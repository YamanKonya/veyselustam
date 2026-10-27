"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminLogin from "@/components/admin/AdminLogin";
import {
  Package,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  KeyRound,
  Boxes,
  BarChart3,
  MessageSquareQuote,
  LayoutList
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, adminChecked, adminUsername, adminLogout } = useAuth();
  const pathname = usePathname();

  if (!adminChecked) return <div className="min-h-screen bg-versace-green-900" />;
  if (!isAdmin) return <AdminLogin />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-panel-950 text-panel-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-panel-900 bg-pattern-dark border-r border-panel-800 flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-3 mb-8">
            <img src="/images/logo-128.webp" alt="" className="w-12 h-12 object-contain rounded-full bg-white p-0.5 ring-1 ring-brass-500/50" />
            <div>
              <h2 className="font-display text-xl text-panel-50 leading-none">Veysel Ustam</h2>
              <span className="text-xs text-brass-400 font-semibold flex items-center gap-1">
                Yönetici Paneli
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <Package className="w-4 h-4" />
              Ürün & Katalog Yönetimi
            </Link>

            <Link
              href="/admin/orders"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/orders"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Sipariş Takibi
            </Link>

            <Link
              href="/admin/analytics"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/analytics"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Ziyaretler
            </Link>

            <Link
              href="/admin/reviews"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/reviews"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <MessageSquareQuote className="w-4 h-4" />
              Yorumlar
            </Link>

            <Link
              href="/admin/menus"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/menus"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Menüler
            </Link>

            <Link
              href="/admin/stock"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/stock"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <Boxes className="w-4 h-4" />
              Kasa Stokları
            </Link>

            <Link
              href="/admin/settings"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/settings"
                  ? "bg-brass-600 text-white shadow-lg shadow-brass-600/20"
                  : "text-panel-400 hover:bg-panel-800 hover:text-panel-200"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Giriş Bilgileri
            </Link>
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="border-t border-panel-800/80 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-panel-200 truncate">{adminUsername}</p>
              <span className="text-[10px] text-brass-400 font-mono font-bold uppercase tracking-widest">Yönetici Modu</span>
            </div>
            <button
              onClick={adminLogout}
              title="Çıkış Yap"
              className="p-2 hover:bg-panel-800 text-panel-400 hover:text-white rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-panel-400 hover:text-brass-400 font-medium transition py-2 rounded-xl bg-panel-950 border border-panel-800"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Mağazaya Geri Dön
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
