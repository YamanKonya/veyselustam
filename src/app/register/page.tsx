"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole, UserProfile } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { KeyRound, Mail, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email || "",
        role: role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("register_error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-amber-800">
            <ShoppingBag className="w-8 h-8 text-amber-600" />
            {t("brand_name")}
          </Link>
          <h2 className="text-xl font-bold text-slate-900 mt-4">{t("register_title")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("register_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t("login_email_label")}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@domain.com"
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t("login_password_label")}
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t("register_role_label")}
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                  role === "customer"
                    ? "bg-amber-50 border-amber-600 text-amber-900"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("register_customer")}
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${
                  role === "admin"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {t("register_admin")}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
          >
            {loading ? t("register_loading") : t("register_button")}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t("register_has_account")}{" "}
          <Link href="/login" className="font-semibold text-amber-700 hover:underline">
            {t("register_login_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
