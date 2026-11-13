"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Loader2, AlertCircle, Search, RefreshCw, MessageCircle } from "lucide-react";
import { UserProfile, Order } from "@/types";
import { fetchMembers } from "@/services/memberService";
import { getOrders } from "@/services/orderService";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";

const waLink = (phone: string) => {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "9" + d; // 0533… → 90533…
  else if (d.length === 10) d = "90" + d; // 533… → 90533…
  return `https://wa.me/${d}`;
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, o] = await Promise.all([fetchMembers(), getOrders().catch(() => [] as Order[])]);
      setMembers(m);
      setOrders(o);
    } catch (err: any) {
      setError(
        err?.code === "permission-denied"
          ? "Üyeler okunamadı: Firebase kurallarının güncel hâli yayınlanmamış olabilir. firestore.rules dosyasını Firebase konsolunda yayınlayın."
          : "Üyeler yüklenemedi. İnternet bağlantısını kontrol edip tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orderStats = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    for (const o of orders) {
      if (!o.userId || o.userId === "guest_user") continue;
      const s = m.get(o.userId) || { count: 0, total: 0 };
      s.count += 1;
      s.total += Number(o.totalAmount) || 0;
      m.set(o.userId, s);
    }
    return m;
  }, [orders]);

  const shown = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    if (!term) return members;
    return members.filter((m) =>
      [m.email, m.phone, m.name].some((v) => (v || "").toLocaleLowerCase("tr").includes(term))
    );
  }, [members, q]);

  const last30 = useMemo(() => {
    const since = Date.now() - 30 * 24 * 3600 * 1000;
    return members.filter((m) => m.createdAt && new Date(m.createdAt).getTime() >= since).length;
  }, [members]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brass-400" /> Üyeler
          </h1>
          <p className="text-sm text-panel-400 mt-1">Sitede üye olan müşteriler. En yeni üye en üstte.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-panel-300 bg-panel-900 border border-panel-700 hover:border-brass-500"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div className="p-4 rounded-2xl bg-panel-900 border border-panel-800">
          <p className="text-xs text-panel-400">Toplam üye</p>
          <p className="text-2xl font-extrabold text-panel-100">{loading ? "…" : members.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-panel-900 border border-panel-800">
          <p className="text-xs text-panel-400">Son 30 gün</p>
          <p className="text-2xl font-extrabold text-panel-100">{loading ? "…" : last30}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-panel-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="E-posta, telefon veya isim ara"
          className="w-full bg-panel-950 border border-panel-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-panel-100 placeholder:text-panel-500 focus:outline-none focus:border-brass-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-panel-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…
        </div>
      ) : !error && shown.length === 0 ? (
        <p className="text-sm text-panel-400">{members.length ? "Aramaya uyan üye yok." : "Henüz üye yok."}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-panel-800">
          <table className="w-full text-sm">
            <thead className="bg-panel-900 text-panel-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Üye</th>
                <th className="text-left px-4 py-3">Telefon</th>
                <th className="text-left px-4 py-3">Kayıt tarihi</th>
                <th className="text-right px-4 py-3">Sipariş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-800">
              {shown.map((m) => {
                const s = orderStats.get(m.id);
                return (
                  <tr key={m.id} className="text-panel-200 hover:bg-panel-900/60">
                    <td className="px-4 py-3">
                      {m.name && <p className="font-semibold text-panel-100">{m.name}</p>}
                      <a href={`mailto:${m.email}`} className="text-panel-300 hover:text-brass-400 break-all">
                        {m.email || "—"}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {m.phone ? (
                        <a
                          href={waLink(m.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 hover:text-brass-400"
                          title="WhatsApp'tan yaz"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> {m.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-panel-400">{fmtDate(m.createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {s ? (
                        <span>
                          {s.count} · <span className="text-panel-400">{s.total.toLocaleString("tr-TR")} ₺</span>
                        </span>
                      ) : (
                        <span className="text-panel-500">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
