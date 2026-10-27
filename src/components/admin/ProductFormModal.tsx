"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { createProduct, updateProduct, uploadFileToStorage } from "@/services/productService";
import { translationSourceKey, usesCatalogText } from "@/i18n/productTranslations";
import { getCatalogContent } from "@/i18n/catalogContent";
import { useStockGroups } from "@/services/stockService";
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
import { MENUS, MENU_LABELS, SUBMENUS, SUBMENU_LABELS, productMenus, productSubmenus } from "@/lib/menus";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
}

const DEFAULT_CATEGORIES = [
  "Nakkaş El Oyması Taşlı",
  "Horasan Akik Taşlı",
  "Özel Yapım Ürünler",
  "El Yapımı Gümüş Kolye",
  "Kadın Takı",
  "Yüzük",
  "Diğer"
];

const PRICE_STEP = 100; // the arrows on price fields move in 100 TL steps

const sameText = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

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
  const [title_ru, setTitleRu] = useState("");

  const [description, setDescription] = useState("");
  const [description_en, setDescriptionEn] = useState("");
  const [description_es, setDescriptionEs] = useState("");
  const [description_de, setDescriptionDe] = useState("");
  const [description_ar, setDescriptionAr] = useState("");
  const [description_ru, setDescriptionRu] = useState("");
  // listPrice: the normal price; salePrice: the discounted price customers pay (empty = no discount)
  const [listPrice, setListPrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [memberPrice, setMemberPrice] = useState<number | "">("");
  const [menus, setMenus] = useState<string[]>([]); // empty = placed automatically
  const [submenus, setSubmenus] = useState<string[]>([]); // stones under Erkek Yüzük; empty = automatic
  const [newFirst, setNewFirst] = useState(false); // a newly added photo was picked as the main image
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [stock, setStock] = useState<number | "">(10);
  const [stockGroup, setStockGroup] = useState("");
  const { groups: stockGroups } = useStockGroups();
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
  // Fingerprint of the Turkish text the translation fields were made from
  const [i18nSource, setI18nSource] = useState<string | undefined>(undefined);
  const [translating, setTranslating] = useState(false);
  const [translateFailed, setTranslateFailed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productToEdit) {
      // Show the text the site shows: for original catalogue pieces that is the
      // hand-written catalogue text, not the old imported text stored with them
      const catalog = usesCatalogText(productToEdit)
        ? (lang: Parameters<typeof getCatalogContent>[1]) => getCatalogContent(productToEdit.id, lang)!
        : null;
      const pick = (lang: "en" | "es" | "de" | "ar" | "ru", field: "title" | "description") =>
        catalog ? catalog(lang)[field] : (productToEdit[`${field}_${lang}`] as string | undefined) || "";
      const trTitle = catalog ? catalog("tr").title : productToEdit.title || "";
      const trDesc = catalog ? catalog("tr").description : productToEdit.description || "";
      setTitle(trTitle);
      setTitleEn(pick("en", "title"));
      setTitleEs(pick("es", "title"));
      setTitleDe(pick("de", "title"));
      setTitleAr(pick("ar", "title"));
      setTitleRu(pick("ru", "title"));

      setDescription(trDesc);
      setDescriptionEn(pick("en", "description"));
      setDescriptionEs(pick("es", "description"));
      setDescriptionDe(pick("de", "description"));
      setDescriptionAr(pick("ar", "description"));
      setDescriptionRu(pick("ru", "description"));
      setI18nSource(catalog ? translationSourceKey(trTitle, trDesc) : productToEdit.i18nSource);
      const discounted = !!productToEdit.originalPrice && productToEdit.originalPrice > productToEdit.price;
      setListPrice(discounted ? productToEdit.originalPrice! : productToEdit.price || 0);
      setSalePrice(discounted ? productToEdit.price : "");
      setDiscountPercent(
        discounted ? Math.round(((productToEdit.originalPrice! - productToEdit.price) / productToEdit.originalPrice!) * 100) : ""
      );
      setMemberPrice(productToEdit.memberPrice || "");
      setMenus(productToEdit.menus || []);
      setSubmenus(productToEdit.submenus || []);
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
      setStockGroup(productToEdit.stockGroup || "");
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
    setTitleRu("");
    setIsFeatured(false);
    setIsActive(true);

    setDescription("");
    setDescriptionEn("");
    setDescriptionEs("");
    setDescriptionDe("");
    setDescriptionAr("");
    setDescriptionRu("");
    setI18nSource(undefined);
    setTranslateFailed(false);
    setListPrice("");
    setSalePrice("");
    setDiscountPercent("");
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory("");
    setStock(10);
    setStockGroup("");
    setSelectedRingSizes(STANDARD_RING_SIZES);
    setCustomRingSize("");
    setExistingImages([]);
    setNewFiles([]);
    setFilePreviews([]);
    setNewFirst(false);
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

  // Click any photo to make it the main (first) image
  const handleMakeMainImage = (index: number) => {
    setNewFirst(false);
    if (index === 0) return;
    const updated = [...existingImages];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setExistingImages(updated);
  };

  const handleMakeNewFileMain = (index: number) => {
    const files = [...newFiles];
    const previews = [...filePreviews];
    const [file] = files.splice(index, 1);
    const [preview] = previews.splice(index, 1);
    setNewFiles([file, ...files]);
    setFilePreviews([preview, ...previews]);
    setNewFirst(true);
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

  type TargetLang = "en" | "es" | "de" | "ar" | "ru";
  type Translations = Record<TargetLang, { title: string; description: string }>;

  const fetchTranslations = async (targets?: TargetLang[]): Promise<Partial<Translations>> => {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [title.trim(), description.trim()], targets }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Çeviri yapılamadı.");
    const out: Partial<Translations> = {};
    for (const [lang, texts] of Object.entries(data.translations as Record<TargetLang, string[]>)) {
      out[lang as TargetLang] = { title: texts[0], description: texts[1] };
    }
    return out;
  };

  const applyTranslations = (tr: Partial<Translations>) => {
    if (tr.en) { setTitleEn(tr.en.title); setDescriptionEn(tr.en.description); }
    if (tr.es) { setTitleEs(tr.es.title); setDescriptionEs(tr.es.description); }
    if (tr.de) { setTitleDe(tr.de.title); setDescriptionDe(tr.de.description); }
    if (tr.ar) { setTitleAr(tr.ar.title); setDescriptionAr(tr.ar.description); }
    if (tr.ru) { setTitleRu(tr.ru.title); setDescriptionRu(tr.ru.description); }
    setI18nSource(translationSourceKey(title, description));
  };

  // Price fields: the normal price and the % give the discounted price, and the
  // discounted price gives the % back
  const discounted = (list: number, pct: number) => Math.round(list * (1 - pct / 100));
  const percentOff = (list: number, sale: number) => Math.round(((list - sale) / list) * 100);
  const num = (v: string) => (v === "" ? "" : Number(v));

  const onListPrice = (v: string) => {
    const list = num(v);
    setListPrice(list);
    if (list === "" || !list) return;
    if (discountPercent !== "" && Number(discountPercent) > 0) setSalePrice(discounted(list, Number(discountPercent)));
    else if (salePrice !== "") setDiscountPercent(Math.max(0, percentOff(list, Number(salePrice))));
  };

  const onDiscountPercent = (v: string) => {
    const pct = num(v);
    setDiscountPercent(pct);
    if (pct === "" || Number(pct) <= 0) setSalePrice("");
    else if (listPrice !== "" && Number(listPrice) > 0) setSalePrice(discounted(Number(listPrice), Number(pct)));
  };

  const onSalePrice = (v: string) => {
    const sale = num(v);
    setSalePrice(sale);
    if (sale === "") setDiscountPercent("");
    else if (listPrice !== "" && Number(listPrice) > 0) setDiscountPercent(Math.max(0, percentOff(Number(listPrice), Number(sale))));
  };

  const handleAutoTranslate = async () => {
    if (!title.trim()) {
      setError("Çevirmeden önce Türkçe ürün adını girin.");
      return;
    }
    setTranslating(true);
    setError("");
    try {
      applyTranslations(await fetchTranslations());
      setShowTranslations(true);
      setTranslateFailed(false);
    } catch (err: any) {
      setError(err.message || "Çeviri yapılamadı.");
    } finally {
      setTranslating(false);
    }
  };

  // A hand-edited translation counts as made from the current Turkish text
  const editTranslation = (setter: (v: string) => void) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setter(e.target.value);
    setI18nSource(translationSourceKey(title, description));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ürün başlığı zorunludur.");
      return;
    }
    if (listPrice === "" || Number(listPrice) <= 0) {
      setError("Geçerli bir fiyat giriniz.");
      return;
    }
    // A discount only counts when the discounted price is below the normal price
    const isCampaignActive = salePrice !== "" && Number(salePrice) > 0 && Number(salePrice) < Number(listPrice);
    const price = isCampaignActive ? Number(salePrice) : Number(listPrice);

    const finalCategory = category === "Diğer" && customCategory.trim() ? customCategory.trim() : category;

    setLoading(true);
    setError("");

    try {
      let finalVideoUrl = videoUrl;
      if (videoFile) {
        finalVideoUrl = await uploadFileToStorage(videoFile, "videos");
      }

      // Translate when the Turkish text changed since the last translation (or never had one)
      const sourceKey = translationSourceKey(title, description);
      let tr: Translations = {
        en: { title: title_en, description: description_en },
        es: { title: title_es, description: description_es },
        de: { title: title_de, description: description_de },
        ar: { title: title_ar, description: description_ar },
        ru: { title: title_ru, description: description_ru },
      };
      let savedSource = i18nSource;
      const stale = i18nSource !== sourceKey || !title_en.trim() || !title_ar.trim();
      // Pieces translated before Russian was added only need the Russian text
      const missing: TargetLang[] = stale ? [] : (["en", "es", "de", "ar", "ru"] as const).filter((l) => !tr[l].title.trim());
      if ((stale || missing.length) && !translateFailed) {
        try {
          const fresh = await fetchTranslations(stale ? undefined : missing);
          tr = { ...tr, ...fresh };
          applyTranslations(fresh);
          savedSource = sourceKey;
        } catch (err: any) {
          setTranslateFailed(true);
          setError(
            (err.message || "Çeviri yapılamadı.") +
              " Ürünü çevirisiz kaydetmek için tekrar kaydedin; diğer dillerde Türkçe metin gösterilir."
          );
          setLoading(false);
          return;
        }
      } else if (stale) {
        savedSource = undefined;
      }

      // the % always follows the prices
      const savedDiscount = isCampaignActive ? percentOff(Number(listPrice), price) : undefined;
      // Original catalogue pieces keep showing the hand-written catalogue text (in every
      // language) until their Turkish text is changed here
      const catalogTr = productToEdit?.id ? getCatalogContent(productToEdit.id, "tr") : null;
      const customText = catalogTr && !(sameText(title, catalogTr.title) && sameText(description, catalogTr.description)) ? true : undefined;
      const productData = {
        title: title.trim(),
        title_en: tr.en.title.trim() || undefined,
        title_es: tr.es.title.trim() || undefined,
        title_de: tr.de.title.trim() || undefined,
        title_ar: tr.ar.title.trim() || undefined,
        title_ru: tr.ru.title.trim() || undefined,

        description: description.trim(),
        description_en: tr.en.description.trim() || undefined,
        description_es: tr.es.description.trim() || undefined,
        description_de: tr.de.description.trim() || undefined,
        description_ar: tr.ar.description.trim() || undefined,
        description_ru: tr.ru.description.trim() || undefined,
        i18nSource: savedSource,
        customText,
        price,
        originalPrice: isCampaignActive ? Number(listPrice) : undefined,
        discountPercent: savedDiscount,
        // a member price only counts when it is below the sale price
        memberPrice: memberPrice !== "" && Number(memberPrice) > 0 && Number(memberPrice) < price ? Number(memberPrice) : undefined,
        menus: menus.length ? menus : undefined,
        submenus: submenus.length ? submenus : undefined,
        isCampaign: isCampaignActive,
        isFeatured: isFeatured,
        isActive: isActive,
        videoUrl: finalVideoUrl.trim() || undefined,
        category: finalCategory,
        stock: Number(stock) || 0,
        stockGroup,
        ringSize: selectedRingSizes,
        images: existingImages,
      };

      if (productToEdit && productToEdit.id) {
        await updateProduct(productToEdit.id, productData, newFiles, newFirst && newFiles.length > 0);
      } else {
        await createProduct(productData, newFiles, newFirst && newFiles.length > 0);
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


  // what the automatic placement would do with the form as it stands
  const draftProduct = { title, description, category: category === "Diğer" ? customCategory : category, isFeatured, id: productToEdit?.id } as Product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-panel-900 border border-panel-800 rounded-3xl shadow-2xl text-panel-100 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-panel-800 bg-panel-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brass-500/10 text-brass-500 rounded-xl border border-brass-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {productToEdit ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <p className="text-xs text-panel-400">
                {productToEdit ? `ID: ${productToEdit.id}` : "Kataloğa yeni el yapımı ürün ekleyin"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-panel-400 hover:text-white hover:bg-panel-800 rounded-xl transition"
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
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Title & Category */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">
                Ürün Adı / Başlığı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 925 Ayar Orijinal Horasan Akik Taşlı El Yapımı Gümüş Yüzük"
                className="w-full px-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white transition"
              />
            </div>

            {/* Vitrin & Yayın Durumu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-panel-950/80 border border-panel-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-panel-700 bg-panel-900 text-brass-500 focus:ring-brass-500"
                />
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${isFeatured ? "fill-brass-400 text-brass-400" : "text-panel-500"}`} />
                  <div>
                    <span className="text-xs font-bold text-white block">Vitrin Ürünü Olarak Belirle</span>
                    <span className="text-[10px] text-panel-400 block">Ana sayfada en başta ve öncelikli gösterilir</span>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-panel-700 bg-panel-900 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-xs font-bold text-white">
                      {isActive ? "Ürün Aktif (Sitede Yayında)" : "Ürün Pasif (Gizli)"}
                    </span>
                  </div>
                  <span className="text-[10px] text-panel-400 block">
                    {isActive ? "Müşteriler mağazada görebilir" : "Mağazada gizlenir, sadece adminde görünür"}
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white transition"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brass-400 mb-2">
                    Özel Kategori Adı
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Örn: Kol Düğmesi, Tesbih..."
                    className="w-full px-4 py-3 bg-panel-950 border border-brass-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">
              Ürün Açıklaması
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="💍 Malzeme: %925 Kaliteli Gümüştür 📦 Ücretsiz Kargo 🚚 Gönderim Süresi: 1-3 iş günü..."
              className="w-full px-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white resize-none"
            />
          </div>

          {/* Translations Section */}
          <div className="border border-panel-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className="w-full px-4 py-3 bg-panel-900/50 hover:bg-panel-800 flex items-center justify-between transition"
            >
              <span className="text-sm font-bold text-brass-500">Çeviriler (İngilizce, Arapça, İspanyolca, Almanca, Rusça)</span>
              <span className="text-xs text-panel-400">{showTranslations ? "Gizle ▲" : "Göster ▼"}</span>
            </button>
            <div className="px-4 py-3 bg-panel-950 border-t border-panel-800 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-panel-400 max-w-md">
                Kaydettiğinizde Türkçe metin otomatik olarak 5 dile çevrilir. Türkçe metni değiştirirseniz çeviriler yeniden yapılır.
                {i18nSource && i18nSource === translationSourceKey(title, description)
                  ? " Çeviriler güncel."
                  : " Çeviriler güncel değil; kayıtta yenilenecek."}
              </p>
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={translating}
                className="px-3 py-2 bg-brass-600 hover:bg-brass-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
              >
                {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Şimdi otomatik çevir
              </button>
            </div>
            {showTranslations && (
              <div className="p-4 bg-panel-950 space-y-6">

                {/* English */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-panel-300 uppercase">İngilizce (English)</h4>
                  <input
                    type="text"
                    value={title_en}
                    onChange={editTranslation(setTitleEn)}
                    placeholder="English Title"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_en}
                    onChange={editTranslation(setDescriptionEn)}
                    placeholder="English Description"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Arabic */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-panel-300 uppercase">Arapça (العربية)</h4>
                  <input
                    type="text"
                    value={title_ar}
                    onChange={editTranslation(setTitleAr)}
                    placeholder="Arabic Title"
                    dir="auto"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_ar}
                    onChange={editTranslation(setDescriptionAr)}
                    placeholder="Arabic Description"
                    dir="auto"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Spanish */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-panel-300 uppercase">İspanyolca (Español)</h4>
                  <input
                    type="text"
                    value={title_es}
                    onChange={editTranslation(setTitleEs)}
                    placeholder="Spanish Title"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_es}
                    onChange={editTranslation(setDescriptionEs)}
                    placeholder="Spanish Description"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* German */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-panel-300 uppercase">Almanca (Deutsch)</h4>
                  <input
                    type="text"
                    value={title_de}
                    onChange={editTranslation(setTitleDe)}
                    placeholder="German Title"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_de}
                    onChange={editTranslation(setDescriptionDe)}
                    placeholder="German Description"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

                {/* Russian */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-panel-300 uppercase">Rusça (Русский)</h4>
                  <input
                    type="text"
                    value={title_ru}
                    onChange={editTranslation(setTitleRu)}
                    placeholder="Russian Title"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={description_ru}
                    onChange={editTranslation(setDescriptionRu)}
                    placeholder="Russian Description"
                    className="w-full px-4 py-2 bg-panel-900 border border-panel-800 rounded-lg text-sm text-white resize-none"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Prices: normal price + discount % give the discounted price (and back) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">
                Satış Fiyatı (₺ TL) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brass-500 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step={PRICE_STEP}
                  value={listPrice}
                  onChange={(e) => onListPrice(e.target.value)}
                  placeholder="5600"
                  className="w-full pl-9 pr-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white font-bold"
                />
              </div>
              <p className="mt-1 text-[10px] text-panel-500">İndirim yoksa müşteri bu fiyatı öder.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brass-400 mb-2">
                İndirim Oranı (%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brass-500 font-bold text-sm">%</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent}
                  onChange={(e) => onDiscountPercent(e.target.value)}
                  placeholder="İndirim yoksa boş"
                  className="w-full pl-8 pr-4 py-3 bg-panel-950 border border-brass-500/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-brass-400 font-bold placeholder:text-panel-600 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                İndirimli Satış Fiyatı (₺)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step={PRICE_STEP}
                  value={salePrice}
                  onChange={(e) => onSalePrice(e.target.value)}
                  placeholder="% girince kendiliğinden oluşur"
                  className="w-full pl-9 pr-4 py-3 bg-panel-950 border border-emerald-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-emerald-300 font-bold placeholder:text-panel-600 placeholder:font-normal"
                />
              </div>
            </div>
            {salePrice !== "" && listPrice !== "" && Number(salePrice) >= Number(listPrice) && (
              <p role="alert" className="md:col-span-3 -mt-1 text-xs text-amber-300">
                İndirimli fiyat, satış fiyatından düşük olmalı. Böyle kaydederseniz indirim gösterilmez.
              </p>
            )}
          </div>

          {/* Member price + which header menus the piece appears under */}
          <div className="bg-panel-950/60 border border-panel-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Üyelere özel fiyat (₺)</span>
              <span className="relative block">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step={PRICE_STEP}
                  value={memberPrice}
                  onChange={(e) => setMemberPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Yoksa boş bırakın"
                  className="w-full pl-9 pr-4 py-3 bg-panel-950 border border-emerald-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-emerald-300 font-bold placeholder:text-panel-600 placeholder:font-normal"
                />
              </span>
              {memberPrice !== "" && listPrice !== "" && Number(memberPrice) >= Number(salePrice !== "" && Number(salePrice) < Number(listPrice) ? salePrice : listPrice) && (
                <span role="alert" className="block mt-1.5 text-xs text-amber-300">Üye fiyatı satış fiyatından düşük olmalı; böyle kaydedilirse gösterilmez.</span>
              )}
            </label>
            <fieldset>
              <legend className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">Menüler</legend>
              <div className="flex flex-wrap gap-2">
                {MENUS.map((m) => {
                  const on = menus.includes(m.id);
                  return (
                    <label key={m.id} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${on ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-900 border-panel-700 text-panel-300"}`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => setMenus(on ? menus.filter((x) => x !== m.id) : [...menus, m.id])}
                      />
                      {MENU_LABELS[m.id]}
                    </label>
                  );
                })}
              </div>
              {(menus.length ? menus.includes("erkek") : productMenus(draftProduct).includes("erkek")) && (
                <div className="mt-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-panel-500 mb-1.5">Erkek Yüzük taşı</span>
                  <div className="flex flex-wrap gap-2">
                    {SUBMENUS.map((m) => {
                      const on = submenus.includes(m.id);
                      return (
                        <label key={m.id} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${on ? "bg-emerald-700 border-emerald-600 text-white" : "bg-panel-900 border-panel-700 text-panel-300"}`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            onChange={() => setSubmenus(on ? submenus.filter((x) => x !== m.id) : [...submenus, m.id])}
                          />
                          {SUBMENU_LABELS[m.id]}
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-panel-500">
                    {submenus.length
                      ? "Ürün yalnızca seçtiğiniz taş kategorilerinde görünür."
                      : `Seçim yapmazsanız taşına göre otomatik yerleşir: ${
                          productSubmenus({ ...draftProduct, menus: menus.length ? menus : undefined })
                            .map((id) => SUBMENU_LABELS[id])
                            .join(", ") || "hiçbiri"
                        }.`}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-panel-500">
                {menus.length
                  ? "Ürün yalnızca seçtiğiniz menülerde görünür."
                  : `Seçim yapmazsanız otomatik yerleşir: ${
                      productMenus(draftProduct)
                        .map((id) => MENU_LABELS[id])
                        .join(", ") || "hiçbir menü"
                    }.`}
              </p>
            </fieldset>
          </div>

          {/* Stock: own count, or a shared case (e.g. Sidre) that several products sell from */}
          <div className="bg-panel-950/60 border border-panel-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">Stok kasası</span>
              <select
                value={stockGroup}
                onChange={(e) => setStockGroup(e.target.value)}
                className="w-full px-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white"
              >
                <option value="">Yok — ürünün kendi stoğu</option>
                {stockGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.stock} stokta)
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-panel-500 mt-1.5">
                Kasalar “Kasa Stokları” sayfasından eklenir.
              </span>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-panel-400 mb-2">Stok adedi</span>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-3 bg-panel-950 border border-panel-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm text-white"
              />
              {stockGroup && (
                <span className="block text-[11px] text-panel-400 mt-1.5">
                  Bu modelin kendi adedi. Satılabilir adet, bu sayı ile{" "}
                  {stockGroups.find((g) => g.id === stockGroup)?.name ?? "kasa"} stoğunun (
                  {stockGroups.find((g) => g.id === stockGroup)?.stock ?? 0}) küçüğüdür; satışta ikisi de düşer.
                </span>
              )}
            </label>
          </div>

          {/* Ring Sizes Variation Selector */}
          <div className="bg-panel-950/60 border border-panel-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-brass-400">
                Parmak Numaraları (Ring Sizes)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRingSizes}
                  className="text-[11px] text-brass-400 hover:underline font-medium"
                >
                  Tümünü Seç (15-30)
                </button>
                <span className="text-panel-700">•</span>
                <button
                  type="button"
                  onClick={handleClearAllRingSizes}
                  className="text-[11px] text-panel-400 hover:underline font-medium"
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
                        ? "bg-brass-600 text-white border-brass-500 shadow-md shadow-brass-600/20"
                        : "bg-panel-900 text-panel-400 border-panel-800 hover:border-panel-700"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Custom Ring Size Add */}
            <div className="flex gap-2 pt-2 border-t border-panel-800/60">
              <input
                type="text"
                value={customRingSize}
                onChange={(e) => setCustomRingSize(e.target.value)}
                placeholder="Özel Ölçü Ekle (Örn: 14, Standart Boy...)"
                className="flex-1 px-3 py-1.5 bg-panel-900 border border-panel-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brass-500"
              />
              <button
                type="button"
                onClick={handleAddCustomRingSize}
                className="px-3 py-1.5 bg-panel-800 hover:bg-panel-700 text-xs font-semibold rounded-lg transition text-panel-200"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Image Upload Integration */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-panel-400">
              Ürün Görselleri
            </label>

            {/* File upload drag & drop area */}
            <div className="border-2 border-dashed border-panel-800 hover:border-brass-500/50 rounded-2xl p-6 text-center cursor-pointer bg-panel-950/60 transition group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-brass-500/10 text-brass-500 flex items-center justify-center group-hover:scale-110 transition duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs text-panel-200 font-semibold">
                  Bilgisayarınızdan Resim Seçin veya Sürükleyin
                </span>
                <span className="text-[10px] text-panel-500">WEBP, JPG, PNG formatları. Çoklu seçim desteklenir.</span>
              </label>
            </div>

            {/* Direct URL input option */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Veya Harici Resim URL'si Ekle (https://...)"
                className="flex-1 px-3 py-2 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brass-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-panel-800 hover:bg-panel-700 text-xs font-semibold rounded-xl transition text-panel-200 whitespace-nowrap"
              >
                URL Ekle
              </button>
            </div>

            {/* Image Previews */}
            {(existingImages.length > 0 || filePreviews.length > 0) && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-panel-400 font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 text-brass-500 fill-brass-500" />
                  Ana görsel yapmak istediğiniz fotoğrafa tıklayın.
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {/* Existing Image URLs */}
                  {existingImages.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className={`relative group rounded-xl overflow-hidden border aspect-square bg-panel-950 ${
                        idx === 0 && !newFirst ? "border-brass-500 ring-2 ring-brass-500 shadow-md shadow-brass-500/20" : "border-panel-800 hover:border-brass-500/60 cursor-pointer"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleMakeMainImage(idx)}
                        title={idx === 0 && !newFirst ? "Ana görsel" : "Ana görsel yap"}
                        className="absolute inset-0 w-full h-full"
                      >
                        <img src={url} alt={`Görsel ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>

                      {idx === 0 && !newFirst && (
                        <span className="absolute top-1 left-1 bg-brass-500 text-[9px] font-bold text-panel-950 px-1.5 py-0.5 rounded shadow">
                          Ana Görsel
                        </span>
                      )}

                      {!(idx === 0 && !newFirst) && (
                        <span className="pointer-events-none absolute bottom-1 inset-x-1 text-center bg-black/70 text-[9px] font-bold text-white py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                          Ana görsel yap
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* New File Previews */}
                  {filePreviews.map((previewUrl, idx) => (
                    <div
                      key={`new-${idx}`}
                      className={`relative group rounded-xl overflow-hidden border aspect-square bg-panel-950 ${
                        newFirst && idx === 0 ? "border-brass-500 ring-2 ring-brass-500" : "border-brass-500/60 cursor-pointer"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleMakeNewFileMain(idx)}
                        title={newFirst && idx === 0 ? "Ana görsel" : "Ana görsel yap"}
                        className="absolute inset-0 w-full h-full"
                      >
                        <img src={previewUrl} alt="Yeni Yüklenen" className="w-full h-full object-cover" />
                      </button>
                      <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${newFirst && idx === 0 ? "bg-brass-500 text-panel-950" : "bg-emerald-500 text-white"}`}>
                        {newFirst && idx === 0 ? "Ana Görsel" : "Yeni"}
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
          <div className="space-y-3 pt-4 border-t border-panel-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brass-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brass-400" />
              Hover Özel Ürün Videosu (Opsiyonel)
            </label>
            <p className="text-[11px] text-panel-400">
              Mouse ile ürünün üzerine gelindiğinde gösterilecek kısa video (.mp4, .webm veya harici video URL'si). Yüklenmezse normal resim gösterilir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Video File Upload */}
              <div className="border border-dashed border-brass-500/30 hover:border-brass-500/80 rounded-xl p-4 text-center cursor-pointer bg-panel-950/80 transition group">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                  id="video-file-upload"
                />
                <label htmlFor="video-file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <div className="p-2.5 bg-brass-500/10 text-brass-500 rounded-full group-hover:scale-110 transition duration-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  {videoFile ? (
                    <>
                      <span className="text-xs text-brass-400 font-bold truncate max-w-[200px]">
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
                      <span className="text-[10px] text-panel-400 font-medium">
                        Farklı video seçmek için tıklayın
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-panel-200 font-semibold">
                        Video Dosyası Yükle
                      </span>
                      <span className="text-[10px] text-panel-500">MP4, WEBM formatı desteklenir</span>
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
                  className="w-full px-3 py-2.5 bg-panel-950 border border-panel-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brass-500"
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
              <div className="mt-3 bg-panel-950/80 border border-brass-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brass-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Hover Video Canlı Kart Önizlemesi (Fareyi üzerine getirin):
                  </span>
                  <span className="text-[10px] text-panel-400 font-normal hidden sm:inline">Ana sayfada aynen böyle görünecektir</span>
                </div>

                <div
                  className="group relative aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-panel-800 bg-panel-900 cursor-pointer shadow-xl"
                  onMouseEnter={(e) => {
                    const vid = e.currentTarget.querySelector("video");
                    if (vid) vid.play().catch(() => {});
                  }}
                >
                  {existingImages.length > 0 || filePreviews.length > 0 ? (
                    <img
                      src={(newFirst && filePreviews[0]) || existingImages[0] || filePreviews[0]}
                      alt="Önizleme"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-panel-500 text-xs">Görsel Yok</div>
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
                    <span className="bg-black/75 backdrop-blur-md text-brass-400 text-[9px] font-bold px-2 py-0.5 rounded truncate max-w-[65%] shadow">
                      {category === "Diğer" && customCategory ? customCategory : category}
                    </span>
                    {salePrice !== "" && listPrice !== "" && Number(salePrice) < Number(listPrice) && (
                      <span className="bg-gradient-to-r from-red-600 to-brass-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 shadow">
                        -%{percentOff(Number(listPrice), Number(salePrice))} İNDİRİM
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 inset-x-2 bg-white/90 text-panel-900 text-[10px] font-bold py-1.5 rounded-lg text-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                    Detayları Gör
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-panel-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-panel-800 text-panel-400 hover:bg-panel-800 hover:text-white text-sm font-medium transition"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brass-600 hover:bg-brass-700 text-white text-sm font-bold shadow-lg shadow-brass-600/20 flex items-center gap-2 transition disabled:opacity-50"
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
