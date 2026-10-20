import { Product } from "@/types";
import { Language } from "./translations";
import { getCatalogContent } from "./catalogContent";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";

// Category Translation Dictionary for all 5 languages
export const CATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  "Nakkaş El Oyması Taşlı": {
    tr: "Nakkaş El Oyması Taşlı",
    en: "Nakkaş Hand-Carved Stones",
    es: "Piedras talladas a mano nakkaş",
    de: "Nakkaş – handgeschnitzte Steine",
    ar: "أحجار منقوشة يدويًا بفن النقّاش",
  },
  "Horasan ve Yemen Akik Taşlı": {
    tr: "Horasan ve Yemen Akik Taşlı",
    en: "Khorasan & Yemeni Agate",
    es: "Ágata de Jorasán y Yemen",
    de: "Chorasan- & Jemen-Achat",
    ar: "عقيق خراساني ويمني",
  },
  "El Yapımı Gümüş Kolye": {
    tr: "El Yapımı Gümüş Kolye",
    en: "Handcrafted Silver Necklaces",
    es: "Collares de plata artesanales",
    de: "Handgefertigte Silberketten",
    ar: "قلائد فضية مصنوعة يدويًا",
  },
  "Özel Yapım Ürünler": {
    tr: "Özel Yapım Ürünler",
    en: "Made to Order",
    es: "Piezas por encargo",
    de: "Sonderanfertigungen",
    ar: "منتجات حسب الطلب",
  },
  "Özel El Yapımı Gümüş Yüzükler": {
    tr: "Özel El Yapımı Gümüş Yüzükler",
    en: "Handcrafted Signature Silver Rings",
    es: "Anillos de plata artesanales exclusivos",
    de: "Exklusive handgefertigte Silberringe",
    ar: "خواتم فضية مميزة مصنوعة يدويًا",
  },
  "Gümüş Yüzük": {
    tr: "Gümüş Yüzük",
    en: "Silver Rings",
    es: "Anillos de plata",
    de: "Silberringe",
    ar: "خواتم فضة",
  },
  "Kadın Takı": {
    tr: "Kadın Takı",
    en: "Women's Jewellery",
    es: "Joyería femenina",
    de: "Damenschmuck",
    ar: "مجوهرات نسائية",
  },
  "Yüzük": {
    tr: "Yüzük",
    en: "Rings",
    es: "Anillos",
    de: "Ringe",
    ar: "خواتم",
  },
};

// Strip shop self-promotion links and stray replacement characters from imported text
const cleanProductText = (text: string): string => {
  return (text || "")
    .normalize("NFC")
    .replace(/[•\s]*Web Sayfamızı Ziyaret Etmeyi Unutmayın!?:?\s*(https?:\/\/[^\s]+)?/gi, "")
    .replace(/https?:\/\/(www\.)?veyselustam\.com[^\s]*/gi, "")
    .replace(/[�﷿]/g, "")
    .replace(/[•\s]+$/g, "")
    .trim();
};

const normalizeForCompare = (text: string) => cleanProductText(text).replace(/\s+/g, " ").toLocaleLowerCase("tr");

/** Fingerprint of the Turkish source text; stored with machine translations to detect edits. */
export const translationSourceKey = (title: string, description: string) => {
  const text = `${normalizeForCompare(title)}\n${normalizeForCompare(description)}`;
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return `v1-${(hash >>> 0).toString(36)}-${text.length}`;
};

const SEED_TITLES = new Map(
  INITIAL_VEYSELUSTAM_PRODUCTS.map((p) => [p.id, normalizeForCompare(p.title)] as const)
);

export const translateCategory = (category: string, lang: Language) => {
  const clean = cleanProductText(category);
  return CATEGORY_TRANSLATIONS[clean]?.[lang] || clean;
};

/**
 * Title and description in the requested language. Sources, in order:
 * 1. The hand-written catalogue text, while the product still has its original title.
 * 2. Translations saved with the product, if they were made from its current Turkish text.
 * 3. The Turkish text unchanged — never a half-translated mix.
 */
export function translateProduct(product: Product, lang: Language): Product {
  const category = translateCategory(product.category || "", lang);

  // Matches the original seed title, or the catalogue's own Turkish title (cart items
  // and orders store the product as it was shown when added)
  const title = normalizeForCompare(product.title);
  const catalogTr = product.id ? getCatalogContent(product.id, "tr") : null;
  if (catalogTr && (SEED_TITLES.get(product.id) === title || normalizeForCompare(catalogTr.title) === title)) {
    const catalog = getCatalogContent(product.id, lang);
    if (catalog) return { ...product, category, ...catalog };
  }

  const baseTitle = cleanProductText(product.title);
  const baseDesc = cleanProductText(product.description);

  if (lang !== "tr") {
    const storedTitle = product[`title_${lang}` as keyof Product] as string | undefined;
    const storedDesc = product[`description_${lang}` as keyof Product] as string | undefined;
    const fresh = product.i18nSource && product.i18nSource === translationSourceKey(product.title, product.description);
    if (fresh && storedTitle) {
      return {
        ...product,
        category,
        title: cleanProductText(storedTitle),
        description: cleanProductText(storedDesc || baseDesc),
      };
    }
  }

  return { ...product, category, title: baseTitle, description: baseDesc };
}
