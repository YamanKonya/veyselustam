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
  Sparkles,
  KeyRound
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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 flex-shrink-0">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl shadow-lg shadow-amber-600/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-100 tracking-tight text-base">Veysel Ustam</h2>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
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
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              Ürün & Katalog Yönetimi
            </Link>

            <Link
              href="/admin/orders"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/orders"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Sipariş Takibi
            </Link>

            <Link
              href="/admin/settings"
              className={`flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl transition ${
                pathname === "/admin/settings"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Giriş Bilgileri
            </Link>
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="border-t border-slate-800/80 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-200 truncate">{adminUsername}</p>
              <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-widest">Yönetici Modu</span>
            </div>
            <button
              onClick={adminLogout}
              title="Çıkış Yap"
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 font-medium transition py-2 rounded-xl bg-slate-950 border border-slate-800"
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
