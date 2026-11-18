"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { StockMovement } from "@/types";
import {
  ACCOUNT_LABELS,
  CHANNEL_LABELS,
  fetchMovementsBetween,
  LEDGER_LABELS,
  MOVEMENT_LABELS,
  PAYMENT_LABELS,
  tl,
  variantCost,
} from "@/services/workshopService";
import { btnGhost, card, caseLabel, liveOrders, WorkshopData } from "./shared";

const monthOptions = () => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 24; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
};
const monthName = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
const r2 = (n: number) => Math.round(n * 100) / 100;

export default function Reports({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const months = useMemo(monthOptions, []);
  const [month, setMonth] = useState(months[0]);
  const [moves, setMoves] = useState<StockMovement[] | null>(null);

  const [from, to] = useMemo(() => {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return [start.toISOString(), end.toISOString()];
  }, [month]);

  useEffect(() => {
    let alive = true;
    setMoves(null);
    fetchMovementsBetween(from, to)
      .then((m) => alive && setMoves(m))
      .catch((err) => {
        console.error(err);
        if (alive) {
          setMoves([]);
          onError("Rapor için hareketler okunamadı.");
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const r = useMemo(() => {
    if (!moves) return null;
    const productById = Object.fromEntries(data.products.map((p) => [p.id, p]));
    const orders = liveOrders(data.orders).filter((o) => o.createdAt >= from && o.createdAt < to);
    const cash = data.cash.filter((e) => e.at >= from && e.at < to);
    const ledger = data.ledger.filter((l) => l.at >= from && l.at < to);

    type CaseRow = { qty: number; revenue: number; cost: number; costKnown: boolean };
    const perCase: Record<string, CaseRow> = {};
    const add = (gid: string, qty: number, revenue: number, productId?: string) => {
      const row = (perCase[gid] ||= { qty: 0, revenue: 0, cost: 0, costKnown: true });
      row.qty += qty;
      row.revenue += revenue;
      const c = variantCost(data.caseById[gid], data.casters, data.settings, productId);
      if (c.missing.length) row.costKnown = false;
      row.cost += c.total * qty;
    };

    const byChannel: Record<string, { qty: number; amount: number }> = {};
    const byPayment: Record<string, number> = {};
    let handQty = 0, handAmount = 0, made = 0, cast = 0, castGrams = 0, waste = 0;
    for (const m of moves) {
      if (m.type === "satis") {
        handQty += m.qty;
        handAmount += m.amount || 0;
        add(m.groupId, m.qty, m.amount || 0, m.productId);
        const ch = CHANNEL_LABELS[m.channel || "diger"];
        byChannel[ch] = { qty: (byChannel[ch]?.qty || 0) + m.qty, amount: (byChannel[ch]?.amount || 0) + (m.amount || 0) };
        const pay = PAYMENT_LABELS[m.payment || "diger"];
        byPayment[pay] = (byPayment[pay] || 0) + (m.amount || 0);
      } else if (m.type === "uretim") made += m.qty;
      else if (m.type === "dokum") {
        cast += m.qty;
        castGrams += m.grams || 0;
      } else if (m.type === "fire") waste += m.qty;
    }

    let siteQty = 0, siteAmount = 0;
    for (const o of orders) {
      siteAmount += o.totalAmount || 0;
      for (const it of o.items) {
        siteQty += it.quantity || 0;
        const gid = productById[it.productId]?.stockGroup;
        if (gid) add(gid, it.quantity || 0, (it.price || 0) * (it.quantity || 0), it.productId);
      }
    }
    if (orders.length) byChannel["Site"] = { qty: siteQty, amount: siteAmount };

    const casterRows: Record<string, { grams: number; has: number; labor: number; paid: number; hasGiven: number }> = {};
    for (const l of ledger) {
      const row = (casterRows[l.casterName] ||= { grams: 0, has: 0, labor: 0, paid: 0, hasGiven: 0 });
      if (l.type === "teslim") {
        row.grams += l.grams || 0;
        row.has += -l.hasGram;
        row.labor += l.tl;
      } else if (l.type === "odeme") row.paid += -l.tl;
      else if (l.type === "hasVerildi") row.hasGiven += l.hasGram;
    }

    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};
    for (const e of cash) {
      if (e.type === "gelir") incomeByCat[e.category] = (incomeByCat[e.category] || 0) + e.amount;
      if (e.type === "gider") expenseByCat[e.category] = (expenseByCat[e.category] || 0) + e.amount;
    }
    const income = Object.values(incomeByCat).reduce((a, b) => a + b, 0);
    const expense = Object.values(expenseByCat).reduce((a, b) => a + b, 0);

    const caseRows = Object.entries(perCase)
      .filter(([gid]) => data.groupById[gid])
      .sort((a, b) => b[1].revenue - a[1].revenue);
    const revenue = handAmount + siteAmount;
    const soldCost = caseRows.reduce((n, [, c]) => n + c.cost, 0);
    const costComplete = caseRows.every(([, c]) => c.costKnown);

    return {
      handQty, handAmount, siteQty, siteAmount, revenue, made, cast, castGrams: r2(castGrams), waste,
      byChannel, byPayment, caseRows, casterRows, incomeByCat, expenseByCat, income, expense, soldCost, costComplete, cash,
    };
  }, [moves, data, from, to]);

  const downloadCsv = () => {
    if (!moves || !r) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows: unknown[][] = [["Tür", "Tarih", "Kasa kodu", "Kasa", "Çeşit", "Adet", "Stok değişimi", "Tutar (TL)", "Kanal", "Ödeme", "Dökümcü", "Gram", "Not", "Giren"]];
    for (const m of [...moves].reverse())
      rows.push([
        MOVEMENT_LABELS[m.type], new Date(m.at).toLocaleString("tr-TR"), m.caseCode, m.groupName, m.productTitle, m.qty, m.delta,
        m.amount, m.channel ? CHANNEL_LABELS[m.channel] : "", m.payment ? PAYMENT_LABELS[m.payment] : "", m.casterName, m.grams, m.note, m.by,
      ]);
    rows.push([]);
    rows.push(["Para defteri", "Tarih", "Hesap", "Kategori", "Tutar (TL)", "Not"]);
    for (const e of [...r.cash].reverse())
      rows.push([
        e.type, new Date(e.at).toLocaleString("tr-TR"),
        e.type === "transfer" && e.toAccount ? `${ACCOUNT_LABELS[e.account]} → ${ACCOUNT_LABELS[e.toAccount]}` : ACCOUNT_LABELS[e.account],
        e.category, e.type === "gider" ? -e.amount : e.amount, e.note,
      ]);
    const csv = "﻿" + rows.map((row) => row.map(esc).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `atolye-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 print-area">
      <style>{`@media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; color: #000; }
        .print-area .no-print { display: none; }
      }`}</style>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-extrabold text-panel-50 flex-1">Aylık rapor: {monthName(month)}</h2>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="no-print px-2 py-2 bg-panel-950 border border-panel-700 rounded-lg text-sm text-panel-100">
          {months.map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
        <button type="button" onClick={downloadCsv} disabled={!r} className={`${btnGhost} no-print`}>
          <Download className="w-4 h-4" /> Excel (CSV)
        </button>
        <button type="button" onClick={() => window.print()} disabled={!r} className={`${btnGhost} no-print`}>
          <Printer className="w-4 h-4" /> Yazdır / PDF
        </button>
      </div>

      {!r ? (
        <p className="text-sm text-panel-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Hesaplanıyor…
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Satılan" value={String(r.handQty + r.siteQty)} sub={`Elden ${r.handQty} · Site ${r.siteQty}`} />
            <Stat label="Ciro" value={tl(r.revenue)} sub={`Elden ${tl(r.handAmount)} · Site ${tl(r.siteAmount)}`} />
            <Stat
              label="Tahmini brüt kâr"
              value={tl(r.revenue - r.soldCost)}
              sub={r.costComplete ? `Satılanın maliyeti ${tl(r.soldCost)}` : "Bazı kasaların maliyet bilgisi eksik"}
            />
            <Stat label="Para defteri neti" value={tl(r.income - r.expense)} sub={`Gelir ${tl(r.income)} · Gider ${tl(r.expense)}`} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Yapılan yüzük" value={String(r.made)} />
            <Stat label="Dökümden gelen" value={String(r.cast)} sub={r.castGrams ? `${r.castGrams} gr` : undefined} />
            <Stat label="Fire" value={String(r.waste)} />
          </div>

          <Section title="Kasa bazında satış">
            {r.caseRows.length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Kasa", "Adet", "Ciro", "Tahmini maliyet", "Brüt kâr"]}
                rows={r.caseRows.map(([gid, c]) => [
                  caseLabel(data.groupById[gid], data.caseById[gid]),
                  c.qty,
                  tl(c.revenue),
                  c.costKnown ? tl(c.cost) : "eksik",
                  c.costKnown ? tl(c.revenue - c.cost) : "—",
                ])}
              />
            )}
          </Section>

          <div className="grid lg:grid-cols-2 gap-5">
            <Section title="Satış kanalları">
              {Object.keys(r.byChannel).length === 0 ? (
                <Empty />
              ) : (
                <Table head={["Kanal", "Adet", "Tutar"]} rows={Object.entries(r.byChannel).map(([k, v]) => [k, v.qty, tl(v.amount)])} />
              )}
            </Section>
            <Section title="Elden satış ödemeleri">
              {Object.keys(r.byPayment).length === 0 ? (
                <Empty />
              ) : (
                <Table head={["Ödeme", "Tutar"]} rows={Object.entries(r.byPayment).map(([k, v]) => [k, tl(v)])} />
              )}
            </Section>
          </div>

          <Section title="Dökümcüler">
            {Object.keys(r.casterRows).length === 0 ? (
              <Empty />
            ) : (
              <Table
                head={["Dökümcü", "Gelen gram", "Düşülen has", "İşçilik", "Ödenen", "Verilen has"]}
                rows={Object.entries(r.casterRows).map(([k, v]) => [
                  k, `${r2(v.grams)} gr`, `${r2(v.has)} gr`, tl(v.labor), tl(v.paid), `${r2(v.hasGiven)} gr`,
                ])}
              />
            )}
            <p className="text-[11px] text-panel-500 mt-2">
              {LEDGER_LABELS.teslim}, {LEDGER_LABELS.odeme.toLocaleLowerCase("tr")} ve {LEDGER_LABELS.hasVerildi.toLocaleLowerCase("tr")} kayıtlarından.
            </p>
          </Section>

          <div className="grid lg:grid-cols-2 gap-5">
            <Section title="Gelirler">
              {Object.keys(r.incomeByCat).length === 0 ? <Empty /> : <Table head={["Kategori", "Tutar"]} rows={Object.entries(r.incomeByCat).map(([k, v]) => [k, tl(v)])} />}
            </Section>
            <Section title="Giderler">
              {Object.keys(r.expenseByCat).length === 0 ? <Empty /> : <Table head={["Kategori", "Tutar"]} rows={Object.entries(r.expenseByCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, tl(v)])} />}
            </Section>
          </div>
          <p className="text-[11px] text-panel-500">
            Tahmini maliyet bugünkü gümüş fiyatıyla hesaplanır. Site siparişleri iptal edilenler hariç, sipariş tarihine göre sayılır.
          </p>
        </>
      )}
    </div>
  );
}

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="p-3 rounded-2xl bg-panel-900 border border-panel-800">
    <p className="text-[11px] text-panel-400">{label}</p>
    <p className="text-xl font-extrabold tabular-nums text-panel-50">{value}</p>
    {sub && <p className="text-[11px] text-panel-500">{sub}</p>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className={card}>
    <h3 className="font-bold text-panel-50 mb-2">{title}</h3>
    {children}
  </div>
);

const Empty = () => <p className="text-sm text-panel-400">Bu ay kayıt yok.</p>;

const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] text-panel-400 border-b border-panel-800">
          {head.map((h, i) => (
            <th key={h} className={`py-1.5 pr-3 font-semibold ${i ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-panel-800/60 text-panel-200">
            {row.map((cell, j) => (
              <td key={j} className={`py-1.5 pr-3 ${j ? "text-right tabular-nums" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
