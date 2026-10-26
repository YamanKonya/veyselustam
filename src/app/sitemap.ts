import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl, listSeoProducts } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listSeoProducts();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/iade`, changeFrequency: "yearly", priority: 0.2 },
    ...products
      .filter((p) => p.id)
      .map((p) => ({
        url: `${SITE_URL}/product/${encodeURIComponent(p.id!)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        // Featured / campaign products are the ones we push
        priority: p.isFeatured || p.isCampaign ? 0.9 : 0.7,
        images: (p.images || []).slice(0, 3).map(absoluteUrl),
      })),
  ];
}
