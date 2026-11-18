"use client";

import React, { useMemo, useState } from "react";
import { Check, Loader2, MessageCircle, PackageCheck, Plus, Send, Trash2, X } from "lucide-react";
import { CastOrder, CastOrderLine, Caster } from "@/types";
import {
  casterUsage,
  castOrderText,
  closeCastOrder,
  createCastOrder,
  isLow,
  pendingByCase,
  receiveCastOrder,
  tl,
  whatsappLink,
} from "@/services/workshopService";
import { btnGhost, btnPrimary, card, caseLabel, dateTime, inputCls, labelCls, sortedGroups, WorkshopData } from "./shared";

const STATUS: Record<CastOrder["status"], [string, string]> = {
  verildi: ["Sipariş verildi", "bg-sky-950 text-sky-300 border-sky-800"],
  kismi: ["Kısmen geldi", "bg-amber-950 text-amber-300 border-amber-800"],
  teslim: ["Teslim alındı", "bg-emerald-950 text-emerald-300 border-emerald-800"],
  iptal: ["İptal", "bg-panel-800 text-panel-400 border-panel-700"],
};

export default function Casting({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [receiving, setReceiving] = useState<CastOrder | null>(null);
  const [showPast, setShowPast] = useState(false);
  const open = data.castOrders.filter((o) => o.status === "verildi" || o.status === "kismi");
  const past = data.castOrders.filter((o) => o.status === "teslim" || o.status === "iptal");

  return (
    <div className="space-y-5">
      <NewOrder data={data} onError={onError} />

      <div className={card}>
        <h2 className="font-bold text-panel-50">Bekleyen siparişler ({open.length})</h2>
        {open.length === 0 && <p className="text-sm text-panel-400 mt-2">Bekleyen döküm siparişi yok.</p>}
        <ul className="mt-3 space-y-3">
          {open.map((o) => (
            <OrderCard key={o.id} o={o} data={data} onReceive={() => setReceiving(o)} onError={onError} />
          ))}
        </ul>
      </div>

      {past.length > 0 && (
        <div className={card}>
          <button type="button" onClick={() => setShowPast(!showPast)} className="font-bold text-panel-50">
            Geçmiş siparişler ({past.length}) {showPast ? "▴" : "▾"}
          </button>
          {showPast && (
            <ul className="mt-3 space-y-3">
              {past.slice(0, 50).map((o) => (
                <OrderCard key={o.id} o={o} data={data} onError={onError} />
              ))}
            </ul>
          )}
        </div>
      )}

      {receiving && (
        <ReceiveForm
          order={receiving}
          caster={data.casters.find((c) => c.id === receiving.casterId)}
          data={data}
          onClose={() => setReceiving(null)}
          onError={onError}
        />
      )}
    </div>
  );
}

/* ---------- new order ---------- */

function NewOrder({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [casterId, setCasterId] = useState("");
  const [qty, setQty] = useState<Record<string, number | "">>({});
  const [extra, setExtra] = useState<string[]>([]);
  const [addId, setAddId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ link: string; caster: string } | null>(null);

  const caster = data.casters.find((c) => c.id === casterId);
  const pending = useMemo(() => pendingByCase(data.castOrders), [data.castOrders]);
  const all = useMemo(() => sortedGroups(data.groups, data.caseById), [data.groups, data.caseById]);

  // Low cases this caster makes (or every low case when none is assigned to them)
  const suggested = useMemo(() => {
    const low = all.filter((g) => isLow(g.stock, data.caseById[g.id]));
    if (!caster) return low;
    const theirs = low.filter((g) => data.caseById[g.id]?.casterIds?.includes(caster.id));
    const unassigned = low.filter((g) => !data.caseById[g.id]?.casterIds?.length);
    return [...theirs, ...unassigned];
  }, [all, data.caseById, caster]);

  const rows = [...suggested, ...all.filter((g) => extra.includes(g.id) && !suggested.includes(g))];

  const suggestQty = (gid: string) => {
    const g = data.groupById[gid];
    const min = data.caseById[gid]?.minStock;
    if (!g || typeof min !== "number") return "";
    return Math.max(0, min * 2 - g.stock - (pending[gid] || 0)) || "";
  };
  const valueOf = (gid: string) => (gid in qty ? qty[gid] : suggestQty(gid));

  const lines: CastOrderLine[] = rows
    .map((g) => ({
      groupId: g.id,
      groupName: g.name,
      caseCode: data.caseById[g.id]?.code,
      qty: Number(valueOf(g.id)) || 0,
    }))
    .filter((l) => l.qty > 0);

  const save = async () => {
    if (!caster) return onError("Dökümcü seçin.");
    if (!lines.length) return onError("En az bir kasaya adet yazın.");
    setBusy(true);
    try {
      await createCastOrder(caster, lines, note);
      setSent({ link: whatsappLink(caster.phone, castOrderText(caster, lines, data.caseById, note)), caster: caster.name });
      setQty({});
      setExtra([]);
      setNote("");
    } catch (err) {
      console.error(err);
      onError("Sipariş kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <h2 className="font-bold text-panel-50">Yeni döküm siparişi</h2>
      <p className="text-xs text-panel-400 mt-1">
        Azalan kasalar listede hazır gelir. Önerilen adet: uyarı sınırının iki katına tamamlar, yoldaki siparişleri düşer.
      </p>

      {sent && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-sm text-emerald-200 flex flex-wrap items-center gap-2">
          <Check className="w-4 h-4" /> Sipariş kaydedildi.
          <a href={sent.link} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> {sent.caster} için WhatsApp'ta aç
          </a>
          <button type="button" onClick={() => setSent(null)} className="ml-auto text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <label className="block mt-3">
        <span className={labelCls}>Dökümcü</span>
        <select value={casterId} onChange={(e) => setCasterId(e.target.value)} className={inputCls}>
          <option value="">Seçin</option>
          {data.casters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {data.casters.length === 0 && <p className="text-xs text-amber-400 mt-1">Önce Dökümcüler sekmesinden dökümcü ekleyin.</p>}

      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-panel-400">Azalan kasa yok. Aşağıdan kasa ekleyebilirsiniz.</p>}
        {rows.map((g) => (
          <li key={g.id} className="flex items-center gap-2 p-2 rounded-xl bg-panel-950 border border-panel-800">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-panel-100 truncate">{caseLabel(g, data.caseById[g.id])}</p>
              <p className="text-[11px] text-panel-500">
                elde {g.stock}
                {typeof data.caseById[g.id]?.minStock === "number" ? ` · sınır ${data.caseById[g.id].minStock}` : ""}
                {pending[g.id] ? ` · yolda ${pending[g.id]}` : ""}
              </p>
            </div>
            <input
              type="number"
              min={0}
              aria-label={`${g.name} adet`}
              value={valueOf(g.id)}
              onChange={(e) => setQty({ ...qty, [g.id]: e.target.value === "" ? "" : Number(e.target.value) })}
              placeholder="0"
              className="w-20 px-2 py-2 bg-panel-900 border border-panel-700 rounded-lg text-center text-panel-100 font-bold"
            />
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <select value={addId} onChange={(e) => setAddId(e.target.value)} className={inputCls}>
          <option value="">Listeye başka kasa ekle</option>
          {all
            .filter((g) => !rows.includes(g))
            .map((g) => (
              <option key={g.id} value={g.id}>
                {caseLabel(g, data.caseById[g.id])} ({g.stock})
              </option>
            ))}
        </select>
        <button
          type="button"
          disabled={!addId}
          onClick={() => {
            setExtra([...extra, addId]);
            setAddId("");
          }}
          className={btnGhost}
        >
          <Plus className="w-4 h-4" /> Ekle
        </button>
      </div>

      <label className="block mt-3">
        <span className={labelCls}>Not (isteğe bağlı)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </label>

      <button type="button" onClick={save} disabled={busy} className={`${btnPrimary} w-full mt-3`}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Siparişi kaydet ({lines.reduce((n, l) => n + l.qty, 0)} adet)
      </button>
    </div>
  );
}

/* ---------- order card ---------- */

function OrderCard({
  o,
  data,
  onReceive,
  onError,
}: {
  o: CastOrder;
  data: WorkshopData;
  onReceive?: () => void;
  onError: (m: string) => void;
}) {
  const caster = data.casters.find((c) => c.id === o.casterId);
  const [label, cls] = STATUS[o.status];
  const isOpen = o.status === "verildi" || o.status === "kismi";
  const total = o.lines.reduce((n, l) => n + l.qty, 0);
  const got = o.lines.reduce((n, l) => n + (l.received || 0), 0);

  const close = async () => {
    const msg = got
      ? `Bu sipariş kapatılsın mı? Gelmeyen ${total - got} adet beklenmeyecek.`
      : "Bu sipariş iptal edilsin mi?";
    if (!window.confirm(msg)) return;
    try {
      await closeCastOrder(o);
    } catch (err) {
      console.error(err);
      onError("Sipariş kapatılamadı.");
    }
  };

  return (
    <li className="p-3 rounded-xl bg-panel-950 border border-panel-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-panel-50">{o.casterName}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>
        <span className="text-xs text-panel-500">{dateTime(o.createdAt)}</span>
        <span className="ml-auto text-sm tabular-nums text-panel-300">
          {got}/{total} adet
        </span>
      </div>
      <ul className="mt-2 text-sm text-panel-300 space-y-0.5">
        {o.lines.map((l) => (
          <li key={l.groupId} className="flex gap-2">
            <span className="flex-1 truncate">
              {l.caseCode ? `${l.caseCode} · ` : ""}
              {l.groupName}
            </span>
            <span className="tabular-nums">
              {l.received || 0}/{l.qty}
            </span>
          </li>
        ))}
      </ul>
      {o.note && <p className="text-xs text-panel-500 mt-1">Not: {o.note}</p>}
      {isOpen && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onReceive && (
            <button type="button" onClick={onReceive} className="px-3 py-2 bg-brass-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4" /> Teslim al
            </button>
          )}
          {caster && (
            <a
              href={whatsappLink(caster.phone, castOrderText(caster, o.lines.map((l) => ({ ...l, qty: l.qty - (l.received || 0) })), data.caseById, o.note))}
              target="_blank"
              rel="noreferrer"
              className={btnGhost}
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
            </a>
          )}
          <button type="button" onClick={close} className={btnGhost}>
            <Trash2 className="w-4 h-4" /> {got ? "Kapat" : "İptal"}
          </button>
        </div>
      )}
    </li>
  );
}

/* ---------- receive ---------- */

function ReceiveForm({
  order,
  caster,
  data,
  onClose,
  onError,
}: {
  order: CastOrder;
  caster?: Caster;
  data: WorkshopData;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const [qty, setQty] = useState<Record<string, number | "">>(
    Object.fromEntries(order.lines.map((l) => [l.groupId, Math.max(0, l.qty - (l.received || 0))]))
  );
  const expectedGrams = order.lines.reduce((n, l) => n + (Number(qty[l.groupId]) || 0) * (data.caseById[l.groupId]?.gram || 0), 0);
  const [grams, setGrams] = useState<number | "">(expectedGrams ? Math.round(expectedGrams * 100) / 100 : "");
  const [hasOverride, setHasOverride] = useState<number | "">("");
  const [laborOverride, setLaborOverride] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const usage = casterUsage(caster || {}, Number(grams) || 0);
  const has = hasOverride === "" ? usage.has : Number(hasOverride);
  const labor = laborOverride === "" ? usage.labor : Number(laborOverride);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caster) return onError("Bu siparişin dökümcüsü silinmiş; önce dökümcüyü yeniden ekleyin.");
    const received = Object.fromEntries(Object.entries(qty).map(([k, v]) => [k, Math.max(0, Math.floor(Number(v) || 0))]));
    if (!Object.values(received).some((n) => n > 0)) return onError("Gelen adet girin.");
    setBusy(true);
    try {
      await receiveCastOrder(order, caster, received, { grams: Number(grams) || 0, has, labor, note });
      onClose();
    } catch (err) {
      console.error(err);
      onError("Teslim kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-panel-900 border border-panel-700 rounded-t-2xl sm:rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-panel-50">Teslim al: {order.casterName}</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1 text-panel-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="space-y-2">
          {order.lines.map((l) => (
            <li key={l.groupId} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-panel-200 truncate">
                {l.caseCode ? `${l.caseCode} · ` : ""}
                {l.groupName}
                <span className="text-panel-500"> (kalan {Math.max(0, l.qty - (l.received || 0))})</span>
              </span>
              <input
                type="number"
                min={0}
                aria-label={`${l.groupName} gelen`}
                value={qty[l.groupId]}
                onChange={(e) => setQty({ ...qty, [l.groupId]: e.target.value === "" ? "" : Number(e.target.value) })}
                className="w-20 px-2 py-2 bg-panel-950 border border-panel-700 rounded-lg text-center text-panel-100 font-bold"
              />
            </li>
          ))}
        </ul>

        <label className="block">
          <span className={labelCls}>Tartılan toplam gram (925)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={grams}
            onChange={(e) => setGrams(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputCls}
          />
          {expectedGrams > 0 && <p className="text-[11px] text-panel-500 mt-1">Kasa gramlarına göre beklenen: {Math.round(expectedGrams * 100) / 100} gr</p>}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className={labelCls}>Düşülecek has (gr)</span>
            <input
              type="number"
              step="0.01"
              value={hasOverride}
              placeholder={String(usage.has)}
              onChange={(e) => setHasOverride(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>İşçilik (TL)</span>
            <input
              type="number"
              step="0.01"
              value={laborOverride}
              placeholder={String(usage.labor)}
              onChange={(e) => setLaborOverride(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            />
          </label>
        </div>
        <p className="text-[11px] text-panel-500">
          Hesap: gram × {caster?.milyem || 925}/1000{caster?.firePercent ? ` × (1 + %${caster.firePercent} fire)` : ""} = {has} gr has ·
          gram × {caster?.laborPerGram || 0} TL = {tl(labor)}. Kutular boş kalırsa bu hesap kullanılır.
        </p>

        <label className="block">
          <span className={labelCls}>Not</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>

        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />} Stoğa ekle ve cariye işle
        </button>
      </form>
    </div>
  );
}
