import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Product } from "@/types";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { saveVideoBlob, getVideoBlobUrl } from "./videoStorage";

const PRODUCTS_COLLECTION = "products";
const STORAGE_KEY = "vu_products_catalog_v3";

// Helper to strip undefined values so Firestore never throws unsupported field value errors
const sanitizeForFirestore = (obj: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
};

// Helper to load catalog from localStorage (persists discounts & custom products)
const loadProductsFromStorage = (): Product[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_VEYSELUSTAM_PRODUCTS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load products from localStorage:", e);
    }
  }
  return [...INITIAL_VEYSELUSTAM_PRODUCTS];
};

// Helper to save catalog to localStorage
const saveProductsToStorage = (products: Product[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Failed to save products to localStorage:", e);
    }
  }
};

// Local in-memory store initialized with localStorage or scraped products dataset
let localProductsStore: Product[] = loadProductsFromStorage();

// Active subscribers list for instant local state sync
const subscribers: Array<(products: Product[]) => void> = [];

const notifySubscribers = () => {
  saveProductsToStorage(localProductsStore);
  subscribers.forEach((cb) => cb([...localProductsStore]));
};

// Convert file to Base64 Data URL instantly
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        resolve("https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp");
      }
    };
    reader.onerror = () => {
      resolve("https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp");
    };
    reader.readAsDataURL(file);
  });
};

// Upload a single file (image or video) to Storage with IndexedDB fallback for videos
export const uploadFileToStorage = async (file: File, folderName: string = "products"): Promise<string> => {
  // For video files, save to browser IndexedDB for instant 60fps playback without localStorage truncation
  if (file.type && file.type.startsWith("video/")) {
    const videoKey = `vu_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return await saveVideoBlob(videoKey, file);
  }

  try {
    const firebaseUploadPromise = (async () => {
      const fileExt = file.name.split('.').pop() || "jpg";
      const fileName = `${folderName}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Storage timeout")), 1200);
    });

    return await Promise.race([firebaseUploadPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Storage upload network fallback to instant base64:", error);
    return await fileToBase64(file);
  }
};

export const uploadImageToStorage = (file: File): Promise<string> => {
  return uploadFileToStorage(file, "products");
};

// Helper to merge Firestore docs with local products dataset, giving precedence to local updates
const mergeWithInitialProducts = (fetched: Product[]): Product[] => {
  const currentLocal = loadProductsFromStorage();
  const localMap = new Map<string, Product>();

  // Start with fetched products from Firestore
  fetched.forEach((p) => {
    if (p.id) {
      localMap.set(p.id, p);
    }
  });

  // Overlay currentLocal products (user edits take precedence)
  currentLocal.forEach((localProd) => {
    if (localProd.id) {
      const existingInFetched = localMap.get(localProd.id);
      if (existingInFetched) {
        const videoUrl = localProd.videoUrl || existingInFetched.videoUrl;
        localMap.set(localProd.id, { 
          ...existingInFetched, 
          ...localProd,
          videoUrl: videoUrl,
        });
      } else {
        localMap.set(localProd.id, localProd);
      }
    }
  });

  return Array.from(localMap.values());
};

// Fetch all products with instant fallback
export const getProducts = async (): Promise<Product[]> => {
  localProductsStore = loadProductsFromStorage();
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      localProductsStore = mergeWithInitialProducts(fetched);
      notifySubscribers();
      return localProductsStore;
    }
  } catch (error) {
    console.warn("Firestore fetch failed, using local products dataset:", error);
  }

  return localProductsStore;
};

// Fetch a single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  localProductsStore = loadProductsFromStorage();
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
  } catch (error) {
    console.warn("Firestore getDoc failed, searching local store:", error);
  }

  return localProductsStore.find((p) => p.id === id) || null;
};

// Real-time listener that guarantees INSTANT initial data delivery from localStorage
export const subscribeProducts = (onUpdate: (products: Product[]) => void) => {
  localProductsStore = loadProductsFromStorage();
  onUpdate([...localProductsStore]);
  subscribers.push(onUpdate);

  let unsubscribeFirebase = () => {};
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("createdAt", "desc"));
    unsubscribeFirebase = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          localProductsStore = mergeWithInitialProducts(fetched);
          notifySubscribers();
        }
      },
      (error) => {
        console.warn("Firestore subscription network fallback:", error);
      }
    );
  } catch (error) {
    console.warn("Firebase snapshot listener setup skipped:", error);
  }

  return () => {
    const idx = subscribers.indexOf(onUpdate);
    if (idx > -1) subscribers.splice(idx, 1);
    try {
      unsubscribeFirebase();
    } catch (e) {}
  };
};

// Add a new product manually
export const createProduct = async (
  productData: Omit<Product, "id">,
  imageFiles: File[] = []
): Promise<string> => {
  const uploadedImageUrls: string[] = [...(productData.images || [])];

  for (const file of imageFiles) {
    const url = await uploadImageToStorage(file);
    uploadedImageUrls.push(url);
  }

  const newId = `vu-prod-${Date.now()}`;
  const newProduct: Product = {
    id: newId,
    ...productData,
    images: uploadedImageUrls.length > 0 ? uploadedImageUrls : ["https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/3b66ab45-af5a-4152-8a16-a2e22d478adf/720/img-20240207-121651.webp"],
    createdAt: new Date().toISOString(),
  };

  // INSTANT LOCAL UPDATE (0ms)
  localProductsStore = [newProduct, ...localProductsStore];
  notifySubscribers();

  // Background non-blocking sync to Firestore
  (async () => {
    try {
      const cleanPayload = sanitizeForFirestore(newProduct);
      if (cleanPayload.videoUrl && cleanPayload.videoUrl.length > 500000) {
        delete cleanPayload.videoUrl;
      }
      const productRef = doc(db, PRODUCTS_COLLECTION, newId);
      await setDoc(productRef, cleanPayload, { merge: true });
    } catch (err) {
      console.warn("Background Firestore addDoc notice:", err);
    }
  })();

  return newProduct.id!;
};

// Update an existing product
export const updateProduct = async (
  id: string,
  productData: Partial<Product>,
  newImageFiles: File[] = []
): Promise<void> => {
  const uploadedImageUrls: string[] = [...(productData.images || [])];

  for (const file of newImageFiles) {
    const url = await uploadImageToStorage(file);
    uploadedImageUrls.push(url);
  }

  const updatedFields = {
    ...productData,
    images: uploadedImageUrls,
    updatedAt: new Date().toISOString(),
  };

  // INSTANT LOCAL UPDATE (0ms)
  localProductsStore = localProductsStore.map((p) =>
    p.id === id ? { ...p, ...updatedFields } : p
  );
  notifySubscribers();

  // Background non-blocking sync to Firestore
  (async () => {
    try {
      const cleanPayload = sanitizeForFirestore(updatedFields);
      if (cleanPayload.videoUrl && cleanPayload.videoUrl.length > 500000) {
        delete cleanPayload.videoUrl;
      }
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      await setDoc(productRef, cleanPayload, { merge: true });
    } catch (err) {
      console.warn("Background Firestore setDoc notice:", err);
    }
  })();
};

// Delete a product
export const deleteProduct = async (id: string): Promise<void> => {
  localProductsStore = localProductsStore.filter((p) => p.id !== id);
  notifySubscribers();

  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    deleteDoc(productRef).catch((err) => {
      console.warn("Background Firestore deleteDoc notice:", err);
    });
  } catch (error) {
    console.warn("Firestore deleteDoc fallback (saved locally):", error);
  }
};

// Bulk apply percentage discount to selected products or category
export const applyBulkDiscount = async (
  percent: number,
  targetCategory?: string,
  selectedProductIds?: string[]
): Promise<number> => {
  if (percent <= 0 || percent >= 100) return 0;

  let count = 0;
  localProductsStore = localProductsStore.map((product) => {
    const matchesCategory = !targetCategory || targetCategory === "Hepsi" || product.category === targetCategory;
    const matchesSelection = !selectedProductIds || selectedProductIds.length === 0 || (product.id && selectedProductIds.includes(product.id));

    if (matchesCategory && matchesSelection) {
      count++;
      const basePrice = product.originalPrice || product.price;
      const discountedPrice = Math.round(basePrice * (1 - percent / 100));

      return {
        ...product,
        originalPrice: basePrice,
        price: discountedPrice,
        discountPercent: percent,
        isCampaign: true,
      };
    }
    return product;
  });

  notifySubscribers();
  return count;
};

// Clear discount / reset prices for selected products or category
export const clearBulkDiscount = async (
  targetCategory?: string,
  selectedProductIds?: string[]
): Promise<number> => {
  let count = 0;
  localProductsStore = localProductsStore.map((product) => {
    const matchesCategory = !targetCategory || targetCategory === "Hepsi" || product.category === targetCategory;
    const matchesSelection = !selectedProductIds || selectedProductIds.length === 0 || (product.id && selectedProductIds.includes(product.id));

    if (matchesCategory && matchesSelection && product.originalPrice) {
      count++;
      return {
        ...product,
        price: product.originalPrice,
        originalPrice: undefined,
        discountPercent: undefined,
        isCampaign: false,
      };
    }
    return product;
  });

  notifySubscribers();
  return count;
};
