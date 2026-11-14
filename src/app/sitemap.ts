import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl, listSeoProducts } from "@/lib/seo";
import { LOCALES, localizedPath } from "@/lib/locale";
import { languageAlternates } from "@/lib/localeSeo";

export const revalidate = 3600;

// Every page is listed once per language, each entry carrying the full set of
// alternates (hreflang) so search engines can pair the language versions.
const localized = (path: string, extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> & { images?: string[] }) =>
  LOCALES.map((locale) => ({
    url: `${SITE_URL}${localizedPath(locale, path)}`,
    alternates: { languages: languageAlternates(path) },
    ...extra,
  }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listSeoProducts();
  return [
    ...localized("/", { changeFrequency: "daily", priority: 1 }),
    { url: `${SITE_URL}/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/iade`, changeFrequency: "yearly", priority: 0.2 },
    ...products
      .filter((p) => p.id)
      .flatMap((p) => {
        const path = `/product/${encodeURIComponent(p.id!)}`;
        const images = (p.images || []).slice(0, 3).map(absoluteUrl);
        return localized(path, {
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          changeFrequency: "weekly" as const,
          // Featured / campaign products are the ones we push
          priority: p.isFeatured || p.isCampaign ? 0.9 : 0.7,
          images,
        });
      }),
  ];
}
