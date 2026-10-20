"use client";

import React, { useState } from "react";
import { KeyRound, User, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await adminLogin(username, password);
      if (result === "wrong") setError("Kullanıcı adı veya şifre yanlış.");
      if (result === "not-admin") setError("Bu hesabın yönetici yetkisi yok.");
    } catch (err: any) {
      setError(
        err?.code === "auth/too-many-requests"
          ? "Çok fazla hatalı deneme yapıldı. Birkaç dakika sonra tekrar deneyin."
          : "Giriş yapılamadı. İnternet bağlantısını kontrol edip tekrar deneyin."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-versace-green-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/images/logo-128.webp" alt="Veysel Ustam" className="w-16 h-16 mx-auto object-contain" />
          <h1 className="font-display text-3xl text-versace-green-900 mt-3">Yönetim paneli</h1>
          <p className="text-sm text-slate-500 mt-1">Devam etmek için giriş yapın.</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı adı</span>
            <div className="relative">
              <User className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full ps-9 pe-3 py-2.5 border border-slate-300 focus:outline-none focus:border-versace-gold-500 text-sm"
              />
            </div>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Şifre</span>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full ps-9 pe-3 py-2.5 border border-slate-300 focus:outline-none focus:border-versace-gold-500 text-sm"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50 font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Giriş yap
          </button>
        </form>
      </div>
    </div>
  );
}
