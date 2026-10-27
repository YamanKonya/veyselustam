"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Mail, KeyRound, AlertCircle, Loader2, Check } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import AuthShell, { authField, authErrorKey, nextPath } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // keep ?next= when switching between sign-in and sign-up
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(window.location.search), []);
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push(nextPath());
    } catch (err: any) {
      setError(t(authErrorKey(err?.code)));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError(t("log_reset_need_email"));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(t("log_reset_sent"));
    } catch (err: any) {
      // Don't reveal whether an account exists for this email.
      if (err?.code === "auth/invalid-email") setError(t("auth_invalid_email"));
      else setNotice(t("log_reset_sent"));
    }
  };


  return (
    <AuthShell title={t("log_title")} subtitle={t("log_sub")}>
      {error && (
        <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mb-5 p-3 bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-800 text-sm">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> {notice}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reg_email")}</span>
          <span className="relative block">
            <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={authField} dir="ltr" />
          </span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">{t("reg_password")}</span>
          <span className="relative block">
            <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={authField} dir="ltr" />
          </span>
        </label>
        <div className="flex justify-end">
          <button type="button" onClick={resetPassword} className="text-xs text-slate-500 hover:text-versace-gold-700 hover:underline">
            {t("log_forgot")}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-versace-green-900 text-versace-gold-50 text-sm font-semibold uppercase tracking-wider hover:bg-versace-green-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("log_loading") : t("log_button")}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500 text-center">
        {t("log_no")}{" "}
        <Link href={`/register${query}`} className="font-semibold text-versace-gold-700 hover:underline">
          {t("log_register")}
        </Link>
      </p>
    </AuthShell>
  );
}
