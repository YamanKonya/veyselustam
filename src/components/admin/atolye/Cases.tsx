"use client";

import React, { useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, Link2, Loader2, Plus, Save, Search, Unlink, Minus } from "lucide-react";
import { db } from "@/lib/firebase";
import { productCode } from "@/lib/productCode";
import { Product, StockGroup } from "@/types";
import { availableStock, slugifyGroupName } from "@/services/stockService";
import { setProductWorkshopFields } from "@/services/productService";
import {
  createCase,
  isLow,
  MOVEMENT_LABELS,
  nextCaseCode,
  normalizeCaseCode,
  saveWorkshopCase,
} from "@/services/workshopService";
import {
  Badge,
  btnGhost,
  btnPrimary,
  card,
  dateTime,
  inputCls,
  labelCls,
  MovementPreset,
  sortedGroups,
  Thumb,
  WorkshopData,
} from "./shared";

type Filter = "all" | "low" | "out";

export default function Cases({
  data,
  onMove,
  onError,
}: {
  data: WorkshopData;
  onMove: (p: MovementPreset) => void;
  onError: (msg: string) => void;
}) {
  const { groups, caseById, variants } = data;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    return sortedGroups(groups, caseById).filter((g) => {
      const wc = caseById[g.id];
      if (filter === "low" && !isLow(g.stock, wc)) return false;
      if (filter === "out" && g.stock > 0) return false;
      if (!term) return true;
      const hay = [g.name, wc?.code, ...(variants[g.id] || []).map((p) => `${p.title} ${productCode(p)}`)]
        .join(" ")
        .toLocaleLowerCase("tr");
      return hay.includes(term);
    });
  }, [groups, caseById, variants, q, filter]);

  const lowCount = groups.filter((g) => isLow(g.stock, caseById[g.id])).length;
  const outCount = groups.filter((g) => g.stock <= 0).length;

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-panel-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kasa kodu, adı, model veya VU kodu ara"
            className={`${inputCls} pl-9`}
          />
        </div>
        {(
          [
            ["all", `Tümü (${groups.length})`],
            ["low", `Azalan (${lowCount})`],
            ["out", `Biten (${outCount})`],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
              filter === k ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-900 border-panel-700 text-panel-300"
            }`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setShowNew((s) => !s)} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Yeni kasa
        </button>
      </div>

      {showNew && <NewCase data={data} onDone={() => setShowNew(false)} onError={onError} />}

      <div className="mt-4 space-y-2">
        {list.length === 0 && <p className="text-sm text-panel-400">Bu aramaya uyan kasa yok.</p>}
        {list.map((g) => (
          <CaseRow
            key={g.id}
            g={g}
            data={data}
            open={open === g.id}
            onToggle={() => setOpen(open === g.id ? null : g.id)}
            onMove={onMove}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}

function NewCase({ data, onDone, onError }: { data: WorkshopData; onDone: () => void; onError: (m: string) => void }) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [code, setCode] = useState(nextCaseCode(data.cases));
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = slugifyGroupName(name);
    const c = normalizeCaseCode(code);
    if (!id) return onError("Kasa adı girin.");
    if (data.groupById[id]) return onError(`“${name.trim()}” adında bir kasa zaten var.`);
    if (!c) return onError("Kasa kodu girin.");
    if (data.cases.some((x) => x.code === c)) return onError(`${c} kodu başka bir kasada kullanılıyor.`);
    setBusy(true);
    try {
      await createCase(id, name.trim(), Number(stock) || 0, c);
      onDone();
    } catch (err) {
      console.error(err);
      onError("Kasa eklenemedi. İnternet bağlantısını ve yönetici girişini kontrol edin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end`}>
      <label>
        <span className={labelCls}>Kod</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
      </label>
      <label className="col-span-2 sm:col-span-1">
        <span className={labelCls}>Kasa adı</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ör. Sidre" className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Eldeki adet</span>
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="0"
          className={inputCls}
        />
      </label>
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ekle
      </button>
    </form>
  );
}

function CaseRow({
  g,
  data,
  open,
  onToggle,
  onMove,
  onError,
}: {
  g: StockGroup;
  data: WorkshopData;
  open: boolean;
  onToggle: () => void;
  onMove: (p: MovementPreset) => void;
  onError: (m: string) => void;
}) {
  const wc = data.caseById[g.id];
  const items = data.variants[g.id] || [];
  const low = isLow(g.stock, wc);

  return (
    <div className={`${card} !p-0 overflow-hidden`}>
      <button type="button" onClick={onToggle} className="w-full p-3 sm:p-4 flex items-center gap-3 text-left">
        <Thumb src={items[0]?.images?.[0]} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-brass-400">{wc?.code || "kodsuz"}</p>
          <p className="font-bold text-panel-50 truncate">{g.name}</p>
          <p className="text-xs text-panel-400">
            {items.length} çeşit{wc?.gram ? ` · ${wc.gram} gr` : ""}
            {typeof wc?.minStock === "number" ? ` · en az ${wc.minStock}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-extrabold tabular-nums ${g.stock <= 0 ? "text-red-400" : low ? "text-amber-400" : "text-panel-50"}`}>
            {g.stock}
          </p>
          <p className={`text-[11px] ${g.stock <= 0 ? "text-red-400" : low ? "text-amber-400" : "text-panel-500"}`}>
            {g.stock <= 0 ? "bitti" : low ? "azaldı" : "adet"}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-panel-500" /> : <ChevronDown className="w-4 h-4 text-panel-500" />}
      </button>

      {open && <CaseDetail g={g} data={data} onMove={onMove} onError={onError} />}
    </div>
  );
}

function CaseDetail({
  g,
  data,
  onMove,
  onError,
}: {
  g: StockGroup;
  data: WorkshopData;
  onMove: (p: MovementPreset) => void;
  onError: (m: string) => void;
}) {
  const wc = data.caseById[g.id];
  const items = data.variants[g.id] || [];
  const [name, setName] = useState(g.name);
  const [code, setCode] = useState(wc?.code || "");
  const [gram, setGram] = useState<number | "">(wc?.gram ?? "");
  const [minStock, setMinStock] = useState<number | "">(wc?.minStock ?? "");
  const [casterIds, setCasterIds] = useState<string[]>(wc?.casterIds || []);
  const [note, setNote] = useState(wc?.note || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [linkQ, setLinkQ] = useState("");

  const recent = data.movements.filter((m) => m.groupId === g.id).slice(0, 6);

  const unlinked = useMemo(() => {
    const term = linkQ.trim().toLocaleLowerCase("tr");
    if (term.length < 2) return [];
    return data.products
      .filter((p) => p.id && p.stockGroup !== g.id)
      .filter((p) => `${p.title} ${productCode(p)}`.toLocaleLowerCase("tr").includes(term))
      .slice(0, 8);
  }, [data.products, linkQ, g.id]);

  const save = async () => {
    const c = normalizeCaseCode(code);
    if (!c) return onError("Kasa kodu boş olamaz.");
    if (data.cases.some((x) => x.id !== g.id && x.code === c)) return onError(`${c} kodu başka bir kasada kullanılıyor.`);
    if (!name.trim()) return onError("Kasa adı boş olamaz.");
    setBusy(true);
    try {
      if (name.trim() !== g.name) await setDoc(doc(db, "stockGroups", g.id), { name: name.trim() }, { merge: true });
      await saveWorkshopCase(g.id, {
        code: c,
        gram: gram === "" ? undefined : Number(gram),
        minStock: minStock === "" ? undefined : Math.max(0, Math.floor(Number(minStock))),
        casterIds,
        note: note.trim(),
      });
      setCode(c);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      onError("Kasa bilgileri kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const link = (p: Product) => {
    if (p.stockGroup && !window.confirm(`“${p.title}” şu an başka bir kasaya bağlı. Bu kasaya taşınsın mı?`)) return;
    setProductWorkshopFields(p.id!, { stockGroup: g.id });
    setLinkQ("");
  };

  return (
    <div className="border-t border-panel-800 p-3 sm:p-4 space-y-5">
      {/* quick actions */}
      <div className="flex flex-wrap gap-2">
        {(["dokum", "uretim", "satis", "fire", "sayim"] as const).map((t) => (
          <button key={t} type="button" onClick={() => onMove({ type: t, groupId: g.id })} className={btnGhost}>
            {MOVEMENT_LABELS[t]}
          </button>
        ))}
      </div>

      {/* card fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label>
          <span className={labelCls}>Kasa kodu</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className={labelCls}>Kasa adı</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Gram (1 kasa)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={gram}
            onChange={(e) => setGram(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Uyarı sınırı (en az)</span>
          <input
            type="number"
            min={0}
            value={minStock}
            onChange={(e) => setMinStock(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Ör. 5"
            className={inputCls}
          />
        </label>
      </div>

      <div>
        <span className={labelCls}>Bu kasayı döken dökümcüler</span>
        {data.casters.length === 0 ? (
          <p className="text-xs text-panel-500">Önce “Dökümcüler” sekmesinden dökümcü ekleyin.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.casters.map((c) => {
              const on = casterIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCasterIds(on ? casterIds.filter((x) => x !== c.id) : [...casterIds, c.id])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    on ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-950 border-panel-700 text-panel-300"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <label className="block">
        <span className={labelCls}>Not</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} />
      </label>

      <button type="button" onClick={save} disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Kaydedildi" : "Kasa bilgilerini kaydet"}
      </button>

      {/* variants */}
      <div>
        <h3 className="text-sm font-bold text-panel-100 mb-2">Çeşitler (kasa + taş)</h3>
        {items.length === 0 && <p className="text-xs text-panel-500 mb-2">Bu kasaya bağlı sitede ürün yok.</p>}
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-panel-950 border border-panel-800">
              <Thumb src={p.images?.[0]} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-panel-100 truncate">{p.title}</p>
                <p className="text-[11px] text-panel-500">
                  {productCode(p)} · satılabilir {availableStock(p, data.groups)}
                  {p.isActive === false ? " · pasif" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1" title="Bu modelin kendi stoğu (taş adedi)">
                <span className="text-[11px] text-panel-500 mr-1">taş</span>
                <button
                  type="button"
                  aria-label="Taş azalt"
                  onClick={() => setProductWorkshopFields(p.id!, { stock: (p.stock || 0) - 1 })}
                  disabled={(p.stock || 0) <= 0}
                  className="w-7 h-7 rounded-md bg-panel-800 flex items-center justify-center disabled:opacity-40"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center text-sm font-bold tabular-nums">{p.stock ?? 0}</span>
                <button
                  type="button"
                  aria-label="Taş artır"
                  onClick={() => setProductWorkshopFields(p.id!, { stock: (p.stock || 0) + 1 })}
                  className="w-7 h-7 rounded-md bg-panel-800 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onMove({ type: "satis", groupId: g.id, productId: p.id })}
                className="hidden sm:flex px-2 py-1.5 text-[11px] font-semibold rounded-md bg-emerald-900 text-emerald-200"
              >
                Sat
              </button>
              <button
                type="button"
                aria-label={`${p.title} bağlantısını kaldır`}
                title="Kasadan ayır"
                onClick={() =>
                  window.confirm(`“${p.title}” bu kasadan ayrılsın mı? Satışı artık kasa stoğundan düşmez.`) &&
                  setProductWorkshopFields(p.id!, { stockGroup: null })
                }
                className="p-1.5 text-panel-500 hover:text-red-400"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <span className={labelCls}>Sitedeki bir ürünü bu kasaya bağla</span>
          <input
            value={linkQ}
            onChange={(e) => setLinkQ(e.target.value)}
            placeholder="Ürün adı veya VU kodu yazın"
            className={inputCls}
          />
          {unlinked.length > 0 && (
            <ul className="mt-2 space-y-1">
              {unlinked.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => link(p)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-panel-950 hover:bg-panel-800 text-left"
                  >
                    <Link2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
                    <span className="text-sm text-panel-100 truncate flex-1">{p.title}</span>
                    <span className="text-[11px] text-panel-500">
                      {productCode(p)}
                      {p.stockGroup ? ` · başka kasada` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* recent ledger */}
      <div>
        <h3 className="text-sm font-bold text-panel-100 mb-2">Son hareketler</h3>
        {recent.length === 0 ? (
          <p className="text-xs text-panel-500">Henüz hareket yok.</p>
        ) : (
          <ul className="space-y-1">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-xs text-panel-300">
                <span className="w-24 text-panel-500">{dateTime(m.at)}</span>
                <Badge kind={m.type}>{MOVEMENT_LABELS[m.type]}</Badge>
                <span className="tabular-nums">
                  {m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? m.delta : `${m.qty} adet`}
                </span>
                <span className="truncate text-panel-500">{m.productTitle || m.casterName || m.note || ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
