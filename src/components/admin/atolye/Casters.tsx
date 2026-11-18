"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { CashAccount, Caster, CasterLedgerType } from "@/types";
import {
  ACCOUNT_LABELS,
  addLedgerLine,
  casterBalance,
  deleteCaster,
  deleteLedgerLine,
  LEDGER_LABELS,
  saveCaster,
  tl,
  whatsappLink,
} from "@/services/workshopService";
import { btnGhost, btnPrimary, card, dateTime, inputCls, labelCls, WorkshopData } from "./shared";

type Num = number | "";
const empty = { name: "", phone: "", laborPerGram: "" as Num, milyem: 925 as Num, firePercent: "" as Num, note: "" };
const num = (v: string): Num => (v === "" ? "" : Number(v));

export default function Casters({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return onError("Dökümcü adı girin.");
    setBusy(true);
    try {
      await saveCaster({
        id: editId || undefined,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        laborPerGram: form.laborPerGram === "" ? undefined : Number(form.laborPerGram),
        milyem: form.milyem === "" ? undefined : Number(form.milyem),
        firePercent: form.firePercent === "" ? undefined : Number(form.firePercent),
        note: form.note.trim() || undefined,
      });
      setForm(empty);
      setEditId(null);
    } catch (err) {
      console.error(err);
      onError("Dökümcü kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const edit = (c: Caster) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      phone: c.phone || "",
      laborPerGram: c.laborPerGram ?? "",
      milyem: c.milyem ?? 925,
      firePercent: c.firePercent ?? "",
      note: c.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (c: Caster) => {
    const b = casterBalance(data.ledger, c.id);
    const warn = b.has || b.owed ? `\nDikkat: cari bakiye açık (${b.has} gr has, ${tl(b.owed)}).` : "";
    if (!window.confirm(`“${c.name}” silinsin mi? Geçmiş kayıtlar silinmez.${warn}`)) return;
    try {
      await deleteCaster(c.id);
    } catch (err) {
      console.error(err);
      onError("Silinemedi.");
    }
  };

  const totals = data.casters.reduce(
    (t, c) => {
      const b = casterBalance(data.ledger, c.id);
      return { has: t.has + b.has, owed: t.owed + b.owed };
    },
    { has: 0, owed: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className={card}>
          <p className="text-xs text-panel-400">Dökümcülerdeki has</p>
          <p className="text-2xl font-extrabold tabular-nums text-panel-50">{Math.round(totals.has * 100) / 100} gr</p>
        </div>
        <div className={card}>
          <p className="text-xs text-panel-400">Ödenecek işçilik</p>
          <p className="text-2xl font-extrabold tabular-nums text-panel-50">{tl(totals.owed)}</p>
        </div>
      </div>

      <form onSubmit={submit} className={`${card} grid grid-cols-2 sm:grid-cols-6 gap-3 items-end`}>
        <label className="col-span-2">
          <span className={labelCls}>Dökümcü adı</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className={labelCls}>Telefon</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx…" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Gram işçiliği (TL)</span>
          <input type="number" min={0} step="0.01" value={form.laborPerGram} onChange={(e) => setForm({ ...form, laborPerGram: num(e.target.value) })} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Ayar (milyem)</span>
          <input type="number" min={0} max={1000} value={form.milyem} onChange={(e) => setForm({ ...form, milyem: num(e.target.value) })} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Döküm firesi (%)</span>
          <input type="number" min={0} step="0.1" value={form.firePercent} onChange={(e) => setForm({ ...form, firePercent: num(e.target.value) })} placeholder="0" className={inputCls} />
        </label>
        <label className="col-span-2 sm:col-span-4">
          <span className={labelCls}>Not</span>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} />
        </label>
        <div className="col-span-2 flex gap-2">
          <button type="submit" disabled={busy} className={`${btnPrimary} flex-1`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editId ? "Kaydet" : "Dökümcü ekle"}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className={btnGhost}>
              Vazgeç
            </button>
          )}
        </div>
      </form>
      <p className="text-[11px] text-panel-500 -mt-2">
        Teslim alınan her dökümde has düşümü = gram × ayar/1000 × (1 + fire). İşçilik = gram × gram işçiliği.
      </p>

      {data.casters.length === 0 && <p className="text-sm text-panel-400">Henüz dökümcü yok.</p>}
      <div className="space-y-3">
        {data.casters.map((c) => (
          <CasterCard
            key={c.id}
            c={c}
            data={data}
            open={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
            onEdit={() => edit(c)}
            onRemove={() => remove(c)}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}

const ACTIONS: { type: CasterLedgerType; label: string; has: 1 | -1 | 0; tl: 1 | -1 | 0; help: string }[] = [
  {
    type: "acilis",
    label: "Eski borç / açılış",
    has: 1,
    tl: 1,
    help:
      "Sistemden önce kalan hesabı bir kere girin. Tutar: dökümcüye olan işçilik borcumuz (TL). Has: dökümcünün elinde duran bizim has gümüşümüz (gr). Biz dökümcüye has borçluysak has kutusuna eksi yazın (ör. -50).",
  },
  { type: "hasVerildi", label: "Has verdim", has: 1, tl: 0, help: "Dökümcüye verilen has gümüş (gr)" },
  { type: "odeme", label: "İşçilik ödedim", has: 0, tl: -1, help: "Ödenen işçilik (TL)" },
  { type: "hasIade", label: "Has iade aldım", has: -1, tl: 0, help: "Dökümcüden geri alınan has (gr)" },
  { type: "duzeltme", label: "Düzeltme", has: 1, tl: 1, help: "Artı veya eksi yazın; ör. sayım farkı" },
];

function CasterCard({
  c,
  data,
  open,
  onToggle,
  onEdit,
  onRemove,
  onError,
}: {
  c: Caster;
  data: WorkshopData;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onError: (m: string) => void;
}) {
  const b = casterBalance(data.ledger, c.id);
  const lines = data.ledger.filter((l) => l.casterId === c.id);
  const cases = data.cases.filter((x) => x.casterIds?.includes(c.id)).length;
  const openOrders = data.castOrders.filter((o) => o.casterId === c.id && (o.status === "verildi" || o.status === "kismi")).length;

  const [action, setAction] = useState<CasterLedgerType | null>(null);
  const [hasVal, setHasVal] = useState<Num>("");
  const [tlVal, setTlVal] = useState<Num>("");
  const [note, setNote] = useState("");
  const [payFrom, setPayFrom] = useState<CashAccount | "">("nakit");
  const [busy, setBusy] = useState(false);
  const a = ACTIONS.find((x) => x.type === action);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a) return;
    const h = Number(hasVal) || 0;
    const t = Number(tlVal) || 0;
    if (!h && !t) return onError("Miktar girin.");
    setBusy(true);
    try {
      await addLedgerLine(c, a.type, {
        // Opening balance and corrections keep the sign typed in
        hasGram: a.type === "duzeltme" || a.type === "acilis" ? h : a.has * Math.abs(h),
        tl: a.type === "duzeltme" || a.type === "acilis" ? t : a.tl * Math.abs(t),
        note,
        payFrom: a.type === "odeme" && payFrom ? payFrom : undefined,
      });
      setAction(null);
      setHasVal("");
      setTlVal("");
      setNote("");
    } catch (err) {
      console.error(err);
      onError("Cari kaydı yazılamadı.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={card}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-panel-50">{c.name}</p>
          <p className="text-xs text-panel-400">
            {c.laborPerGram ? `${c.laborPerGram} TL/gr` : "işçilik girilmedi"} · {c.milyem || 925} ayar
            {c.firePercent ? ` · %${c.firePercent} fire` : ""} · {cases} kasa
            {openOrders ? ` · ${openOrders} bekleyen sipariş` : ""}
          </p>
        </div>
        {c.phone && (
          <a href={whatsappLink(c.phone, "")} target="_blank" rel="noreferrer" className="p-2 text-emerald-400" aria-label="WhatsApp">
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
        <button type="button" onClick={onEdit} className="p-2 text-panel-400 hover:text-panel-100" aria-label="Düzenle">
          <Pencil className="w-4 h-4" />
        </button>
        <button type="button" onClick={onRemove} className="p-2 text-panel-500 hover:text-red-400" aria-label="Sil">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-panel-950 border border-panel-800">
          <p className="text-[11px] text-panel-400">Dökümcüdeki has</p>
          <p className={`text-lg font-extrabold tabular-nums ${b.has < 0 ? "text-red-400" : "text-panel-50"}`}>{b.has} gr</p>
          {b.has < 0 && <p className="text-[11px] text-red-400">Has borcumuz var</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-panel-950 border border-panel-800">
          <p className="text-[11px] text-panel-400">Ödenecek işçilik</p>
          <p className="text-lg font-extrabold tabular-nums text-panel-50">{tl(b.owed)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((x) => (
          <button
            key={x.type}
            type="button"
            onClick={() => setAction(action === x.type ? null : x.type)}
            className={`${btnGhost} ${action === x.type ? "!bg-brass-600 !text-white" : ""}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {a && (
        <form onSubmit={save} className="mt-3 p-3 rounded-xl bg-panel-950 border border-panel-800 grid grid-cols-2 gap-3 items-end">
          <p className="col-span-2 text-xs text-panel-400">{a.help}</p>
          {a.has !== 0 && (
            <label>
              <span className={labelCls}>Has (gr)</span>
              <input type="number" step="0.01" value={hasVal} onChange={(e) => setHasVal(num(e.target.value))} className={inputCls} />
            </label>
          )}
          {a.tl !== 0 && (
            <label>
              <span className={labelCls}>Tutar (TL)</span>
              <input type="number" step="0.01" value={tlVal} onChange={(e) => setTlVal(num(e.target.value))} className={inputCls} />
            </label>
          )}
          {a.type === "odeme" && (
            <label>
              <span className={labelCls}>Nereden ödendi</span>
              <select value={payFrom} onChange={(e) => setPayFrom(e.target.value as CashAccount | "")} className={inputCls}>
                <option value="nakit">{ACCOUNT_LABELS.nakit}</option>
                <option value="banka">{ACCOUNT_LABELS.banka}</option>
                <option value="">Para defterine yazma</option>
              </select>
            </label>
          )}
          <label className="col-span-2">
            <span className={labelCls}>Not</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </label>
          <button type="submit" disabled={busy} className={`${btnPrimary} col-span-2`}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
          </button>
        </form>
      )}

      <button type="button" onClick={onToggle} className="mt-3 text-xs text-brass-400 font-semibold flex items-center gap-1">
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Cari hareketleri ({lines.length})
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {lines.length === 0 && <li className="text-xs text-panel-500">Kayıt yok.</li>}
          {lines.slice(0, 100).map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-panel-950">
              <span className="w-24 text-panel-500 flex-shrink-0">{dateTime(l.at)}</span>
              <span className="flex-1 min-w-0 truncate text-panel-200">
                {LEDGER_LABELS[l.type]}
                {l.grams ? ` · ${l.grams} gr geldi` : ""}
                {l.note ? ` · ${l.note}` : ""}
              </span>
              {l.hasGram !== 0 && (
                <span className={`tabular-nums ${l.hasGram > 0 ? "text-sky-300" : "text-amber-300"}`}>
                  {l.hasGram > 0 ? "+" : ""}
                  {l.hasGram} gr
                </span>
              )}
              {l.tl !== 0 && (
                <span className={`tabular-nums ${l.tl > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                  {l.tl > 0 ? "+" : ""}
                  {tl(l.tl)}
                </span>
              )}
              {l.type !== "teslim" && (
                <button
                  type="button"
                  aria-label="Kaydı sil"
                  onClick={() =>
                    window.confirm("Bu cari kaydı silinsin mi?") &&
                    deleteLedgerLine(l).catch(() => onError("Silinemedi."))
                  }
                  className="text-panel-600 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
