"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { deleteProduct, createProduct, toggleFeaturedProduct, toggleActiveProduct, setProductPlacement } from "@/services/productService";
import { MENUS, MENU_LABELS, SUBMENUS, SUBMENU_LABELS, FilterId, MenuId, inFilter, isSubMenu, productMenus, productSubmenus } from "@/lib/menus";
import BulkCampaignModal from "./BulkCampaignModal";
import { 
  Edit3, 
  Trash2, 
  Copy,
  Image as ImageIcon, 
  Search, 
  Tag, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Zap,
  CheckSquare,
  Square,
  Percent,
  Star,
  Sparkles,
  LayoutList,
  RotateCcw
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import Link from "next/link";
import { useStockGroups, availableStock } from "@/services/stockService";

interface ProductListTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDeleteSuccess: () => void;
}

const ITEMS_PER_PAGE = 15;

export default function ProductListTable({
  products,
  loading,
  onEdit,
  onDeleteSuccess,
}: ProductListTableProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const { groups: stockGroups } = useStockGroups();
  const [selectedCategory, setSelectedCategory] = useState("Hepsi");
  const [statusFilter, setStatusFilter] = useState<"all" | "featured" | "active" | "passive">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Large preview that follows the cursor over a thumbnail
  const [hoverPreview, setHoverPreview] = useState<{ images: string[]; x: number; y: number } | null>(null);
  const trackHover = (images: string[]) => (e: React.MouseEvent) => {
    if (window.matchMedia?.("(hover: none)").matches) return;
    setHoverPreview({ images, x: e.clientX, y: e.clientY });
  };
  const [currentPage, setCurrentPage] = useState(1);

  // Campaign Modal & Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const categories = ["Hepsi", ...Array.from(new Set(products.map((p) => p.category)))];
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuNote, setMenuNote] = useState("");
  const [menuMode, setMenuMode] = useState<"add" | "move">("add");

  // Search finds a piece by the name the site shows (in Turkish and the panel's language)
  // as well as by its stored text and id; Turkish letters and accents are ignored
  const fold = (s: string) =>
    (s || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/\s+/g, " ");
  const query = fold(searchTerm).trim();
  const filteredProducts = products.filter((product) => {
    const shown = translateProduct(product, "tr");
    const shownHere = language === "tr" ? shown : translateProduct(product, language);
    const matchesSearch =
      !query ||
      [shown.title, shown.description, shownHere.title, product.title, product.description, product.id || ""].some((s) =>
        fold(s).includes(query)
      );
    // the filter holds a new menu ("menu:erkek"), "menu:none" or an old category ("cat:…")
    const menus = productMenus(product);
    const matchesCategory =
      selectedCategory === "Hepsi" ||
      (selectedCategory === "menu:none" && menus.length === 0) ||
      (selectedCategory.startsWith("menu:") && selectedCategory !== "menu:none" && inFilter(product, selectedCategory.slice(5) as FilterId)) ||
      (selectedCategory.startsWith("cat:") && product.category === selectedCategory.slice(4));
    
    let matchesStatus = true;
    if (statusFilter === "featured") matchesStatus = !!product.isFeatured;
    else if (statusFilter === "active") matchesStatus = product.isActive !== false;
    else if (statusFilter === "passive") matchesStatus = product.isActive === false;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination math
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProducts.map((p) => p.id!).filter(Boolean);
    const allSelected = pageIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds(selectedProductIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...pageIds])));
    }
  };

  const selectedProducts = products.filter((p) => p.id && selectedProductIds.includes(p.id));

  const filterLabel = (id: FilterId) => (isSubMenu(id) ? SUBMENU_LABELS[id] : MENU_LABELS[id]);
  const sortMenus = (ids: string[]) => MENUS.map((m) => m.id).filter((m) => ids.includes(m));
  const sortSubs = (ids: string[]) => SUBMENUS.map((m) => m.id).filter((m) => ids.includes(m));

  // Selected pieces and one menu or stone subcategory.
  // "add": add it (or, if all already have it, take it away); "move": it becomes their only
  // menu / stone. A subcategory also puts the piece in its parent menu. A guessed placement
  // becomes explicit; "auto" hands both lists back to automatic placement.
  const applyMenu = async (id: FilterId | "auto") => {
    if (!selectedProducts.length) return;
    const allHave = id !== "auto" && selectedProducts.every((p) => inFilter(p, id));
    const removing = menuMode === "add" && allHave;
    setMenuBusy(true);
    setMenuNote("");
    try {
      selectedProducts.forEach((p) => {
        if (id === "auto") return setProductPlacement(p.id!, { menus: null, submenus: null });
        const menus = productMenus(p) as string[];
        if (isSubMenu(id)) {
          const subs = productSubmenus(p) as string[];
          const parent = SUBMENUS.find((m) => m.id === id)!.parent;
          const nextSubs = removing ? subs.filter((m) => m !== id) : menuMode === "move" ? [id] : [...subs, id];
          setProductPlacement(p.id!, {
            submenus: sortSubs(nextSubs),
            ...(removing || menus.includes(parent) ? {} : { menus: sortMenus([...menus, parent]) }),
          });
        } else {
          const nextMenus = removing ? menus.filter((m) => m !== id) : menuMode === "move" ? [id] : [...menus, id];
          setProductPlacement(p.id!, { menus: sortMenus(nextMenus) });
        }
      });
      const n = selectedProducts.length;
      setMenuNote(
        id === "auto"
          ? `${n} ürün otomatik yerleşime döndü.`
          : removing
          ? `${n} ürün "${filterLabel(id)}" bölümünden çıkarıldı.`
          : menuMode === "move"
          ? `${n} ürün "${filterLabel(id)}" bölümüne taşındı.`
          : `${n} ürün "${filterLabel(id)}" bölümüne eklendi.`
      );
    } catch {
      setMenuNote("Menüler kaydedilemedi, tekrar deneyin.");
    } finally {
      setMenuBusy(false);
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((i) => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      onDeleteSuccess();
      setDeleteConfirmProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloneProduct = async (product: Product) => {
    if (!product.id) return;
    setCloningId(product.id);
    try {
      const clonedData = {
        title: `${product.title} (Kopya)`,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        isCampaign: product.isCampaign,
        category: product.category,
        stock: product.stock,
        ringSize: [...(product.ringSize || [])],
        images: [...(product.images || [])],
      };
      await createProduct(clonedData);
      onDeleteSuccess();
    } catch (err) {
      console.error("Error cloning product:", err);
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Campaign Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-panel-900 border border-panel-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-panel-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("admin_tbl_search_ph")}
            className="w-full pl-10 pr-4 py-2.5 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brass-500 transition"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-panel-400 font-medium whitespace-nowrap">{t("admin_tbl_th_category")}:</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brass-500 transition"
          >
            <option value="Hepsi">{t("cat_all")}</option>
            <optgroup label="Menüler">
              {MENUS.map((m) => (
                <React.Fragment key={m.id}>
                  <option value={`menu:${m.id}`}>
                    {MENU_LABELS[m.id]} ({products.filter((p) => productMenus(p).includes(m.id)).length})
                  </option>
                  {SUBMENUS.filter((sm) => sm.parent === m.id).map((sm) => (
                    <option key={sm.id} value={`menu:${sm.id}`}>
                      {"\u00a0\u00a0\u00a0› "}{SUBMENU_LABELS[sm.id]} ({products.filter((p) => productSubmenus(p).includes(sm.id)).length})
                    </option>
                  ))}
                </React.Fragment>
              ))}
              <option value="menu:none">Hiçbir menüde değil ({products.filter((p) => productMenus(p).length === 0).length})</option>
            </optgroup>
            <optgroup label="Eski kategoriler">
              {categories.filter((c) => c !== "Hepsi").map((cat) => (
                <option key={cat} value={`cat:${cat}`}>{cat}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Status Filter (Tümü / Vitrin / Aktif / Pasif) */}
        <div className="flex items-center gap-1 bg-panel-950 p-1 border border-panel-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === "all" ? "bg-panel-800 text-white" : "text-panel-400 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => { setStatusFilter("featured"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === "featured" ? "bg-brass-500/20 text-brass-300 border border-brass-500/30" : "text-panel-400 hover:text-brass-300"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-brass-400 text-brass-400" />
            Vitrindekiler
          </button>
          <button
            onClick={() => { setStatusFilter("active"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === "active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-panel-400 hover:text-emerald-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Aktifler
          </button>
          <button
            onClick={() => { setStatusFilter("passive"); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === "passive" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-panel-400 hover:text-red-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Pasifler
          </button>
        </div>

        {/* Bulk Campaign Trigger Button */}
        <button
          onClick={() => setIsCampaignModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brass-600 to-brass-500 hover:from-brass-500 hover:to-brass-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brass-600/20 flex items-center justify-center gap-2 transition whitespace-nowrap"
        >
          <Zap className="w-4 h-4" />
          {selectedProductIds.length > 0 
            ? `(${selectedProductIds.length}) ${t("admin_btn_campaign")}`
            : t("admin_btn_campaign")
          }
        </button>
      </div>

      {/* Bulk menu assignment for the selected pieces */}
      <div className="bg-panel-900 border border-panel-800 p-4 rounded-2xl shadow-lg flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-bold text-panel-100 flex items-center gap-1.5">
            <LayoutList className="w-4 h-4 text-brass-400" /> Menüye ata
          </span>
          <span className="text-panel-400">
            {selectedProducts.length
              ? `${selectedProducts.length} ürün seçili. Bir menüye ya da taşa tıklayın. Ekle: seçilenler oraya da girer (hepsinde zaten varsa çıkarılır). Taşı: seçilenler yalnızca orada kalır.`
              : "Listeden ürünleri işaretleyin ya da filtreleyip hepsini seçin, sonra menüye tıklayın."}
          </span>
          {filteredProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...filteredProducts.map((p) => p.id!).filter(Boolean)])))}
              className="text-brass-400 hover:text-brass-300 font-semibold underline underline-offset-2"
            >
              Listedeki {filteredProducts.length} ürünün hepsini seç
            </button>
          )}
          {selectedProducts.length > 0 && (
            <button type="button" onClick={() => setSelectedProductIds([])} className="text-panel-400 hover:text-white underline underline-offset-2">
              Seçimi temizle
            </button>
          )}
        </div>
        <div role="group" aria-label="Atama şekli" className="flex items-center gap-1 bg-panel-950 p-1 border border-panel-800 rounded-xl self-start">
          {([
            ["add", "Ekle", "Seçilenler mevcut menülerine ek olarak buraya da girer"],
            ["move", "Taşı", "Seçilenler yalnızca tıkladığınız menüde / taşta kalır"],
          ] as const).map(([mode, label, hint]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={menuMode === mode}
              title={hint}
              onClick={() => setMenuMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${menuMode === mode ? "bg-brass-600 text-white" : "text-panel-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {(
          [
            ["Menüler", MENUS.map((m) => m.id as FilterId)],
            ["Erkek Yüzük taşları", SUBMENUS.map((m) => m.id as FilterId)],
          ] as const
        ).map(([title, ids]) => (
          <div key={title} className="flex flex-wrap items-center gap-2">
            <span className="w-36 text-[11px] font-semibold uppercase tracking-wider text-panel-500">{title}</span>
            {ids.map((id) => {
              const have = selectedProducts.filter((p) => inFilter(p, id)).length;
              const all = selectedProducts.length > 0 && have === selectedProducts.length;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!selectedProducts.length || menuBusy}
                  onClick={() => applyMenu(id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-40 ${
                    all ? "bg-brass-600 border-brass-500 text-white" : have ? "bg-brass-500/15 border-brass-500/40 text-brass-300" : "bg-panel-950 border-panel-700 text-panel-200 hover:border-brass-500"
                  }`}
                >
                  {all ? "✓ " : menuMode === "move" ? "→ " : "+ "}
                  {filterLabel(id)}
                  {have > 0 && !all && <span className="ms-1 opacity-70">({have})</span>}
                </button>
              );
            })}
          </div>
        ))}
        <div>
          <button
            type="button"
            disabled={!selectedProducts.length || menuBusy}
            onClick={() => applyMenu("auto")}
            title="Seçilenlerin elle verilen menülerini ve taşlarını siler; kategorisine göre otomatik yerleşir"
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-panel-700 bg-panel-950 text-panel-400 hover:text-white transition disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {menuBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Otomatiğe döndür
          </button>
        </div>
        {menuNote && <p role="status" className="text-xs text-emerald-300">{menuNote}</p>}
      </div>

      {/* Table Container */}
      <div className="bg-panel-900 border border-panel-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-panel-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brass-500" />
            <p className="text-sm font-medium">{t("loading_products")}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-panel-400 flex flex-col items-center gap-2">
            <Tag className="w-10 h-10 text-panel-600 mb-1" />
            <p className="text-base font-semibold text-panel-300">{t("no_products_found")}</p>
            <p className="text-xs text-panel-500 max-w-sm">
              {t("no_products_desc")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-panel-300">
              <thead className="bg-panel-950/80 border-b border-panel-800 text-xs font-semibold text-panel-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-10 text-center">
                    <button
                      onClick={handleSelectAllOnPage}
                      className="p-1 text-panel-400 hover:text-brass-400 transition"
                      title="Sayfadaki Tümünü Seç"
                    >
                      {paginatedProducts.every((p) => p.id && selectedProductIds.includes(p.id)) ? (
                        <CheckSquare className="w-4 h-4 text-brass-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">{t("admin_tbl_th_product").split("&")[0]}</th>
                  <th className="py-4 px-6">{t("admin_tbl_th_product")}</th>
                  <th className="py-4 px-6">{t("admin_tbl_th_category")}</th>
                  <th className="py-4 px-6">{t("admin_tbl_th_price")}</th>
                  <th className="py-4 px-6">{t("admin_tbl_th_stock")}</th>
                  <th className="py-4 px-6 text-center">VİTRİN & DURUM</th>
                  <th className="py-4 px-6 text-right">{t("admin_tbl_th_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-800/80">
                {paginatedProducts.map((rawProduct) => {
                  const product = translateProduct(rawProduct, language);
                  const hasImage = product.images && product.images.length > 0;
                  const mainImg = hasImage ? product.images[0] : null;
                  const isSelected = product.id ? selectedProductIds.includes(product.id) : false;

                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                  const discountPct = (hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0);

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-panel-800/40 transition ${
                        rawProduct.isActive === false ? "opacity-60 bg-red-950/10" : ""
                      } ${
                        rawProduct.isFeatured ? "bg-brass-500/[0.04]" : ""
                      } ${
                        isSelected ? "bg-brass-500/10 border-l-2 border-l-brass-500" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => product.id && handleToggleSelectProduct(product.id)}
                          className="p-1 text-panel-400 hover:text-brass-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brass-500" />
                          ) : (
                            <Square className="w-4 h-4 text-panel-600" />
                          )}
                        </button>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-4 px-4">
                        <div 
                          onClick={() => mainImg && setPreviewImage(mainImg)}
                          onMouseEnter={mainImg ? trackHover(product.images) : undefined}
                          onMouseMove={mainImg ? trackHover(product.images) : undefined}
                          onMouseLeave={() => setHoverPreview(null)}
                          className={`w-14 h-14 rounded-xl bg-panel-950 border border-panel-800 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer group relative ${
                            mainImg ? "hover:border-brass-500" : ""
                          }`}
                        >
                          {mainImg ? (
                            <>
                              <img
                                src={mainImg}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-panel-600" />
                          )}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-6 max-w-sm">
                        <Link 
                          href={`/product/${product.id}`} 
                          target="_blank"
                          className="font-bold text-panel-100 text-sm hover:text-brass-400 transition line-clamp-1 flex items-center gap-1.5"
                        >
                          <span>{product.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                        <p className="text-xs text-panel-400 line-clamp-1 mt-0.5">
                          {product.description || "Açıklama yok"}
                        </p>
                        {product.images && product.images.length > 1 && (
                          <span className="inline-block mt-1 text-[10px] text-brass-500 font-semibold bg-brass-500/10 px-1.5 py-0.5 rounded border border-brass-500/20">
                            +{product.images.length - 1} ekstra resim
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {productMenus(product).map((m) => (
                            <span
                              key={m}
                              title={product.menus ? "Elle seçildi" : "Otomatik yerleşti"}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                                product.menus ? "bg-brass-600 text-white" : "bg-brass-500/10 border border-dashed border-brass-500/40 text-brass-300"
                              }`}
                            >
                              {MENU_LABELS[m]}
                            </span>
                          ))}
                          {productSubmenus(product).map((m) => (
                            <span
                              key={m}
                              title={product.submenus ? "Elle seçildi" : "Otomatik yerleşti"}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                                product.submenus ? "bg-emerald-700 text-white" : "bg-emerald-500/10 border border-dashed border-emerald-500/40 text-emerald-300"
                              }`}
                            >
                              › {SUBMENU_LABELS[m]}
                            </span>
                          ))}
                          {productMenus(product).length === 0 && <span className="text-[11px] text-amber-300">Menüsüz</span>}
                        </div>
                        <span className="block mt-1 text-[10px] text-panel-500 whitespace-nowrap">{product.category}</span>
                      </td>

                      {/* Price & Discount */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-emerald-400 text-base">
                              ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                            </span>

                            {hasDiscount && (
                              <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                -%{discountPct}
                              </span>
                            )}
                          </div>

                          {hasDiscount && (
                            <span className="text-xs text-panel-500 line-through mt-0.5 font-medium">
                              ₺{product.originalPrice!.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {(() => {
                          const left = availableStock(product, stockGroups);
                          const group = stockGroups.find((g) => g.id === product.stockGroup);
                          return (
                            <>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  left > 5
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : left > 0
                                    ? "bg-brass-500/10 text-brass-400 border border-brass-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}
                              >
                                {left} adet
                              </span>
                              {group && <span className="block mt-1 text-[10px] text-panel-400">{group.name} kasası</span>}
                            </>
                          );
                        })()}
                      </td>

                      {/* Featured & Status Toggles */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Vitrin Butonu */}
                          <button
                            onClick={() => rawProduct.id && toggleFeaturedProduct(rawProduct.id)}
                            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                              rawProduct.isFeatured
                                ? "bg-brass-500/20 border-brass-500/40 text-brass-300 shadow-sm shadow-brass-500/20"
                                : "bg-panel-950 border-panel-800 text-panel-500 hover:text-brass-400 hover:border-panel-700"
                            }`}
                            title={rawProduct.isFeatured ? "Vitrin Ürünü (Tıkla ve Kaldır)" : "Vitrinde Göster"}
                          >
                            <Star className={`w-3.5 h-3.5 ${rawProduct.isFeatured ? "fill-brass-400 text-brass-400" : ""}`} />
                            <span className="text-[11px]">
                              {rawProduct.isFeatured ? "Vitrinde" : "Normal"}
                            </span>
                          </button>

                          {/* Aktif / Pasif Butonu */}
                          <button
                            onClick={() => rawProduct.id && toggleActiveProduct(rawProduct.id)}
                            className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                              rawProduct.isActive !== false
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                                : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                            }`}
                            title={rawProduct.isActive !== false ? "Ürün Yayında (Tıkla Pasife Al)" : "Ürün Pasif/Gizli (Tıkla Yayına Al)"}
                          >
                            {rawProduct.isActive !== false ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span>Pasif</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(rawProduct)}
                            className="p-2 text-panel-400 hover:text-brass-400 hover:bg-panel-800 rounded-xl transition"
                            title="Düzenle / İndirim Yap"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCloneProduct(translateProduct(rawProduct, "tr"))}
                            disabled={cloningId === product.id}
                            className="p-2 text-panel-400 hover:text-purple-400 hover:bg-panel-800 rounded-xl transition disabled:opacity-50"
                            title="Kopyala / Çoğalt"
                          >
                            {cloningId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmProduct(product)}
                            className="p-2 text-panel-400 hover:text-red-400 hover:bg-panel-800 rounded-xl transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 bg-panel-950/60 border-t border-panel-800 text-xs text-panel-400">
            <span>
              Toplam <strong>{filteredProducts.length}</strong> üründen{" "}
              <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> -{" "}
              <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> arası gösteriliyor
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-panel-900 border border-panel-800 rounded-lg text-panel-300 hover:bg-panel-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-panel-900 border border-panel-800 rounded-lg text-panel-300 hover:bg-panel-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Campaign Modal */}
      <BulkCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        categories={categories}
        selectedProductIds={selectedProductIds}
        onSuccess={(msg) => {
          setSelectedProductIds([]);
          onDeleteSuccess();
        }}
      />

      {/* Image Full Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full bg-panel-900 border border-panel-800 p-2 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white hover:bg-black rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Ürün Önizleme" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {hoverPreview && (() => {
        const W = 360;
        const H = W + (hoverPreview.images.length > 1 ? 64 : 0);
        const left = Math.min(hoverPreview.x + 24, window.innerWidth - W - 12);
        const top = Math.max(12, Math.min(hoverPreview.y - H / 2, window.innerHeight - H - 12));
        return (
          <div
            aria-hidden
            className="fixed z-[60] pointer-events-none rounded-2xl border border-brass-500/60 bg-panel-950 p-2 shadow-2xl"
            style={{ left, top, width: W }}
          >
            <img src={hoverPreview.images[0]} alt="" className="w-full aspect-square object-cover rounded-xl" />
            {hoverPreview.images.length > 1 && (
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {hoverPreview.images.slice(1, 7).map((src) => (
                  <img key={src} src={src} alt="" className="w-full aspect-square object-cover rounded-md" />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-panel-900 border border-panel-800 p-6 rounded-3xl shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Ürünü Silmek İstiyor musunuz?</h3>
            <p className="text-xs text-panel-400">
              "<span className="text-panel-200 font-semibold">{deleteConfirmProduct.title}</span>" ürünü veritabanından silinecektir.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-5 py-2.5 bg-panel-800 hover:bg-panel-700 text-panel-300 rounded-xl text-xs font-semibold transition"
              >
                İptal
              </button>
              <button
                onClick={() => deleteConfirmProduct.id && handleDelete(deleteConfirmProduct.id)}
                disabled={deletingId === deleteConfirmProduct.id}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 flex items-center gap-1 transition disabled:opacity-50"
              >
                {deletingId === deleteConfirmProduct.id ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
