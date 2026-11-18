"use client";

import React, { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, MessageCircle } from "lucide-react";
import { Caster } from "@/types";
import { deleteCaster, saveCaster } from "@/services/workshopService";
import { btnGhost, btnPrimary, card, inputCls, labelCls, WorkshopData } from "./shared";

const empty = { name: "", phone: "", laborPerGram: "" as number | "", note: "" };

export default function Casters({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // What each caster delivered in the loaded window
  const stats = (id: string) => {
    let qty = 0;
    let grams = 0;
    for (const m of data.movements) if (m.type === "dokum" && m.casterId === id) {
      qty += m.qty;
      grams += m.grams || 0;
    }
    const cases = data.cases.filter((c) => c.casterIds?.includes(id)).length;
    return { qty, grams: Math.round(grams * 100) / 100, cases };
  };

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
    setForm({ name: c.name, phone: c.phone || "", laborPerGram: c.laborPerGram ?? "", note: c.note || "" });
  };

  const remove = async (c: Caster) => {
    if (!window.confirm(`“${c.name}” silinsin mi? Geçmiş döküm kayıtları silinmez.`)) return;
    try {
      await deleteCaster(c.id);
    } catch (err) {
      console.error(err);
      onError("Silinemedi.");
    }
  };

  const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "90")}`;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className={`${card} grid grid-cols-2 sm:grid-cols-5 gap-3 items-end`}>
        <label className="col-span-2 sm:col-span-1">
          <span className={labelCls}>Dökümcü adı</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Telefon</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="05xx…"
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Gram işçiliği (TL)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.laborPerGram}
            onChange={(e) => setForm({ ...form, laborPerGram: e.target.value === "" ? "" : Number(e.target.value) })}
            className={inputCls}
          />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className={labelCls}>Not</span>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} />
        </label>
        <div className="col-span-2 sm:col-span-1 flex gap-2">
          <button type="submit" disabled={busy} className={`${btnPrimary} flex-1`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editId ? "Kaydet" : "Ekle"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(empty);
              }}
              className={btnGhost}
            >
              Vazgeç
            </button>
          )}
        </div>
      </form>

      {data.casters.length === 0 && <p className="text-sm text-panel-400">Henüz dökümcü yok.</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {data.casters.map((c) => {
          const s = stats(c.id);
          return (
            <div key={c.id} className={card}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-panel-50">{c.name}</p>
                  <p className="text-xs text-panel-400">
                    {c.laborPerGram ? `Gram işçiliği ${c.laborPerGram} TL` : "İşçilik girilmedi"}
                    {` · ${s.cases} kasa`}
                  </p>
                  {c.note && <p className="text-xs text-panel-500 mt-1">{c.note}</p>}
                </div>
                {c.phone && (
                  <a href={wa(c.phone)} target="_blank" rel="noreferrer" className="p-2 text-emerald-400" aria-label="WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                <button type="button" onClick={() => edit(c)} className="p-2 text-panel-400 hover:text-panel-100" aria-label="Düzenle">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => remove(c)} className="p-2 text-panel-500 hover:text-red-400" aria-label="Sil">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-panel-300">
                Son 120 günde: <b className="text-panel-100">{s.qty}</b> kasa, <b className="text-panel-100">{s.grams}</b> gr teslim
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-panel-600">
        Döküm siparişleri ve has gümüş / işçilik hesabı (cari) sonraki aşamada bu sekmeye eklenecek.
      </p>
    </div>
  );
}
