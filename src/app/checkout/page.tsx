"use client";

import React, { useState, useEffect } from "react";
import { imageAt } from "@/lib/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { usePrice } from "@/lib/currency";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import { placeOrderWithStock, OutOfStockError } from "@/services/stockService";
import { createOrder } from "@/services/orderService";
import { SALES_OPEN } from "@/lib/shop";
import { ShippingAddress, OrderItem } from "@/types";
import Link from "next/link";
import { 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Package,
  Lock
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getTotalAmount, clearCart } = useCartStore();
  const { t, language } = useLanguage();
  const { price, inTl, tl } = usePrice();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    setMounted(true);
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  if (!mounted) return null;

  const totalAmount = getTotalAmount();

  if (!SALES_OPEN) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <h1 className="font-display text-4xl text-versace-green-900">{t("sales_soon")}</h1>
          <p className="text-sm text-slate-600 mt-3 max-w-md">{t("sales_soon_checkout")}</p>
          <Link
            href="/"
            className="mt-8 px-8 py-3 bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50 text-sm font-semibold transition-colors"
          >
            {t("hero_cta_explore")}
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <CartDrawer />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{t("cart_empty")}</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            {t("cart_empty_sub")}
          </p>
          <Link
            href="/"
            className="px-8 py-3 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm shadow-lg transition-colors"
          >
            {t("hero_cta_explore")}
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.address.trim() || !formData.district.trim()) {
      setError(t("form_error_required"));
      return;
    }

    setLoading(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id || "",
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        ringSize: item.selectedRingSize,
        image: item.product.images?.[0] || "",
      }));

      const orderData = {
        userId: user?.uid || "guest_user",
        customerInfo: formData,
        items: orderItems,
        totalAmount: totalAmount,
        status: "pending" as const,
      };
      // Order and stock are written together; a sold-out case stops the order.
      // If the stock rules aren't published yet (permission-denied), still take
      // the order so sales never stop, just without the stock update.
      let newOrderId: string;
      try {
        newOrderId = await placeOrderWithStock(
          items.map((item) => ({ product: item.product, quantity: item.quantity })),
          orderData
        );
      } catch (err: any) {
        if (err?.code !== "permission-denied") throw err;
        console.warn("Stock rules not active; order saved without stock update", err);
        newOrderId = await createOrder(orderData);
      }

      clearCart();
      router.push(`/order-success/${newOrderId}`);
    } catch (err: any) {
      console.error(err);
      if (err instanceof OutOfStockError) {
        const line = items.find((i) => i.product.id === err.productId);
        const name = line ? translateProduct(line.product, language).title : "";
        setError(
          err.available > 0
            ? t("order_error_stock_low").replace("{name}", name).replace("{count}", String(err.available))
            : t("order_error_stock_out").replace("{name}", name)
        );
      } else {
        setError(t("order_error_generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col">
      <Navbar />
      <CartDrawer />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-amber-700 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t("nav_home")}
          </Link>
          <span>/</span>
          <span className="text-slate-400">{t("checkout_title")}</span>
        </nav>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-4">
          {[
            { step: 1, label: t("cart_title"), icon: ShoppingBag, done: true },
            { step: 2, label: t("checkout_title"), icon: MapPin, done: false, active: true },
            { step: 3, label: t("payment_method"), icon: CreditCard, done: false },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              {i > 0 && <div className={`h-px w-8 sm:w-16 ${s.done || s.active ? 'bg-amber-400' : 'bg-slate-200'}`} />}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.done ? 'bg-emerald-500 text-white' :
                  s.active ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {s.done ? <CheckCircle className="w-4 h-4" /> : s.step}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${s.active ? 'text-amber-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column: Form */}
          <div className="flex-1 w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-5 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                {t("checkout_title")}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {t("checkout_subtitle")}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2 animate-slideUp">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t("form_fullname")} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={t("form_fullname_ph")}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t("form_phone")} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t("form_phone_ph")}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t("email_label")} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@domain.com"
                    className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t("form_city")} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t("form_city_ph")}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t("district_label")} *
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t("form_address")} *
                </label>
                <textarea
                  name="address"
                  rows={3}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t("form_address_ph")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t("form_note")}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 rtl:right-3.5 rtl:left-auto top-3.5 text-slate-400" />
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={t("form_note_ph")}
                    className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2.5 transition-all text-sm sm:text-base disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t("submitting")}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t("complete_order")} • {tl(totalAmount)}</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {t("trust_3_title")} — SSL
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-96 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-5">
              <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>{t("order_items")}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {items.length} {t("product_count")}
                </span>
              </h3>

              {/* Item list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-none">
                {items.map((item) => {
                  const product = translateProduct(item.product, language);
                  return (
                    <div key={item.cartItemId} className="flex gap-3 text-xs">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={imageAt(product.images[0], 180)} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">{t("no_image")}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 line-clamp-1">{product.title}</p>
                      {item.selectedRingSize && (
                        <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                          {t("cart_ring_size")} {item.selectedRingSize}
                        </p>
                      )}
                      <p className="text-slate-500 mt-1">
                        {item.quantity} x {price(item.product.price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 flex-shrink-0">
                      {price(item.product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
              </div>

              {/* Calculations */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>{t("cart_subtotal")}</span>
                  <span>{price(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" /> {t("cart_shipping")}
                  </span>
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded">{t("cart_free")}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 text-lg pt-3 border-t border-slate-200">
                  <span>{t("cart_total")}</span>
                  <span className="bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                    {price(totalAmount)}
                  </span>
                </div>
                {!inTl && (
                  <p className="text-xs text-slate-500 text-end">{t("paid_in_try").replace("{amount}", tl(totalAmount))}</p>
                )}
              </div>
            </div>

            {/* Guarantees */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              {[
                { icon: Truck, text: t("trust_2_title"), color: "text-emerald-600" },
                { icon: ShieldCheck, text: t("trust_3_title"), color: "text-amber-600" },
                { icon: Package, text: t("trust_4_title"), color: "text-violet-600" },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-600">
                  <g.icon className={`w-4 h-4 ${g.color} flex-shrink-0`} />
                  <span className="font-medium">{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
