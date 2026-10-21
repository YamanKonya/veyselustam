"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check, Link2, Search } from "lucide-react";
import { Product } from "@/types";
import { translateProduct } from "@/i18n/productTranslations";
import { slugifyGroupName } from "@/services/stockService";
import { campaignLink } from "@/services/analyticsService";

// Builds a tracked link for any product, so each post or message shows up as
// its own campaign under "Kaynaklar" on the Ziyaretler page.

type Source = "instagram" | "whatsapp" | "facebook";
const SOURCES: { id: Source; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "facebook", label: "Facebook" },
];

export default function CampaignLinkBuilder({ products }: { products: Product[] }) {
  const options = useMemo(
    () =>
      products
        .filter((p) => p.id && p.isActive !== false)
        .map((p) => ({ id: p.id!, title: translateProduct(p, "tr").title, image: p.images?.[0] }))
        .sort((a, b) => a.title.localeCompare(b.title, "tr")),
    [products]
  );

  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [source, setSource] = useState<Source>("instagram");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? options.filter((o) => o.title.toLocaleLowerCase("tr").includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.id === productId);
  // â, î, û etc. lose their accent instead of being dropped
  const campaign = slugifyGroupName(name.normalize("NFD").replace(/[̀-ͯ]/g, "")).slice(0, 60);
  const link = selected && campaign ? campaignLink(selected.id, source, campaign) : "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Linki kopyalayın:", link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field = "w-full bg-panel-950 border border-panel-700 rounded-xl px-3 py-2.5 text-sm text-panel-100 placeholder:text-panel-500 focus:outline-none focus:border-brass-500";

  return (
    <section className="bg-panel-900 border border-panel-800 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-panel-100 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-brass-400" /> Kampanya linki oluştur
      </h2>
      <p className="text-xs text-panel-400 mt-1 mb-4">
        Ürünü ve kampanya adını seçin; çıkan linki paylaşımınıza koyun. O linkle gelenler “Kaynaklar” bölümünde bu adla ayrı görünür.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-panel-300 mb-1.5" htmlFor="cl-search">
            1. Ürün
          </label>
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-panel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="cl-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün ara (ör. sidre, akik)"
              className={`${field} pl-9`}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-panel-800 divide-y divide-panel-800" role="listbox" aria-label="Ürünler">
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-panel-500">Ürün bulunamadı.</li>}
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === productId}
                  onClick={() => setProductId(o.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition ${
                    o.id === productId ? "bg-brass-600/20 text-panel-50" : "text-panel-200 hover:bg-panel-800"
                  }`}
                >
                  {o.image ? <img src={o.image} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" /> : <span className="w-8 h-8" />}
                  <span className="line-clamp-2">{o.title}</span>
                  {o.id === productId && <Check className="w-4 h-4 text-brass-400 ml-auto flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-panel-300 mb-1.5" htmlFor="cl-name">
              2. Kampanya adı
            </label>
            <input
              id="cl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Bayram hikâyesi, Ekim gönderisi"
              className={field}
            />
            {name && campaign && <p className="text-[11px] text-panel-500 mt-1">Panelde görünecek ad: {campaign}</p>}
          </div>

          <div>
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">3. Nerede paylaşacaksınız?</span>
            <div role="group" aria-label="Paylaşım yeri" className="flex gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={source === s.id}
                  onClick={() => setSource(s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    source === s.id ? "bg-brass-600 text-white" : "bg-panel-800 text-panel-200 hover:bg-panel-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-panel-300 mb-1.5">4. Link</span>
            {link ? (
              <div className="flex gap-2">
                <input readOnly value={link} onFocus={(e) => e.target.select()} className={`${field} font-mono text-xs`} aria-label="Kampanya linki" />
                <button
                  type="button"
                  onClick={copy}
                  className="px-4 rounded-xl bg-brass-600 hover:bg-brass-500 text-white text-sm font-semibold flex items-center gap-1.5 flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-panel-500">
                {!selected ? "Önce bir ürün seçin." : "Bir kampanya adı yazın."}
              </p>
            )}
            {link && source === "instagram" && (
              <p className="text-[11px] text-panel-500 mt-2">
                Instagram'da gönderi açıklamasındaki linke tıklanmaz: hikâyede “Bağlantı” çıkartmasına, biyografiye veya DM'e koyun.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
