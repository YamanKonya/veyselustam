"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/i18n/translations";
import { formatPrice } from "@/lib/format";

// Prices are entered in TL; each language shows them in its country's currency,
// converted at the TCMB rate (see /api/rates). Payment is still taken in TL.

const CURRENCY: Record<Language, { code: string; locale: string }> = {
  tr: { code: "TRY", locale: "tr-TR" },
  en: { code: "USD", locale: "en-US" },
  es: { code: "EUR", locale: "es-ES" },
  de: { code: "EUR", locale: "de-DE" },
  ar: { code: "SAR", locale: "ar-SA-u-nu-latn" },
  ru: { code: "RUB", locale: "ru-RU" },
};

const CACHE_KEY = "veyselustam_rates";
type Rates = Record<string, number>;

let rates: Rates | null = null;
let loading: Promise<Rates | null> | null = null;

const readCache = (): Rates | null => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null")?.rates ?? null;
  } catch {
    return null;
  }
};

const loadRates = () => {
  loading ??= fetch("/api/rates")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.rates) {
        rates = data.rates;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
      return rates;
    })
    .catch(() => rates);
  return loading;
};

/** `price(tl)` formats a TL amount in the visitor's currency; `inTl` is true when no conversion happens. */
export const usePrice = () => {
  const { language } = useLanguage();
  const [current, setCurrent] = useState<Rates | null>(rates);

  useEffect(() => {
    if (language === "tr") return;
    if (!rates) {
      rates = readCache();
      if (rates) setCurrent(rates);
    }
    loadRates().then((r) => r && setCurrent(r));
  }, [language]);

  const { code, locale } = CURRENCY[language];
  const rate = code === "TRY" ? null : current?.[code];

  const price = (tl: number) => {
    if (!rate) return `₺${formatPrice(tl)}`; // Turkish, or rates not available
    return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(tl / rate);
  };

  return { price, inTl: !rate, tl: (v: number) => `₺${formatPrice(v)}` };
};
