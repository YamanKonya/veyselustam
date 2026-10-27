import { Product } from "@/types";
import { Language } from "./translations";
import { getCatalogContent } from "./catalogContent";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { toHorasanWording } from "@/lib/horasanWording";
import { RU_BACKFILL } from "./ruBackfill";

// Category Translation Dictionary for all 6 languages
export const CATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  "Nakkaş El Oyması Taşlı": {
    tr: "Nakkaş El Oyması Taşlı",
    en: "Nakkaş Hand-Carved Stones",
    es: "Piedras talladas a mano nakkaş",
    de: "Nakkaş – handgeschnitzte Steine",
    ar: "أحجار منقوشة يدويًا بفن النقّاش",
    ru: "Камни с ручной резьбой в стиле наккаш",
  },
  "Horasan Akik Taşlı": {
    tr: "Horasan Akik Taşlı",
    en: "Khorasan Agate",
    es: "Ágata de Jorasán",
    de: "Chorasan-Achat",
    ar: "عقيق خراساني",
    ru: "Хорасанский агат",
  },
  "El Yapımı Gümüş Kolye": {
    tr: "El Yapımı Gümüş Kolye",
    en: "Handcrafted Silver Necklaces",
    es: "Collares de plata artesanales",
    de: "Handgefertigte Silberketten",
    ar: "قلائد فضية مصنوعة يدويًا",
    ru: "Серебряные колье ручной работы",
  },
  "Özel Yapım Ürünler": {
    tr: "Özel Yapım Ürünler",
    en: "Made to Order",
    es: "Piezas por encargo",
    de: "Sonderanfertigungen",
    ar: "منتجات حسب الطلب",
    ru: "Изделия на заказ",
  },
  "Özel El Yapımı Gümüş Yüzükler": {
    tr: "Özel El Yapımı Gümüş Yüzükler",
    en: "Handcrafted Signature Silver Rings",
    es: "Anillos de plata artesanales exclusivos",
    de: "Exklusive handgefertigte Silberringe",
    ar: "خواتم فضية مميزة مصنوعة يدويًا",
    ru: "Авторские серебряные кольца ручной работы",
  },
  "Gümüş Yüzük": {
    tr: "Gümüş Yüzük",
    en: "Silver Rings",
    es: "Anillos de plata",
    de: "Silberringe",
    ar: "خواتم فضة",
    ru: "Серебряные кольца",
  },
  "Kadın Takı": {
    tr: "Kadın Takı",
    en: "Women's Jewellery",
    es: "Joyería femenina",
    de: "Damenschmuck",
    ar: "مجوهرات نسائية",
    ru: "Женские украшения",
  },
  "Yüzük": {
    tr: "Yüzük",
    en: "Rings",
    es: "Anillos",
    de: "Ringe",
    ar: "خواتم",
    ru: "Кольца",
  },
};

// Strip shop self-promotion links and stray replacement characters from imported text;
// old "Yemen akik" wording reads as Khorasan agate (saved products may still carry it)
const cleanProductText = (text: string): string => {
  return toHorasanWording((text || "").normalize("NFC"))
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

/** Does the site show the hand-written catalogue text for this product (rather than its stored text)? */
export const usesCatalogText = (product: Product) => {
  if (product.customText || !product.id) return false; // saved from the admin form with its own text
  const catalogTr = getCatalogContent(product.id, "tr");
  if (!catalogTr) return false;
  // Matches the original seed title, or the catalogue's own Turkish title (cart items
  // and orders store the product as it was shown when added)
  const title = normalizeForCompare(product.title);
  return SEED_TITLES.get(product.id) === title || normalizeForCompare(catalogTr.title) === title;
};

/**
 * Title and description in the requested language. Sources, in order:
 * 1. The hand-written catalogue text, while the product still has its original title
 *    and has not been given its own text in the admin panel.
 * 2. Translations saved with the product, if they were made from its current Turkish text
 *    (Russian: the prepared Russian text for pieces saved before Russian existed, then English).
 * 3. The Turkish text unchanged — never a half-translated mix.
 */
export function translateProduct(product: Product, lang: Language): Product {
  const category = translateCategory(product.category || "", lang);

  if (usesCatalogText(product)) {
    const catalog = getCatalogContent(product.id, lang);
    if (catalog) return { ...product, category, ...catalog };
  }

  const baseTitle = cleanProductText(product.title);
  const baseDesc = cleanProductText(product.description);

  if (lang !== "tr") {
    const sourceKey = translationSourceKey(product.title, product.description);
    const fresh = product.i18nSource && product.i18nSource === sourceKey;
    const backfill = lang === "ru" && !product.title_ru && product.id ? RU_BACKFILL[product.id] : undefined;
    if (backfill && backfill.source === sourceKey) {
      return { ...product, category, title: backfill.title, description: cleanProductText(backfill.description) };
    }
    for (const l of lang === "ru" ? (["ru", "en"] as const) : [lang]) {
      const storedTitle = product[`title_${l}` as keyof Product] as string | undefined;
      const storedDesc = product[`description_${l}` as keyof Product] as string | undefined;
      if (fresh && storedTitle) {
        return {
          ...product,
          category,
          title: cleanProductText(storedTitle),
          description: cleanProductText(storedDesc || baseDesc),
        };
      }
    }
  }

  return { ...product, category, title: baseTitle, description: baseDesc };
}
