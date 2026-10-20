"use client";

import React, { useEffect, useState } from "react";
import { imageAt } from "@/lib/image";
import { useCartStore } from "@/store/useCartStore";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  Truck,
  ChevronRight
} from "lucide-react";

export default function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    getTotalAmount, 
    getTotalItems 
  } = useCartStore();

  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted || !isRendered) return null;

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();

  const handleGoToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 rtl:left-0 rtl:right-auto flex max-w-full">
        {/* Drawer */}
        <div 
          className={`w-full max-w-md bg-white text-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out h-full ${
            isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">{t("cart_title")}</h2>
                <p className="text-xs text-slate-500">{totalItems} {t("product_count")}</p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-32 h-32 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-2 relative">
                  <ShoppingBag className="w-12 h-12" />
                  <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping absolute"></span>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full relative"></span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-xl">{t("cart_empty")}</h3>
                <p className="text-sm text-slate-500 max-w-[250px]">
                  {t("cart_empty_sub")}
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  {t("hero_cta_explore")}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item, index) => {
                  const product = translateProduct(item.product, language);
                  const hasImage = product.images && product.images.length > 0;
                  return (
                    <div key={item.cartItemId} className="group">
                      <div className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl transition-shadow hover:shadow-md hover:border-amber-100">
                        {/* Image */}
                        <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                          {hasImage ? (
                            <img
                              src={imageAt(product.images[0], 180)}
                              alt={product.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                              {t("no_image")}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight">
                                {product.title}
                              </h4>
                              <button
                                onClick={() => removeItem(item.cartItemId)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-1"
                                title={t("remove_item")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {item.selectedRingSize && (
                              <span className="inline-flex mt-2 text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                                {t("cart_ring_size")} {item.selectedRingSize}
                              </span>
                            )}
                          </div>

                          <div className="flex items-end justify-between mt-3">
                            <span className="font-bold text-slate-900 text-sm">
                              ₺{(item.product.price * item.quantity).toLocaleString("tr-TR")}
                            </span>

                            {/* Quantity Modifier */}
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-semibold text-slate-800 w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      {index < items.length - 1 && (
                        <div className="h-px bg-slate-100 w-full mt-6"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-white relative z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t("cart_subtotal")}</span>
                  <span className="font-medium text-slate-700">₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-500" /> {t("cart_shipping")}
                  </span>
                  <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs">{t("cart_free")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-lg pt-3 border-t border-slate-100">
                  <span>{t("cart_total")}</span>
                  <span className="text-amber-600">
                    ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoToCheckout}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm group"
              >
                <span>{t("cart_checkout")}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t("trust_3_title")} — SSL</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
