import { Language } from "@/i18n/translations";
import { CATEGORY_TRANSLATIONS } from "@/i18n/productTranslations";

/**
 * Title for the Meta and Pinterest feeds. The site keeps its own product names
 * (they are matched with the translations), but feed platforms search titles, so the
 * feed title always ends with the words people type: "925 Silver Ring · Khorasan Agate".
 * Limited to 100 characters, the Pinterest limit, so the key words are never cut off.
 *
 * Only the words below are written by hand (one short phrase per language). No paid
 * translation service is used.
 */
const SILVER_RING: Record<Language, string> = {
  tr: "925 Gümüş Yüzük",
  en: "925 Sterling Silver Ring",
  es: "Anillo de plata 925",
  de: "925er Silberring",
  ar: "خاتم فضة 925",
  ru: "Серебряное кольцо 925",
};

export const FEED_TITLE_MAX = 100;

export const feedTitle = (title: string, category: string, lang: Language) => {
  const cat = CATEGORY_TRANSLATIONS[category]?.[lang];
  const suffix = [SILVER_RING[lang], cat].filter(Boolean).join(" · ");
  const sep = " · ";
  const room = FEED_TITLE_MAX - suffix.length - sep.length;
  if (room < 20) return title.slice(0, FEED_TITLE_MAX); // suffix alone too long: keep the title only
  const base = title.length <= room ? title : title.slice(0, room).replace(/[\s,;:·-]+\S*$/, "");
  return `${base}${sep}${suffix}`;
};
