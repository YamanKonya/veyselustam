"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Minus, Trash2, AlertCircle, Loader2, Save } from "lucide-react";
import { Product, StockGroup } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { useStockGroups, saveStockGroup, deleteStockGroup, slugifyGroupName } from "@/services/stockService";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";

export default function AdminStockPage() {
  const { groups, loaded } = useStockGroups();
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // Typed-in stock values not yet saved, per group
  const [drafts, setDrafts] = useState<Record<string, number | "">>({});

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => data.length && setProducts(data));
    return () => unsubscribe();
  }, []);

  const linked = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of products) if (p.stockGroup) (map[p.stockGroup] ||= []).push(p);
    return map;
  }, [products]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setError("");
    try {
      await action();
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi. Yönetici olarak giriş yaptığınızdan ve internet bağlantınızdan emin olup tekrar deneyin.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = slugifyGroupName(newName);
    if (!id) {
      setError("Kasa adı girin.");
      return;
    }
    if (groups.some((g) => g.id === id)) {
      setError(`“${newName.trim()}” adında bir kasa zaten var.`);
      return;
    }
    run("new", async () => {
      await saveStockGroup(id, newName, Number(newStock) || 0);
      setNewName("");
      setNewStock("");
    });
  };

  const change = (g: StockGroup, stock: number) =>
    run(g.id, async () => {
      await saveStockGroup(g.id, g.name, stock);
      setDrafts((d) => {
        const { [g.id]: _, ...rest } = d;
        return rest;
      });
    });

  const remove = (g: StockGroup) => {
    const count = linked[g.id]?.length || 0;
    const warning = count
      ? `“${g.name}” kasasına bağlı ${count} ürün var. Silerseniz bu ürünler kendi stok sayılarına döner. Devam edilsin mi?`
      : `“${g.name}” kasası silinsin mi?`;
    if (window.confirm(warning)) run(g.id, () => deleteStockGroup(g.id));
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
        <Boxes className="w-6 h-6 text-brass-400" /> Kasa Stokları
      </h1>
      <p className="text-sm text-panel-400 mt-1 max-w-2xl">
        Aynı yüzük kasası farklı taşlarla satılıyorsa (ör. Sidre Akik, Sidre Hematit) burada bir kasa tanımlayın ve
        ürünleri ürün düzenleme ekranından bu kasaya bağlayın. Bağlı ürünlerden hangisi satılırsa satılsın kasa stoğundan
        düşülür; kasa bitince hepsi “Tükendi” görünür.
      </p>

      {error && (
        <div role="alert" className="mt-6 p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-6 p-4 bg-panel-900 border border-panel-800 rounded-2xl flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="block text-xs text-panel-300 mb-1">Yeni kasa adı</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ör. Sidre"
            className="w-full px-3 py-2.5 bg-panel-950 border border-panel-700 rounded-xl text-sm text-panel-100 focus:outline-none focus:border-brass-500"
          />
        </label>
        <label className="w-32">
          <span className="block text-xs text-panel-300 mb-1">Stok</span>
          <input
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0"
            className="w-full px-3 py-2.5 bg-panel-950 border border-panel-700 rounded-xl text-sm text-panel-100 focus:outline-none focus:border-brass-500"
          />
        </label>
        <button
          type="submit"
          disabled={busy === "new"}
          className="px-4 py-2.5 bg-brass-600 hover:bg-brass-500 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Kasa ekle
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {!loaded && <p className="text-sm text-panel-400">Kasalar yükleniyor…</p>}
        {loaded && groups.length === 0 && (
          <p className="text-sm text-panel-400">Henüz kasa yok. Yukarıdan ilk kasanızı ekleyin.</p>
        )}
        {groups.map((g) => {
          const items = linked[g.id] || [];
          const draft = drafts[g.id];
          return (
            <div key={g.id} className="p-4 bg-panel-900 border border-panel-800 rounded-2xl">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[160px]">
                  <h2 className="text-lg font-bold text-panel-50">{g.name}</h2>
                  <p className={`text-xs mt-0.5 ${g.stock > 0 ? "text-panel-400" : "text-red-400 font-semibold"}`}>
                    {g.stock > 0 ? `${g.stock} kasa stokta` : "Stok bitti — bağlı ürünler “Tükendi” görünüyor"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Bir azalt"
                    disabled={busy === g.id || g.stock <= 0}
                    onClick={() => change(g, g.stock - 1)}
                    className="w-9 h-9 rounded-lg bg-panel-800 hover:bg-panel-700 text-panel-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    aria-label={`${g.name} stok`}
                    value={draft ?? g.stock}
                    onChange={(e) => setDrafts((d) => ({ ...d, [g.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-20 px-2 py-2 bg-panel-950 border border-panel-700 rounded-lg text-center text-panel-100 font-bold tabular-nums focus:outline-none focus:border-brass-500"
                  />
                  <button
                    type="button"
                    aria-label="Bir artır"
                    disabled={busy === g.id}
                    onClick={() => change(g, g.stock + 1)}
                    className="w-9 h-9 rounded-lg bg-panel-800 hover:bg-panel-700 text-panel-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {draft !== undefined && draft !== g.stock && (
                    <button
                      type="button"
                      disabled={busy === g.id || draft === ""}
                      onClick={() => change(g, Number(draft))}
                      className="px-3 h-9 rounded-lg bg-brass-600 hover:bg-brass-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" /> Kaydet
                    </button>
                  )}
                  {busy === g.id && <Loader2 className="w-4 h-4 animate-spin text-brass-400" />}
                </div>

                <button
                  type="button"
                  onClick={() => remove(g)}
                  aria-label={`${g.name} kasasını sil`}
                  className="p-2 text-panel-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-panel-800">
                {items.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {items.map((p) => (
                      <li key={p.id} className="text-xs px-2.5 py-1 rounded-lg bg-panel-800 text-panel-200 max-w-[260px] truncate">
                        {p.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-panel-500">
                    Bağlı ürün yok. Ürün düzenleme ekranında “Stok kasası” alanından bu kasayı seçin.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
