"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, Star, Check, Trash2, EyeOff, Loader2, AlertCircle, Plus } from "lucide-react";
import { Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { translateProduct } from "@/i18n/productTranslations";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import {
  fetchAllReviews,
  setReviewStatus,
  deleteReview,
  addReviewAsAdmin,
  Review,
  ReviewSource,
  REVIEW_LIMITS,
} from "@/services/reviewService";

const SOURCES: { id: ReviewSource; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "site", label: "Site / diğer" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-brass-400 text-brass-400" : "text-panel-600"}`} />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved">("pending");

  // manual add (a review a customer sent on WhatsApp, Instagram…)
  const [pid, setPid] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [source, setSource] = useState<ReviewSource>("whatsapp");
  const [date, setDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const unsub = subscribeProducts((data) => data.length && setProducts(data));
    return () => unsub();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReviews(await fetchAllReviews());
    } catch (err: any) {
      setError(
        err?.code === "permission-denied"
          ? "Yorumlar okunamadı: Firebase kurallarının güncel hâli (reviews bölümü) yayınlanmamış. firestore.rules dosyasını Firebase konsolunda yayınlayın."
          : "Yorumlar yüklenemedi. İnternet bağlantısını kontrol edip tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const titleOf = useMemo(() => {
    const m = new Map(products.map((p) => [p.id, translateProduct(p, "tr").title] as const));
    return (id: string) => m.get(id) || id;
  }, [products]);
  const options = useMemo(
    () => products.filter((p) => p.id).map((p) => ({ id: p.id!, title: titleOf(p.id!) })).sort((a, b) => a.title.localeCompare(b.title, "tr")),
    [products, titleOf]
  );

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      flash(msg);
      load();
    } catch {
      flash("İşlem yapılamadı");
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || name.trim().length < 2 || text.trim().length < 3 || !consent) return;
    setSaving(true);
    try {
      await addReviewAsAdmin({ productId: pid, name, rating, text, source, date: date ? new Date(date + "T12:00:00") : undefined });
      setName("");
      setText("");
      setRating(5);
      setDate("");
      setConsent(false);
      flash("Yorum yayınlandı");
      setFilter("approved");
      load();
    } catch {
      flash("Yorum eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const shown = reviews.filter((r) => r.status === filter);
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const field = "w-full bg-panel-950 border border-panel-700 rounded-xl px-3 py-2.5 text-sm text-panel-100 placeholder:text-panel-500 focus:outline-none focus:border-brass-500";

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
          <MessageSquareQuote className="w-6 h-6 text-brass-400" /> Yorumlar
        </h1>
        <p className="text-sm text-panel-400 mt-1">
          Müşterilerin sitede yazdığı yorumlar onayınızdan sonra ürün sayfasında görünür. WhatsApp veya Instagram'dan gelen yorumları buradan ekleyebilirsiniz.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <section className="bg-panel-900 border border-panel-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-panel-100 flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-brass-400" /> WhatsApp / Instagram yorumu ekle
        </h2>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">Ürün</span>
            <select value={pid} onChange={(e) => setPid(e.target.value)} className={field} required>
              <option value="">Ürün seçin…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">Müşterinin adı (ör. “Ahmet K.”)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={REVIEW_LIMITS.name} className={field} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="block text-xs font-semibold text-panel-300 mb-1.5">Nereden geldi</span>
              <select value={source} onChange={(e) => setSource(e.target.value as ReviewSource)} className={field}>
                {SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-xs font-semibold text-panel-300 mb-1.5">Tarih</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
          </div>
          <div className="md:col-span-2">
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">Puan</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Puan">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}/5`} onClick={() => setRating(n)} className="p-1">
                  <Star className={`w-6 h-6 ${n <= rating ? "fill-brass-400 text-brass-400" : "text-panel-600"}`} />
                </button>
              ))}
            </div>
          </div>
          <label className="md:col-span-2">
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">Yorum (müşterinin yazdığı gibi)</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={REVIEW_LIMITS.text} rows={4} className={field} required />
          </label>
          <label className="md:col-span-2 flex items-start gap-2 text-sm text-panel-300">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            Müşteri bu yorumun adıyla sitede yayınlanmasına izin verdi ve yorumu değiştirmeden ekliyorum.
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || !consent}
              className="px-5 py-2.5 rounded-xl bg-brass-600 hover:bg-brass-500 text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Yorumu yayınla
            </button>
          </div>
        </form>
      </section>

      <section className="bg-panel-900 border border-panel-800 rounded-2xl p-5">
        <div role="group" aria-label="Yorum durumu" className="flex gap-2 mb-4">
          {(["pending", "approved"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === f ? "bg-brass-600 text-white" : "bg-panel-800 text-panel-300"}`}
            >
              {f === "pending" ? `Onay bekleyen (${pendingCount})` : `Yayında (${reviews.length - pendingCount})`}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-panel-500">Yükleniyor…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-panel-500">{filter === "pending" ? "Onay bekleyen yorum yok." : "Henüz yayında yorum yok."}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((r) => (
              <li key={r.id} className="p-4 rounded-xl bg-panel-950 border border-panel-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Stars value={r.rating} />
                    <span className="font-semibold text-panel-100">{r.name}</span>
                    <span className="text-xs text-panel-500">
                      {r.createdAt.toLocaleDateString("tr-TR")} · {SOURCES.find((s) => s.id === r.source)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {r.status === "pending" ? (
                      <button type="button" onClick={() => act(() => setReviewStatus(r.id, "approved"), "Yorum yayınlandı")}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Onayla
                      </button>
                    ) : (
                      <button type="button" onClick={() => act(() => setReviewStatus(r.id, "pending"), "Yorum yayından kaldırıldı")}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-panel-800 hover:bg-panel-700 text-panel-200 inline-flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" /> Yayından kaldır
                      </button>
                    )}
                    <button type="button" onClick={() => confirm("Bu yorum silinsin mi?") && act(() => deleteReview(r.id), "Yorum silindi")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-900/60 hover:bg-red-800 text-red-200 inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-brass-300">{titleOf(r.productId)}</p>
                <p className="mt-1.5 text-sm text-panel-200 whitespace-pre-line" dir="auto">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-panel-950 border border-brass-500/50 text-panel-100 text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
