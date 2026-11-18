import { NextResponse } from "next/server";
import { getTcmbRates } from "@/lib/rates";

// Live silver price and dollar rate for the admin panel, from free keyless sources:
// - silver: api.gold-api.com spot price (USD per troy ounce, updated within seconds)
// - dollar: finans.truncgil.com live USD/TRY; that feed is flaky (sometimes slow,
//   empty or cut short), so it gets a short timeout and the TCMB daily rate is used
//   when it fails.
// Runs on every request; the upstream calls themselves are cached for a minute.

export const dynamic = "force-dynamic";
const REVALIDATE = 60;
const OUNCE = 31.1034768;

export interface SilverQuote {
  /** TL for 1 gram of pure silver */
  gramTL: number;
  /** USD for 1 gram of pure silver */
  gramUSD: number;
  /** USD per troy ounce */
  ounceUSD: number;
  /** TL for 1 USD */
  usdTry: number;
  /** where the dollar rate came from: "live" or "tcmb" (daily) */
  usdSource: "live" | "tcmb";
  updatedAt: string;
  source: string;
}

async function silverSpot() {
  const res = await fetch("https://api.gold-api.com/price/XAG", {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`gold-api ${res.status}`);
  const d = await res.json();
  const ounceUSD = Number(d?.price);
  if (!(ounceUSD > 0)) throw new Error("gold-api: no price");
  return { ounceUSD, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : new Date().toISOString() };
}

/** Live USD/TRY; reads the value straight from the text so a cut-off file still works */
async function liveUsd() {
  const res = await fetch("https://finans.truncgil.com/v4/today.json", {
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(3500),
    headers: { Accept: "application/json", "Accept-Encoding": "identity" },
  });
  if (!res.ok) throw new Error(`truncgil ${res.status}`);
  const text = await res.text();
  const block = text.match(/"USD":\{[^}]*\}/)?.[0] || "";
  const selling = Number(block.match(/"Selling":([\d.]+)/)?.[1]);
  if (!(selling > 10)) throw new Error("truncgil: no USD");
  return selling;
}

export async function GET() {
  try {
    const [spot, usdLive] = await Promise.all([silverSpot(), liveUsd().catch(() => null)]);
    let usdTry = usdLive;
    let usdSource: SilverQuote["usdSource"] = "live";
    if (!usdTry) {
      usdTry = Number((await getTcmbRates()).rates.USD);
      usdSource = "tcmb";
    }
    if (!(usdTry > 0)) throw new Error("no USD rate");
    const gramUSD = spot.ounceUSD / OUNCE;
    const quote: SilverQuote = {
      gramTL: gramUSD * usdTry,
      gramUSD,
      ounceUSD: spot.ounceUSD,
      usdTry,
      usdSource,
      updatedAt: spot.updatedAt,
      source: usdSource === "live" ? "gold-api.com + Truncgil" : "gold-api.com + TCMB",
    };
    return NextResponse.json(quote);
  } catch (err) {
    console.warn("silver price failed:", err);
    return NextResponse.json({ error: "Gümüş fiyatı alınamadı." }, { status: 502 });
  }
}
