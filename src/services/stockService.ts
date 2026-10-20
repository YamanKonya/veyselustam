import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Order, Product, StockDeductions, StockGroup } from "@/types";

// Shared stock pools: one ring case (e.g. "Sidre") sold with different stones.
// Every product linked to a group sells from the group's stock.

const GROUPS = "stockGroups";
const PRODUCTS = "products";
const ORDERS = "orders";

/* ---------- live group list (shared by every component) ---------- */

let groupsCache: StockGroup[] = [];
let groupsLoaded = false;
const listeners = new Set<(groups: StockGroup[]) => void>();
let unsubscribe: (() => void) | null = null;

const startListening = () => {
  if (unsubscribe) return;
  try {
    unsubscribe = onSnapshot(
      collection(db, GROUPS),
      (snap) => {
        groupsCache = snap.docs
          .map((d) => ({ id: d.id, name: d.data().name ?? d.id, stock: Number(d.data().stock) || 0 }))
          .sort((a, b) => a.name.localeCompare(b.name, "tr"));
        groupsLoaded = true;
        listeners.forEach((l) => l(groupsCache));
      },
      (err) => console.warn("Stock groups listener:", err)
    );
  } catch (err) {
    console.warn("Stock groups listener setup skipped:", err);
  }
};

/** Live list of stock groups; `loaded` is false until Firestore has answered. */
export const useStockGroups = () => {
  const [groups, setGroups] = useState<StockGroup[]>(groupsCache);
  const [loaded, setLoaded] = useState(groupsLoaded);
  useEffect(() => {
    const onUpdate = (g: StockGroup[]) => {
      setGroups(g);
      setLoaded(true);
    };
    listeners.add(onUpdate);
    startListening();
    return () => {
      listeners.delete(onUpdate);
    };
  }, []);
  return { groups, loaded };
};

/** What can be sold right now: the group's stock for linked products, else the product's own. */
export const availableStock = (product: Product, groups: StockGroup[]) => {
  if (product.stockGroup) {
    const group = groups.find((g) => g.id === product.stockGroup);
    // Before the group list arrives, fall back to the product's own number
    // rather than flashing "out of stock".
    if (!group) return groupsLoaded ? 0 : product.stock ?? 0;
    return group.stock;
  }
  return product.stock ?? 0;
};

/* ---------- admin: manage groups ---------- */

export const slugifyGroupName = (name: string) =>
  name
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const saveStockGroup = async (id: string, name: string, stock: number) => {
  await setDoc(doc(db, GROUPS, id), { name: name.trim(), stock: Math.max(0, Math.floor(stock)) }, { merge: true });
};

export const deleteStockGroup = async (id: string) => {
  await deleteDoc(doc(db, GROUPS, id));
};

/* ---------- checkout: order + stock in one transaction ---------- */

export class OutOfStockError extends Error {
  constructor(public productId: string, public available: number) {
    super(`out-of-stock:${productId}`);
  }
}

interface CartLine {
  product: Product;
  quantity: number;
}

/**
 * Creates the order and takes its stock in a single Firestore transaction, so
 * either both happen or neither does. Firestore rules only let a customer lower
 * a stock count as part of creating a new order, by exactly that order's amount.
 */
export const placeOrderWithStock = async (
  lines: CartLine[],
  orderData: Omit<Order, "id" | "createdAt" | "stockDeductions">
): Promise<string> => {
  const orderRef = doc(collection(db, ORDERS));

  await runTransaction(db, async (tx) => {
    // Current product docs decide grouping (the cart may hold an older copy)
    const productIds = Array.from(new Set(lines.map((l) => l.product.id).filter(Boolean))) as string[];
    const productSnaps = new Map(
      await Promise.all(productIds.map(async (id) => [id, await tx.get(doc(db, PRODUCTS, id))] as const))
    );

    const groupQty: Record<string, number> = {};
    const productQty: Record<string, number> = {};
    const names: Record<string, string> = {};
    for (const line of lines) {
      const id = line.product.id;
      if (!id) continue;
      const snap = productSnaps.get(id);
      const group = (snap?.exists() ? snap.data().stockGroup : undefined) ?? line.product.stockGroup;
      if (group) {
        groupQty[group] = (groupQty[group] || 0) + line.quantity;
        names[`g:${group}`] = id;
      } else if (snap?.exists() && typeof snap.data().stock === "number") {
        // products without a stock field in Firestore are not tracked
        productQty[id] = (productQty[id] || 0) + line.quantity;
        names[`p:${id}`] = id;
      }
    }

    const groupSnaps = await Promise.all(
      Object.keys(groupQty).map(async (gid) => [gid, await tx.get(doc(db, GROUPS, gid))] as const)
    );

    for (const [gid, snap] of groupSnaps) {
      const stock = snap.exists() ? Number(snap.data().stock) || 0 : 0;
      if (stock < groupQty[gid]) throw new OutOfStockError(names[`g:${gid}`], stock);
    }
    for (const [pid, qty] of Object.entries(productQty)) {
      const stock = Number(productSnaps.get(pid)!.data()!.stock) || 0;
      if (stock < qty) throw new OutOfStockError(names[`p:${pid}`], stock);
    }

    for (const [gid, snap] of groupSnaps) {
      const stock = Number(snap.data()!.stock) || 0;
      tx.update(doc(db, GROUPS, gid), { stock: stock - groupQty[gid], lastOrderId: orderRef.id });
    }
    for (const [pid, qty] of Object.entries(productQty)) {
      const stock = Number(productSnaps.get(pid)!.data()!.stock) || 0;
      tx.update(doc(db, PRODUCTS, pid), { stock: stock - qty, lastOrderId: orderRef.id });
    }

    const stockDeductions: StockDeductions = { groups: groupQty, products: productQty };
    tx.set(orderRef, {
      ...orderData,
      id: orderRef.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      stockDeductions,
    });
  });

  return orderRef.id;
};

/* ---------- admin: give stock back when an order is cancelled ---------- */

export const restockOrder = async (order: Order) => {
  if (!order.id || order.restocked || !order.stockDeductions) return;
  const { groups, products } = order.stockDeductions;
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, ORDERS, order.id!);
    const fresh = await tx.get(orderRef);
    if (!fresh.exists() || fresh.data().restocked) return;
    for (const [gid, qty] of Object.entries(groups || {})) tx.update(doc(db, GROUPS, gid), { stock: increment(qty) });
    for (const [pid, qty] of Object.entries(products || {})) tx.update(doc(db, PRODUCTS, pid), { stock: increment(qty) });
    tx.update(orderRef, { restocked: true });
  });
};
