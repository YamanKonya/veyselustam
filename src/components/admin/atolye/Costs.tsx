"use client";

import React, { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { productCode } from "@/lib/productCode";
import { useSilverStore } from "@/store/useSilverStore";
import { saveHasPrice, saveWorkshopCase, tl, variantCost } from "@/services/workshopService";
import { btnPrimary, card, caseLabel, dateTime, inputCls, labelCls, sortedGroups, Thumb, WorkshopData } from "./shared";

type Sort = "margin" | "code";

export default function Costs({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const { settings } = data;
  const [price, setPrice] = useState<number | "">(settings.hasPrice ?? "");
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<Sort>("margin");
  const [warnAt, setWarnAt] = useState(30);
  const live = useSilverStore((s) => s.quote);

  const savePrice = async () => {
    if (!price || Number(price) <= 0) return onError("Gram has gümüş fiyatını girin.");
    setBusy(true);
    try {
      await saveHasPrice(Number(price), settings);
    } catch (err) {
      console.error(err);
      onError("Fiyat kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    const out = [];
    for (const g of sortedGroups(data.groups, data.caseById)) {
      const wc = data.caseById[g.id];
      for (const p of data.variants[g.id] || []) {
        const cost = variantCost(wc, data.casters, settings, p.id);
        const margin = p.price - cost.total;
        const pct = p.price ? Math.round((margin / p.price) * 100) : 0;
        out.push({ g, wc, p, cost, margin, pct });
      }
    }
    if (sort === "margin") out.sort((a, b) => (a.cost.missing.length ? 1 : 0) - (b.cost.missing.length ? 1 : 0) || a.pct - b.pct);
    return out;
  }, [data, settings, sort]);

  const setStone = (gid: string, pid: string, v: string) => {
    const wc = data.caseById[gid];
    const stoneCosts = { ...(wc?.stoneCosts || {}) };
    if (v === "") delete stoneCosts[pid];
    else stoneCosts[pid] = Number(v);
    saveWorkshopCase(gid, { stoneCosts }).catch(() => onError("Taş maliyeti kaydedilemedi."));
  };
  const setExtra = (gid: string, v: string) =>
    saveWorkshopCase(gid, { extraCost: v === "" ? 0 : Number(v) }).catch(() => onError("Kaydedilemedi."));

  const history = settings.hasPriceHistory || [];

  return (
    <div className="space-y-5">
      <div className={card}>
        <h2 className="font-bold text-panel-50">Gümüş fiyatı</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="w-48">
            <span className={labelCls}>1 gram has gümüş (TL)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className={inputCls}
            />
          </label>
          <button type="button" onClick={savePrice} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kaydet
          </button>
          {live && (
            <button
              type="button"
              onClick={() => setPrice(Math.round(live.gramTL * 100) / 100)}
              className="px-3 py-2.5 bg-panel-800 hover:bg-panel-700 text-panel-100 text-xs font-semibold rounded-xl"
              title={`Kaynak: ${live.source}`}
            >
              Anlık fiyatı al ({live.gramTL.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺)
            </button>
          )}
          {settings.hasPriceAt && (
            <p className="text-xs text-panel-400">
              Son: {tl(settings.hasPrice || 0)} · {dateTime(settings.hasPriceAt)}
            </p>
          )}
        </div>
        {history.length > 1 && (
          <p className="mt-2 text-[11px] text-panel-500">
            Önceki: {history.slice(1, 6).map((h) => `${tl(h.price)} (${new Date(h.at).toLocaleDateString("tr-TR")})`).join(" · ")}
          </p>
        )}
        <p className="mt-2 text-[11px] text-panel-500">
          Anlık fiyat piyasanın gram gümüş satış fiyatıdır; kuyumcu/toptancı fiyatınız farklıysa onu yazın. Maliyet hesabı
          kaydedilen fiyatla yapılır. Maliyet = gram × ayar × (1 + fire) × has fiyatı + gram × işçilik + taş + diğer (cila, kutu…). Dökümcü olarak kasaya
          atanan ilk dökümcü kullanılır.
        </p>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-panel-50 flex-1">Çeşit maliyetleri ({rows.length})</h2>
          <label className="text-xs text-panel-400 flex items-center gap-1.5">
            Uyarı: kâr %
            <input
              type="number"
              value={warnAt}
              onChange={(e) => setWarnAt(Number(e.target.value) || 0)}
              className="w-14 px-2 py-1 bg-panel-950 border border-panel-700 rounded-md text-panel-100"
            />
            altı
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="px-2 py-1.5 bg-panel-950 border border-panel-700 rounded-lg text-xs text-panel-100">
            <option value="margin">Kârı en düşük önce</option>
            <option value="code">Kasa koduna göre</option>
          </select>
        </div>

        {rows.length === 0 && <p className="text-sm text-panel-400 mt-3">Kasaya bağlı ürün yok.</p>}
        <ul className="mt-3 space-y-2">
          {rows.map(({ g, wc, p, cost, margin, pct }) => {
            const bad = !cost.missing.length && pct < warnAt;
            return (
              <li key={p.id} className={`p-3 rounded-xl bg-panel-950 border ${bad ? "border-red-800" : "border-panel-800"}`}>
                <div className="flex items-center gap-3">
                  <Thumb src={p.images?.[0]} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-panel-100 truncate">{p.title}</p>
                    <p className="text-[11px] text-panel-500 truncate">
                      {caseLabel(g, wc)} · {productCode(p)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-panel-300 tabular-nums">{tl(p.price)}</p>
                    {cost.missing.length ? (
                      <p className="text-[11px] text-amber-400">eksik: {cost.missing.join(", ")}</p>
                    ) : (
                      <p className={`text-sm font-bold tabular-nums ${bad ? "text-red-400" : "text-emerald-300"}`}>
                        {tl(margin)} · %{pct}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-panel-400">
                  <span>Gümüş {tl(cost.silver)}</span>
                  <span>İşçilik {tl(cost.labor)}</span>
                  <label className="flex items-center gap-1">
                    Taş
                    <input
                      type="number"
                      min={0}
                      defaultValue={wc?.stoneCosts?.[p.id!] ?? ""}
                      onBlur={(e) => e.target.value !== String(wc?.stoneCosts?.[p.id!] ?? "") && setStone(g.id, p.id!, e.target.value)}
                      placeholder="0"
                      className="w-16 px-1.5 py-0.5 bg-panel-900 border border-panel-700 rounded text-panel-100"
                    />
                  </label>
                  <label className="flex items-center gap-1" title="Kasadaki bütün çeşitler için">
                    Diğer
                    <input
                      type="number"
                      min={0}
                      defaultValue={wc?.extraCost ?? ""}
                      onBlur={(e) => e.target.value !== String(wc?.extraCost ?? "") && setExtra(g.id, e.target.value)}
                      placeholder="0"
                      className="w-16 px-1.5 py-0.5 bg-panel-900 border border-panel-700 rounded text-panel-100"
                    />
                  </label>
                  <span className="font-semibold text-panel-200">Toplam {tl(cost.total)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
