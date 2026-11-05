import { translateProduct } from "@/i18n/productTranslations";
import { LANGUAGES, Language } from "@/i18n/translations";
import { SITE_NAME, SITE_URL, absoluteUrl, listSeoProducts, listStockGroups } from "@/lib/seo";
import { RATE_CODES, RateCode, getTcmbRates } from "@/lib/rates";

// Product catalogue feed for Meta Commerce Manager (WhatsApp Business catalogue,
// Instagram and Facebook shop) and the Pinterest catalogue. They fetch this URL on a
// schedule, so products added on the site appear there without manual work. The same
// columns are accepted by Google Merchant Center.
//
// Default is Turkish with TL prices. ?lang=en&currency=USD (or GBP, EUR…) gives the
// site's translated text, prices converted at the TCMB rate and links that open the
// product page in that language — one feed per country in Pinterest.

export const revalidate = 900;

// The marketplaces reject WebP photos; the image CDN serves the same picture as JPEG
const jpeg = (url: string) => (url.includes("cdn.myikas.com/") ? url.replace(/\.webp$/i, ".jpeg") : url);

const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "google_product_category",
  "product_type",
  "inventory",
] as const;

const cell = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const plain = (text: string, max: number) =>
  text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿️]/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const langParam = params.get("lang");
  const lang: Language = LANGUAGES.some((l) => l.code === langParam) ? (langParam as Language) : "tr";
  const currencyParam = (params.get("currency") || "TRY").toUpperCase();
  const currency = currencyParam === "TRY" || RATE_CODES.includes(currencyParam as RateCode) ? currencyParam : "TRY";

  // TL for one unit of the feed currency; a feed with wrong prices is worse than none
  let rate = 1;
  if (currency !== "TRY") {
    try {
      rate = (await getTcmbRates()).rates[currency as RateCode] ?? 0;
    } catch (err) {
      console.error("feed rates failed:", err);
      rate = 0;
    }
    if (!rate) return new Response("Exchange rate unavailable", { status: 503 });
  }
  const langQuery = lang === "tr" ? "" : `?lang=${lang}`;

  const [products, groups] = await Promise.all([listSeoProducts(), listStockGroups()]);

  const rows = products
    .filter((p) => p.id && p.images?.length && p.price > 0)
    .map((raw) => {
      const p = translateProduct(raw, lang);
      const own = typeof p.stock === "number" ? p.stock : 0;
      // Same rule as the shop: a sale needs both the product and its case in stock
      const inventory = p.stockGroup && groups[p.stockGroup] !== undefined ? Math.min(own, groups[p.stockGroup]) : own;
      const record: Record<(typeof COLUMNS)[number], string | number> = {
        id: p.id!,
        title: plain(p.title, 150),
        description: plain(p.description || p.title, 5000),
        // Real stock, not pre-order: Pinterest refuses to distribute preorder items as out of stock
        availability: inventory > 0 ? "in stock" : "out of stock",
        condition: "new",
        price: `${(p.price / rate).toFixed(2)} ${currency}`,
        link: `${SITE_URL}/product/${encodeURIComponent(p.id!)}${langQuery}`,
        image_link: jpeg(absoluteUrl(p.images[0])),
        additional_image_link: p.images.slice(1, 10).map((i) => jpeg(absoluteUrl(i))).join(","),
        brand: SITE_NAME,
        google_product_category: "Apparel & Accessories > Jewelry > Rings",
        product_type: p.category || "",
        inventory: Math.max(0, inventory),
      };
      return COLUMNS.map((c) => cell(record[c])).join(",");
    });

  return new Response([COLUMNS.join(","), ...rows].join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
