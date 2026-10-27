import { NextResponse } from "next/server";

// Exchange rates from the Central Bank of the Republic of Türkiye (TCMB), used to show
// TL prices in the visitor's currency. Cached for an hour; TCMB publishes once a day.

const CODES = ["USD", "EUR", "SAR", "RUB", "GBP"] as const;

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { next: { revalidate } });
    if (!res.ok) throw new Error(`tcmb ${res.status}`);
    const xml = await res.text();
    const date = xml.match(/Date="([^"]+)"/)?.[1] ?? "";
    const rates: Record<string, number> = {};
    for (const code of CODES) {
      const block = xml.match(new RegExp(`CurrencyCode="${code}"[\\s\\S]*?</Currency>`))?.[0];
      const unit = Number(block?.match(/<Unit>([\d.]+)<\/Unit>/)?.[1] || 1);
      const selling = Number(block?.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/)?.[1]);
      if (selling > 0) rates[code] = selling / unit; // TL for one unit of the currency
    }
    if (!Object.keys(rates).length) throw new Error("tcmb: no rates");
    return NextResponse.json({ date, rates });
  } catch (err) {
    console.error("rates failed:", err);
    return NextResponse.json({ error: "Kurlar alınamadı." }, { status: 502 });
  }
}
