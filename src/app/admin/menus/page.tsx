"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LayoutList, AlertCircle } from "lucide-react";
import { Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { MENUS, MENU_LABELS, MenuId, productMenus, saveMenuSettings, useMenuSettings } from "@/lib/menus";

// Switch the header menus on and off. A menu with no products yet (e.g. brooches)
// stays hidden until its pieces are added and it is ticked here.
export default function AdminMenusPage() {
  const enabled = useMenuSettings();
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [saving, setSaving] = useState<MenuId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeProducts((data) => data.length && setProducts(data));
    return () => unsub();
  }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(MENUS.map((m) => [m.id, 0])) as Record<MenuId, number>;
    products.filter((p) => p.isActive !== false).forEach((p) => productMenus(p).forEach((id) => c[id]++));
    return c;
  }, [products]);

  const toggle = async (id: MenuId) => {
    setSaving(id);
    setError("");
    try {
      await saveMenuSettings({ ...enabled, [id]: !enabled[id] });
    } catch (err: any) {
      setError(
        err?.code === "permission-denied"
          ? "Kaydedilemedi: Firebase kurallarının güncel hâli yayınlanmamış olabilir."
          : "Kaydedilemedi. İnternet bağlantısını kontrol edip tekrar deneyin."
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
          <LayoutList className="w-6 h-6 text-brass-400" /> Menüler
        </h1>
        <p className="text-sm text-panel-400 mt-1">
          Sitenin üst menüsünde hangi başlıkların görüneceğini seçin. Ürünler menülere kategorisine göre otomatik yerleşir;
          ürün düzenleme ekranındaki “Menüler” kutularından elle de seçebilirsiniz.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <ul className="bg-panel-900 border border-panel-800 rounded-2xl divide-y divide-panel-800">
        {MENUS.map((m) => {
          const on = enabled[m.id];
          return (
            <li key={m.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-bold text-panel-100">{MENU_LABELS[m.id]}</p>
                <p className={`text-xs mt-0.5 ${counts[m.id] ? "text-panel-400" : "text-amber-300"}`}>
                  {counts[m.id] ? `${counts[m.id]} aktif ürün` : "Henüz ürün yok"}
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className={`text-xs font-semibold ${on ? "text-emerald-400" : "text-panel-500"}`}>{on ? "Sitede görünüyor" : "Gizli"}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={on}
                  disabled={saving === m.id}
                  onChange={() => toggle(m.id)}
                  aria-label={`${MENU_LABELS[m.id]} menüsü`}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`relative w-11 h-6 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brass-500 ${on ? "bg-emerald-600" : "bg-panel-700"} ${saving === m.id ? "opacity-50" : ""}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
