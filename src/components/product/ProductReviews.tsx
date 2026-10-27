"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MessageCircle, Instagram, Check, Loader2, UserRound } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { fetchApprovedReviews, submitReview, Review, REVIEW_LIMITS } from "@/services/reviewService";

const LOCALES: Record<string, string> = { tr: "tr-TR", en: "en-GB", es: "es-ES", de: "de-DE", ar: "ar", ru: "ru-RU" };

function Stars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? "fill-versace-gold-500 text-versace-gold-500" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "invalid">("idle");

  useEffect(() => {
    fetchApprovedReviews(productId).then(setReviews).catch(() => setReviews([]));
  }, [productId]);

  // members only: prefill the name they gave at sign-up
  useEffect(() => {
    if (profile?.name && !name) setName(profile.name);
  }, [profile?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2 || text.trim().length < 3) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      await submitReview({ uid: user.uid, productId, name, rating, text, lang: language });
      setState("sent");
      setText("");
      setRating(5);
    } catch {
      setState("error");
    }
  };

  const field = "w-full border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-versace-gold-500";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 id="reviews-heading" className="font-display text-3xl text-versace-green-900">{t("reviews_title")}</h2>
          {reviews.length > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Stars value={Math.round(average)} />
              <span className="tabular-nums font-semibold text-versace-green-900">{average.toFixed(1).replace(".", ",")}</span>
              <span>· {reviews.length} {t("reviews_count")}</span>
            </p>
          )}
        </div>
        {!open && state !== "sent" && user && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-5 py-3 text-sm font-semibold bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700 transition-colors"
          >
            {t("reviews_write")}
          </button>
        )}
      </div>

      {!user && (
        <div className="mb-8 p-5 border border-versace-gold-500/40 bg-versace-gold-50/40 flex flex-wrap items-center justify-between gap-4 max-w-3xl">
          <p className="text-sm text-slate-700 flex items-center gap-2">
            <UserRound className="w-5 h-5 text-versace-gold-700 flex-shrink-0" /> {t("reviews_login_cta")}
          </p>
          <div className="flex gap-2">
            <Link href={`/register?next=/product/${productId}`} className="px-5 py-2.5 text-sm font-semibold bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700 transition-colors">
              {t("member_join")}
            </Link>
            <Link href={`/login?next=/product/${productId}`} className="px-5 py-2.5 text-sm font-semibold border border-versace-green-900 text-versace-green-900 hover:bg-versace-green-900 hover:text-versace-gold-50 transition-colors">
              {t("member_login")}
            </Link>
          </div>
        </div>
      )}

      {state === "sent" && (
        <p role="status" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" /> {t("reviews_thanks")}
        </p>
      )}

      {open && user && state !== "sent" && (
        <form onSubmit={send} className="mb-8 p-5 border border-versace-gold-500/40 bg-versace-gold-50/40 grid gap-4 max-w-2xl">
          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reviews_rating")}</span>
            <div role="radiogroup" aria-label={t("reviews_rating")} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n}/5`}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star className={`w-7 h-7 ${n <= rating ? "fill-versace-gold-500 text-versace-gold-500" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reviews_name")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={REVIEW_LIMITS.name} className={field} autoComplete="given-name" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reviews_text")}</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={REVIEW_LIMITS.text} rows={4} className={field} />
          </label>
          {(state === "error" || state === "invalid") && (
            <p role="alert" className="text-sm text-red-700">{t(state === "error" ? "reviews_error" : "reviews_invalid")}</p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={state === "sending"}
              className="px-6 py-3 text-sm font-semibold bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
            >
              {state === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
              {state === "sending" ? t("reviews_sending") : t("reviews_submit")}
            </button>
            <p className="text-xs text-slate-500">{t("reviews_privacy")}</p>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">{t("reviews_empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="p-5 border border-slate-100 bg-white">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <time className="text-xs text-slate-400 tabular-nums" dateTime={r.createdAt.toISOString()}>
                  {r.createdAt.toLocaleDateString(LOCALES[language] || "tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </div>
              <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-line" dir="auto">{r.text}</p>
              <p className="mt-3 text-sm font-semibold text-versace-green-900 flex items-center gap-2" dir="auto">
                {r.name}
                {r.source === "whatsapp" && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700">
                    <MessageCircle className="w-3.5 h-3.5" /> {t("reviews_via_whatsapp")}
                  </span>
                )}
                {r.source === "instagram" && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-pink-700">
                    <Instagram className="w-3.5 h-3.5" /> {t("reviews_via_instagram")}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
