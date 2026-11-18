"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  cashBalances,
  casterBalance,
  isLow,
  pendingByCase,
  startOfDay,
  startOfMonth,
  startOfWeek,
  tl,
} from "@/services/workshopService";
import { buildFeed, FeedRow } from "./Ledger";
import { btnGhost, card, caseLabel, liveOrders, MovementPreset, sortedGroups, WorkshopData } from "./shared";

type Period = "day" | "week" | "month";
const PERIODS: [Period, string][] = [
  ["day", "Bugün"],
  ["week", "Bu hafta"],
  ["month", "Bu ay"],
];

const Tile = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="p-3 sm:p-4 rounded-2xl bg-panel-900 border border-panel-800">
    <p className="text-xs text-panel-400">{label}</p>
    <p className="text-2xl font-extrabold text-panel-50 tabular-nums mt-0.5">{value}</p>
    {sub && <p className="text-[11px] text-panel-500 mt-0.5">{sub}</p>}
  </div>
);

export default function Summary({ data, onMove }: { data: WorkshopData; onMove: (p: MovementPreset) => void }) {
  const [period, setPeriod] = useState<Period>("day");

  const s = useMemo(() => {
    const from = (period === "day" ? startOfDay() : period === "week" ? startOfWeek() : startOfMonth()).toISOString();
    const moves = data.movements.filter((m) => m.at >= from);
    const orders = liveOrders(data.orders).filter((o) => o.createdAt >= from);

    let handQty = 0, handAmount = 0, made = 0, cast = 0, castGrams = 0, waste = 0;
    const perCase: Record<string, number> = {};
    for (const m of moves) {
      if (m.type === "satis") {
        handQty += m.qty;
        handAmount += m.amount || 0;
        perCase[m.groupId] = (perCase[m.groupId] || 0) + m.qty;
      } else if (m.type === "uretim") made += m.qty;
      else if (m.type === "dokum") {
        cast += m.qty;
        castGrams += m.grams || 0;
      } else if (m.type === "fire") waste += m.qty;
    }
    let onlineQty = 0, onlineAmount = 0;
    for (const o of orders) {
      onlineQty += o.items.reduce((n, i) => n + (i.quantity || 0), 0);
      onlineAmount += o.totalAmount || 0;
      for (const [gid, n] of Object.entries(o.stockDeductions?.groups || {})) perCase[gid] = (perCase[gid] || 0) + n;
    }
    const top = Object.entries(perCase)
      .filter(([gid]) => data.groupById[gid])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { handQty, handAmount, onlineQty, onlineAmount, made, cast, castGrams: Math.round(castGrams), waste, top, orderCount: orders.length };
  }, [data, period]);

  const totalStock = data.groups.reduce((n, g) => n + Math.max(0, g.stock), 0);
  const low = sortedGroups(data.groups, data.caseById)
    .filter((g) => isLow(g.stock, data.caseById[g.id]))
    .sort((a, b) => a.stock - b.stock);
  const feed = useMemo(() => buildFeed(data).slice(0, 8), [data]);
  const pending = useMemo(() => pendingByCase(data.castOrders), [data.castOrders]);
  const money = useMemo(() => cashBalances(data.cash), [data.cash]);
  const uncollected = useMemo(() => {
    const done = new Set(data.cash.filter((e) => e.source === "siparis").map((e) => e.refId));
    const since = new Date(Date.now() - 120 * 86400000).toISOString();
    const list = liveOrders(data.orders).filter((o) => o.createdAt >= since && o.id && !done.has(o.id));
    return { count: list.length, amount: list.reduce((n, o) => n + (o.totalAmount || 0), 0) };
  }, [data.cash, data.orders]);
  const casterTotals = useMemo(() => {
    let has = 0;
    let owed = 0;
    for (const c of data.casters) {
      const b = casterBalance(data.ledger, c.id);
      has += b.has;
      owed += b.owed;
    }
    return { has: Math.round(has * 100) / 100, owed };
  }, [data.casters, data.ledger]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {PERIODS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setPeriod(k)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
              period === k ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-900 border-panel-700 text-panel-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Satılan"
          value={s.handQty + s.onlineQty}
          sub={`Elden ${s.handQty} · Site ${s.onlineQty}`}
        />
        <Tile label="Ciro" value={tl(s.handAmount + s.onlineAmount)} sub={`Elden ${tl(s.handAmount)} · Site ${tl(s.onlineAmount)}`} />
        <Tile label="Yapılan yüzük" value={s.made} sub={s.waste ? `Fire ${s.waste}` : undefined} />
        <Tile label="Dökümden gelen" value={s.cast} sub={s.castGrams ? `${s.castGrams} gr` : undefined} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Eldeki toplam kasa" value={totalStock} sub={`${data.groups.length} model`} />
        <Tile label="Azalan / biten model" value={low.length} sub={`${low.filter((g) => g.stock <= 0).length} tanesi bitti`} />
        <Tile
          label="Yoldaki döküm"
          value={Object.values(pending).reduce((n, q) => n + q, 0)}
          sub={`${data.castOrders.filter((o) => o.status === "verildi" || o.status === "kismi").length} açık sipariş`}
        />
        <Tile
          label="Gram has gümüş"
          value={data.settings.hasPrice ? tl(data.settings.hasPrice) : "—"}
          sub={data.settings.hasPriceAt ? new Date(data.settings.hasPriceAt).toLocaleDateString("tr-TR") : "Maliyet sekmesinden girin"}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Para (nakit + banka)" value={tl(money.toplam)} sub={`Nakit ${tl(money.nakit)} · Banka ${tl(money.banka)}`} />
        <Tile label="Dökümcülerdeki has" value={`${casterTotals.has} gr`} />
        <Tile label="Ödenecek işçilik" value={tl(casterTotals.owed)} />
        <Tile label="Parası alınmamış sipariş" value={uncollected.count} sub={uncollected.count ? tl(uncollected.amount) : undefined} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className={card}>
          <h2 className="font-bold text-panel-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Döküm gerekenler
          </h2>
          {low.length === 0 ? (
            <p className="text-sm text-panel-400 mt-2">Azalan kasa yok.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {low.slice(0, 15).map((g) => {
                const wc = data.caseById[g.id];
                return (
                  <li key={g.id} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-panel-200 truncate">{caseLabel(g, wc)}</span>
                    <span className={`text-sm font-bold tabular-nums ${g.stock <= 0 ? "text-red-400" : "text-amber-400"}`}>
                      {g.stock}
                      {typeof wc?.minStock === "number" && <span className="text-panel-500 font-normal"> / {wc.minStock}</span>}
                    </span>
                    {pending[g.id] ? <span className="text-[11px] text-sky-300">yolda {pending[g.id]}</span> : null}
                    <button type="button" onClick={() => onMove({ type: "dokum", groupId: g.id })} className={btnGhost}>
                      Döküm geldi
                    </button>
                  </li>
                );
              })}
              {low.length > 15 && <li className="text-xs text-panel-500">ve {low.length - 15} kasa daha (Kasalar → Azalan)</li>}
            </ul>
          )}
        </div>

        <div className={card}>
          <h2 className="font-bold text-panel-50">En çok satan kasalar</h2>
          {s.top.length === 0 ? (
            <p className="text-sm text-panel-400 mt-2">Bu dönemde satış yok.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {s.top.map(([gid, n]) => (
                <li key={gid} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-panel-200 truncate">{caseLabel(data.groupById[gid], data.caseById[gid])}</span>
                  <span className="font-bold tabular-nums text-panel-50">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={card}>
        <h2 className="font-bold text-panel-50">Son hareketler</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-panel-400 mt-2">Henüz kayıt yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {feed.map((l) => (
              <FeedRow key={l.key} line={l} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
