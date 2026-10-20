"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/layout/SiteFooter";
import ShowcaseSlider from "@/components/home/ShowcaseSlider";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { useCartStore } from "@/store/useCartStore";
import { useRecentStore } from "@/store/useRecentStore";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import { ChevronUp, X } from "lucide-react";
import { imageAt, imageSrcSet } from "@/lib/image";

import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";

const PAGE_SIZE = 12;
const SHOWCASE_SIZE = 10;

// Banner → category match (by keyword, so renamed categories still resolve)
const BANNERS = [
  { titleKey: "banner_craft_title", descKey: "banner_craft_desc", match: ["nakkaş", "gümüş yüzük", "el yapımı gümüş"] },
  { titleKey: "banner_stone_title", descKey: "banner_stone_desc", match: ["akik"] },
  { titleKey: "banner_custom_title", descKey: "banner_custom_desc", match: ["özel yapım"] },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [globalSearch, setGlobalSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<{ label: string; match: string[] } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("tab_new");
  const tabs = ["tab_new", "tab_bestseller", "tab_collection"];

  const { addItem } = useCartStore();
  const { recentItems } = useRecentStore();

  const [mounted, setMounted] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for global search events from Navbar
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      setGlobalSearch((e as CustomEvent<string>).detail || "");
      setCategoryFilter(null);
      document.getElementById("koleksiyon")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("global-search", handleGlobalSearch);
    return () => window.removeEventListener("global-search", handleGlobalSearch);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeProducts((updatedProducts) => {
      if (updatedProducts && updatedProducts.length > 0) {
        setProducts(updatedProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const localizedProducts = useMemo(() => {
    const activeOnly = products.filter((p) => p.isActive !== false);
    return activeOnly.map((p) => translateProduct(p, language));
  }, [products, language]);

  // Vitrin: featured pieces first, topped up with the newest pieces that have photos
  const showcaseProducts = useMemo(() => {
    const withImage = localizedProducts.filter((p) => p.images?.length);
    const featured = withImage.filter((p) => p.isFeatured);
    const time = (p: Product) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);
    const newest = withImage.filter((p) => !p.isFeatured).sort((a, b) => time(b) - time(a));
    return [...featured, ...newest].slice(0, Math.max(SHOWCASE_SIZE, featured.length));
  }, [localizedProducts]);

  // Banner photos come from the shop's own products in each category
  const bannerImages = useMemo(
    () =>
      BANNERS.map((b, i) => {
        const hit = localizedProducts.find(
          (p) => p.images?.length && b.match.some((m) => (products.find((o) => o.id === p.id)?.category || "").toLocaleLowerCase("tr").includes(m))
        );
        return hit?.images[0] || localizedProducts[i]?.images?.[0];
      }),
    [localizedProducts, products]
  );

  const filteredProducts = useMemo(() => {
    let filtered = localizedProducts;

    if (globalSearch) {
      const q = globalSearch.toLocaleLowerCase("tr");
      filtered = filtered.filter(
        (p) => p.title.toLocaleLowerCase("tr").includes(q) || p.description.toLocaleLowerCase("tr").includes(q)
      );
    } else {
      if (categoryFilter) {
        filtered = filtered.filter((p) => {
          const raw = (products.find((o) => o.id === p.id)?.category || "").toLocaleLowerCase("tr");
          return categoryFilter.match.some((m) => raw.includes(m));
        });
      }
      if (activeTab === "tab_new") {
        // Newest first by date added (the list's own order differs between the
        // local catalogue and Firestore, so don't rely on it)
        const time = (p: Product) => (p.createdAt ? Date.parse(p.createdAt) || 0 : 0);
        filtered = [...filtered].sort((a, b) => time(b) - time(a));
      } else if (activeTab === "tab_bestseller") {
        filtered = [...filtered].sort((a, b) => b.price - a.price);
      }
    }

    // Featured pieces always lead the list
    return [...filtered].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  }, [localizedProducts, products, globalSearch, activeTab, categoryFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [globalSearch, activeTab, categoryFilter]);

  const handleAddToCart = useCallback((product: Product, size: string) => {
    addItem(product, size, 1);
    setAddedToCart(product.id || null);
    setTimeout(() => setAddedToCart(null), 1500);
  }, [addItem]);

  const openCategory = (banner: (typeof BANNERS)[number]) => {
    setGlobalSearch("");
    setCategoryFilter({ label: t(banner.titleKey), match: banner.match });
    document.getElementById("koleksiyon")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col">
      <Navbar />
      <CartDrawer />

      <main className="flex-1">
        <h1 className="sr-only">{t("brand_name")}: {t("hero_badge")}</h1>

        {/* 1. VİTRİN */}
        <ShowcaseSlider products={showcaseProducts} />

        {/* 2. CATEGORY BANNERS */}
        <section className="grid grid-cols-1 md:grid-cols-3">
          {BANNERS.map((banner, i) => (
            <button
              key={banner.titleKey}
              type="button"
              onClick={() => openCategory(banner)}
              className="group relative h-[280px] sm:h-[380px] overflow-hidden bg-versace-green-900 flex items-end text-start"
            >
              {bannerImages[i] && (
                <img
                  src={imageAt(bannerImages[i], 720)}
                  srcSet={imageSrcSet(bannerImages[i], [540, 720, 1080])}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-versace-green-900/95 via-versace-green-900/30 to-transparent" />
              <div className="relative p-6 sm:p-8">
                <h2 className="font-display text-3xl text-white">{t(banner.titleKey)}</h2>
                <p className="mt-1 text-sm text-versace-gold-100/80">{t(banner.descKey)}</p>
                <span className="mt-4 inline-block h-px w-10 bg-versace-gold-500 transition-all duration-500 group-hover:w-20" />
              </div>
            </button>
          ))}
        </section>

        {/* 3. COLLECTION */}
        <section id="koleksiyon" className="scroll-mt-48 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
          {globalSearch ? (
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl text-versace-green-900">{t("search_results")}</h2>
                <p className="text-slate-500 mt-2">
                  {t("search_results_for").replace("{query}", globalSearch).replace("{count}", filteredProducts.length.toString())}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGlobalSearch("")}
                className="inline-flex items-center gap-1.5 text-sm text-versace-green-900 hover:text-versace-gold-700"
              >
                <X className="w-4 h-4" /> {t("search_clear")}
              </button>
            </div>
          ) : (
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200">
              <div role="tablist" className="flex items-center gap-8 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-display text-2xl whitespace-nowrap border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? "border-versace-gold-500 text-versace-green-900"
                        : "border-transparent text-slate-400 hover:text-versace-green-700"
                    }`}
                  >
                    {t(tab)}
                  </button>
                ))}
              </div>
              <div className="pb-4 flex items-center gap-3 text-sm text-slate-500">
                {categoryFilter && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700"
                  >
                    {categoryFilter.label} <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="tabular-nums">
                  {filteredProducts.length} {t("product_count")}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
            {filteredProducts.slice(0, visibleCount).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdded={addedToCart === product.id}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500">{t("search_no_results")}</div>
          )}

          {visibleCount < filteredProducts.length && (
            <div className="mt-14 flex flex-col items-center gap-3">
              <p dir="ltr" className="text-sm text-slate-500 tabular-nums">
                {visibleCount} / {filteredProducts.length}
              </p>
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-10 py-3.5 border border-versace-green-900 text-versace-green-900 text-sm font-semibold hover:bg-versace-green-900 hover:text-versace-gold-50 transition-colors"
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </section>

        {/* 4. RECENTLY VIEWED */}
        {mounted && recentItems && recentItems.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
            <h2 className="font-display text-3xl text-versace-green-900 mb-8">{t("recent_products")}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {recentItems.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={translateProduct(product, language)}
                  isAdded={addedToCart === product.id}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. SEO TEXT */}
        <section className="bg-versace-gold-50 border-t border-versace-gold-100 py-14">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl text-versace-green-900 mb-4">{t("seo_title")}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{t("seo_desc")}</p>
          </div>
        </section>
      </main>

      <SiteFooter />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 end-6 z-40 w-12 h-12 bg-versace-green-900 hover:bg-versace-gold-500 text-versace-gold-50 hover:text-versace-green-900 shadow-xl flex items-center justify-center transition-colors animate-fadeIn"
          aria-label={t("scroll_top")}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
