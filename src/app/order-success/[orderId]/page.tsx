"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Order } from "@/types";
import { getOrderById } from "@/services/orderService";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { 
  CheckCircle2, 
  Package, 
  MapPin, 
  Calendar, 
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const { t } = useLanguage();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId).then((data) => {
        setOrder(data);
        setLoading(false);
      });
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium text-slate-500">{t("submitting")}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="w-12 h-12 text-slate-400 mb-2" />
          <h2 className="text-xl font-bold text-slate-800">{t("no_products_found")}</h2>
          <p className="text-xs text-slate-500 mb-6">{t("no_products_desc")}</p>
          <Link href="/" className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold">
            {t("go_home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        {/* Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              {t("order_success_title")}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              {order.customerInfo.fullName}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {t("order_success_sub")}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-mono text-slate-700">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{t("order_id_label")} <strong>{order.id}</strong></span>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
          <h2 className="font-extrabold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            {t("order_customer_info")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Customer Shipping Address */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] text-amber-800 mb-1">
                {t("checkout_title")}
              </span>
              <p className="font-semibold text-slate-900">{order.customerInfo.fullName}</p>
              <p className="text-slate-600">{order.customerInfo.phone}</p>
              <p className="text-slate-600">{order.customerInfo.email}</p>
              <p className="text-slate-600 mt-2">
                {order.customerInfo.address}, {order.customerInfo.district} / {order.customerInfo.city}
              </p>
            </div>

            {/* Status & Timing */}
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] text-amber-800 mb-1">
                {t("order_status_label")}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 font-bold capitalize">
                  {order.status === "pending" ? t("status_pending") : order.status}
                </span>
              </div>
              <p className="text-slate-500 mt-2">
                Tarih: {new Date(order.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{t("order_items")}</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      {item.ringSize && (
                        <span className="text-[10px] text-amber-800 font-medium">{t("cart_ring_size")} {item.ringSize}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <p className="text-slate-500">{item.quantity} {t("quantity_label")}</p>
                    <p className="font-bold text-slate-900">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-base font-extrabold">
            <span className="text-slate-900">{t("cart_total")}</span>
            <span className="text-amber-800 text-xl">
              ₺{order.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-md transition"
            >
              <span>{t("go_home")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
