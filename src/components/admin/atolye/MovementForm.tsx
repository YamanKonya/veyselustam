"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X, Check } from "lucide-react";
import { productCode } from "@/lib/productCode";
import { MovementType, PaymentMethod, SaleChannel } from "@/types";
import {
  CHANNEL_LABELS,
  MOVEMENT_LABELS,
  NotEnoughStockError,
  PAYMENT_LABELS,
  recordMovement,
} from "@/services/workshopService";
import { btnPrimary, caseLabel, inputCls, labelCls, MovementPreset, sortedGroups, WorkshopData } from "./shared";

const TYPES: MovementType[] = ["satis", "dokum", "uretim", "fire", "iade", "sayim"];

const HELP: Record<MovementType, string> = {
  satis: "Dükkân, Instagram veya WhatsApp'tan satılan yüzük. Kasa stoğundan düşer. Siteden gelen siparişler zaten kendiliğinden düşüyor.",
  dokum: "Dökümcüden gelen kasalar. Kasa stoğuna eklenir.",
  uretim: "Taşı takılıp hazırlanan yüzük. Stok değişmez, ustam ne yapıldığını görür.",
  fire: "Bozulan, kırılan, kaybolan kasa. Stoktan düşer.",
  iade: "Geri gelen yüzük. Stoğa eklenir.",
  sayim: "Rafta sayılan gerçek adedi yazın. Fark defterde görünür.",
};

export default function MovementForm({
  data,
  preset,
  onClose,
}: {
  data: WorkshopData;
  preset: MovementPreset;
  onClose: () => void;
}) {
  const [type, setType] = useState<MovementType>(preset.type || "satis");
  const [groupId, setGroupId] = useState(preset.groupId || "");
  const [productId, setProductId] = useState(preset.productId || "");
  const [qty, setQty] = useState<number | "">(1);
  const [casterId, setCasterId] = useState("");
  const [grams, setGrams] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [channel, setChannel] = useState<SaleChannel>("dukkan");
  const [payment, setPayment] = useState<PaymentMethod>("nakit");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [caseQ, setCaseQ] = useState("");

  const groups = useMemo(() => sortedGroups(data.groups, data.caseById), [data.groups, data.caseById]);
  const filteredGroups = useMemo(() => {
    const t = caseQ.trim().toLocaleLowerCase("tr");
    if (!t) return groups;
    return groups.filter((g) => caseLabel(g, data.caseById[g.id]).toLocaleLowerCase("tr").includes(t));
  }, [groups, caseQ, data.caseById]);

  const group = data.groupById[groupId];
  const variants = data.variants[groupId] || [];
  const product = variants.find((p) => p.id === productId);
  const wc = data.caseById[groupId];
  const casters = data.casters;
  const preferredCasters = wc?.casterIds?.length ? casters.filter((c) => wc.casterIds!.includes(c.id)) : casters;

  // Sensible defaults when the case or model changes
  useEffect(() => {
    if (productId && !variants.some((p) => p.id === productId)) setProductId("");
    if (type === "sayim" && group) setQty(group.stock);
    if (type === "dokum" && !casterId && preferredCasters.length === 1) setCasterId(preferredCasters[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, type]);

  useEffect(() => {
    if (type !== "satis" || amountTouched) return;
    const price = product?.price;
    setAmount(price && qty ? price * Number(qty) : "");
  }, [type, product, qty, amountTouched]);

  useEffect(() => {
    if (type === "dokum" && wc?.gram && qty && !grams) setGrams(Math.round(wc.gram * Number(qty) * 100) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, qty, wc?.gram]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!groupId) return setError("Kasa seçin.");
    const n = Number(qty);
    if (qty === "" || n < 0 || (type !== "sayim" && n <= 0)) return setError("Adet girin.");
    setBusy(true);
    try {
      await recordMovement({
        type,
        groupId,
        qty: n,
        product,
        caster: type === "dokum" ? casters.find((c) => c.id === casterId) : undefined,
        grams: type === "dokum" && grams !== "" ? Number(grams) : undefined,
        amount: type === "satis" && amount !== "" ? Number(amount) : undefined,
        channel: type === "satis" ? channel : undefined,
        payment: type === "satis" ? payment : undefined,
        note,
      });
      setDone(`${MOVEMENT_LABELS[type]} kaydedildi: ${caseLabel(group!, wc)}`);
      setQty(1);
      setNote("");
      setAmountTouched(false);
      setGrams("");
    } catch (err) {
      console.error(err);
      if (err instanceof NotEnoughStockError) setError(`Stok yetmiyor: bu kasadan elde ${err.available} adet var.`);
      else if ((err as { code?: string })?.code === "permission-denied")
        setError("Firebase izin vermedi. firestore.rules dosyasının güncel hâli Firebase konsolundan yayınlanmalı.");
      else setError("Kaydedilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-panel-900 border border-panel-700 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-panel-50">Hareket gir</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1 text-panel-400 hover:text-panel-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setDone("");
              }}
              className={`px-2 py-2 rounded-lg text-xs font-semibold border ${
                type === t ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-950 border-panel-700 text-panel-300"
              }`}
            >
              {MOVEMENT_LABELS[t]}
            </button>
          ))}
        </div>
        <p className="text-xs text-panel-400">{HELP[type]}</p>

        <div>
          <span className={labelCls}>Kasa</span>
          {!preset.groupId && (
            <input
              value={caseQ}
              onChange={(e) => setCaseQ(e.target.value)}
              placeholder="Kod veya ad ile süz (ör. K-012, Sidre)"
              className={`${inputCls} mb-2`}
            />
          )}
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
            <option value="">Kasa seçin</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {caseLabel(g, data.caseById[g.id])} ({g.stock})
              </option>
            ))}
          </select>
          {group && <p className="text-xs text-panel-500 mt-1">Elde şu an {group.stock} adet.</p>}
        </div>

        {(type === "satis" || type === "uretim" || type === "iade") && variants.length > 0 && (
          <label className="block">
            <span className={labelCls}>Çeşit (taş)</span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
              <option value="">Belirtmeden</option>
              {variants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {productCode(p) && `(${productCode(p)})`}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className={labelCls}>{type === "sayim" ? "Sayılan adet (rafta olan)" : "Adet"}</span>
          <input
            type="number"
            min={type === "sayim" ? 0 : 1}
            value={qty}
            onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputCls}
          />
          {type === "sayim" && group && qty !== "" && Number(qty) !== group.stock && (
            <p className="text-xs text-amber-400 mt-1">
              Fark: {Number(qty) - group.stock > 0 ? "+" : ""}
              {Number(qty) - group.stock}
            </p>
          )}
        </label>

        {type === "dokum" && (
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelCls}>Dökümcü</span>
              <select value={casterId} onChange={(e) => setCasterId(e.target.value)} className={inputCls}>
                <option value="">Seçin</option>
                {preferredCasters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {preferredCasters.length < casters.length && (
                  <optgroup label="Diğer">
                    {casters
                      .filter((c) => !preferredCasters.includes(c))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label>
              <span className={labelCls}>Gelen toplam gram</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={grams}
                onChange={(e) => setGrams(e.target.value === "" ? "" : Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>
        )}

        {type === "satis" && (
          <>
            <label className="block">
              <span className={labelCls}>Satış tutarı (TL, toplam)</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => {
                  setAmountTouched(true);
                  setAmount(e.target.value === "" ? "" : Number(e.target.value));
                }}
                className={inputCls}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelCls}>Nereden</span>
                <select value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)} className={inputCls}>
                  {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Ödeme</span>
                <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)} className={inputCls}>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        <label className="block">
          <span className={labelCls}>Not (isteğe bağlı)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>

        {error && <p className="text-sm text-red-300 bg-red-950 border border-red-800 rounded-xl p-2.5">{error}</p>}
        {done && (
          <p className="text-sm text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-xl p-2.5 flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {done}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
        </button>
      </form>
    </div>
  );
}
