"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/useCartStore";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/layout/LanguageSelector";
import { 
  ShoppingBag, 
  ShieldAlert, 
  LogOut, 
  User, 
  Search,
  Menu,
  X,
  Gem,
  Phone,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const { user, profile, isAdmin, logout, loading } = useAuth();
  const { toggleCart, getTotalItems } = useCartStore();
  const { t } = useLanguage();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const totalItemsCount = mounted ? getTotalItems() : 0;
  const closeMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Dispatch a custom event so page.tsx can listen, or use query params. 
      // For simplicity without changing Next.js routing structure drastically, we dispatch an event.
      window.dispatchEvent(new CustomEvent('global-search', { detail: searchQuery }));
      
      // If we are not on home, navigate there
      if (window.location.pathname !== '/') {
        router.push('/');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 flex flex-col shadow-sm">
      
      {/* 1. TOP BAR (Kosova Saat style dark top bar) */}
      <div className="bg-versace-green-900 text-versace-gold-100 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] sm:text-xs">
          <div className="hidden sm:flex items-center gap-4">
            <span className="uppercase tracking-widest font-light">{t("hero_badge")}</span>
          </div>
          <div className="flex items-center gap-4 justify-end w-full sm:w-auto">
            <Link href="https://wa.me/905555555555" target="_blank" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" />
              <span>{t("nav_contact")}</span>
            </Link>
            <div className="w-px h-3 bg-versace-gold/30"></div>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo, Search, User/Cart Actions) */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto h-24 sm:h-28 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group flex-shrink-0">
            <img 
              src="/images/logo.png" 
              alt="Veysel Ustam" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md" 
            />
            <div className="hidden sm:block">
              <span className="font-light text-2xl lg:text-3xl text-versace-green-900 tracking-[0.2em] block uppercase leading-none font-serif">
                {t("brand_name")}
              </span>
              <span className="text-[10px] lg:text-xs text-versace-gold-600 font-semibold uppercase tracking-[0.35em] block mt-1.5">
                {t("brand_sub")}
              </span>
            </div>
          </Link>

          {/* Search Bar (Centered, wide like Kosova Saat) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="w-full relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nav_search_ph")}
                className="w-full py-2.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-none text-sm focus:outline-none focus:border-versace-gold transition-colors placeholder:text-slate-400"
              />
              <button type="submit" className="absolute right-0 top-0 bottom-0 px-4 bg-versace-gold text-white hover:bg-versace-gold-700 transition-colors flex items-center justify-center">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Desktop User/Cart Actions */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            {loading ? (
              <div className="hidden sm:block w-16 h-6 bg-slate-100 animate-pulse rounded-md" />
            ) : user ? (
              <div className="hidden lg:flex items-center gap-4">
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-versace-gold-700 hover:text-versace-green-900 transition-colors uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    {t("nav_admin")}
                  </Link>
                )}
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-versace-green-900 truncate max-w-[120px]">{user.email?.split("@")[0]}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest">{profile?.role || t("nav_user")}</span>
                </div>
                <button onClick={logout} title={t("nav_logout")} className="text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-4">
                <Link href="/login" className="flex flex-col items-center gap-1 text-slate-600 hover:text-versace-gold-700 transition-colors group">
                  <User className="w-5 h-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider group-hover:text-versace-gold-700">{t("nav_login")}</span>
                </Link>
              </div>
            )}
            
            {/* Cart Button */}
            <button 
              onClick={toggleCart} 
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-versace-gold-700 transition-colors relative group ml-2 sm:ml-0" 
              title={t("nav_cart")}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-versace-green-900 text-versace-gold-100 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider group-hover:text-versace-gold-700">{t("nav_my_cart")}</span>
            </button>

          </div>
        </div>
      </div>

      {/* 3. MEGA MENU / NAVIGATION BAR (Desktop Only) */}
      <div className="hidden lg:block bg-white border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8">
          {[
            { label: t("cat_el_oymasi"), link: "/#koleksiyon" },
            { label: t("cat_dogal_tasli"), link: "/#koleksiyon" },
            { label: t("cat_gumuse_oyma"), link: "/#koleksiyon" },
            { label: t("cat_mineli_yuzukler"), link: "/#koleksiyon" },
            { label: t("cat_ozel_siparis"), link: "/#koleksiyon" },
          ].map((item, idx) => (
            <div key={idx} className="group relative">
              <Link 
                href={item.link} 
                className="flex items-center gap-1 py-4 text-xs font-semibold text-versace-green-900 hover:text-versace-gold-700 transition-colors tracking-widest uppercase border-b-2 border-transparent hover:border-versace-gold-700"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Slide-in Drawer overlay */}
      <div 
        className={`fixed inset-0 bg-versace-green-900/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} 
        onClick={closeMenu}
      />

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-2xl z-50 flex flex-col lg:hidden transition-transform duration-300 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-versace-green-900 text-white">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Veysel Ustam" className="w-8 h-8 object-contain" />
            <span className="font-light tracking-widest uppercase">{t("menu_title")}</span>
          </div>
          <button onClick={closeMenu} className="p-2 text-versace-gold-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <form onSubmit={(e) => { handleSearch(e); closeMenu(); }} className="w-full relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("nav_search_ph")}
              className="w-full py-2 pl-4 pr-10 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-versace-gold"
            />
            <button type="submit" className="absolute right-0 top-0 bottom-0 px-3 text-versace-gold-700">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Menu Categories */}
          <div className="flex flex-col">
            {[t("cat_el_oymasi"), t("cat_dogal_tasli"), t("cat_gumuse_oyma"), t("cat_mineli_yuzukler"), t("cat_ozel_siparis")].map((item, idx) => (
              <Link 
                key={idx}
                href="/#koleksiyon"
                onClick={closeMenu}
                className="p-4 text-xs font-semibold text-versace-green-900 border-b border-slate-50 uppercase tracking-widest hover:bg-slate-50"
              >
                {item}
              </Link>
            ))}
          </div>
          
          <div className="h-px bg-slate-100 my-4" />

          {/* User Section */}
          <div className="px-4 flex flex-col gap-2">
            {loading ? (
              <div className="w-full h-10 bg-slate-100 animate-pulse" />
            ) : user ? (
              <>
                <div className="p-3 bg-slate-50 border border-slate-100 flex flex-col mb-2">
                  <span className="text-xs font-bold text-versace-green-900">{user.email}</span>
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={closeMenu} className="flex items-center gap-3 p-3 bg-versace-gold/10 text-versace-gold-700 font-semibold uppercase tracking-wider text-xs">
                    <ShieldAlert className="w-4 h-4" /> {t("nav_admin")}
                  </Link>
                )}
                <button onClick={() => { logout(); closeMenu(); }} className="flex items-center gap-3 p-3 text-red-600 font-semibold uppercase tracking-wider text-xs text-left">
                  <LogOut className="w-4 h-4" /> {t("nav_logout")}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={closeMenu} className="w-full py-3 px-4 text-center text-xs font-semibold text-versace-green-900 border border-versace-green-900 uppercase tracking-widest">{t("nav_login")}</Link>
                <Link href="/register" onClick={closeMenu} className="w-full py-3 px-4 text-center text-xs font-semibold text-white bg-versace-green-900 uppercase tracking-widest">{t("nav_register")}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
