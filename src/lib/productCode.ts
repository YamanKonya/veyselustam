import { Product } from "@/types";

// Every product gets a short, permanent number (VU-1001, VU-1002 …) so it can be
// found quickly in the admin panel and named in WhatsApp conversations. Numbers
// are handed out in the order products were added and never reused.
export const FIRST_CODE = 1001;

export const productCode = (p: Pick<Product, "code">) => (p.code ? `VU-${p.code}` : "");

/** The next free number after every code already given. */
export const nextCode = (products: Pick<Product, "code">[]) =>
  Math.max(FIRST_CODE - 1, ...products.map((p) => p.code || 0)) + 1;
