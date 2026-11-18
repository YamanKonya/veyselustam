import { create } from "zustand";
import { persist } from "zustand/middleware";

// Live silver price and dollar rate for the admin panel (from /api/silver), plus
// the currency the Atölye amounts are shown in. Amounts are always stored in TL.

export type DisplayCurrency = "TRY" | "USD";

export interface SilverQuote {
  gramTL: number;
  gramUSD: number;
  ounceUSD: number;
  usdTry: number;
  /** "tcmb" = daily central bank rate (live feed unavailable) */
  usdSource: "live" | "tcmb";
  updatedAt: string;
  source: string;
}

interface SilverState {
  quote: SilverQuote | null;
  /** gram price before the last change, for the up/down arrow */
  prevGramTL?: number;
  error: boolean;
  fetchedAt: number;
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  refresh: () => Promise<void>;
}

export const useSilverStore = create<SilverState>()(
  persist(
    (set, get) => ({
      quote: null,
      error: false,
      fetchedAt: 0,
      currency: "TRY",
      setCurrency: (currency) => set({ currency }),
      refresh: async () => {
        try {
          const res = await fetch("/api/silver", { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const quote = (await res.json()) as SilverQuote;
          if (!(quote.gramTL > 0)) throw new Error("bad quote");
          const old = get().quote?.gramTL;
          set({
            quote,
            prevGramTL: old && Math.abs(old - quote.gramTL) > 0.005 ? old : get().prevGramTL,
            error: false,
            fetchedAt: Date.now(),
          });
        } catch (err) {
          console.warn("silver price:", err);
          set({ error: true });
        }
      },
    }),
    // Only the chosen currency is remembered on this device
    { name: "vu_admin_currency", partialize: (s) => ({ currency: s.currency }) }
  )
);

/** Formats a TL amount in the chosen display currency */
export const formatMoney = (amountTL: number, currency: DisplayCurrency, usdTry?: number) => {
  if (currency === "USD" && usdTry && usdTry > 0) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amountTL / usdTry);
  }
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amountTL);
};
