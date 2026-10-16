"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import { Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { useCartStore } from "@/store/useCartStore";
import { useRecentStore } from "@/store/useRecentStore";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Award,
  Eye,
  Tag,
  Heart,
  Star,
  ArrowRight,
  Phone,
  Instagram,
  MessageCircle,
  ChevronUp,
  Gem,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";

export default function Home() {
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [loading, setLoading] = useState(false);
  
  // Global search from Navbar
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Tabbed Products State
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState("YENİ ÜRÜNLER");
  const tabs = [t("tab_new"), t("tab_bestseller"), t("tab_collection")];

  useEffect(() => {
    setActiveTab(t("tab_new"));
  }, [t]);


  const { addItem, items } = useCartStore();
  const { recentItems } = useRecentStore();

  const [mounted, setMounted] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for global search events from Navbar
  useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setGlobalSearch(e.detail || "");
      // Scroll to products if search is triggered
      document.getElementById("koleksiyon")?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("global-search", handleGlobalSearch);
    return () => window.removeEventListener("global-search", handleGlobalSearch);
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts((updatedProducts) => {
      if (updatedProducts && updatedProducts.length > 0) {
        setProducts(updatedProducts);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const localizedProducts = useMemo(() => {
    // Only show active products (isActive !== false)
    const activeOnly = products.filter((p) => p.isActive !== false);
    return activeOnly.map((p) => translateProduct(p, language));
  }, [products, language]);

  // Filter products based on search and active tab, prioritizing featured products
  const filteredProducts = useMemo(() => {
    let filtered = localizedProducts;

    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    } else {
      if (activeTab === t("tab_new")) {
        filtered = [...localizedProducts].reverse();
      } else if (activeTab === t("tab_bestseller")) {
        filtered = [...localizedProducts].sort((a, b) => b.price - a.price);
      } else if (activeTab === t("tab_collection")) {
        filtered = [...localizedProducts];
      }
    }

    // Vitrin (Featured) ürünlerini her zaman en önde göster
    return [...filtered].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [localizedProducts, globalSearch, activeTab]);

  const handleAddToCart = useCallback((product: Product, size: string) => {
    addItem(product, size, 1);
    setAddedToCart(product.id || null);
    setTimeout(() => setAddedToCart(null), 1500);
  }, [addItem]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextSlide = () => setCurrentSlide(s => (s === 2 ? 0 : s + 1));
  const prevSlide = () => setCurrentSlide(s => (s === 0 ? 2 : s - 1));

  // Auto slide
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <Navbar />
      <CartDrawer />

      {/* 1. HERO SLIDER (Kosova Saat Style wide banner) */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden bg-versace-green-900">
        
        {/* Slide 1 */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 0 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-versace-green-900 to-transparent z-10" />
          {/* We would use an actual image here, but using a CSS background for structure */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599643478524-fb66f70a0066?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60" />
          <div className="relative z-20 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-start text-white w-full">
            <span className="text-versace-gold-500 font-semibold tracking-[0.3em] uppercase text-xs mb-4">{t("hero_slide1_badge")}</span>
            <h1 className="text-4xl sm:text-6xl font-light tracking-widest uppercase leading-tight max-w-xl" dangerouslySetInnerHTML={{__html: t("hero_slide1_title").replace("Gümüş Yüzükler", '<strong class="font-bold text-versace-gold">Gümüş Yüzükler</strong>').replace("Silver Rings", '<strong class="font-bold text-versace-gold">Silver Rings</strong>').replace("خواتم فضة", '<strong class="font-bold text-versace-gold">خواتم فضة</strong>')}} />
            <p className="mt-4 text-sm sm:text-base text-versace-green-100/90 font-light max-w-lg leading-relaxed hidden sm:block">{t("hero_slide1_desc")}</p>
            <button className="mt-8 px-8 py-3 bg-white text-versace-green-900 text-xs font-semibold uppercase tracking-widest hover:bg-versace-gold hover:text-white transition-colors">
              {t("hero_slide1_btn")}
            </button>
          </div>
        </div>

        {/* Slide 2 */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === 1 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-versace-green-900 to-transparent z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60" />
          <div className="relative z-20 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-start text-white w-full">
            <span className="text-versace-gold-500 font-semibold tracking-[0.3em] uppercase text-xs mb-4">{t("hero_slide2_badge")}</span>
            <h1 className="text-4xl sm:text-6xl font-light tracking-widest uppercase leading-tight max-w-xl" dangerouslySetInnerHTML={{__html: t("hero_slide2_title").replace("Akik ve Zümrüt", '<strong class="font-bold text-versace-gold">Akik ve Zümrüt</strong>').replace("Agate & Emerald", '<strong class="font-bold text-versace-gold">Agate & Emerald</strong>').replace("عقيق أصلي وزمرد", '<strong class="font-bold text-versace-gold">عقيق أصلي وزمرد</strong>')}} />
            <p className="mt-4 text-sm sm:text-base text-versace-green-100/90 font-light max-w-lg leading-relaxed hidden sm:block">{t("hero_slide2_desc")}</p>
            <button className="mt-8 px-8 py-3 bg-white text-versace-green-900 text-xs font-semibold uppercase tracking-widest hover:bg-versace-gold hover:text-white transition-colors">
              {t("hero_slide2_btn")}
            </button>
          </div>
        </div>

        {/* Slide Controls */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-versace-green-900 transition-colors border border-white/20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-versace-green-900 transition-colors border border-white/20">
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* THREE BANNERS SECTION */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <Link href="#koleksiyon" className="group relative h-[300px] sm:h-[400px] overflow-hidden bg-slate-100 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605100804763-247f6612d597?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="relative z-20 w-10/12 max-w-[280px] mb-8 bg-white text-center py-6 shadow-sm border-b-2 border-transparent transition-colors group-hover:border-versace-gold">
              <h3 className="text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-slate-900 mb-1">{t("banner_craft_title")}</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase">{t("banner_craft_desc")}</p>
            </div>
          </Link>
          <Link href="#koleksiyon" className="group relative h-[300px] sm:h-[400px] overflow-hidden bg-slate-100 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620656798363-2a4b882da083?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="relative z-20 w-10/12 max-w-[280px] mb-8 bg-white text-center py-6 shadow-sm border-b-2 border-transparent transition-colors group-hover:border-versace-gold">
              <h3 className="text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-slate-900 mb-1">{t("banner_stone_title")}</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase">{t("banner_stone_desc")}</p>
            </div>
          </Link>
          <Link href="#koleksiyon" className="group relative h-[300px] sm:h-[400px] overflow-hidden bg-slate-100 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="relative z-20 w-10/12 max-w-[280px] mb-8 bg-white text-center py-6 shadow-sm border-b-2 border-transparent transition-colors group-hover:border-versace-gold">
              <h3 className="text-sm sm:text-base font-bold tracking-[0.2em] uppercase text-slate-900 mb-1">{t("banner_custom_title")}</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase">{t("banner_custom_desc")}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. TABBED PRODUCTS GRID */}
      <section id="koleksiyon" className="max-w-7xl mx-auto px-4 py-8 sm:py-16 w-full">
        {globalSearch ? (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light tracking-widest uppercase text-versace-green-900">{t("search_results")}</h2>
            <p className="text-slate-500 mt-2">{t("search_results_for").replace("{query}", globalSearch).replace("{count}", filteredProducts.length.toString())}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-10">
            {/* Tabs */}
            <div className="flex items-center gap-6 sm:gap-12 overflow-x-auto w-full justify-start sm:justify-center border-b border-slate-200 pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all whitespace-nowrap border-b-2 ${
                    activeTab === tab
                      ? "border-versace-gold text-versace-green-900"
                      : "border-transparent text-slate-400 hover:text-versace-gold-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-3">
              {filteredProducts.length} {t("product_count") || "Ürün"}
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product, index) => {
            const hasImage = product.images && product.images.length > 0;
            const isAddedToCart = addedToCart === product.id;
            const defaultRingSize = product.ringSize && product.ringSize.length > 0 ? product.ringSize[0] : "";

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  {hasImage ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                      {t("no_image")}
                    </div>
                  )}

                  {/* Vitrin Rozeti (Sol Üst Köşe) */}
                  {product.isFeatured && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-lg flex items-center gap-1 border border-amber-300">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>VİTRİN</span>
                    </div>
                  )}

                  {/* Watermark / Filigran (Sağ Üst Köşe) */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 pointer-events-none opacity-95 group-hover:opacity-100 transition-opacity">
                    <img 
                      src="/images/watermark.png" 
                      alt="Veysel Ustam" 
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" 
                    />
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className="absolute inset-x-4 bottom-4 bg-versace-green-900/95 backdrop-blur text-versace-gold-500 py-2.5 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-versace-green-900 z-20"
                  >
                    <Eye className="w-4 h-4" /> {t("btn_inspect")}
                  </Link>
                </div>

                {/* Body Content */}
                <div className="pt-3 pb-1 flex-1 flex flex-col justify-between text-left">
                  <div className="mb-2">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm hover:text-versace-green-900 transition line-clamp-2 leading-snug">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Price & Discount Row */}
                  <div className="flex items-center gap-3 mb-4 mt-auto">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs tracking-tight">
                        %{product.discountPercent || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}
                      </div>
                    )}
                    
                    <div className="flex flex-col justify-center">
                      {product.originalPrice && product.originalPrice > product.price ? (
                        <>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-medium leading-none mb-0.5">
                            ₺{product.originalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                            ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button (Full width dark green) */}
                  <button
                    onClick={() => handleAddToCart(product, defaultRingSize)}
                    className="w-full py-2.5 sm:py-3 bg-[#1B3224] hover:bg-[#122419] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl sm:rounded-2xl transition-colors duration-300"
                  >
                    {isAddedToCart ? t("added") : t("btn_add_to_cart")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {t("search_no_results")}
          </div>
        )}
      </section>

      {/* SEO Text Area (Kosova Saat Style) */}
      <section className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-lg font-light tracking-widest uppercase text-versace-green-900 mb-4">{t("seo_title")}</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-4xl mx-auto font-light">
            {t("seo_desc")}
          </p>
        </div>
      </section>

      {/* RECENTLY VIEWED PRODUCTS */}
      {mounted && recentItems && recentItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 w-full border-t border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-light tracking-widest uppercase text-versace-green-900">{t("recent_products")}</h2>
            <div className="mt-4 mx-auto w-12 h-px bg-versace-gold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {recentItems.slice(0, 3).map((product) => {
              const hasImage = product.images && product.images.length > 0;
              const isAddedToCart = addedToCart === product.id;
              const defaultRingSize = product.ringSize && product.ringSize.length > 0 ? product.ringSize[0] : "";

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    {hasImage ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">{t("no_image")}</div>
                    )}

                    {/* Watermark / Filigran (Sağ Üst Köşe) */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 pointer-events-none opacity-95 group-hover:opacity-100 transition-opacity">
                      <img 
                        src="/images/watermark.png" 
                        alt="Veysel Ustam" 
                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" 
                      />
                    </div>

                    <Link href={`/product/${product.id}`} className="absolute inset-x-4 bottom-4 bg-versace-green-900/95 backdrop-blur text-versace-gold-500 py-2.5 text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-versace-green-900 z-20">
                      <Eye className="w-4 h-4" /> İncele
                    </Link>
                  </div>
                  {/* Body Content */}
                  <div className="pt-3 pb-1 flex-1 flex flex-col justify-between text-left">
                    <div className="mb-2">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm hover:text-versace-green-900 transition line-clamp-2 leading-snug">{product.title}</h3>
                      </Link>
                    </div>
                    {/* Price & Discount Row */}
                    <div className="flex items-center gap-3 mb-4 mt-auto">
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs tracking-tight">
                          %{product.discountPercent || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}
                        </div>
                      )}
                      <div className="flex flex-col justify-center">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-medium leading-none mb-0.5">₺{product.originalPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </div>
                    {/* Add to Cart Button */}
                    <button onClick={() => handleAddToCart(product, defaultRingSize)} className="w-full py-2.5 sm:py-3 bg-[#1B3224] hover:bg-[#122419] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl sm:rounded-2xl transition-colors duration-300">
                      {isAddedToCart ? t("added") : "SEPETE EKLE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. FOOTER (4 Column Kosova Saat Style) */}
      <footer className="bg-versace-green-900 text-versace-gold-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-versace-gold/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            
            {/* Col 1: Kurumsal */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-versace-gold-500 tracking-[0.2em] uppercase">{t("footer_corp_title")}</h4>
              <div className="flex flex-col gap-3">
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_corp_about")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_corp_customer")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_corp_faq")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_corp_privacy")}</Link>
              </div>
            </div>

            {/* Col 2: Alışveriş */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-versace-gold-500 tracking-[0.2em] uppercase">{t("footer_shopping_title")}</h4>
              <div className="flex flex-col gap-3">
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_shopping_distance")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_shopping_delivery")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_shopping_warranty")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_shopping_bank")}</Link>
              </div>
            </div>

            {/* Col 3: Üyelik */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-versace-gold-500 tracking-[0.2em] uppercase">{t("footer_membership_title")}</h4>
              <div className="flex flex-col gap-3">
                <Link href="/login" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_membership_new")}</Link>
                <Link href="/login" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_membership_login")}</Link>
                <Link href="/login" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_membership_forgot")}</Link>
                <Link href="/" className="text-xs text-versace-green-100/70 hover:text-versace-gold transition uppercase tracking-widest">{t("footer_membership_track")}</Link>
              </div>
            </div>

            {/* Col 4: İletişim */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-versace-gold-500 tracking-[0.2em] uppercase">{t("footer_contact_title")}</h4>
              <div className="flex flex-col gap-4">
                <p className="text-xs text-versace-green-100/70 font-light leading-relaxed">
                  {t("footer_contact_desc")}
                </p>
                <a href="tel:+905551234567" className="text-sm text-versace-gold hover:text-white transition font-semibold tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4" /> 0555 123 45 67
                </a>
                <a href="https://wa.me/905551234567" target="_blank" rel="noopener noreferrer" className="text-xs text-versace-green-100/70 hover:text-white transition flex items-center gap-2 uppercase tracking-widest">
                  <MessageCircle className="w-4 h-4" /> {t("nav_whatsapp_support")}
                </a>
                <a href="https://instagram.com/veyselustam" target="_blank" rel="noopener noreferrer" className="text-xs text-versace-green-100/70 hover:text-white transition flex items-center gap-2 uppercase tracking-widest">
                  <Instagram className="w-4 h-4" /> @veyselustam
                </a>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-versace-gold/10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-4 text-versace-gold-500">
              <img src="/images/logo.png" alt="Veysel Ustam" className="w-20 h-20 sm:w-24 sm:h-24 object-contain brightness-110 drop-shadow-md" />
              <div>
                <span className="font-light tracking-[0.2em] uppercase text-2xl text-white block">Veysel Ustam</span>
                <span className="text-[11px] text-versace-gold-500 font-semibold uppercase tracking-[0.35em] block mt-1">KAPALIÇARŞI İSTANBUL</span>
              </div>
            </div>
            <p className="text-[10px] text-versace-green-100/50 uppercase tracking-[0.1em]">{t("footer_rights")}</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rtl:left-6 rtl:right-auto z-40 w-12 h-12 bg-versace-green-900 hover:bg-versace-gold text-white rounded-none shadow-xl flex items-center justify-center transition-all duration-300 animate-fadeIn"
          aria-label="Yukarı Çık"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
