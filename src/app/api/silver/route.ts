import { NextResponse } from "next/server";
import { getTcmbRates } from "@/lib/rates";

// Live silver price and dollar rate for the admin panel. Free, keyless sources:
// 1) finans.truncgil.com: Turkish market gram silver (TL) and USD/TRY, refreshed every few minutes
// 2) fallback: api.gold-api.com spot silver (USD/oz) with the TCMB dollar rate
// Runs on every request; the upstream calls themselves are cached for a minute.
export const dynamic = "force-dynamic";
const REVALIDATE = 60;

const OUNCE = 31.1034768;

export interface SilverQuote {
  /** TL for 1 gram of pure silver */
  gramTL: number;
  gramTLBuy?: number;
  /** USD for 1 gram of pure silver */
  gramUSD: number;
  /** TL for 1 USD */
  usdTry: number;
  /** daily change of the silver price, percent */
  change?: number;
  updatedAt: string;
  source: string;
}

// The file is rewritten every few minutes upstream and can be read half-written;
// try once more, bypassing the cache, before falling back to the next source.
async function readTruncgil(fresh: boolean) {
  const res = await fetch(
    "https://finans.truncgil.com/v4/today.json",
    fresh ? { cache: "no-store" } : { next: { revalidate: REVALIDATE } }
  );
  if (!res.ok) throw new Error(`truncgil ${res.status}`);
  return JSON.parse(await res.text());
}

async function fromTruncgil(): Promise<SilverQuote> {
  let d;
  try {
    d = await readTruncgil(false);
  } catch {
    d = await readTruncgil(true);
  }
  const sell = Number(d?.GUMUS?.Selling);
  const buy = Number(d?.GUMUS?.Buying);
  const usd = Number(d?.USD?.Selling);
  if (!(sell > 0) || !(usd > 0)) throw new Error("truncgil: missing silver or USD");
  // "2026-11-18 13:55:01" is Türkiye time
  const at = typeof d.Update_Date === "string" ? new Date(d.Update_Date.replace(" ", "T") + "+03:00") : new Date();
  return {
    gramTL: sell,
    gramTLBuy: buy > 0 ? buy : undefined,
    gramUSD: sell / usd,
    usdTry: usd,
    change: Number.isFinite(Number(d.GUMUS.Change)) ? Number(d.GUMUS.Change) : undefined,
    updatedAt: (isNaN(at.getTime()) ? new Date() : at).toISOString(),
    source: "Truncgil Finans",
  };
}

async function fromGoldApi(): Promise<SilverQuote> {
  const [spot, tcmb] = await Promise.all([
    fetch("https://api.gold-api.com/price/XAG", { next: { revalidate: REVALIDATE } }).then((r) => {
      if (!r.ok) throw new Error(`gold-api ${r.status}`);
      return r.json();
    }),
    getTcmbRates(),
  ]);
  const ounceUSD = Number(spot?.price);
  const usd = Number(tcmb.rates.USD);
  if (!(ounceUSD > 0) || !(usd > 0)) throw new Error("gold-api: missing price");
  const gramUSD = ounceUSD / OUNCE;
  return {
    gramTL: gramUSD * usd,
    gramUSD,
    usdTry: usd,
    updatedAt: typeof spot.updatedAt === "string" ? spot.updatedAt : new Date().toISOString(),
    source: "gold-api.com + TCMB",
  };
}

export async function GET() {
  for (const source of [fromTruncgil, fromGoldApi]) {
    try {
      return NextResponse.json(await source());
    } catch (err) {
      console.warn("silver source failed:", err);
    }
  }
  return NextResponse.json({ error: "Gümüş fiyatı alınamadı." }, { status: 502 });
}
