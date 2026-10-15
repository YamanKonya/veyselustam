"use client";

import React, { useState } from "react";
import { applyBulkDiscount, clearBulkDiscount } from "@/services/productService";
import { 
  X, 
  Percent, 
  Tag, 
  Zap, 
  Check, 
  RotateCcw,
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";

interface BulkCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedProductIds: string[];
  onSuccess: (message: string) => void;
}

const PRESET_PERCENTAGES = [10, 15, 20, 25, 30, 50];

export default function BulkCampaignModal({
  isOpen,
  onClose,
  categories,
  selectedProductIds,
  onSuccess,
}: BulkCampaignModalProps) {
  const [selectedPercent, setSelectedPercent] = useState<number>(20);
  const [customPercent, setCustomPercent] = useState<string>("");
  const [targetCategory, setTargetCategory] = useState<string>("Hepsi");
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"apply" | "clear">("apply");

  if (!isOpen) return null;

  const activePercent = customPercent ? parseFloat(customPercent) || 0 : selectedPercent;

  const handleApplyDiscount = async () => {
    setLoading(true);
    try {
      if (mode === "apply") {
        if (activePercent <= 0 || activePercent >= 100) {
          alert("Lütfen %1 ile %99 arasında geçerli bir indirim oranı girin.");
          setLoading(false);
          return;
        }
        const count = await applyBulkDiscount(
          activePercent,
          targetCategory,
          selectedProductIds
        );
        onSuccess(`Başarılı! ${count} adet ürüne %${activePercent} indirim uygulandı.`);
      } else {
        const count = await clearBulkDiscount(targetCategory, selectedProductIds);
        onSuccess(`${count} adet ürünün kampanyası kaldırıldı ve orijinal fiyatlarına döndürüldü.`);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Toplu Kampanya Yönetimi</h2>
              <p className="text-xs text-slate-400">Ürünlere toplu indirim uygulayın veya kaldırın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setMode("apply")}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mode === "apply"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Percent className="w-4 h-4" />
              İndirim Uygula
            </button>
            <button
              onClick={() => setMode("clear")}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                mode === "clear"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Kampanyaları Sıfırla
            </button>
          </div>

          {/* Targeted Products Info */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Layers className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-xs">
              {selectedProductIds.length > 0 ? (
                <p className="text-amber-400 font-semibold">
                  Tablodan seçilen <span className="font-bold underline">{selectedProductIds.length} adet özel ürüne</span> işlem yapılacaktır.
                </p>
              ) : (
                <p className="text-slate-300">
                  Kategoriye göre tüm ürünler hedeflenecektir.
                </p>
              )}
            </div>
          </div>

          {mode === "apply" ? (
            <>
              {/* Category Filter Target */}
              {selectedProductIds.length === 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Hedef Kategori
                  </label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "Hepsi" ? "Tüm Ürünler (Tüm Mağaza)" : cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Discount Percentage Options */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  İndirim Oranı (%)
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {PRESET_PERCENTAGES.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setSelectedPercent(pct);
                        setCustomPercent("");
                      }}
                      className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                        selectedPercent === pct && !customPercent
                          ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      %{pct}
                    </button>
                  ))}
                </div>

                {/* Custom Percentage Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={customPercent}
                    onChange={(e) => setCustomPercent(e.target.value)}
                    placeholder="Veya Özel Yüzde Girin (Örn: 35)"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-red-400">
                <AlertCircle className="w-4 h-4" /> Kampanyaları Sıfırlama Onayı
              </p>
              <p>
                Seçilen ürünlerin kampanyalı fiyatları kaldırılacak ve orijinal satış fiyatlarına geri döndürülecektir.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs font-semibold transition"
          >
            İptal
          </button>
          <button
            onClick={handleApplyDiscount}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition flex items-center gap-2 ${
              mode === "apply"
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
            }`}
          >
            {mode === "apply" ? ` %${activePercent} İndirimi Uygula` : "Kampanyaları Sıfırla"}
          </button>
        </div>
      </div>
    </div>
  );
}
