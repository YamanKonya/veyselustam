"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import {
  subscribeProducts,
  subscribeProductWriteErrors,
  seedProductsToFirestore,
  syncCatalogImages,
  migrateAgateWording,
  describeFirestoreError,
} from "@/services/productService";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { ensureStockGroups } from "@/services/stockService";
import ProductFormModal from "@/components/admin/ProductFormModal";
import ProductListTable from "@/components/admin/ProductListTable";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Plus, 
  Package, 
  Layers, 
  Boxes, 
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  Loader2
} from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), isError ? 8000 : 3000);
  };

  // One-time setup on opening the panel: save catalogue products that aren't in
  // Firestore yet and create cases they point to (e.g. Sidre). Idempotent.
  const setupStarted = useRef(false);
  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;
    (async () => {
      try {
        const { created } = await seedProductsToFirestore();
        const groups = await ensureStockGroups(INITIAL_VEYSELUSTAM_PRODUCTS);
        const imagesUpdated = await syncCatalogImages();
        const reworded = await migrateAgateWording();
        const parts: string[] = [];
        if (created) parts.push(`${created} ürün Firebase'e kaydedildi`);
        if (imagesUpdated) parts.push(`${imagesUpdated} ürünün görselleri güncellendi`);
        if (reworded) parts.push(`${reworded} üründe "Yemen akik" ifadesi "Horasan akik" yapıldı`);
        if (groups.length) parts.push(`kasa oluşturuldu: ${groups.join(", ")}`);
        if (parts.length) showToast(parts.join(" · "));
      } catch (err) {
        showToast(`Otomatik kurulum yapılamadı: ${describeFirestoreError(err)}`, true);
      }
    })();
  }, []);

  // Background Firestore writes report failures here (e.g. rules denial)
  useEffect(() => {
    return subscribeProductWriteErrors((msg) => showToast(msg, true));
  }, []);

  const handleSeedFirestore = async () => {
    if (!confirm("Tüm ürünler Firestore'a yüklenecek (zaten kayıtlı olanlara dokunulmaz). Devam edilsin mi?")) return;
    setSeeding(true);
    try {
      const { created, skipped } = await seedProductsToFirestore();
      showToast(`${created} ürün Firestore'a yüklendi, ${skipped} ürün zaten kayıtlıydı.`);
    } catch (err) {
      showToast(`Yükleme başarısız: ${describeFirestoreError(err)}`, true);
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Metrics
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const categoriesCount = new Set(products.map((p) => p.category)).size;
  const totalCatalogValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 1)), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role={toastIsError ? "alert" : "status"}
          className={`fixed top-20 right-6 rtl:left-6 rtl:right-auto z-50 max-w-md text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2.5 ${
            toastIsError ? "bg-rose-600" : "bg-emerald-600 animate-bounce"
          }`}
        >
          {toastIsError ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panel-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("admin_title")}
            </h1>
            <span className="px-3 py-1 rounded-full bg-brass-500/10 border border-brass-500/20 text-brass-400 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t("admin_badge")}
            </span>
          </div>
          <p className="text-panel-400 text-xs sm:text-sm mt-1">
            {t("admin_subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSeedFirestore}
          disabled={seeding}
          title="Henüz Firestore'da olmayan ürünleri veritabanına kaydeder"
          className="px-5 py-3.5 rounded-2xl border border-panel-700 bg-panel-900 hover:bg-panel-800 text-panel-200 font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
          {seeding ? "Yükleniyor..." : "Ürünleri Firestore'a Yükle"}
        </button>
        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brass-600 to-brass-500 hover:from-brass-500 hover:to-brass-600 text-white font-bold text-sm shadow-xl shadow-brass-600/20 flex items-center justify-center gap-2 transition duration-300 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          {t("admin_btn_add")}
        </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-panel-900 border border-panel-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-panel-400 uppercase tracking-wider">{t("admin_stat_1")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{totalProducts}</h3>
            <p className="text-[11px] text-panel-500 mt-1">{t("admin_stat_1_sub")}</p>
          </div>
          <div className="p-3 bg-brass-600/10 text-brass-500 rounded-2xl border border-brass-500/20">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-panel-900 border border-panel-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-panel-400 uppercase tracking-wider">{t("admin_stat_2")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{totalStock}</h3>
            <p className="text-[11px] text-panel-500 mt-1">{t("admin_stat_2_sub")}</p>
          </div>
          <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-panel-900 border border-panel-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-panel-400 uppercase tracking-wider">{t("admin_stat_3")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-brass-300 mt-1">{categoriesCount}</h3>
            <p className="text-[11px] text-panel-500 mt-1">{t("admin_stat_3_sub")}</p>
          </div>
          <div className="p-3 bg-brass-500/10 text-brass-300 rounded-2xl border border-brass-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Catalog Value */}
        <div className="bg-panel-900 border border-panel-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-panel-400 uppercase tracking-wider">{t("admin_stat_4")}</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-brass-400 mt-1">
              ₺{totalCatalogValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-panel-500 mt-1">{t("admin_stat_4_sub")}</p>
          </div>
          <div className="p-3 bg-panel-500/10 text-panel-200 rounded-2xl border border-panel-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <ProductListTable
        products={products}
        loading={loading}
        onEdit={handleEditProduct}
        onDeleteSuccess={() => showToast("Ürün başarıyla silindi.")}
      />

      {/* Product Add / Edit Modal */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          productToEdit={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            showToast(editingProduct ? "Ürün başarıyla güncellendi." : "Yeni ürün başarıyla eklendi.");
          }}
        />
      )}
    </div>
  );
}
