import { Product } from "@/types";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { translateProduct } from "@/i18n/productTranslations";
import { firebaseConfig } from "@/lib/firebaseConfig";
import { CONTACT } from "@/lib/contact";

// Server-side product data for search engines: page titles, descriptions,
// structured data and the sitemap. Products are publicly readable, so the
// Firestore REST API is used without signing in.

export const SITE_URL = "https://veyselustam.com";
export const SITE_NAME = "Veysel Ustam";
export const SITE_DESCRIPTION =
  "Konya'da el yapımı 925 ayar gümüş yüzükler: akik, firuze, hematit ve doğal taşlı, nakış işlemeli erkek yüzükleri. Usta işi, kişiye özel.";

const REST = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

type FsValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FsValue[] };
  timestampValue?: string;
};

const plain = (v: FsValue | undefined): any => {
  if (!v) return undefined;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(plain);
  return undefined;
};

const fromDoc = (doc: { name: string; fields?: Record<string, FsValue>; updateTime?: string }): Product & { updatedAt?: string } => {
  const f = doc.fields || {};
  const out: any = { id: doc.name.split("/").pop(), updatedAt: doc.updateTime };
  for (const k of Object.keys(f)) out[k] = plain(f[k]);
  out.images = Array.isArray(out.images) ? out.images : [];
  return out;
};

const seedById = new Map(INITIAL_VEYSELUSTAM_PRODUCTS.map((p) => [p.id, p] as const));

/** The product as the shop shows it in Turkish, or null if it doesn't exist. */
export async function getSeoProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${REST}/products/${encodeURIComponent(id)}?key=${firebaseConfig.apiKey}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) return translateProduct(fromDoc(await res.json()), "tr");
  } catch {}
  const seed = seedById.get(id);
  return seed ? translateProduct(seed, "tr") : null;
}

/** All active products for the sitemap; falls back to the built-in catalogue. */
export async function listSeoProducts(): Promise<(Product & { updatedAt?: string })[]> {
  try {
    const all: (Product & { updatedAt?: string })[] = [];
    let pageToken = "";
    for (let i = 0; i < 10; i++) {
      const res = await fetch(
        `${REST}/products?pageSize=300&key=${firebaseConfig.apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      all.push(...(data.documents || []).map(fromDoc));
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
    if (all.length) return all.filter((p) => p.isActive !== false);
  } catch {}
  return INITIAL_VEYSELUSTAM_PRODUCTS.filter((p) => p.isActive !== false);
}

/** Shared case stock by group id (e.g. { sidre: 15 }); empty if unavailable. */
export async function listStockGroups(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${REST}/stockGroups?pageSize=300&key=${firebaseConfig.apiKey}`, { next: { revalidate: 900 } });
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const d of data.documents || []) {
      const g = fromDoc(d) as any;
      if (typeof g.stock === "number") out[g.id] = g.stock;
    }
    return out;
  } catch {
    return {};
  }
}

/** Search-result sized description: first sentences, emoji and links stripped. */
export const metaDescription = (text: string, max = 158) => {
  const clean = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿️]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:•-]+$/, "") + "…";
};

export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

export const storeJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  "@id": `${SITE_URL}/#store`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-256.png`,
  image: `${SITE_URL}/images/logo-256.png`,
  description: SITE_DESCRIPTION,
  telephone: CONTACT.phoneE164,
  address: { "@type": "PostalAddress", addressLocality: "Konya", addressCountry: "TR" },
  areaServed: "TR",
  sameAs: [`https://www.instagram.com/${CONTACT.instagram}/`],
});
