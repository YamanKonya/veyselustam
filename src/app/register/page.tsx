"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Mail, Phone, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthShell, { authField, authErrorKey, nextPath } from "@/components/auth/AuthShell";

// Quick member sign-up: email, phone and password, nothing else.
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // keep ?next= when switching between sign-in and sign-up
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(window.location.search), []);
  const { t } = useLanguage();
  const { setUserProfile } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      setError(t("auth_phone_invalid"));
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile: UserProfile = {
        id: user.uid,
        email: user.email || email.trim(),
        phone: (phone.trim().startsWith("+") ? "+" : "") + digits,
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      // The account works even if saving the profile fails (the site then uses a basic profile).
      await setDoc(doc(db, "users", user.uid), profile).catch(() => {});
      setUserProfile(profile);
      router.push(nextPath());
    } catch (err: any) {
      setError(t(authErrorKey(err?.code)));
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthShell title={t("reg_title")} subtitle={t("reg_sub")}>
      {error && (
        <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
      <form onSubmit={handleRegister} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reg_email")}</span>
          <span className="relative block">
            <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={authField} dir="ltr" />
          </span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reg_phone")}</span>
          <span className="relative block">
            <Phone className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" required autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("reg_phone_ph")} className={authField} dir="ltr" />
          </span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reg_password")}</span>
          <span className="relative block">
            <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("reg_password_hint")} className={authField} dir="ltr" />
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-versace-green-900 text-versace-gold-50 text-sm font-semibold uppercase tracking-wider hover:bg-versace-green-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("reg_loading") : t("reg_button")}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500 text-center">
        {t("reg_have")}{" "}
        <Link href={`/login${query}`} className="font-semibold text-versace-gold-700 hover:underline">
          {t("reg_login")}
        </Link>
      </p>
    </AuthShell>
  );
}
