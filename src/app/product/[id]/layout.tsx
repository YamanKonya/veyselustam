import type { Metadata } from "next";
import { ProductSeoLayout, productMetadata } from "@/lib/localeSeo";

// The product page itself is a client component; this server layout gives search
// engines and link previews (WhatsApp, Instagram) the product's title, photo and price.

type Props = { params: { id: string }; children: React.ReactNode };

export function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return productMetadata(decodeURIComponent(params.id), "tr");
}

export default function ProductLayout({ params, children }: Props) {
  return (
    <ProductSeoLayout id={decodeURIComponent(params.id)} locale="tr">
      {children}
    </ProductSeoLayout>
  );
}
