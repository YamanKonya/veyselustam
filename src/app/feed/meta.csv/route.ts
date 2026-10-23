import { translateProduct } from "@/i18n/productTranslations";
import { SITE_NAME, SITE_URL, absoluteUrl, listSeoProducts, listStockGroups } from "@/lib/seo";
import { SALES_OPEN } from "@/lib/shop";

// Product catalogue feed for Meta Commerce Manager (WhatsApp Business catalogue,
// Instagram and Facebook shop). Commerce Manager fetches this URL on a schedule,
// so products added on the site appear there without manual work. The same
// columns are accepted by Google Merchant Center.

export const revalidate = 900;

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

export async function GET() {
  const [products, groups] = await Promise.all([listSeoProducts(), listStockGroups()]);

  const rows = products
    .filter((p) => p.id && p.images?.length && p.price > 0)
    .map((raw) => {
      const p = translateProduct(raw, "tr");
      const own = typeof p.stock === "number" ? p.stock : 0;
      // Same rule as the shop: a sale needs both the product and its case in stock
      const inventory = p.stockGroup && groups[p.stockGroup] !== undefined ? Math.min(own, groups[p.stockGroup]) : own;
      const record: Record<(typeof COLUMNS)[number], string | number> = {
        id: p.id!,
        title: plain(p.title, 150),
        description: plain(p.description || p.title, 5000),
        // Matches the product page JSON-LD: while sales are closed everything is a pre-order
        availability: !SALES_OPEN ? "preorder" : inventory > 0 ? "in stock" : "out of stock",
        condition: "new",
        price: `${p.price.toFixed(2)} TRY`,
        link: `${SITE_URL}/product/${encodeURIComponent(p.id!)}`,
        image_link: absoluteUrl(p.images[0]),
        additional_image_link: p.images.slice(1, 10).map(absoluteUrl).join(","),
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
