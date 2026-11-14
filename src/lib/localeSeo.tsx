import type { Metadata } from "next";
import { SALES_OPEN } from "@/lib/shop";
import { translateProduct } from "@/i18n/productTranslations";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl, getSeoProduct, metaDescription, storeJsonLd } from "@/lib/seo";
import { LOCALES, Locale, localizedPath } from "@/lib/locale";

// Sunucu tarafı SEO: her dil adresi kendi başlık, açıklama, canonical ve hreflang
// etiketlerini taşır. Sayfanın gövdesi istemci tarafında çevrilir (LanguageContext).

const OG_LOCALE: Record<Locale, string> = {
  tr: "tr_TR", en: "en_GB", es: "es_ES", de: "de_DE", ar: "ar_SA", ru: "ru_RU",
};

const HOME_COPY: Record<Locale, { title: string; description: string; home: string }> = {
  tr: { title: "Veysel Ustam | El Yapımı 925 Ayar Gümüş Yüzük, Konya", description: SITE_DESCRIPTION, home: "Anasayfa" },
  en: {
    title: "Veysel Ustam | Handmade 925 Sterling Silver Rings, Konya",
    description: "Handmade 925 sterling silver rings from Konya, Turkey: men's rings with agate, turquoise, hematite and natural stones, with fine engraving. Made by hand, made to order.",
    home: "Home",
  },
  es: {
    title: "Veysel Ustam | Anillos de plata de ley 925 hechos a mano, Konya",
    description: "Anillos de plata de ley 925 hechos a mano en Konya: anillos para hombre con ágata, turquesa, hematites y piedras naturales, con grabado fino. Trabajo artesanal y a medida.",
    home: "Inicio",
  },
  de: {
    title: "Veysel Ustam | Handgefertigte Silberringe 925, Konya",
    description: "Handgefertigte Ringe aus 925er Sterlingsilber aus Konya: Herrenringe mit Achat, Türkis, Hämatit und Naturstein, mit feiner Gravur. Handwerk, auf Wunsch gefertigt.",
    home: "Startseite",
  },
  ar: {
    title: "Veysel Ustam | خواتم فضة 925 مصنوعة يدوياً، قونية",
    description: "خواتم فضة عيار 925 مصنوعة يدوياً في قونية: خواتم رجالية بالعقيق والفيروز والهيماتيت والأحجار الطبيعية، مع نقش دقيق. صناعة يدوية وحسب الطلب.",
    home: "الرئيسية",
  },
  ru: {
    title: "Veysel Ustam | Серебряные кольца 925 пробы ручной работы, Конья",
    description: "Серебряные кольца 925 пробы ручной работы из Коньи: мужские кольца с агатом, бирюзой, гематитом и натуральными камнями, с тонкой гравировкой. Работа мастера, на заказ.",
    home: "Главная",
  },
};

const LOGO_IMAGE = { url: "/images/logo-256.png", width: 256, height: 256, alt: SITE_NAME };

/** Bir yolun tüm dil sürümlerinin mutlak adresleri (hreflang için) */
export function languageAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of LOCALES) map[locale] = `${SITE_URL}${localizedPath(locale, path)}`;
  map["x-default"] = `${SITE_URL}${path}`;
  return map;
}

export function homeMetadata(locale: Locale): Metadata {
  const copy = HOME_COPY[locale];
  const url = localizedPath(locale, "/");
  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: url, languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: copy.title,
      description: copy.description,
      locale: OG_LOCALE[locale],
      images: [LOGO_IMAGE],
    },
    twitter: { card: "summary", title: copy.title, description: copy.description },
  };
}

export async function productMetadata(id: string, locale: Locale): Promise<Metadata> {
  const raw = await getSeoProduct(id);
  if (!raw) return { title: "Ürün bulunamadı", robots: { index: false } };

  const product = translateProduct(raw, locale);
  const path = `/product/${encodeURIComponent(id)}`;
  const url = localizedPath(locale, path);
  const description = metaDescription(product.description || "");
  const image = product.images?.[0] ? absoluteUrl(product.images[0]) : undefined;
  return {
    title: product.title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: product.title,
      description,
      locale: OG_LOCALE[locale],
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.title, description, images: image ? [image] : undefined },
    robots: product.isActive === false ? { index: false } : undefined,
  };
}

/** Ürün sayfasının yapısal verisi (Product, Offer, BreadcrumbList) */
export async function ProductSeoLayout({
  id,
  locale,
  children,
}: {
  id: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const raw = await getSeoProduct(id);
  const product = raw ? translateProduct(raw, locale) : null;
  const path = `/product/${encodeURIComponent(id)}`;
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: metaDescription(product.description || "", 500),
        image: (product.images || []).slice(0, 5).map(absoluteUrl),
        sku: id,
        category: product.category,
        brand: { "@type": "Brand", name: SITE_NAME },
        material: "925 Ayar Gümüş",
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}${localizedPath(locale, path)}`,
          priceCurrency: "TRY",
          price: product.price,
          availability: !SALES_OPEN
            ? "https://schema.org/PreOrder"
            : product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": storeJsonLd()["@id"] },
        },
      }
    : null;
  const breadcrumb = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_COPY[locale].home, item: `${SITE_URL}${localizedPath(locale, "/")}` },
          { "@type": "ListItem", position: 2, name: product.title, item: `${SITE_URL}${localizedPath(locale, path)}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, "\u003c") }}
        />
      )}
      {children}
    </>
  );
}
