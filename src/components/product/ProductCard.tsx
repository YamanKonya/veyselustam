"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice, discountPercent } from "@/lib/format";
import { imageAt, imageSrcSet } from "@/lib/image";

interface ProductCardProps {
  product: Product;
  isAdded: boolean;
  onAddToCart: (product: Product, size: string) => void;
}

export default function ProductCard({ product, isAdded, onAddToCart }: ProductCardProps) {
  const { t } = useLanguage();
  const image = product.images?.[0];
  const discount = discountPercent(product.price, product.originalPrice, product.discountPercent);
  const href = `/product/${product.id}`;

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block aspect-square w-full overflow-hidden bg-versace-green-900">
        {image ? (
          <img
            src={imageAt(image, 540)}
            srcSet={imageSrcSet(image, [360, 540, 720])}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, 50vw"
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-versace-gold-100/60 text-xs">
            {t("no_image")}
          </div>
        )}

        {product.isFeatured && (
          <span className="absolute top-3 start-3 bg-versace-green-900/90 text-versace-gold-500 text-[11px] font-medium px-2.5 py-1 shadow-[0_0_0_1px_rgba(197,160,89,0.5)]">
            {t("featured_badge")}
          </span>
        )}

        {discount > 0 && (
          <span className="absolute bottom-3 start-3 bg-versace-gold-500 text-versace-green-900 text-xs font-semibold px-2 py-1 tabular-nums">
            −%{discount}
          </span>
        )}

        <img
          src="/images/watermark.webp"
          alt=""
          aria-hidden
          className="absolute top-2 end-2 w-12 h-12 sm:w-14 sm:h-14 object-contain pointer-events-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)]"
        />
      </Link>

      <div className="pt-4 flex-1 flex flex-col">
        <Link href={href} className="hover:text-versace-gold-700 transition-colors">
          <h3 className="font-display text-lg leading-snug text-versace-green-900 line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 mb-4 flex items-baseline gap-2">
          <span className="text-base font-semibold text-versace-green-900 tabular-nums">
            ₺{formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-slate-400 line-through tabular-nums">
              ₺{formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product, product.ringSize?.[0] || "")}
          className={`mt-auto w-full py-3 text-sm font-semibold transition-colors ${
            isAdded
              ? "bg-versace-gold-500 text-versace-green-900"
              : "bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700"
          }`}
        >
          {isAdded ? t("added") : t("btn_add_to_cart")}
        </button>
      </div>
    </article>
  );
}
