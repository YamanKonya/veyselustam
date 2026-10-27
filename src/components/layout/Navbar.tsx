"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/layout/LanguageSelector";
import SocialIcons from "@/components/layout/SocialIcons";
import { whatsappLink } from "@/lib/contact";
import { SALES_OPEN } from "@/lib/shop";
import { MENUS, MenuId, openMenu, useMenuSettings } from "@/lib/menus";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, Search, Menu, X, Phone, UserRound, LogOut } from "lucide-react";

export default function Navbar() {
  const { toggleCart, getTotalItems } = useCartStore();
  const { t } = useLanguage();
  const router = useRouter();
  const { user, logout } = useAuth();
  const enabledMenus = useMenuSettings();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
  }, [mobileMenuOpen]);

  const totalItemsCount = mounted ? getTotalItems() : 0;
  const closeMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // page.tsx listens for this event and filters the collection
      window.dispatchEvent(new CustomEvent("global-search", { detail: searchQuery }));
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    }
  };

  const menus = MENUS.filter((m) => enabledMenus[m.id]);

  // On the home page filter in place; elsewhere go home with the menu in the URL.
  const goToMenu = (e: React.MouseEvent, id: MenuId) => {
    closeMenu();
    if (window.location.pathname === "/") {
      e.preventDefault();
      openMenu(id);
      history.replaceState(null, "", `/?menu=${id}#koleksiyon`);
      document.getElementById("koleksiyon")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const member = mounted && user;
  const accountButton = (
    <Link
      href={member ? "/account" : "/register"}
      className="flex flex-col items-center gap-1 text-versace-green-900 hover:text-versace-gold-700 transition-colors"
    >
      <UserRound className="w-6 h-6" />
      <span className="hidden lg:block text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap">
        {member ? t("nav_account") : t("nav_login")}
      </span>
    </Link>
  );

  const searchForm = (className: string) => (
    <form onSubmit={handleSearch} role="search" className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 absolute start-3 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("nav_search_ph")}
        aria-label={t("nav_search_ph")}
        className="w-full py-2.5 ps-9 pe-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-versace-gold-500 focus:bg-white transition-colors placeholder:text-slate-400"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-50 flex flex-col shadow-sm">
      {/* Top bar */}
      <div className="bg-versace-green-900 text-versace-gold-100 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <span className="hidden sm:block tracking-wide">{SALES_OPEN ? t("hero_badge") : t("sales_soon_banner")}</span>
          <div className="ms-auto">
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main header: search | logo | contact + cart */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto h-20 lg:h-28 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left: menu (mobile) / search (desktop) */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t("menu_title")}
              className="lg:hidden p-2 -ms-2 text-versace-green-900 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            {searchForm("hidden lg:flex w-full max-w-xs")}
          </div>

          {/* Center: logo + name */}
          <Link href="/" className="flex items-center gap-3 lg:gap-4 justify-self-center">
            <img
              src="/images/logo-256.webp"
              alt=""
              width={88}
              height={88}
              className="w-12 h-12 lg:w-[88px] lg:h-[88px] object-contain"
            />
            <span className="hidden sm:block">
              <span className="font-display font-medium text-2xl lg:text-[2.6rem] text-versace-green-900 tracking-[0.12em] block uppercase leading-none">
                {t("brand_name")}
              </span>
              <span className="text-[10px] lg:text-xs text-versace-gold-700 font-semibold uppercase tracking-[0.35em] block mt-2">
                {t("brand_sub")}
              </span>
            </span>
          </Link>

          {/* Right: social logos, member sign-in, cart */}
          <div className="flex items-center justify-end gap-5 lg:gap-7">
            <SocialIcons className="hidden md:flex lg:gap-4" iconClass="w-5 h-5 lg:w-[22px] lg:h-[22px]" />
            <span className="hidden md:block h-8 w-px bg-slate-200" aria-hidden="true" />
            {accountButton}
            {SALES_OPEN && (
            <button
              onClick={toggleCart}
              className="flex flex-col items-center gap-1 text-versace-green-900 hover:text-versace-gold-700 transition-colors"
              aria-label={t("nav_cart")}
            >
              <span className="relative">
                <ShoppingBag className="w-6 h-6" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -end-2 bg-versace-gold-500 text-versace-green-900 text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </span>
              <span className="hidden lg:block text-[11px] font-semibold uppercase tracking-wider">{t("nav_my_cart")}</span>
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Category bar (desktop) */}
      <div className="hidden lg:block bg-white border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8">
          {menus.map((m) => (
            <Link
              key={m.id}
              href={`/?menu=${m.id}#koleksiyon`}
              onClick={(e) => goToMenu(e, m.id)}
              className="py-3 text-xs font-semibold text-versace-green-900 hover:text-versace-gold-700 transition-colors tracking-widest uppercase border-b-2 border-transparent hover:border-versace-gold-700"
            >
              {t(m.key)}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 bg-versace-green-900/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
      />
      <div
        className={`fixed top-0 start-0 h-full w-4/5 max-w-sm bg-white shadow-2xl z-50 flex flex-col lg:hidden transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-versace-green-900 text-white">
          <div className="flex items-center gap-2">
            <img src="/images/logo-128.webp" alt="" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl">{t("menu_title")}</span>
          </div>
          <button onClick={closeMenu} aria-label={t("close")} className="p-2 text-versace-gold-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          {searchForm("w-full")}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 flex flex-col">
          {menus.map((m) => (
            <Link
              key={m.id}
              href={`/?menu=${m.id}#koleksiyon`}
              onClick={(e) => goToMenu(e, m.id)}
              className="p-4 text-sm font-semibold text-versace-green-900 border-b border-slate-50 hover:bg-slate-50"
            >
              {t(m.key)}
            </Link>
          ))}
          {member ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="p-4 text-sm font-semibold text-slate-500 border-b border-slate-50 hover:bg-slate-50 flex items-center gap-2 text-start"
            >
              <LogOut className="w-4 h-4" /> {t("nav_logout")}
            </button>
          ) : (
            <Link href="/register" onClick={closeMenu} className="p-4 text-sm font-semibold text-versace-gold-700 border-b border-slate-50 hover:bg-slate-50 flex items-center gap-2">
              <UserRound className="w-4 h-4" /> {t("nav_login")}
            </Link>
          )}
          <div className="px-4 pt-5 pb-1 flex items-center gap-3 text-xs text-slate-500">
            {t("social_follow")}
            <SocialIcons iconClass="w-6 h-6" />
          </div>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="m-4 py-3 flex items-center justify-center gap-2 bg-versace-green-900 text-versace-gold-50 text-sm font-semibold"
          >
            <Phone className="w-4 h-4" /> {t("nav_contact")}
          </a>
        </nav>
      </div>
    </header>
  );
}
