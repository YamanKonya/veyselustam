"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { createProduct, updateProduct, uploadFileToStorage } from "@/services/productService";
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Star,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
}

const DEFAULT_CATEGORIES = [
  "Nakkaş El Oyması Taşlı",
  "Horasan ve Yemen Akik Taşlı",
  "Özel Yapım Ürünler",
  "El Yapımı Gümüş Kolye",
  "Kadın Takı",
  "Yüzük",
  "Diğer"
];

const STANDARD_RING_SIZES = [
  "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
];

export default function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}: ProductFormModalProps) {
  const [title, setTitle] = useState("");
  const [title_en, setTitleEn] = useState("");
  const [title_es, setTitleEs] = useState("");
  const [title_de, setTitleDe] = useState("");
  const [title_ar, setTitleAr] = useState("");

  const [description, setDescription] = useState("");
  const [description_en, setDescriptionEn] = useState("");
  const [description_es, setDescriptionEs] = useState("");
  const [description_de, setDescriptionDe] = useState("");
  const [description_ar, setDescriptionAr] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [stock, setStock] = useState<number | "">(10);
  const [selectedRingSizes, setSelectedRingSizes] = useState<string[]>(STANDARD_RING_SIZES);
  const [customRingSize, setCustomRingSize] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  
  // Custom Hover Video state
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Vitrin & Aktiflik Durumu
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [showTranslations, setShowTranslations] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title || "");
      setTitleEn(productToEdit.title_en || "");
      setTitleEs(productToEdit.title_es || "");
      setTitleDe(productToEdit.title_de || "");
      setTitleAr(productToEdit.title_ar || "");

      setDescription(productToEdit.description || "");
      setDescriptionEn(productToEdit.description_en || "");
      setDescriptionEs(productToEdit.description_es || "");
      setDescriptionDe(productToEdit.description_de || "");
      setDescriptionAr(productToEdit.description_ar || "");
      setPrice(productToEdit.price || 0);
      setOriginalPrice(productToEdit.originalPrice || "");
      setDiscountPercent(productToEdit.discountPercent || "");
      setVideoUrl(productToEdit.videoUrl || "");
      setVideoFile(null);
      
      setIsFeatured(productToEdit.isFeatured || false);
      setIsActive(productToEdit.isActive !== false);

      const cat = productToEdit.category || DEFAULT_CATEGORIES[0];
      if (DEFAULT_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setCustomCategory("");
      } else {
        setCategory("Diğer");
        setCustomCategory(cat);
      }

      setStock(productToEdit.stock ?? 10);
      setSelectedRingSizes(productToEdit.ringSize || STANDARD_RING_SIZES);
      setExistingImages(productToEdit.images || []);
    } else {
      resetForm();
    }
  }, [productToEdit, isOpen]);

  const resetForm = () => {
    setTitle("");
    setTitleEn("");
    setTitleEs("");
    setTitleDe("");
    setTitleAr("");
    setIsFeatured(false);
    setIsActive(true);

    setDescription("");
    setDescriptionEn("");
    setDescriptionEs("");
    setDescriptionDe("");
    setDescriptionAr("");
    setPrice("");
    setOriginalPrice("");
    setDiscountPercent("");
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory("");
    setStock(10);
    setSelectedRingSizes(STANDARD_RING_SIZES);
    setCustomRingSize("");
    setExistingImages([]);
    setNewFiles([]);
    setFilePreviews([]);
    setImageUrlInput("");
    setVideoUrl("");
    setVideoFile(null);
    setShowTranslations(false);
    setError("");
  };

  if (!isOpen) return null;

  const handleRingSizeToggle = (size: string) => {
    if (selectedRingSizes.includes(size)) {
      setSelectedRingSizes(selectedRingSizes.filter((s) => s !== size));
    } else {
      setSelectedRingSizes([...selectedRingSizes, size]);
    }
  };

  const handleSelectAllRingSizes = () => {
    setSelectedRingSizes(STANDARD_RING_SIZES);
  };

  const handleClearAllRingSizes = () => {
    setSelectedRingSizes([]);
  };

  const handleAddCustomRingSize = () => {
    if (customRingSize.trim() && !selectedRingSizes.includes(customRingSize.trim())) {
      setSelectedRingSizes([...selectedRingSizes, customRingSize.trim()]);
      setCustomRingSize("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArr]);

      const newPreviews = filesArr.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleMakeMainImage = (index: number) => {
    if (index === 0) return;
    const updated = [...existingImages];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setExistingImages(updated);
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setExistingImages([...existingImages, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoUrl(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ürün başlığı zorunludur.");
      return;
    }
    if (price === "" || Number(price) <= 0) {
      setError("Geçerli bir fiyat giriniz.");
      return;
    }

    const finalCategory = category === "Diğer" && customCategory.trim() ? customCategory.trim() : category;

    setLoading(true);
    setError("");

    try {
      let finalVideoUrl = videoUrl;
      if (videoFile) {
        finalVideoUrl = await uploadFileToStorage(videoFile, "videos");
      }

      const isCampaignActive = originalPrice !== "" && Number(originalPrice) > Number(price);
      const productData = {
        title: title.trim(),
        title_en: title_en.trim() || undefined,
        title_es: title_es.trim() || undefined,
        title_de: title_de.trim() || undefined,
        title_ar: title_ar.trim() || undefined,

        description: description.trim(),
        description_en: description_en.trim() || undefined,
        description_es: description_es.trim() || undefined,
        description_de: description_de.trim() || undefined,
        description_ar: description_ar.trim() || undefined,
        price: Number(price),
        originalPrice: originalPrice !== "" ? Number(originalPrice) : undefined,
        discountPercent: discountPercent !== "" ? Number(discountPercent) : undefined,
        isCampaign: isCampaignActive,
        isFeatured: isFeatured,
        isActive: isActive,
        videoUrl: finalVideoUrl.trim() || undefined,
        category: finalCategory,
        stock: Number(stock) || 0,
        ringSize: selectedRingSizes,
        images: existingImages,
      };

      if (productToEdit && productToEdit.id) {
        await updateProduct(productToEdit.id, productData, newFiles);
      } else {
        await createProduct(productData, newFiles);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {productToEdit ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <p className="text-xs text-slate-400">
                {productToEdit ? `ID: ${productToEdit.id}` : "Kataloğa yeni el yapımı ürün ekleyin"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Title & Category */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Ürün Adı / Başlığı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 925 Ayar Orijinal Horasan Akik Taşlı El Yapımı Gümüş Yüzük"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white transition"
              />
            </div>

            {/* Vitrin & Yayın Durumu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${isFeatured ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">Vitrin Ürünü Olarak Belirle</span>
                    <span className="text-[10px] text-slate-400 block">Ana sayfada en başta ve öncelikli gösterilir</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-xs font-bold text-white">
                      {isActive ? "Ürün Aktif (Sitede Yayında)" : "Ürün Pasif (Gizli)"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {isActive ? "Müşteriler mağazada görebilir" : "Mağazada gizlenir, sadece adminde görünür"}
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white transition"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === "Diğer" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                    Özel Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Örn: Kol Düğmesi, Tesbih..."
                    className="w-full px-4 py-3 bg-slate-950 border border-amber-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Ürün Açıklaması
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="💍 Malzeme: %925 Kaliteli Gümüştür 📦 Ücretsiz Kargo 🚚 Gönderim Süresi: 1-3 iş günü..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white resize-none"
            />
          </div>

          {/* Translations Section */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className="w-full px-4 py-3 bg-slate-900/50 hover:bg-slate-800 flex items-center justify-between transition"
            >
              <span className="text-sm font-bold text-amber-500">Çoklu Dil Çevirileri (Opsiyonel)</span>
              <span className="text-xs text-slate-400">{showTranslations ? "Gizle ▲" : "Göster ▼"}</span>
            </button>
            {showTranslations && (
              <div className="p-4 bg-slate-950 space-y-6">
                
                {/* English */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">İngilizce (English)</h4>
                  <input
                    type="text"
                    value={title_en}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="English Title"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_en}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="English Description"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Arabic */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Arapça (العربية)</h4>
                  <input
                    type="text"
                    value={title_ar}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="Arabic Title"
                    dir="auto"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_ar}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="Arabic Description"
                    dir="auto"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Spanish */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">İspanyolca (Español)</h4>
                  <input
                    type="text"
                    value={title_es}
                    onChange={(e) => setTitleEs(e.target.value)}
                    placeholder="Spanish Title"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_es}
                    onChange={(e) => setDescriptionEs(e.target.value)}
                    placeholder="Spanish Description"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* German */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Almanca (Deutsch)</h4>
                  <input
                    type="text"
                    value={title_de}
                    onChange={(e) => setTitleDe(e.target.value)}
                    placeholder="German Title"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_de}
                    onChange={(e) => setDescriptionDe(e.target.value)}
                    placeholder="German Description"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Price, Original Price, Discount & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Satış Fiyatı (₺ TL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setPrice(val);
                    if (originalPrice && val !== "") {
                      const pct = Math.round(((Number(originalPrice) - Number(val)) / Number(originalPrice)) * 100);
                      setDiscountPercent(pct > 0 ? pct : 0);
                    }
                  }}
                  placeholder="5600.00"
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                İndirimsiz (Eski) Fiyat (₺)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setOriginalPrice(val);
                    if (val !== "" && price !== "") {
                      const pct = Math.round(((Number(val) - Number(price)) / Number(val)) * 100);
                      setDiscountPercent(pct > 0 ? pct : 0);
                    }
                  }}
                  placeholder="7000.00"
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-300 line-through"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                İndirim Oranı (%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">%</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent}
                  onChange={(e) => {
                    const pct = e.target.value === "" ? "" : Number(e.target.value);
                    setDiscountPercent(pct);
                    if (pct !== "" && originalPrice) {
                      const calculatedPrice = Math.round(Number(originalPrice) * (1 - Number(pct) / 100));
                      setPrice(calculatedPrice);
                    } else if (pct !== "" && price) {
                      const calculatedOrig = Math.round(Number(price) / (1 - Number(pct) / 100));
                      setOriginalPrice(calculatedOrig);
                    }
                  }}
                  placeholder="20"
                  className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-amber-500/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-amber-400 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Ring Sizes Variation Selector */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Parmak Numaraları (Ring Sizes)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRingSizes}
                  className="text-[11px] text-amber-400 hover:underline font-medium"
                >
                  Tümünü Seç (15-30)
                </button>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleClearAllRingSizes}
                  className="text-[11px] text-slate-400 hover:underline font-medium"
                >
                  Temizle
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STANDARD_RING_SIZES.map((size) => {
                const isSelected = selectedRingSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleRingSizeToggle(size)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 border ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Custom Ring Size Add */}
            <div className="flex gap-2 pt-2 border-t border-slate-800/60">
              <input
                type="text"
                value={customRingSize}
                onChange={(e) => setCustomRingSize(e.target.value)}
                placeholder="Özel Ölçü Ekle (Örn: 14, Standart Boy...)"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomRingSize}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition text-slate-200"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Image Upload Integration */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ürün Görselleri
            </label>
            
            {/* File upload drag & drop area */}
            <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/60 transition group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-200 font-semibold">
                  Bilgisayarınızdan Resim Seçin veya Sürükleyin
                </span>
                <span className="text-[10px] text-slate-500">WEBP, JPG, PNG formatları. Çoklu seçim desteklenir.</span>
              </label>
            </div>

            {/* Direct URL input option */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Veya Harici Resim URL'si Ekle (https://...)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl transition text-slate-200 whitespace-nowrap"
              >
                URL Ekle
              </button>
            </div>

            {/* Image Previews */}
            {(existingImages.length > 0 || filePreviews.length > 0) && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  İlk görsel ana ürün resmi olarak kullanılacaktır.
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {/* Existing Image URLs */}
                  {existingImages.map((url, idx) => (
                    <div 
                      key={`existing-${idx}`} 
                      className={`relative group rounded-xl overflow-hidden border aspect-square bg-slate-950 ${
                        idx === 0 ? "border-amber-500 shadow-md shadow-amber-500/20" : "border-slate-800"
                      }`}
                    >
                      <img src={url} alt={`Görsel ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-[9px] font-bold text-slate-950 px-1.5 py-0.5 rounded shadow">
                          Ana Görsel
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleMakeMainImage(idx)}
                            className="p-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition hover:scale-105"
                            title="Ana Görsel Yap"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-950" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="p-1.5 bg-red-600 text-white rounded-lg text-xs transition hover:scale-105"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New File Previews */}
                  {filePreviews.map((previewUrl, idx) => (
                    <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-amber-500/60 aspect-square bg-slate-950">
                      <img src={previewUrl} alt="Yeni Yüklenen" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-emerald-500 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                        Yeni
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hover Video Upload Integration */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Hover Özel Ürün Videosu (Opsiyonel)
            </label>
            <p className="text-[11px] text-slate-400">
              Mouse ile ürünün üzerine gelindiğinde gösterilecek kısa video (.mp4, .webm veya harici video URL'si). Yüklenmezse normal resim gösterilir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Video File Upload */}
              <div className="border border-dashed border-amber-500/30 hover:border-amber-500/80 rounded-xl p-4 text-center cursor-pointer bg-slate-950/80 transition group">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                  id="video-file-upload"
                />
                <label htmlFor="video-file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full group-hover:scale-110 transition duration-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  {videoFile ? (
                    <>
                      <span className="text-xs text-amber-400 font-bold truncate max-w-[200px]">
                        ✓ {videoFile.name}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • Yüklenmeye Hazır
                      </span>
                    </>
                  ) : videoUrl ? (
                    <>
                      <span className="text-xs text-emerald-400 font-bold">
                        ✓ Yüklü Video Mevcut
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Farklı video seçmek için tıklayın
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-200 font-semibold">
                        Video Dosyası Yükle
                      </span>
                      <span className="text-[10px] text-slate-500">MP4, WEBM formatı desteklenir</span>
                    </>
                  )}
                </label>
              </div>

              {/* Video URL Input */}
              <div className="flex flex-col gap-2 justify-center">
                <input
                  type="text"
                  value={videoUrl.startsWith("data:") || videoUrl.startsWith("blob:") ? "" : videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoFile(null);
                  }}
                  placeholder={
                    videoUrl.startsWith("data:") || videoUrl.startsWith("blob:")
                      ? "Bilgisayardan Yüklenmiş Video Aktif"
                      : "Veya Harici Video URL'si Girin (https://...mp4)"
                  }
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl("");
                      setVideoFile(null);
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 self-start font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Videoyu Kaldır
                  </button>
                )}
              </div>
            </div>

            {/* Video Preview Player with Hover test */}
            {videoUrl && (
              <div className="mt-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Hover Video Canlı Kart Önizlemesi (Fareyi üzerine getirin):
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Ana sayfada aynen böyle görünecektir</span>
                </div>
                
                <div 
                  className="group relative aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer shadow-xl"
                  onMouseEnter={(e) => {
                    const vid = e.currentTarget.querySelector("video");
                    if (vid) vid.play().catch(() => {});
                  }}
                >
                  {existingImages.length > 0 || filePreviews.length > 0 ? (
                    <img 
                      src={existingImages[0] || filePreviews[0]} 
                      alt="Önizleme" 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">Görsel Yok</div>
                  )}

                  <video
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

                  {/* Header Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-start justify-between gap-1 z-20 pointer-events-none">
                    <span className="bg-black/75 backdrop-blur-md text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded truncate max-w-[65%] shadow">
                      {category === "Diğer" && customCategory ? customCategory : category}
                    </span>
                    {originalPrice && Number(originalPrice) > Number(price || 0) && (
                      <span className="bg-gradient-to-r from-red-600 to-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 shadow">
                        -%{discountPercent || Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)} İNDİRİM
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 inset-x-2 bg-white/90 text-slate-900 text-[10px] font-bold py-1.5 rounded-lg text-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                    Detayları Gör
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white text-sm font-medium transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Kaydediliyor..." : productToEdit ? "Değişiklikleri Kaydet" : "Ürünü Yayınla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
