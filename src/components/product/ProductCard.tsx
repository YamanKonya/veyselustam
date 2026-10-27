"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice, discountPercent } from "@/lib/format";
import MemberPrice from "@/components/product/MemberPrice";
import { imageAt, imageSrcSet } from "@/lib/image";
import { useStockGroups, availableStock } from "@/services/stockService";
import { AdminEditButton } from "@/components/admin/AdminEditProvider";
import { SALES_OPEN } from "@/lib/shop";

interface ProductCardProps {
  product: Product;
  isAdded: boolean;
  onAddToCart: (product: Product, size: string) => void;
}

// Only videos every visitor can load (site files or web links), not ones kept in
// the admin's own browser storage
const playableVideo = (url?: string) => (url && /^(\/|https?:\/\/)/.test(url) ? url : "");

export default function ProductCard({ product, isAdded, onAddToCart }: ProductCardProps) {
  const { t } = useLanguage();
  const video = playableVideo(product.videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoArmed, setVideoArmed] = useState(false); // load the file only after the first hover
  const [videoOn, setVideoOn] = useState(false);

  const startVideo = (e: React.PointerEvent) => {
    if (!video || e.pointerType !== "mouse") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setVideoArmed(true);
    setVideoOn(true);
  };
  useEffect(() => {
    if (videoOn) videoRef.current?.play().catch(() => setVideoOn(false));
  }, [videoOn, videoArmed]);

  const stopVideo = () => {
    setVideoOn(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };
  const { groups } = useStockGroups();
  const soldOut = availableStock(product, groups) <= 0;
  const image = product.images?.[0];
  const discount = discountPercent(product.price, product.originalPrice, product.discountPercent);
  const href = `/product/${product.id}`;

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link
          href={href}
          onPointerEnter={startVideo}
          onPointerLeave={stopVideo}
          className="relative block aspect-square w-full overflow-hidden bg-versace-green-900"
        >
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

          {video && videoArmed && (
            <video
              ref={videoRef}
              src={video}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoOn ? "opacity-100" : "opacity-0"}`}
            />
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
        <AdminEditButton productId={product.id} className="absolute bottom-3 end-3 z-10" />
      </div>

      <div className="pt-4 flex-1 flex flex-col">
        <Link href={href} className="hover:text-versace-gold-700 transition-colors">
          <h3 className="font-display text-lg leading-snug text-versace-green-900 line-clamp-2">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 mb-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {discount > 0 && (
            <span className="text-sm text-slate-500 line-through decoration-red-600/80 decoration-2 tabular-nums">
              ₺{formatPrice(product.originalPrice!)}
            </span>
          )}
          <span className={`font-bold text-versace-green-900 tabular-nums ${discount > 0 ? "text-xl" : "text-lg"}`}>
            ₺{formatPrice(product.price)}
          </span>
        </div>
        <div className="-mt-2 mb-4">
          <MemberPrice product={product} />
        </div>

        {!SALES_OPEN ? (
          <Link
            href={href}
            className="mt-auto w-full py-3 text-sm font-semibold text-center border border-versace-green-900/30 text-versace-green-900 hover:border-versace-green-900 transition-colors"
          >
            {t("sales_soon")}
          </Link>
        ) : (
        <button
          type="button"
          disabled={soldOut}
          onClick={() => onAddToCart(product, product.ringSize?.[0] || "")}
          className={`mt-auto w-full py-3 text-sm font-semibold transition-colors ${
            soldOut
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : isAdded
              ? "bg-versace-gold-500 text-versace-green-900"
              : "bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700"
          }`}
        >
          {soldOut ? t("sold_out") : isAdded ? t("added") : t("btn_add_to_cart")}
        </button>
        )}
      </div>
    </article>
  );
}
