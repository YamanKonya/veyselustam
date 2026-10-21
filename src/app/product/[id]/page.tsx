"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/layout/SiteFooter";
import { whatsappLink } from "@/lib/contact";
import { imageAt } from "@/lib/image";
import { useStockGroups, availableStock } from "@/services/stockService";
import { AdminEditButton } from "@/components/admin/AdminEditProvider";
import { SALES_OPEN } from "@/lib/shop";
import { Product } from "@/types";
import { getProductById, getLocalProductById } from "@/services/productService";
import { useCartStore } from "@/store/useCartStore";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import { useRecentStore } from "@/store/useRecentStore";
import Link from "next/link";
import { 
  ShoppingBag, 
  ChevronLeft, 
  Check, 
  ShieldCheck, 
  Truck, 
  Award, 
  Plus, 
  Minus,
  Loader2,
  AlertCircle,
  Sparkles,
  Heart,
  Share2,
  Star,
  Gem,
  Package,
  ArrowLeft,
  ZoomIn,
  MessageCircle,
  X,
  ChevronRight
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { t, language } = useLanguage();

  const [rawProduct, setProduct] = useState<Product | null>(null);
  const product = rawProduct ? translateProduct(rawProduct, language) : null;
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedRingSize, setSelectedRingSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  const { addItem } = useCartStore();
  const { addRecentItem } = useRecentStore();
  const { groups } = useStockGroups();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const show = (data: Product) => {
      setProduct(data);
      addRecentItem(data);
      setSelectedRingSize((current) => current || data.ringSize?.[0] || "");
      setLoading(false);
    };

    // Render the local copy at once; Firestore can take seconds (or never answer offline)
    const local = getLocalProductById(id);
    if (local) show(local);

    getProductById(id).then((data) => {
      if (cancelled) return;
      if (data) show(data);
      else setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const imageCount = rawProduct?.images?.length || 0;
  const stepImage = useCallback(
    (delta: number) => {
      if (imageCount < 2) return;
      setSelectedImageIndex((i) => (i + delta + imageCount) % imageCount);
    },
    [imageCount]
  );

  // Warm the cache for every gallery photo so switching is instant
  useEffect(() => {
    rawProduct?.images?.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = imageAt(src, 1080);
    });
  }, [rawProduct?.images]);

  // Arrow keys move through the gallery (also inside the zoom view); Esc closes zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
      if (e.key === "ArrowLeft") stepImage(-1 * rtl);
      if (e.key === "ArrowRight") stepImage(1 * rtl);
      if (e.key === "Escape") setImageZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepImage]);

  const swipeStartX = useRef<number | null>(null);
  const swiped = useRef(false);
  const onSwipeStart = (e: React.PointerEvent) => {
    swipeStartX.current = e.clientX;
    swiped.current = false;
  };
  const onSwipeEnd = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const delta = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(delta) > 50) {
      swiped.current = true;
      const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
      stepImage((delta < 0 ? 1 : -1) * rtl);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.ringSize && product.ringSize.length > 0 && !selectedRingSize) {
      setSizeError(t("pd_select_size"));
      return;
    }

    setSizeError("");
    addItem(product, selectedRingSize, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <CartDrawer />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-versace-gold-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-500">{t("loading_products")}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <CartDrawer />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{t("no_products_found")}</h2>
          <p className="text-sm text-slate-500 mb-2">{t("no_products_desc")}</p>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-900 text-white text-sm font-bold hover:bg-versace-green-700 transition-colors"
          >
            {t("pd_back")}
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentMainImage = images[selectedImageIndex] || null;
  // Linked to a shared case (e.g. Sidre)? Then the case stock is what can be sold
  const left = availableStock(product, groups);

  return (
    <div className="min-h-screen text-slate-900 flex flex-col">
      <Navbar />
      <CartDrawer />

      {/* Image Zoom Modal */}
      {imageZoom && currentMainImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setImageZoom(false)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentMainImage}
              alt={product.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onPointerDown={onSwipeStart}
              onPointerUp={onSwipeEnd}
              draggable={false}
            />
            {/* Watermark in zoom modal */}
            <div className="absolute bottom-6 end-6 z-10 pointer-events-none drop-shadow-2xl opacity-95">
              <img 
                src="/images/watermark.webp" 
                alt="Veysel Ustam" 
                width={200}
                height={200}
                className="w-20 h-24 sm:w-28 sm:h-32 object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" 
              />
            </div>
          </div>
          <button
            className="absolute top-6 end-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-sm transition z-20"
            onClick={(e) => { e.stopPropagation(); setImageZoom(false); }}
            aria-label={t("close")}
          >
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <GalleryArrows
              onPrev={() => stepImage(-1)}
              onNext={() => stepImage(1)}
              prevLabel={t("showcase_prev")}
              nextLabel={t("showcase_next")}
              className="start-4 sm:start-8"
              nextClassName="end-4 sm:end-8"
            />
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-versace-gold-700 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t("nav_home")}
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Product Detail Container */}
        <div className="bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Image Gallery */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 bg-slate-50/50">
              {/* Main Display Image */}
              <div
                className="aspect-square bg-versace-green-900 overflow-hidden border border-slate-200/50 relative group cursor-zoom-in select-none touch-pan-y"
                onClick={() => {
                  if (!swiped.current) setImageZoom(true);
                }}
                onPointerDown={onSwipeStart}
                onPointerUp={onSwipeEnd}
              >
                {currentMainImage ? (
                  <img
                    src={imageAt(currentMainImage, 1080)}
                    alt={product.title}
                    fetchPriority="high"
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    {t("no_image")}
                  </div>
                )}

                {/* Category & Featured/Status badges */}
                <div className="absolute top-3 sm:top-4 left-3 rtl:right-3 rtl:left-auto sm:left-4 flex flex-wrap items-center gap-2 z-10">
                  <span className="bg-versace-green-900/90 text-versace-gold-500 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 uppercase tracking-wider">
                    {product.category}
                  </span>
                  {product.isFeatured && (
                    <span className="bg-versace-gold-500 text-versace-green-900 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-versace-green-900" /> {t("featured_badge")}
                    </span>
                  )}
                  {product.isActive === false && (
                    <span className="bg-red-500/90 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 uppercase tracking-wider shadow-md">
                      {t("inactive_badge")}
                    </span>
                  )}
                </div>

                {/* Watermark / Filigran (Sağ Üst Köşe) */}
                <div className="absolute top-3 sm:top-5 right-3 rtl:left-3 rtl:right-auto sm:right-5 z-10 pointer-events-none opacity-95 group-hover:opacity-100 transition-opacity">
                  <img 
                    src="/images/watermark.webp" 
                    alt="Veysel Ustam" 
                    width={140}
                    height={140}
                    className="w-14 h-16 sm:w-20 sm:h-24 lg:w-24 lg:h-28 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]" 
                  />
                </div>

                {images.length > 1 && (
                  <>
                    <GalleryArrows
                      onPrev={() => stepImage(-1)}
                      onNext={() => stepImage(1)}
                      prevLabel={t("showcase_prev")}
                      nextLabel={t("showcase_next")}
                      className="start-3"
                      nextClassName="end-3"
                    />
                    <span dir="ltr" className="absolute bottom-3 start-3 z-10 bg-versace-green-900/85 text-versace-gold-50 text-xs px-2.5 py-1 tabular-nums">
                      {selectedImageIndex + 1} / {images.length}
                    </span>
                  </>
                )}

                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 rtl:left-3 rtl:right-auto bg-white/80 backdrop-blur-sm text-slate-600 text-[10px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-3 h-3" /> {t("zoom_hint")}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                        selectedImageIndex === idx
                          ? "border-versace-gold-500 ring-2 ring-versace-gold-500/20"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imageAt(imgUrl, 180)} alt={`${t("image_alt")} ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Details & Buying Actions */}
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Title & Category */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-versace-gold-700 bg-versace-gold-50 px-2.5 py-1 rounded-lg">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Gem className="w-3 h-3" /> {t("pd_handmade_guarantee")}
                    </span>
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-medium text-versace-green-900 leading-[1.1]">
                    {product.title}
                  </h1>
                  <AdminEditButton
                    productId={product.id}
                    label="Bu ürünü düzenle"
                    onSaved={() => id && getProductById(id).then((data) => data && setProduct(data))}
                  />
                </div>

                {/* Price & Stock */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-3 border-y border-slate-100">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-semibold text-versace-green-900 tabular-nums">
                          ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          -%{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} {t("discount_label")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-slate-400 line-through font-medium">
                          ₺{product.originalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {(product.originalPrice - product.price).toLocaleString("tr-TR")} ₺ {t("savings_label")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-semibold text-versace-green-900 tabular-nums">
                      ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  )}

                  {SALES_OPEN && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      left > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {left > 0 ? `${t("pd_in_stock")} (${left})` : t("pd_out_of_stock")}
                  </span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("pd_desc_heading")}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description || t("pd_default_desc")}
                  </p>
                </div>

                {/* Ring Size Selection */}
                {SALES_OPEN && product.ringSize && product.ringSize.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {t("pd_select_size")} *
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.ringSize.map((size) => {
                        const isSelected = selectedRingSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedRingSize(size);
                              setSizeError("");
                            }}
                            className={`min-w-[44px] h-11 px-3 text-xs font-bold transition-all duration-200 flex items-center justify-center border ${
                              isSelected
                                ? "bg-versace-green-900 text-versace-gold-50 border-versace-green-900"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {sizeError && (
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {sizeError}
                      </p>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                {SALES_OPEN && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {t("quantity_label")}
                  </label>
                  <div className="flex items-center gap-1 w-fit border border-slate-200 p-1 bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-extrabold w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(Math.max(left, 1), quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                )}
              </div>

              {/* Action Buttons & Guarantees */}
              <div className="space-y-4 pt-6 mt-4 border-t border-slate-100">
                {/* Add to Cart Button */}
                {SALES_OPEN ? (
                <button
                  onClick={handleAddToCart}
                  disabled={left <= 0}
                  className={`w-full py-4 font-extrabold shadow-xl flex items-center justify-center gap-2.5 transition-all duration-300 text-sm sm:text-base disabled:opacity-50 ${
                    addedToCart
                      ? "bg-versace-gold-500 text-versace-green-900 shadow-versace-gold-500/25"
                      : "bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50 shadow-versace-green-900/20"
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{t("added")}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>{left <= 0 ? t("sold_out") : `${t("add_to_cart")} • ₺${(product.price * quantity).toLocaleString("tr-TR")}`}</span>
                    </>
                  )}
                </button>
                ) : (
                  <div className="p-4 border border-versace-gold-500/40 bg-versace-gold-50 text-versace-green-900">
                    <p className="font-display text-xl">{t("sales_soon")}</p>
                    <p className="text-sm text-slate-600 mt-1">{t("sales_soon_product")}</p>
                  </div>
                )}

                {/* WhatsApp Contact */}
                <a
                  href={whatsappLink(product.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-2 transition-colors text-sm border border-emerald-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("hero_cta_whatsapp")}
                </a>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 text-xs text-slate-600 border border-slate-100">
                    <Truck className="w-4 h-4 text-versace-gold-700 flex-shrink-0" />
                    <span className="font-medium">{t("badge_shipping")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 text-xs text-slate-600 border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-versace-gold-700 flex-shrink-0" />
                    <span className="font-medium">{t("badge_silver")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 text-xs text-slate-600 border border-slate-100">
                    <Award className="w-4 h-4 text-versace-gold-700 flex-shrink-0" />
                    <span className="font-medium">{t("badge_silver_desc")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 text-xs text-slate-600 border border-slate-100">
                    <Package className="w-4 h-4 text-versace-gold-700 flex-shrink-0" />
                    <span className="font-medium">{t("badge_custom")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function GalleryArrows({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  className,
  nextClassName,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  className: string;
  nextClassName: string;
}) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <>
      <button
        type="button"
        aria-label={prevLabel}
        onClick={(e) => { stop(e); onPrev(); }}
        onPointerDown={stop}
        onPointerUp={stop}
        className={`showcase-arrow absolute top-1/2 -translate-y-1/2 ${className}`}
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        onClick={(e) => { stop(e); onNext(); }}
        onPointerDown={stop}
        onPointerUp={stop}
        className={`showcase-arrow absolute top-1/2 -translate-y-1/2 ${nextClassName}`}
      >
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </button>
    </>
  );
}
