import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types";

const ORDERS_COLLECTION = "orders";

// Fallback in-memory store for orders
let localOrdersStore: Order[] = [];

// Create a new order
export const createOrder = async (
  orderData: Omit<Order, "id" | "createdAt">
): Promise<string> => {
  const newOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const newOrder: Order = {
    id: newOrderId,
    ...orderData,
    status: orderData.status || "pending",
    createdAt: new Date().toISOString(),
  };

  // No silent fallback: an order that isn't in Firestore must not look placed
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...newOrder,
  });
  newOrder.id = docRef.id;

  localOrdersStore = [newOrder, ...localOrdersStore];
  return newOrder.id!;
};

// Fetch all orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      localOrdersStore = fetched;
      return fetched;
    }
  } catch (error) {
    console.warn("Firestore orders fetch fallback:", error);
  }

  return localOrdersStore;
};

// Real-time listener for orders
export const subscribeOrders = (onUpdate: (orders: Order[]) => void) => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          localOrdersStore = fetched;
          onUpdate(fetched);
        } else {
          onUpdate(localOrdersStore);
        }
      },
      (error) => {
        console.warn("Firestore orders subscription error, using local dataset:", error);
        onUpdate(localOrdersStore);
      }
    );
  } catch (error) {
    onUpdate(localOrdersStore);
    return () => {};
  }
};

// Fetch single order by ID
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
  } catch (error) {
    console.warn("Firestore getOrderById fallback:", error);
  }

  return localOrdersStore.find((o) => o.id === id) || null;
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Firestore updateOrderStatus fallback:", error);
  }

  localOrdersStore = localOrdersStore.map((o) =>
    o.id === orderId ? { ...o, status } : o
  );
};
