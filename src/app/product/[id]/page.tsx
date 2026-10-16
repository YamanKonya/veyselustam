"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import { Product } from "@/types";
import { getProductById } from "@/services/productService";
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
  MessageCircle
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

  useEffect(() => {
    if (id) {
      getProductById(id).then((data) => {
        setProduct(data);
        if (data) {
          addRecentItem(data);
          if (data.ringSize && data.ringSize.length > 0) {
            setSelectedRingSize(data.ringSize[0]);
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <CartDrawer />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-amber-600 animate-spin" />
          </div>
          <p className="text-sm font-medium text-slate-500">{t("loading_products")}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-amber-600 transition-colors"
          >
            {t("pd_back")}
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentMainImage = images[selectedImageIndex] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
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
            />
            {/* Watermark in zoom modal */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none drop-shadow-xl opacity-90">
              <img 
                src="/images/watermark.png" 
                alt="Veysel Ustam" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow" 
              />
            </div>
          </div>
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-sm transition z-20"
            onClick={(e) => { e.stopPropagation(); setImageZoom(false); }}
          >
            <AlertCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-amber-700 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t("nav_home")}
          </Link>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Product Detail Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Image Gallery */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 bg-slate-50/50">
              {/* Main Display Image */}
              <div
                className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200/50 relative group cursor-zoom-in"
                onClick={() => setImageZoom(true)}
              >
                {currentMainImage ? (
                  <img
                    src={currentMainImage}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    {t("no_image")}
                  </div>
                )}

                {/* Category badge */}
                <span className="absolute top-3 sm:top-4 left-3 rtl:right-3 rtl:left-auto sm:left-4 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-xl uppercase tracking-wider">
                  {product.category}
                </span>

                {/* Watermark / Filigran (Sağ Üst Köşe) */}
                <div className="absolute top-3 sm:top-4 right-3 rtl:left-3 rtl:right-auto sm:right-4 z-10 pointer-events-none drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                  <img 
                    src="/images/watermark.png" 
                    alt="Veysel Ustam" 
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow" 
                  />
                </div>

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
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                        selectedImageIndex === idx
                          ? "border-amber-600 ring-2 ring-amber-600/20 scale-105"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt={`Görsel ${idx + 1}`} className="w-full h-full object-cover" />
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
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Gem className="w-3 h-3" /> {t("pd_handmade_guarantee")}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {product.title}
                  </h1>
                </div>

                {/* Price & Stock */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-3 border-y border-slate-100">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                          ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          -%{product.discountPercent || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} {t("discount_label")}
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
                    <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                      ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  )}

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      product.stock > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {product.stock > 0 ? `${t("pd_in_stock")} (${product.stock})` : t("pd_out_of_stock")}
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("pd_desc_heading")}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description || "Veysel Usta el işçiliği özel tasarım ürün."}
                  </p>
                </div>

                {/* Ring Size Selection */}
                {product.ringSize && product.ringSize.length > 0 && (
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
                            className={`min-w-[44px] h-11 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center border ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/15 scale-105"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {sizeError && (
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {sizeError}
                      </p>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {t("quantity_label")}
                  </label>
                  <div className="flex items-center gap-1 w-fit border border-slate-200 rounded-xl p-1 bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-extrabold w-10 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Guarantees */}
              <div className="space-y-4 pt-6 mt-4 border-t border-slate-100">
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full py-4 font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all duration-300 text-sm sm:text-base disabled:opacity-50 ${
                    addedToCart
                      ? "bg-emerald-500 text-white shadow-emerald-500/25"
                      : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-600/25"
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
                      <span>{t("add_to_cart")} • ₺{(product.price * quantity).toLocaleString("tr-TR")}</span>
                    </>
                  )}
                </button>

                {/* WhatsApp Contact */}
                <a
                  href={`https://wa.me/905551234567?text=${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm border border-emerald-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("hero_cta_whatsapp")}
                </a>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">{t("badge_shipping")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-medium">{t("badge_silver")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium">{t("badge_silver_desc")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <Package className="w-4 h-4 text-violet-600 flex-shrink-0" />
                    <span className="font-medium">{t("badge_custom")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="text-xs font-bold text-slate-500">{t("brand_name")} © 2026</p>
          <p className="text-[11px] text-slate-600">{t("footer_sub")}</p>
        </div>
      </footer>
    </div>
  );
}
