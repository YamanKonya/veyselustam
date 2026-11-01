// Exchange rates from the Central Bank of the Republic of Türkiye (TCMB): TL for one unit
// of each currency. Used to show prices in the visitor's currency and to price the
// foreign-language product feeds. TCMB publishes once a day; callers cache for an hour.

export const RATE_CODES = ["USD", "EUR", "SAR", "RUB", "GBP"] as const;
export type RateCode = (typeof RATE_CODES)[number];

const REVALIDATE = 3600;

export async function getTcmbRates(): Promise<{ date: string; rates: Partial<Record<RateCode, number>> }> {
  const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`tcmb ${res.status}`);
  const xml = await res.text();
  const date = xml.match(/Date="([^"]+)"/)?.[1] ?? "";
  const rates: Partial<Record<RateCode, number>> = {};
  for (const code of RATE_CODES) {
    const block = xml.match(new RegExp(`CurrencyCode="${code}"[\\s\\S]*?</Currency>`))?.[0];
    const unit = Number(block?.match(/<Unit>([\d.]+)<\/Unit>/)?.[1] || 1);
    const selling = Number(block?.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/)?.[1]);
    if (selling > 0) rates[code] = selling / unit;
  }
  if (!Object.keys(rates).length) throw new Error("tcmb: no rates");
  return { date, rates };
}
