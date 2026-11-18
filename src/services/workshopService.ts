import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  Caster,
  MovementType,
  PaymentMethod,
  Product,
  SaleChannel,
  StockGroup,
  StockMovement,
  WorkshopCase,
} from "@/types";
import { saveStockGroup } from "./stockService";

// Atölye: case cards (code, gram, reorder level), casters and a ledger of every
// stock movement. All three collections are admin-only; the sellable count of
// a case stays in the public stockGroups doc so checkout keeps working as is.

const CASES = "workshopCases";
const CASTERS = "casters";
const MOVEMENTS = "stockMovements";
const GROUPS = "stockGroups";
const PRODUCTS = "products";

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  dokum: "Döküm geldi",
  uretim: "Yüzük yapıldı",
  satis: "Elden satış",
  fire: "Fire / bozuk",
  iade: "İade geldi",
  sayim: "Sayım düzeltme",
};

export const CHANNEL_LABELS: Record<SaleChannel, string> = {
  dukkan: "Dükkân",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  diger: "Diğer",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
  diger: "Diğer",
};

/* ---------- live subscriptions ---------- */

type Listener<T> = { data: T; loaded: boolean; error: string };

const useCollection = <T>(subscribe: (ok: (d: T) => void, fail: (e: unknown) => void) => () => void, empty: T) => {
  const [state, setState] = useState<Listener<T>>({ data: empty, loaded: false, error: "" });
  useEffect(() => {
    const unsub = subscribe(
      (data) => setState({ data, loaded: true, error: "" }),
      (err) => {
        console.warn("Atölye listener:", err);
        const code = (err as { code?: string })?.code;
        setState((s) => ({
          ...s,
          loaded: true,
          error: code === "permission-denied" ? "permission-denied" : "network",
        }));
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
};

export const useWorkshopCases = () =>
  useCollection<WorkshopCase[]>(
    (ok, fail) =>
      onSnapshot(
        collection(db, CASES),
        (snap) => ok(snap.docs.map((d) => ({ id: d.id, code: "", ...d.data() }) as WorkshopCase)),
        fail
      ),
    []
  );

export const useCasters = () =>
  useCollection<Caster[]>(
    (ok, fail) =>
      onSnapshot(
        collection(db, CASTERS),
        (snap) =>
          ok(
            snap.docs
              .map((d) => ({ id: d.id, name: "", ...d.data() }) as Caster)
              .sort((a, b) => a.name.localeCompare(b.name, "tr"))
          ),
        fail
      ),
    []
  );

/** Ledger lines of the last `days` days, newest first */
export const useMovements = (days = 120) =>
  useCollection<StockMovement[]>((ok, fail) => {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    return onSnapshot(
      query(collection(db, MOVEMENTS), where("at", ">=", since), orderBy("at", "desc"), limit(2000)),
      (snap) => ok(snap.docs.map((d) => ({ ...(d.data() as StockMovement), id: d.id }))),
      fail
    );
  }, []);

/* ---------- case codes ---------- */

export const formatCaseCode = (n: number) => `K-${String(n).padStart(3, "0")}`;

const codeNumber = (code: string) => {
  const m = /^K-(\d+)$/i.exec(code.trim());
  return m ? Number(m[1]) : 0;
};

/** The next free K-number after every code already given */
export const nextCaseCode = (cases: WorkshopCase[]) =>
  formatCaseCode(Math.max(0, ...cases.map((c) => codeNumber(c.code || ""))) + 1);

/**
 * Gives every case that has no workshop card yet a card with the next K-code,
 * in alphabetical order of the case name. Returns how many were created.
 */
export const assignCaseCodes = async (groups: StockGroup[], cases: WorkshopCase[]) => {
  const have = new Set(cases.filter((c) => c.code).map((c) => c.id));
  const missing = groups.filter((g) => !have.has(g.id)).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  let next = Math.max(0, ...cases.map((c) => codeNumber(c.code || "")));
  for (const g of missing) {
    next += 1;
    await setDoc(doc(db, CASES, g.id), { code: formatCaseCode(next) }, { merge: true });
  }
  return missing.length;
};

export const normalizeCaseCode = (code: string) => code.trim().toLocaleUpperCase("tr").replace(/\s+/g, "-");

export const saveWorkshopCase = async (id: string, fields: Partial<Omit<WorkshopCase, "id">>) => {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || (typeof v === "number" && Number.isNaN(v))) continue;
    clean[k] = v;
  }
  await setDoc(doc(db, CASES, id), clean, { merge: true });
};

/** Creates a new case: public stock group plus its workshop card */
export const createCase = async (id: string, name: string, stock: number, code: string) => {
  await saveStockGroup(id, name, 0);
  await saveWorkshopCase(id, { code });
  if (stock > 0) await recordMovement({ type: "sayim", groupId: id, qty: stock, note: "Açılış sayımı" });
};

/* ---------- casters ---------- */

export const saveCaster = async (caster: Omit<Caster, "id"> & { id?: string }) => {
  const ref = caster.id ? doc(db, CASTERS, caster.id) : doc(collection(db, CASTERS));
  const { id: _, ...fields } = caster;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== "") clean[k] = v;
  await setDoc(ref, clean, { merge: true });
  return ref.id;
};

export const deleteCaster = (id: string) => deleteDoc(doc(db, CASTERS, id));

/* ---------- the ledger ---------- */

export interface MovementInput {
  type: MovementType;
  groupId: string;
  /** pieces; for "sayim" it is the counted total */
  qty: number;
  product?: Product;
  caster?: Caster;
  grams?: number;
  amount?: number;
  channel?: SaleChannel;
  payment?: PaymentMethod;
  note?: string;
}

const OUT: MovementType[] = ["satis", "fire"];
const IN: MovementType[] = ["dokum", "iade"];

export class NotEnoughStockError extends Error {
  constructor(public available: number) {
    super("not-enough-stock");
  }
}

/**
 * Writes one ledger line and applies it to the case stock (and, for a sale or
 * a return of a specific model, to that model's own stone count) in a single
 * transaction, so the ledger and the counts never drift apart.
 */
export const recordMovement = async (input: MovementInput) => {
  const qty = Math.max(0, Math.floor(input.qty));
  if (input.type !== "sayim" && qty <= 0) throw new Error("qty");
  const ref = doc(collection(db, MOVEMENTS));

  await runTransaction(db, async (tx) => {
    const groupRef = doc(db, GROUPS, input.groupId);
    const caseRef = doc(db, CASES, input.groupId);
    const productRef = input.product?.id ? doc(db, PRODUCTS, input.product.id) : null;
    const [groupSnap, caseSnap, productSnap] = await Promise.all([
      tx.get(groupRef),
      tx.get(caseRef),
      productRef ? tx.get(productRef) : Promise.resolve(null),
    ]);
    if (!groupSnap.exists()) throw new Error("no-case");
    const stock = Number(groupSnap.data().stock) || 0;

    let delta = 0;
    if (IN.includes(input.type)) delta = qty;
    else if (OUT.includes(input.type)) delta = -qty;
    else if (input.type === "sayim") delta = qty - stock;
    if (stock + delta < 0) throw new NotEnoughStockError(stock);

    if (delta !== 0) tx.update(groupRef, { stock: stock + delta });

    // The model's own count (its stones) moves with a sale or a return
    const productStock = productSnap?.exists() ? productSnap.data().stock : undefined;
    if (productRef && typeof productStock === "number" && (input.type === "satis" || input.type === "iade")) {
      const next = input.type === "satis" ? Math.max(0, productStock - qty) : productStock + qty;
      tx.update(productRef, { stock: next });
    }

    const line: Record<string, unknown> = {
      type: input.type,
      groupId: input.groupId,
      groupName: groupSnap.data().name ?? input.groupId,
      caseCode: caseSnap.exists() ? caseSnap.data().code : undefined,
      qty: input.type === "sayim" ? Math.abs(delta) : qty,
      delta,
      stockAfter: stock + delta,
      productId: input.product?.id,
      productTitle: input.product?.title,
      productCode: input.product?.code,
      casterId: input.caster?.id,
      casterName: input.caster?.name,
      grams: input.grams,
      amount: input.amount,
      channel: input.channel,
      payment: input.payment,
      note: input.note?.trim() || undefined,
      at: new Date().toISOString(),
      by: auth?.currentUser?.email || undefined,
    };
    for (const k of Object.keys(line)) if (line[k] === undefined || line[k] === "") delete line[k];
    tx.set(ref, line);
  });

  return ref.id;
};

/** Removes a ledger line written by mistake and undoes what it did to the stock */
export const undoMovement = async (m: StockMovement) => {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, MOVEMENTS, m.id);
    const groupRef = doc(db, GROUPS, m.groupId);
    const productRef = m.productId ? doc(db, PRODUCTS, m.productId) : null;
    const [snap, groupSnap, productSnap] = await Promise.all([
      tx.get(ref),
      tx.get(groupRef),
      productRef ? tx.get(productRef) : Promise.resolve(null),
    ]);
    if (!snap.exists()) return;
    if (groupSnap.exists() && m.delta !== 0) {
      const stock = Number(groupSnap.data().stock) || 0;
      tx.update(groupRef, { stock: Math.max(0, stock - m.delta) });
    }
    const productStock = productSnap?.exists() ? productSnap.data().stock : undefined;
    if (productRef && typeof productStock === "number" && (m.type === "satis" || m.type === "iade")) {
      tx.update(productRef, { stock: m.type === "satis" ? productStock + m.qty : Math.max(0, productStock - m.qty) });
    }
    tx.delete(ref);
  });
};

/* ---------- helpers for the summary ---------- */

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const startOfWeek = (d = new Date()) => {
  const s = startOfDay(d);
  const day = (s.getDay() + 6) % 7; // Monday = 0
  s.setDate(s.getDate() - day);
  return s;
};
export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const tl = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export const isLow = (stock: number, wc?: WorkshopCase) =>
  stock <= 0 || (typeof wc?.minStock === "number" && stock <= wc.minStock);
