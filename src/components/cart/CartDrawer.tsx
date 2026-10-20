"use client";

import React, { useEffect, useState } from "react";
import { imageAt } from "@/lib/image";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/useCartStore";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Truck } from "lucide-react";

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
        className={`absolute inset-0 bg-versace-green-900/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 rtl:left-0 rtl:right-auto flex max-w-full">
        {/* Drawer */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("cart_title")}
          className={`w-screen max-w-md bg-[#fbfbf8] text-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out h-full ${
            isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-versace-green-900 bg-pattern-dark text-versace-gold-50 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl leading-none">{t("cart_title")}</h2>
              <p className="text-xs text-versace-gold-500 mt-1.5 tabular-nums">
                {totalItems} {t("product_count")}
              </p>
            </div>
            <button
              onClick={closeCart}
              aria-label={t("close")}
              className="p-2 -me-2 text-versace-gold-100/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-10 h-10 text-versace-gold-500" strokeWidth={1.25} />
                <h3 className="font-display text-2xl text-versace-green-900 mt-4">{t("cart_empty")}</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[260px]">{t("cart_empty_sub")}</p>
                <button
                  onClick={closeCart}
                  className="mt-8 px-8 py-3 bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50 text-sm font-semibold transition-colors"
                >
                  {t("hero_cta_explore")}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-versace-gold-100">
                {items.map((item) => {
                  const product = translateProduct(item.product, language);
                  const image = product.images?.[0];
                  return (
                    <li key={item.cartItemId} className="flex gap-4 py-5 first:pt-0">
                      <div className="w-20 h-20 bg-versace-green-900 overflow-hidden flex-shrink-0">
                        {image ? (
                          <img src={imageAt(image, 180)} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-versace-gold-100/60 text-[10px]">
                            {t("no_image")}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display text-base leading-snug text-versace-green-900 line-clamp-2">
                            {product.title}
                          </h4>
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="p-1 -me-1 text-slate-300 hover:text-red-600 transition-colors"
                            aria-label={t("remove_item")}
                            title={t("remove_item")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.selectedRingSize && (
                          <span className="mt-1 text-xs text-versace-gold-700">
                            {t("cart_ring_size")} {item.selectedRingSize}
                          </span>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border border-versace-gold-100">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              aria-label="−"
                              className="w-8 h-8 flex items-center justify-center text-versace-green-900 hover:bg-versace-gold-50 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold text-versace-green-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              aria-label="+"
                              className="w-8 h-8 flex items-center justify-center text-versace-green-900 hover:bg-versace-gold-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-semibold text-versace-green-900 tabular-nums">
                            ₺{formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="px-6 pt-5 pb-6 border-t border-versace-gold-100 bg-white">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>{t("cart_subtotal")}</dt>
                  <dd className="tabular-nums">₺{formatPrice(totalAmount)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-versace-gold-700" /> {t("cart_shipping")}
                  </dt>
                  <dd className="text-versace-green-700 font-semibold">{t("cart_free")}</dd>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-versace-gold-100">
                  <dt className="font-semibold text-versace-green-900">{t("cart_total")}</dt>
                  <dd className="font-display text-3xl text-versace-green-900 tabular-nums lining-nums">
                    ₺{formatPrice(totalAmount)}
                  </dd>
                </div>
              </dl>

              <button
                onClick={handleGoToCheckout}
                className="mt-5 w-full py-4 bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {t("cart_checkout")}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <p className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-versace-gold-700" />
                {t("trust_3_title")} — SSL
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
