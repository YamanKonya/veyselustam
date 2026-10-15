"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
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
  CheckCircle2
} from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
        <div className="fixed top-20 right-6 rtl:left-6 rtl:right-auto z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("admin_title")}
            </h1>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t("admin_badge")}
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {t("admin_subtitle")}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 transition duration-300 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          {t("admin_btn_add")}
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("admin_stat_1")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{totalProducts}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{t("admin_stat_1_sub")}</p>
          </div>
          <div className="p-3 bg-amber-600/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("admin_stat_2")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{totalStock}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{t("admin_stat_2_sub")}</p>
          </div>
          <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("admin_stat_3")}</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">{categoriesCount}</h3>
            <p className="text-[11px] text-slate-500 mt-1">{t("admin_stat_3_sub")}</p>
          </div>
          <div className="p-3 bg-purple-600/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Catalog Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("admin_stat_4")}</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
              ₺{totalCatalogValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">{t("admin_stat_4_sub")}</p>
          </div>
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
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
