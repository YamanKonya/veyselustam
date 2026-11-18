"use client";

import React, { useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { MovementType, StockMovement } from "@/types";
import { CHANNEL_LABELS, MOVEMENT_LABELS, PAYMENT_LABELS, tl, undoMovement } from "@/services/workshopService";
import { Badge, card, dateTime, inputCls, liveOrders, WorkshopData } from "./shared";

/** A ledger line or an online order, shown in one list */
export interface FeedLine {
  key: string;
  at: string;
  kind: MovementType | "online";
  title: string;
  detail: string;
  delta?: number;
  stockAfter?: number;
  by?: string;
  movement?: StockMovement;
}

export const buildFeed = (data: WorkshopData): FeedLine[] => {
  const lines: FeedLine[] = data.movements.map((m) => {
    const parts: string[] = [];
    if (m.productTitle) parts.push(m.productTitle);
    if (m.type === "satis") {
      if (m.amount) parts.push(tl(m.amount));
      if (m.channel) parts.push(CHANNEL_LABELS[m.channel]);
      if (m.payment) parts.push(PAYMENT_LABELS[m.payment]);
    }
    if (m.type === "dokum") {
      if (m.casterName) parts.push(m.casterName);
      if (m.grams) parts.push(`${m.grams} gr`);
    }
    if (m.type === "uretim") parts.push(`${m.qty} adet`);
    if (m.note) parts.push(m.note);
    return {
      key: m.id,
      at: m.at,
      kind: m.type,
      title: `${m.caseCode ? m.caseCode + " · " : ""}${m.groupName}`,
      detail: parts.join(" · "),
      delta: m.delta,
      stockAfter: m.stockAfter,
      by: m.by,
      movement: m,
    };
  });

  // Orders for the same window as the ledger (last 120 days)
  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  for (const o of liveOrders(data.orders).filter((o) => o.createdAt >= since)) {
    const qty = o.items.reduce((s, i) => s + (i.quantity || 0), 0);
    lines.push({
      key: `o-${o.id}`,
      at: o.createdAt,
      kind: "online",
      title: o.items.map((i) => i.title).join(", "),
      detail: `${qty} adet · ${tl(o.totalAmount || 0)} · ${o.customerInfo?.city || ""}`,
      delta: -Object.values(o.stockDeductions?.groups || {}).reduce((s, n) => s + n, 0) || undefined,
    });
  }
  return lines.sort((a, b) => (a.at < b.at ? 1 : -1));
};

export const FeedRow = ({ line, onUndo }: { line: FeedLine; onUndo?: (m: StockMovement) => void }) => (
  <li className="flex items-start gap-3 p-3 rounded-xl bg-panel-950 border border-panel-800">
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge kind={line.kind}>{line.kind === "online" ? "Site siparişi" : MOVEMENT_LABELS[line.kind]}</Badge>
        <span className="text-xs text-panel-500">{dateTime(line.at)}</span>
      </div>
      <p className="text-sm font-semibold text-panel-100 mt-1 truncate">{line.title}</p>
      {line.detail && <p className="text-xs text-panel-400 truncate">{line.detail}</p>}
      {line.by && <p className="text-[11px] text-panel-600">{line.by}</p>}
    </div>
    <div className="text-right flex-shrink-0">
      {typeof line.delta === "number" && line.delta !== 0 && (
        <p className={`text-lg font-extrabold tabular-nums ${line.delta > 0 ? "text-sky-300" : "text-emerald-300"}`}>
          {line.delta > 0 ? `+${line.delta}` : line.delta}
        </p>
      )}
      {typeof line.stockAfter === "number" && <p className="text-[11px] text-panel-500">kalan {line.stockAfter}</p>}
      {onUndo && line.movement && (
        <button
          type="button"
          onClick={() => onUndo(line.movement!)}
          className="mt-1 text-[11px] text-panel-500 hover:text-red-400 inline-flex items-center gap-1"
        >
          <Undo2 className="w-3 h-3" /> geri al
        </button>
      )}
    </div>
  </li>
);

type Kind = MovementType | "online" | "all";

export default function Ledger({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [kind, setKind] = useState<Kind>("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(60);
  const feed = useMemo(() => buildFeed(data), [data]);

  const list = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    return feed.filter(
      (l) => (kind === "all" || l.kind === kind) && (!t || `${l.title} ${l.detail}`.toLocaleLowerCase("tr").includes(t))
    );
  }, [feed, kind, q]);

  const undo = async (m: StockMovement) => {
    if (!window.confirm(`Bu satır silinsin ve stoğa etkisi geri alınsın mı?\n${MOVEMENT_LABELS[m.type]} · ${m.groupName}`)) return;
    try {
      await undoMovement(m);
    } catch (err) {
      console.error(err);
      onError("Geri alınamadı.");
    }
  };

  const kinds: [Kind, string][] = [
    ["all", "Tümü"],
    ["online", "Site siparişi"],
    ...(Object.entries(MOVEMENT_LABELS) as [MovementType, string][]),
  ];

  return (
    <div className={card}>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kasa, model, dökümcü ara" className={`${inputCls} sm:max-w-xs`} />
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={`${inputCls} sm:max-w-[200px]`}>
          {kinds.map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <ul className="mt-3 space-y-2">
        {list.length === 0 && <p className="text-sm text-panel-400">Kayıt yok.</p>}
        {list.slice(0, shown).map((l) => (
          <FeedRow key={l.key} line={l} onUndo={undo} />
        ))}
      </ul>
      {list.length > shown && (
        <button type="button" onClick={() => setShown(shown + 60)} className="mt-3 text-sm text-brass-400 font-semibold">
          Daha fazla göster ({list.length - shown})
        </button>
      )}
      <p className="mt-3 text-[11px] text-panel-600">Son 120 günün kayıtları gösteriliyor.</p>
    </div>
  );
}
