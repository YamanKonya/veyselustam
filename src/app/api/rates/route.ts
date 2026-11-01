import { NextResponse } from "next/server";
import { getTcmbRates } from "@/lib/rates";

// Exchange rates from the Central Bank of the Republic of Türkiye (TCMB), used to show
// TL prices in the visitor's currency. Cached for an hour; TCMB publishes once a day.

export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(await getTcmbRates());
  } catch (err) {
    console.error("rates failed:", err);
    return NextResponse.json({ error: "Kurlar alınamadı." }, { status: 502 });
  }
}
