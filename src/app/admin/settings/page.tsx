"use client";

import React, { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { changeAdminCredentials, WrongPasswordError } from "@/lib/adminAuth";

export default function AdminSettingsPage() {
  const { adminUsername, setAdminUsername } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [username, setUsername] = useState(adminUsername || "");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ ok: false, text: "Yeni şifre en az 6 karakter olmalı." });
      return;
    }
    if (newPassword !== repeat) {
      setMessage({ ok: false, text: "Yeni şifreler birbiriyle aynı değil." });
      return;
    }
    if (!username.trim()) {
      setMessage({ ok: false, text: "Kullanıcı adı boş olamaz." });
      return;
    }
    setBusy(true);
    try {
      const saved = await changeAdminCredentials(currentPassword, username, newPassword);
      setAdminUsername(saved);
      setCurrentPassword("");
      setNewPassword("");
      setRepeat("");
      setMessage({ ok: true, text: "Giriş bilgileri güncellendi. Bir sonraki girişte yenilerini kullanın." });
    } catch (err: any) {
      const text =
        err instanceof WrongPasswordError
          ? err.message
          : err?.code === "auth/too-many-requests"
          ? "Çok fazla hatalı deneme yapıldı. Birkaç dakika sonra tekrar deneyin."
          : err?.code === "auth/weak-password"
          ? "Yeni şifre çok zayıf, daha uzun bir şifre seçin."
          : "Kaydedilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.";
      setMessage({ ok: false, text });
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
        <KeyRound className="w-6 h-6 text-amber-400" /> Giriş bilgileri
      </h1>
      <p className="text-sm text-slate-400 mt-1">Yönetim paneline giriş için kullanılan kullanıcı adı ve şifreyi değiştirin.</p>

      {message && (
        <div
          role="status"
          className={`mt-6 p-3 rounded-xl text-sm flex items-start gap-2 border ${
            message.ok ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-red-950 border-red-800 text-red-300"
          }`}
        >
          {message.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Mevcut şifre</span>
          <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Kullanıcı adı</span>
          <input type="text" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Yeni şifre</span>
          <input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="block text-sm text-slate-300 mb-1">Yeni şifre (tekrar)</span>
          <input type="password" required autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={field} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Giriş bilgilerini kaydet
        </button>
      </form>
    </div>
  );
}
