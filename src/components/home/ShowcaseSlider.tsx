"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Check, Pause, Play } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/format";
import { imageAt, imageSrcSet } from "@/lib/image";
import { useStockGroups, availableStock } from "@/services/stockService";
import { AdminEditButton } from "@/components/admin/AdminEditProvider";
import { SALES_OPEN } from "@/lib/shop";

const AUTOPLAY_MS = 5000;

interface ShowcaseSliderProps {
  products: Product[];
}

export default function ShowcaseSlider({ products }: ShowcaseSliderProps) {
  const { t, dir } = useLanguage();
  const { addItem } = useCartStore();
  const { groups } = useStockGroups();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [added, setAdded] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const thumbRail = useRef<HTMLDivElement>(null);

  const count = products.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Product list can shrink when Firestore data arrives
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  // Advances every 5 s; any manual move restarts the countdown (the effect re-runs
  // on index). Only the pause button stops it.
  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count, go]);

  // Keep the active thumbnail visible in the rail
  useEffect(() => {
    const rail = thumbRail.current;
    const active = rail?.children[index] as HTMLElement | undefined;
    if (rail && active) {
      rail.scrollTo({
        left: active.offsetLeft - rail.clientWidth / 2 + active.clientWidth / 2,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }, [index, reducedMotion]);

  if (count === 0) return null;

  const product = products[index];
  const step = dir === "rtl" ? -1 : 1;
  const prev = () => go(index - step);
  const next = () => go(index + step);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) > 50) (delta < 0 ? next : prev)();
  };

  const handleAdd = () => {
    addItem(product, product.ringSize?.[0] || "", 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const soldOut = availableStock(product, groups) <= 0;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("showcase_label")}
      className="showcase relative w-full overflow-hidden text-versace-gold-50"
      onKeyDown={onKeyDown}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 lg:pt-16 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-14 items-center">

          {/* Stage: the product under the display-case light */}
          <div
            className="relative lg:order-2 select-none touch-pan-y"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (dragStartX.current = null)}
          >
            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              {/* Next piece peeking from behind the case edge */}
              {count > 2 && <NextGhost src={products[(index + 1) % count]?.images?.[0]} />}

              <div className="showcase-frame absolute inset-0 overflow-hidden">
                {/* Only the current piece and its neighbours are mounted, so the first
                    paint downloads one photo instead of the whole case */}
                {products.map((p, i) => {
                  const near = i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
                  if (!near) return null;
                  return (
                  <img
                    key={p.id ?? i}
                    src={imageAt(p.images?.[0], 1080)}
                    srcSet={imageSrcSet(p.images?.[0], [540, 720, 1080])}
                    sizes="(min-width: 1024px) 560px, 100vw"
                    alt={i === index ? p.title : ""}
                    aria-hidden={i !== index}
                    draggable={false}
                    fetchPriority={i === index ? "high" : "low"}
                    decoding="async"
                    className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none ${
                      i === index ? "opacity-100 scale-100" : "opacity-0 scale-[1.04]"
                    }`}
                  />
                  );
                })}
                <img
                  src="/images/watermark.webp"
                  alt=""
                  aria-hidden
                  className="absolute top-3 end-3 w-16 h-16 sm:w-20 sm:h-20 object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
                />
              </div>

              {/* Arrows sit on the frame edge */}
              <button
                type="button"
                onClick={prev}
                aria-label={t("showcase_prev")}
                className="showcase-arrow absolute top-1/2 -translate-y-1/2 -start-3 sm:-start-5"
              >
                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={t("showcase_next")}
                className="showcase-arrow absolute top-1/2 -translate-y-1/2 -end-3 sm:-end-5"
              >
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* Placard: what the piece is and what it costs */}
          {/* Announce changes only when the visitor is driving; autoplay would be noise */}
          <div className="lg:order-1 text-center lg:text-start" aria-live={paused ? "polite" : "off"}>
            <div className="flex items-center gap-3 justify-center lg:justify-start text-sm text-versace-gold-500/90 font-medium">
              {t("showcase_label")}
              <span dir="ltr" className="inline-block text-versace-gold-50/40 tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? t("showcase_play") : t("showcase_pause")}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-versace-gold-50/60 hover:text-versace-gold-500 shadow-[0_0_0_1px_rgba(197,160,89,0.35)] transition-colors"
                >
                  {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
              )}
            </div>

            <h2
              key={product.id}
              className="showcase-title mt-4 font-display text-[2rem] sm:text-[2.6rem] lg:text-[3.1rem] leading-[1.05] font-medium text-white line-clamp-3 motion-safe:animate-placard"
            >
              {product.title}
            </h2>

            <p className="mt-3 text-sm text-versace-gold-50/60">{product.category}</p>
            <AdminEditButton productId={product.id} className="mt-3" />

            <div className="mt-6 flex items-baseline gap-3 justify-center lg:justify-start">
              <span className="font-display text-3xl sm:text-4xl text-versace-gold-500 tabular-nums lining-nums">
                ₺{formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-versace-gold-50/40 line-through tabular-nums">
                  ₺{formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                href={`/product/${product.id}`}
                className="inline-flex items-center justify-center px-7 py-3.5 bg-versace-gold-500 text-versace-green-900 text-sm font-semibold hover:bg-versace-gold-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-versace-gold-100"
              >
                {t("showcase_view")}
              </Link>
              {SALES_OPEN && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut}
                className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-versace-gold-500/50 text-versace-gold-50 text-sm font-semibold hover:border-versace-gold-500 hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-versace-gold-100"
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                {soldOut ? t("sold_out") : added ? t("added") : t("btn_add_to_cart")}
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail rail: the rest of the case, with autoplay progress on the active piece */}
        {count > 1 && (
          <div
            ref={thumbRail}
            role="tablist"
            aria-label={t("showcase_label")}
            className="mt-10 lg:mt-14 flex gap-3 overflow-x-auto scrollbar-none pb-1 lg:justify-center"
          >
            {products.map((p, i) => (
              <button
                key={p.id ?? i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={p.title}
                onClick={() => go(i)}
                className={`showcase-thumb relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] overflow-hidden transition-opacity ${
                  i === index ? "opacity-100" : "opacity-45 hover:opacity-80"
                }`}
              >
                <img src={imageAt(p.images?.[0], 180)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} />
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className={`absolute inset-x-0 bottom-0 h-[2px] bg-versace-gold-500 origin-left rtl:origin-right ${
                      paused ? "" : "animate-showcase-progress"
                    }`}
                    style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NextGhost({ src }: { src?: string }) {
  if (!src) return null;
  return (
    <div
      aria-hidden
      className="hidden xl:block absolute top-[14%] -end-[34%] w-[56%] aspect-square overflow-hidden opacity-25 blur-[1px]"
    >
      <img src={imageAt(src, 540)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} />
    </div>
  );
}
