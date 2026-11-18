import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  Transaction,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  CastOrder,
  CastOrderLine,
  Caster,
  CasterLedgerLine,
  CasterLedgerType,
  MovementType,
  PaymentMethod,
  Product,
  SaleChannel,
  StockGroup,
  StockMovement,
  WorkshopCase,
  WorkshopSettings,
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
const CAST_ORDERS = "castOrders";
const LEDGER = "casterLedger";
const SETTINGS_DOC = ["settings", "workshop"] as const;

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

    // A delivery with a caster and grams also goes on that caster's account
    let ledgerId: string | undefined;
    if (input.type === "dokum" && input.caster && input.grams) {
      ledgerId = writeDelivery(tx, input.caster, input.grams, { movementId: ref.id, note: input.note });
    }

    const line: Record<string, unknown> = {
      type: input.type,
      ledgerId,
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
    if (m.ledgerId) tx.delete(doc(db, LEDGER, m.ledgerId));
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

/* ---------- casting orders and caster accounts ---------- */

const clean = (o: Record<string, unknown>) => {
  for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === "") delete o[k];
  return o;
};

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Pure silver used and labour owed for `grams` of cast silver from this caster */
export const casterUsage = (caster: Pick<Caster, "milyem" | "firePercent" | "laborPerGram">, grams: number) => {
  const milyem = caster.milyem || 925;
  const fire = caster.firePercent || 0;
  return {
    has: round(grams * (milyem / 1000) * (1 + fire / 100)),
    labor: round(grams * (caster.laborPerGram || 0)),
  };
};

/** Writes a "teslim" line on the caster account inside a transaction; returns its id */
function writeDelivery(
  tx: Transaction,
  caster: Caster,
  grams: number,
  extra: { movementId?: string; castOrderId?: string; note?: string; has?: number; labor?: number }
) {
  const usage = casterUsage(caster, grams);
  const ref = doc(collection(db, LEDGER));
  tx.set(
    ref,
    clean({
      casterId: caster.id,
      casterName: caster.name,
      type: "teslim",
      hasGram: -(extra.has ?? usage.has),
      tl: extra.labor ?? usage.labor,
      grams,
      movementId: extra.movementId,
      castOrderId: extra.castOrderId,
      note: extra.note?.trim(),
      at: new Date().toISOString(),
      by: auth?.currentUser?.email || undefined,
    })
  );
  return ref.id;
}

export const useCastOrders = () =>
  useCollection<CastOrder[]>(
    (ok, fail) =>
      onSnapshot(
        query(collection(db, CAST_ORDERS), orderBy("createdAt", "desc"), limit(300)),
        (snap) => ok(snap.docs.map((d) => ({ ...(d.data() as CastOrder), id: d.id }))),
        fail
      ),
    []
  );

export const useCasterLedger = () =>
  useCollection<CasterLedgerLine[]>(
    (ok, fail) =>
      onSnapshot(
        query(collection(db, LEDGER), orderBy("at", "desc"), limit(3000)),
        (snap) => ok(snap.docs.map((d) => ({ ...(d.data() as CasterLedgerLine), id: d.id }))),
        fail
      ),
    []
  );

export const useWorkshopSettings = () =>
  useCollection<WorkshopSettings>(
    (ok, fail) => onSnapshot(doc(db, ...SETTINGS_DOC), (snap) => ok((snap.data() as WorkshopSettings) || {}), fail),
    {}
  );

export const saveHasPrice = async (price: number, current: WorkshopSettings) => {
  const at = new Date().toISOString();
  const history = [{ price, at }, ...(current.hasPriceHistory || [])].slice(0, 60);
  await setDoc(doc(db, ...SETTINGS_DOC), { hasPrice: price, hasPriceAt: at, hasPriceHistory: history }, { merge: true });
};

/** Balance of one caster: pure silver they hold (g) and labour we owe (TL) */
export const casterBalance = (ledger: CasterLedgerLine[], casterId: string) => {
  let has = 0;
  let owed = 0;
  for (const l of ledger)
    if (l.casterId === casterId) {
      has += l.hasGram || 0;
      owed += l.tl || 0;
    }
  return { has: round(has), owed: round(owed) };
};

export const LEDGER_LABELS: Record<CasterLedgerType, string> = {
  hasVerildi: "Has verildi",
  teslim: "Döküm teslim",
  hasIade: "Has iade alındı",
  odeme: "İşçilik ödendi",
  duzeltme: "Düzeltme",
};

export const addLedgerLine = async (
  caster: Caster,
  type: CasterLedgerType,
  values: { hasGram?: number; tl?: number; note?: string }
) => {
  const ref = doc(collection(db, LEDGER));
  await setDoc(
    ref,
    clean({
      casterId: caster.id,
      casterName: caster.name,
      type,
      hasGram: round(values.hasGram || 0),
      tl: round(values.tl || 0),
      note: values.note?.trim(),
      at: new Date().toISOString(),
      by: auth?.currentUser?.email || undefined,
    })
  );
};

export const deleteLedgerLine = (id: string) => deleteDoc(doc(db, LEDGER, id));

export const createCastOrder = async (caster: Caster, lines: CastOrderLine[], note?: string) => {
  const ref = doc(collection(db, CAST_ORDERS));
  await setDoc(
    ref,
    clean({
      casterId: caster.id,
      casterName: caster.name,
      lines: lines.filter((l) => l.qty > 0).map((l) => clean({ ...l, received: 0 })),
      status: "verildi",
      note: note?.trim(),
      createdAt: new Date().toISOString(),
      by: auth?.currentUser?.email || undefined,
    })
  );
  return ref.id;
};

/** Closes an order: cancelled if nothing came, otherwise done with what came */
export const closeCastOrder = (o: CastOrder) =>
  setDoc(
    doc(db, CAST_ORDERS, o.id),
    { status: o.lines.some((l) => l.received) ? "teslim" : "iptal", updatedAt: new Date().toISOString() },
    { merge: true }
  );

/** WhatsApp text of a casting order */
export const castOrderText = (
  caster: Pick<Caster, "name">,
  lines: CastOrderLine[],
  cases: Record<string, WorkshopCase>,
  note?: string
) => {
  const rows = lines
    .filter((l) => l.qty > 0)
    .map((l) => {
      const gram = cases[l.groupId]?.gram;
      return `• ${l.caseCode ? l.caseCode + " " : ""}${l.groupName}: ${l.qty} adet${gram ? ` (~${gram} gr)` : ""}`;
    });
  const total = lines.reduce((n, l) => n + (l.qty > 0 ? l.qty : 0), 0);
  return [
    `Selamün aleyküm ${caster.name},`,
    "Veysel Ustam atölyesinden döküm siparişi:",
    ...rows,
    `Toplam: ${total} adet`,
    note?.trim() ? `Not: ${note.trim()}` : "",
    "Hayırlı işler.",
  ]
    .filter(Boolean)
    .join("\n");
};

export const whatsappLink = (phone: string | undefined, text: string) => {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0/, "90");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

/**
 * Receives (part of) a casting order: adds the cases to stock with a ledger
 * line each, writes one delivery line on the caster account and updates the
 * order, all in one transaction.
 */
export const receiveCastOrder = async (
  order: CastOrder,
  caster: Caster,
  received: Record<string, number>,
  totals: { grams: number; has: number; labor: number; note?: string }
) => {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, CAST_ORDERS, order.id);
    const lines = order.lines.filter((l) => (received[l.groupId] || 0) > 0);
    const groupRefs: [CastOrderLine, DocumentReference][] = lines.map((l) => [l, doc(db, GROUPS, l.groupId)]);
    const [orderSnap, ...groupSnaps] = await Promise.all([tx.get(orderRef), ...groupRefs.map(([, r]) => tx.get(r))]);
    if (!orderSnap.exists()) throw new Error("no-order");

    const totalQty = lines.reduce((n, l) => n + received[l.groupId], 0);
    const ledgerId =
      totals.grams > 0
        ? writeDelivery(tx, caster, totals.grams, {
            castOrderId: order.id,
            note: totals.note,
            has: totals.has,
            labor: totals.labor,
          })
        : undefined;
    const at = new Date().toISOString();

    groupRefs.forEach(([l, ref], i) => {
      const snap = groupSnaps[i];
      if (!snap.exists()) return;
      const qty = received[l.groupId];
      const stock = Number(snap.data().stock) || 0;
      tx.update(ref, { stock: stock + qty });
      tx.set(
        doc(collection(db, MOVEMENTS)),
        clean({
          type: "dokum",
          groupId: l.groupId,
          groupName: snap.data().name ?? l.groupName,
          caseCode: l.caseCode,
          qty,
          delta: qty,
          stockAfter: stock + qty,
          casterId: caster.id,
          casterName: caster.name,
          grams: totalQty && totals.grams ? round((totals.grams * qty) / totalQty) : undefined,
          castOrderId: order.id,
          note: totals.note?.trim(),
          at,
          by: auth?.currentUser?.email || undefined,
        })
      );
    });

    const current = (orderSnap.data().lines || []) as CastOrderLine[];
    const next = current.map((l) => ({ ...l, received: (l.received || 0) + (received[l.groupId] || 0) }));
    const complete = next.every((l) => (l.received || 0) >= l.qty);
    tx.update(orderRef, {
      lines: next,
      status: complete ? "teslim" : "kismi",
      updatedAt: at,
      ...(ledgerId ? { ledgerIds: [...((orderSnap.data().ledgerIds as string[]) || []), ledgerId] } : {}),
    });
  });
};

/** Cases already on an open order, with the quantity still to come */
export const pendingByCase = (orders: CastOrder[]) => {
  const out: Record<string, number> = {};
  for (const o of orders)
    if (o.status === "verildi" || o.status === "kismi")
      for (const l of o.lines) out[l.groupId] = (out[l.groupId] || 0) + Math.max(0, l.qty - (l.received || 0));
  return out;
};

/* ---------- cost ---------- */

export interface VariantCost {
  silver: number;
  labor: number;
  stone: number;
  extra: number;
  total: number;
  /** what is missing for a complete figure */
  missing: string[];
}

/** Cost of one finished ring of this case (and variant) at the saved silver price */
export const variantCost = (
  wc: WorkshopCase | undefined,
  casters: Caster[],
  settings: WorkshopSettings,
  productId?: string
): VariantCost => {
  const missing: string[] = [];
  const gram = wc?.gram || 0;
  if (!gram) missing.push("gram");
  if (!settings.hasPrice) missing.push("gümüş fiyatı");
  const caster = casters.find((c) => wc?.casterIds?.includes(c.id));
  if (!caster) missing.push("dökümcü");
  const usage = casterUsage(caster || {}, gram);
  const silver = round(usage.has * (settings.hasPrice || 0));
  const labor = usage.labor;
  const stone = (productId && wc?.stoneCosts?.[productId]) || 0;
  const extra = wc?.extraCost || 0;
  return { silver, labor, stone, extra, total: round(silver + labor + stone + extra), missing };
};
