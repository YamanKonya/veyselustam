import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/media/ holds the product photos uploaded in the admin panel; it must stay
    // crawlable so Google can index them. The longer Allow rule wins over /api/.
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/checkout", "/order-success", "/login", "/register", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
