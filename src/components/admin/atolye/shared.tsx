"use client";

import React from "react";
import {
  CashEntry,
  Caster,
  CasterLedgerLine,
  CastOrder,
  MovementType,
  Order,
  Product,
  StockGroup,
  StockMovement,
  WorkshopCase,
  WorkshopSettings,
} from "@/types";

export const inputCls =
  "w-full px-3 py-2.5 bg-panel-950 border border-panel-700 rounded-xl text-sm text-panel-100 focus:outline-none focus:border-brass-500";
export const labelCls = "block text-xs text-panel-300 mb-1";
export const btnPrimary =
  "px-4 py-2.5 bg-brass-600 hover:bg-brass-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-60";
export const btnGhost =
  "px-3 py-2 bg-panel-800 hover:bg-panel-700 text-panel-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50";
export const card = "p-4 bg-panel-900 border border-panel-800 rounded-2xl";

/** Everything the Atölye tabs read, loaded once by the page */
export interface WorkshopData {
  groups: StockGroup[];
  cases: WorkshopCase[];
  casters: Caster[];
  movements: StockMovement[];
  products: Product[];
  orders: Order[];
  castOrders: CastOrder[];
  ledger: CasterLedgerLine[];
  settings: WorkshopSettings;
  cash: CashEntry[];
  caseById: Record<string, WorkshopCase>;
  groupById: Record<string, StockGroup>;
  /** products linked to each case */
  variants: Record<string, Product[]>;
}

/** What a movement form should open with */
export interface MovementPreset {
  type?: MovementType;
  groupId?: string;
  productId?: string;
}

export const caseLabel = (g: StockGroup, wc?: WorkshopCase) => (wc?.code ? `${wc.code} · ${g.name}` : g.name);

/** Cases sorted by code (cases without a code last, by name) */
export const sortedGroups = (groups: StockGroup[], caseById: Record<string, WorkshopCase>) =>
  [...groups].sort((a, b) => {
    const ca = caseById[a.id]?.code || "";
    const cb = caseById[b.id]?.code || "";
    if (ca && cb) return ca.localeCompare(cb, "tr", { numeric: true });
    if (ca) return -1;
    if (cb) return 1;
    return a.name.localeCompare(b.name, "tr");
  });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const MOVEMENT_COLORS: Record<MovementType | "online", string> = {
  dokum: "bg-sky-950 text-sky-300 border-sky-800",
  uretim: "bg-violet-950 text-violet-300 border-violet-800",
  satis: "bg-emerald-950 text-emerald-300 border-emerald-800",
  online: "bg-emerald-950 text-emerald-300 border-emerald-800",
  fire: "bg-red-950 text-red-300 border-red-800",
  iade: "bg-amber-950 text-amber-300 border-amber-800",
  sayim: "bg-panel-800 text-panel-200 border-panel-700",
};

export const Badge = ({ kind, children }: { kind: MovementType | "online"; children: React.ReactNode }) => (
  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${MOVEMENT_COLORS[kind]}`}>
    {children}
  </span>
);

// Small photo; hovering it shows the full picture bigger, like the product cards zoom on hover
export const Thumb = ({ src }: { src?: string }) =>
  src ? (
    <span className="group relative flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className="w-10 h-10 rounded-lg object-cover bg-panel-800 transition-transform duration-300 ease-out group-hover:scale-110"
      />
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 hidden group-hover:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl object-cover bg-panel-950 border border-panel-700 shadow-2xl shadow-black/60"
        />
      </span>
    </span>
  ) : (
    <div className="w-10 h-10 rounded-lg bg-panel-800 flex-shrink-0" />
  );

/** Online orders that count as sales (not cancelled) */
export const liveOrders = (orders: Order[]) => orders.filter((o) => o.status !== "cancelled" && !o.restocked);
