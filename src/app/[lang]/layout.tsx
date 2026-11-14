import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";

// Dil adresleri: /en, /es, /de, /ar, /ru. Bilinmeyen önekler 404 döner.
// Türkçe (/tr) adresi ana adrese yönlendirilir (next.config.mjs).
export default function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: { lang: string } }>) {
  if (!isLocale(params.lang) || params.lang === "tr") notFound();
  return children;
}
