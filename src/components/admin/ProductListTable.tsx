"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { deleteProduct, createProduct } from "@/services/productService";
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
  X,
  Zap,
  CheckSquare,
  Square,
  Percent
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translateProduct } from "@/i18n/productTranslations";
import Link from "next/link";

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
  const [selectedCategory, setSelectedCategory] = useState("Hepsi");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Campaign Modal & Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const categories = ["Hepsi", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.id && product.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "Hepsi" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("admin_tbl_search_ph")}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{t("admin_tbl_th_category")}:</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Hepsi" ? t("cat_all") : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Campaign Trigger Button */}
        <button
          onClick={() => setIsCampaignModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition whitespace-nowrap"
        >
          <Zap className="w-4 h-4" />
          {selectedProductIds.length > 0 
            ? `(${selectedProductIds.length}) ${t("admin_btn_campaign")}`
            : t("admin_btn_campaign")
          }
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">{t("loading_products")}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
            <Tag className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-base font-semibold text-slate-300">{t("no_products_found")}</p>
            <p className="text-xs text-slate-500 max-w-sm">
              {t("no_products_desc")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-10 text-center">
                    <button
                      onClick={handleSelectAllOnPage}
                      className="p-1 text-slate-400 hover:text-amber-400 transition"
                      title="Sayfadaki Tümünü Seç"
                    >
                      {paginatedProducts.every((p) => p.id && selectedProductIds.includes(p.id)) ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
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
                  <th className="py-4 px-6">{t("sizes")}</th>
                  <th className="py-4 px-6 text-right">{t("admin_tbl_th_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedProducts.map((rawProduct) => {
                  const product = translateProduct(rawProduct, language);
                  const hasImage = product.images && product.images.length > 0;
                  const mainImg = hasImage ? product.images[0] : null;
                  const isSelected = product.id ? selectedProductIds.includes(product.id) : false;

                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                  const discountPct = product.discountPercent || (hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0);

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? "bg-amber-500/5 border-l-2 border-l-amber-500" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => product.id && handleToggleSelectProduct(product.id)}
                          className="p-1 text-slate-400 hover:text-amber-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-4 px-4">
                        <div 
                          onClick={() => mainImg && setPreviewImage(mainImg)}
                          className={`w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer group relative ${
                            mainImg ? "hover:border-amber-500" : ""
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
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          )}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-6 max-w-sm">
                        <Link 
                          href={`/product/${product.id}`} 
                          target="_blank"
                          className="font-bold text-slate-100 text-sm hover:text-amber-400 transition line-clamp-1 flex items-center gap-1.5"
                        >
                          <span>{product.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {product.description || "Açıklama yok"}
                        </p>
                        {product.images && product.images.length > 1 && (
                          <span className="inline-block mt-1 text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            +{product.images.length - 1} ekstra resim
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                          {product.category}
                        </span>
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
                            <span className="text-xs text-slate-500 line-through mt-0.5 font-medium">
                              ₺{product.originalPrice!.toLocaleString("tr-TR", { minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            product.stock > 5
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : product.stock > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {product.stock} adet
                        </span>
                      </td>

                      {/* Ring Sizes */}
                      <td className="py-4 px-6">
                        {product.ringSize && product.ringSize.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {product.ringSize.slice(0, 5).map((size) => (
                              <span
                                key={size}
                                className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-800"
                              >
                                {size}
                              </span>
                            ))}
                            {product.ringSize.length > 5 && (
                              <span className="text-[10px] text-slate-500 font-semibold align-middle">
                                +{product.ringSize.length - 5}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(rawProduct)}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition"
                            title="Düzenle / İndirim Yap"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCloneProduct(product)}
                            disabled={cloningId === product.id}
                            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-xl transition disabled:opacity-50"
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
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
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
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Toplam <strong>{filteredProducts.length}</strong> üründen{" "}
              <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> -{" "}
              <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> arası gösteriliyor
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
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
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 p-2 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Ürünü Silmek İstiyor musunuz?</h3>
            <p className="text-xs text-slate-400">
              "<span className="text-slate-200 font-semibold">{deleteConfirmProduct.title}</span>" ürünü veritabanından silinecektir.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
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
