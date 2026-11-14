import type { Metadata } from "next";
import { ProductSeoLayout, productMetadata } from "@/lib/localeSeo";
import { isLocale, type Locale } from "@/lib/locale";

type Props = { params: { id: string; lang: string }; children: React.ReactNode };

const localeOf = (lang: string): Locale => (isLocale(lang) ? lang : "tr");

export function generateMetadata({ params }: { params: { id: string; lang: string } }): Promise<Metadata> {
  return productMetadata(decodeURIComponent(params.id), localeOf(params.lang));
}

export default function LocalizedProductLayout({ params, children }: Props) {
  return (
    <ProductSeoLayout id={decodeURIComponent(params.id)} locale={localeOf(params.lang)}>
      {children}
    </ProductSeoLayout>
  );
}
