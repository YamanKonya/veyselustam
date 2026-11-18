"use client";

import React, { useEffect } from "react";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useSilverStore } from "@/store/useSilverStore";

const REFRESH_MS = 60_000;

const tr = (n: number, digits = 2) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Live gram silver price and dollar rate, shown on every admin page */
export default function SilverBar() {
  const { quote, error, currency, setCurrency, refresh } = useSilverStore();

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    const onShow = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [refresh]);

  const up = (quote?.change ?? 0) >= 0;

  return (
    <div className="mb-5 -mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 rounded-xl bg-panel-900 border border-panel-800 text-sm">
      <span className="text-panel-400 text-xs">Gram has gümüş</span>
      {quote ? (
        <>
          <span className="font-extrabold text-panel-50 tabular-nums">
            {currency === "USD" ? `$${quote.gramUSD.toFixed(3)}` : `${tr(quote.gramTL)} ₺`}
          </span>
          <span className="text-panel-400 text-xs tabular-nums">
            {currency === "USD" ? `${tr(quote.gramTL)} ₺` : `$${quote.gramUSD.toFixed(3)}`}
          </span>
          {typeof quote.change === "number" && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}%{tr(Math.abs(quote.change))}
            </span>
          )}
          <span className="text-panel-300 text-xs tabular-nums">USD {tr(quote.usdTry, 4)} ₺</span>
          <span className="text-panel-600 text-[11px]" title={quote.source}>
            {new Date(quote.updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            {error ? " · güncellenemedi" : ""}
          </span>
        </>
      ) : (
        <span className="text-panel-500 text-xs">{error ? "Fiyat alınamadı" : "Yükleniyor…"}</span>
      )}
      <button type="button" onClick={() => refresh()} aria-label="Fiyatı yenile" className="text-panel-500 hover:text-panel-200">
        <RefreshCw className="w-3.5 h-3.5" />
      </button>

      <div className="ml-auto flex rounded-lg border border-panel-700 overflow-hidden text-xs font-bold" role="group" aria-label="Para birimi">
        {(["TRY", "USD"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            aria-pressed={currency === c}
            className={`px-3 py-1.5 ${currency === c ? "bg-brass-600 text-white" : "bg-panel-950 text-panel-400"}`}
          >
            {c === "TRY" ? "₺ TL" : "$ USD"}
          </button>
        ))}
      </div>
    </div>
  );
}
