import type { Metadata } from "next";
import { SALES_OPEN } from "@/lib/shop";
import { SITE_NAME, SITE_URL, absoluteUrl, getSeoProduct, metaDescription, storeJsonLd } from "@/lib/seo";

// The product page itself is a client component; this server layout gives search
// engines and link previews (WhatsApp, Instagram) the product's title, photo and price.

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = decodeURIComponent(params.id);
  const product = await getSeoProduct(id);
  if (!product) return { title: "Ürün bulunamadı", robots: { index: false } };

  const description = metaDescription(product.description || "");
  const image = product.images?.[0] ? absoluteUrl(product.images[0]) : undefined;
  const url = `/product/${encodeURIComponent(id)}`;
  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: product.title,
      description,
      locale: "tr_TR",
      images: image ? [{ url: image, alt: product.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.title, description, images: image ? [image] : undefined },
    robots: product.isActive === false ? { index: false } : undefined,
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const id = decodeURIComponent(params.id);
  const product = await getSeoProduct(id);
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
          url: `${SITE_URL}/product/${encodeURIComponent(id)}`,
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
          { "@type": "ListItem", position: 1, name: "Anasayfa", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: product.title, item: `${SITE_URL}/product/${encodeURIComponent(id)}` },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </>
  );
}
