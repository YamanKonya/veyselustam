import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
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

/**
 * What can be sold right now. A product linked to a case is limited by both the
 * case stock and its own stock (e.g. Sidre case 20, Sidre Akik stones 5 → 5).
 */
export const availableStock = (product: Product, groups: StockGroup[]) => {
  const own = typeof product.stock === "number" ? product.stock : Infinity;
  if (product.stockGroup) {
    const group = groups.find((g) => g.id === product.stockGroup);
    // A case that doesn't exist (not created yet, or deleted) doesn't limit
    // anything; checkout treats it the same way.
    if (group) return Math.min(group.stock, own);
  }
  return Number.isFinite(own) ? own : 0;
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
      }
      // The product's own count is taken too (a case product's stones); products
      // without a stock field in Firestore are not tracked
      if (snap?.exists() && typeof snap.data().stock === "number") {
        productQty[id] = (productQty[id] || 0) + line.quantity;
        names[`p:${id}`] = id;
      }
    }

    const groupSnaps = await Promise.all(
      Object.keys(groupQty).map(async (gid) => [gid, await tx.get(doc(db, GROUPS, gid))] as const)
    );

    // Cases that don't exist in Firestore aren't tracked (same as availableStock)
    for (const [gid, snap] of groupSnaps) {
      if (!snap.exists()) {
        delete groupQty[gid];
        continue;
      }
      const stock = Number(snap.data().stock) || 0;
      if (stock < groupQty[gid]) throw new OutOfStockError(names[`g:${gid}`], stock);
    }
    for (const [pid, qty] of Object.entries(productQty)) {
      const stock = Number(productSnaps.get(pid)!.data()!.stock) || 0;
      if (stock < qty) throw new OutOfStockError(names[`p:${pid}`], stock);
    }

    for (const [gid, snap] of groupSnaps) {
      if (!(gid in groupQty)) continue;
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

/* ---------- admin: one-time setup and a no-customer sale test ---------- */

/**
 * Creates cases that products point to but that don't exist yet, starting each
 * at the sum of its products' own stock. Returns e.g. ["Sidre (20)"].
 */
export const ensureStockGroups = async (products: Product[]) => {
  const totals: Record<string, number> = {};
  for (const p of products) {
    if (p.stockGroup) totals[p.stockGroup] = (totals[p.stockGroup] || 0) + (typeof p.stock === "number" ? p.stock : 0);
  }
  const created: string[] = [];
  for (const [id, total] of Object.entries(totals)) {
    const snap = await getDoc(doc(db, GROUPS, id));
    if (snap.exists()) continue;
    const name = id.charAt(0).toLocaleUpperCase("tr") + id.slice(1).replace(/-/g, " ");
    await saveStockGroup(id, name, total);
    created.push(`${name} (${total})`);
  }
  return created;
};

export interface SaleTestResult {
  productTitle: string;
  group?: { name: string; before: number; afterSale: number; afterReturn: number };
  product?: { before: number; afterSale: number; afterReturn: number };
}

const readStock = async (path: string, id: string) => {
  const snap = await getDoc(doc(db, path, id));
  return snap.exists() && typeof snap.data().stock === "number" ? (snap.data().stock as number) : undefined;
};

/**
 * Runs one unit of `product` through the real checkout path (same transaction,
 * same Firestore rules), records the stock, then cancels the order, returns the
 * stock and deletes the test order. No customer or real order is left behind.
 */
export const runSaleTest = async (product: Product, groupName?: string): Promise<SaleTestResult> => {
  if (!product.id) throw new Error("no-product-id");
  const gid = product.stockGroup;
  const g0 = gid ? await readStock(GROUPS, gid) : undefined;
  const p0 = await readStock(PRODUCTS, product.id);

  const orderId = await placeOrderWithStock([{ product, quantity: 1 }], {
    userId: auth?.currentUser?.uid || "guest_user",
    customerInfo: {
      fullName: "STOK TESTİ (otomatik, siliniyor)",
      email: "",
      phone: "-",
      city: "-",
      district: "-",
      address: "Kasa Stokları sayfasındaki satış testi",
      notes: "",
    },
    items: [{ productId: product.id, title: product.title, price: 0, quantity: 1 }],
    totalAmount: 0,
    status: "pending",
  });

  const g1 = gid ? await readStock(GROUPS, gid) : undefined;
  const p1 = await readStock(PRODUCTS, product.id);

  const orderSnap = await getDoc(doc(db, ORDERS, orderId));
  await restockOrder({ id: orderId, ...(orderSnap.data() as Order) });
  await deleteDoc(doc(db, ORDERS, orderId));

  const g2 = gid ? await readStock(GROUPS, gid) : undefined;
  const p2 = await readStock(PRODUCTS, product.id);

  return {
    productTitle: product.title,
    group: gid && g0 !== undefined ? { name: groupName || gid, before: g0, afterSale: g1 ?? g0, afterReturn: g2 ?? g0 } : undefined,
    product: p0 !== undefined ? { before: p0, afterSale: p1 ?? p0, afterReturn: p2 ?? p0 } : undefined,
  };
};
