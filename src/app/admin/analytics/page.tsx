"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  Loader2,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Eye,
  Users,
  Link2,
  Star,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { isEventPath } from "@/lib/trackEvent";
import { Product } from "@/types";
import { subscribeProducts, toggleFeaturedProduct } from "@/services/productService";
import { translateProduct } from "@/i18n/productTranslations";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import CampaignLinkBuilder from "@/components/admin/CampaignLinkBuilder";
import { fetchPageViews, groupVisits, sourceLabel, campaignLink, PageView } from "@/services/analyticsService";

const RANGES = [
  { days: 1, label: "Bugün" },
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
];

const TZ = "Europe/Istanbul";
const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["tr"], { type: "region" });
    return (code: string) => (code ? dn.of(code) || code : "Bilinmiyor");
  } catch {
    return (code: string) => code || "Bilinmiyor";
  }
})();

const fmtDuration = (s: number) => {
  if (s < 1) return "0 sn";
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m} dk ${r} sn` : `${m} dk`;
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
};
const fmtTime = (d: Date) =>
  d.toLocaleString("tr-TR", { timeZone: TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtClock = (d: Date) => d.toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD

// Shopping events recorded by trackEvent (path after "/")
const ERROR_LABELS: Record<string, string> = {
  stok: "Stok yetersiz",
  form: "Formu eksik bıraktı",
  "permission-denied": "Yetki hatası (Firebase kuralları)",
  unavailable: "Bağlantı hatası",
  "deadline-exceeded": "Bağlantı zaman aşımı",
  genel: "Bilinmeyen hata",
};
const errorLabel = (path: string) => {
  const code = path.split("#hata:")[1] || "genel";
  return ERROR_LABELS[code] || `Hata: ${code}`;
};
const eventLabel = (path: string) =>
  path === "/sepet#ekle"
    ? "Sepete ekledi"
    : path === "/checkout#sepet"
    ? "Ödeme sayfasında sepetinde"
    : path === "/checkout#gonder"
    ? "Siparişi tamamlaya bastı"
    : path.includes("#hata:")
    ? errorLabel(path)
    : path;

type Stage = "error" | "tried" | "form" | "checkout" | "cart";
const STAGES: Record<Stage, { label: string; cls: string }> = {
  error: { label: "Sipariş hata verdi", cls: "bg-red-950 text-red-300 border-red-800" },
  tried: { label: "Göndermeyi denedi", cls: "bg-amber-950 text-amber-300 border-amber-800" },
  form: { label: "Formu eksik bıraktı", cls: "bg-amber-950 text-amber-300 border-amber-800" },
  checkout: { label: "Ödeme sayfasından ayrıldı", cls: "bg-panel-800 text-panel-200 border-panel-700" },
  cart: { label: "Sepete ekledi, ödemeye geçmedi", cls: "bg-panel-800 text-panel-300 border-panel-700" },
};

const DeviceIcon = ({ device }: { device: string }) =>
  device === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : device === "tablet" ? <Tablet className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />;
const deviceName = (d: string) => (d === "mobile" ? "Telefon" : d === "tablet" ? "Tablet" : "Bilgisayar");
const place = (v: { city: string; region: string; country: string }) =>
  [v.city, v.country ? regionName(v.country) : ""].filter(Boolean).join(", ") || "Konum yok";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [openVisit, setOpenVisit] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeProducts((data) => data.length && setProducts(data));
    return () => unsub();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setViews(await fetchPageViews(days));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.code === "permission-denied"
          ? "Ziyaret kayıtları okunamadı: Firebase kurallarının güncel hâli (pageviews bölümü) yayınlanmamış. firestore.rules dosyasını Firebase konsolunda yayınlayın."
          : err?.code === "failed-precondition"
          ? "Firebase bu sorgu için bir dizin istiyor; hata ayrıntısındaki bağlantıdan dizini oluşturun."
          : "Ziyaret kayıtları yüklenemedi. İnternet bağlantısını kontrol edip tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const titleOf = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, translateProduct(p, "tr").title] as const));
    return (id: string) => map.get(id) || id;
  }, [products]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p] as const)), [products]);

  const visits = useMemo(() => groupVisits(views), [views]);
  // Page views without the shopping events (those are stored alongside them)
  const pageViews = useMemo(() => views.filter((v) => !isEventPath(v.path)), [views]);

  // Visits that added to cart or opened checkout but never reached the order-success page
  const funnel = useMemo(() => {
    let carted = 0;
    let checkout = 0;
    let ordered = 0;
    const open: { visit: (typeof visits)[number]; stage: Stage; products: string[]; detail: string }[] = [];
    for (const v of visits) {
      const ev = v.events;
      const added = ev.filter((e) => e.path === "/sepet#ekle");
      const atCheckout = v.views.some((p) => p.path.startsWith("/checkout")) || ev.some((e) => e.path.startsWith("/checkout"));
      const done = v.views.some((p) => p.path.startsWith("/order-success"));
      if (added.length) carted++;
      if (atCheckout) checkout++;
      if (done) ordered++;
      if (done || (!added.length && !atCheckout)) continue;

      const errors = ev.filter((e) => e.path.includes("#hata:") && !e.path.endsWith(":form"));
      const stage: Stage = errors.length
        ? "error"
        : ev.some((e) => e.path === "/checkout#gonder")
        ? "tried"
        : ev.some((e) => e.path === "/checkout#hata:form")
        ? "form"
        : atCheckout
        ? "checkout"
        : "cart";
      const inCart = ev.filter((e) => e.path === "/checkout#sepet").map((e) => e.productId);
      const products = Array.from(new Set((inCart.length ? inCart : added.map((e) => e.productId)).filter(Boolean)));
      const last = errors[errors.length - 1];
      const detail = last ? errorLabel(last.path) + (last.productId ? `: ${titleOf(last.productId)}` : "") : "";
      open.push({ visit: v, stage, products, detail });
    }
    return { carted, checkout, ordered, open };
  }, [visits, titleOf]);
  const [stageFilter, setStageFilter] = useState<"all" | "cart" | "checkout">("all");
  const openShown = funnel.open.filter((o) =>
    stageFilter === "all" ? true : stageFilter === "cart" ? o.stage === "cart" : o.stage !== "cart"
  );

  const kpis = useMemo(() => {
    const n = visits.length;
    const totalSec = visits.reduce((s, v) => s + v.seconds, 0);
    const bounces = visits.filter((v) => v.views.length === 1).length;
    return {
      visits: n,
      views: pageViews.length,
      avgTime: n ? Math.round(totalSec / n) : 0,
      pagesPerVisit: n ? (pageViews.length / n).toFixed(1).replace(".", ",") : "0",
      bounce: n ? Math.round((bounces / n) * 100) : 0,
    };
  }, [visits, pageViews]);

  // Visits per day across the selected range (days with no visits included)
  const daily = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of visits) counts.set(dayKey(v.start), (counts.get(dayKey(v.start)) || 0) + 1);
    const out: { key: string; label: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      out.push({
        key,
        label: d.toLocaleDateString("tr-TR", { timeZone: TZ, day: "numeric", month: "short" }),
        count: counts.get(key) || 0,
      });
    }
    return out;
  }, [visits, days]);
  const dailyMax = Math.max(1, ...daily.map((d) => d.count));

  // Products by interest: unique visitors, then total viewing time
  const topProducts = useMemo(() => {
    const stats = new Map<string, { views: number; visitors: Set<string>; seconds: number }>();
    for (const v of pageViews) {
      if (!v.productId) continue;
      const s = stats.get(v.productId) || { views: 0, visitors: new Set<string>(), seconds: 0 };
      s.views++;
      s.visitors.add(v.sid);
      s.seconds += v.seconds;
      stats.set(v.productId, s);
    }
    return Array.from(stats.entries())
      .map(([id, s]) => ({ id, views: s.views, visitors: s.visitors.size, seconds: s.seconds, avg: Math.round(s.seconds / s.views) }))
      .sort((a, b) => b.visitors - a.visitors || b.seconds - a.seconds)
      .slice(0, 15);
  }, [pageViews]);

  const tally = (key: (v: (typeof visits)[number]) => string) => {
    const m = new Map<string, number>();
    for (const v of visits) m.set(key(v), (m.get(key(v)) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };
  const locations = useMemo(() => tally((v) => place(v)), [visits]);
  const sources = useMemo(() => tally((v) => (v.campaign ? `${v.source} · ${v.campaign}` : v.source)), [visits]);
  const devices = useMemo(() => tally((v) => deviceName(v.device)), [visits]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const copyLink = async (id: string, source: "instagram" | "whatsapp") => {
    const link = campaignLink(id, source, `kampanya-${id.replace(/^vu-/, "")}`);
    try {
      await navigator.clipboard.writeText(link);
      showToast(`${source === "instagram" ? "Instagram" : "WhatsApp"} kampanya linki kopyalandı`);
    } catch {
      window.prompt("Linki kopyalayın:", link);
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      const now = await toggleFeaturedProduct(id);
      showToast(now ? "Ürün vitrine alındı" : "Ürün vitrinden çıkarıldı");
    } catch {
      showToast("Vitrin durumu değiştirilemedi");
    }
  };

  const Panel = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <section className={`bg-panel-900 border border-panel-800 rounded-2xl p-5 ${className}`}>
      <h2 className="text-sm font-bold text-panel-100 mb-4">{title}</h2>
      {children}
    </section>
  );

  const RankList = ({ rows, empty }: { rows: [string, number][]; empty: string }) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    if (!rows.length) return <p className="text-sm text-panel-500">{empty}</p>;
    return (
      <ul className="space-y-2.5">
        {rows.slice(0, 8).map(([label, n]) => (
          <li key={label} className="text-sm">
            <div className="flex justify-between gap-3 text-panel-200">
              <span className="truncate">{label}</span>
              <span className="tabular-nums text-panel-300">{n}</span>
            </div>
            <div className="mt-1 h-1.5 bg-panel-800 rounded-full overflow-hidden">
              <div className="h-full bg-brass-500 rounded-full" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brass-400" /> Ziyaretler
          </h1>
          <p className="text-sm text-panel-400 mt-1">
            Ziyaretçilerin nereden geldiği, ne kadar kaldığı ve hangi ürünlere ilgi gösterdiği. Saatler Türkiye saatidir; IP adresi
            saklanmaz, konum şehir düzeyindedir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Tarih aralığı" className="flex bg-panel-900 border border-panel-800 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  days === r.days ? "bg-brass-600 text-white" : "text-panel-300 hover:text-panel-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            aria-label="Yenile"
            className="p-2.5 bg-panel-900 border border-panel-800 rounded-xl text-panel-300 hover:text-panel-100"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Ziyaret", value: kpis.visits.toLocaleString("tr-TR") },
          { icon: Eye, label: "Sayfa görüntüleme", value: kpis.views.toLocaleString("tr-TR") },
          { icon: Clock, label: "Ort. sitede kalma", value: fmtDuration(kpis.avgTime) },
          { icon: BarChart3, label: "Ziyaret başına sayfa", value: kpis.pagesPerVisit },
          { icon: Eye, label: "Tek sayfada çıkma", value: `%${kpis.bounce}` },
        ].map((k) => (
          <div key={k.label} className="bg-panel-900 border border-panel-800 rounded-2xl p-4">
            <p className="text-xs text-panel-400 flex items-center gap-1.5">
              <k.icon className="w-3.5 h-3.5" /> {k.label}
            </p>
            <p className="text-2xl font-extrabold text-panel-50 mt-1.5 tabular-nums">{loading ? "…" : k.value}</p>
          </div>
        ))}
      </div>

      {/* Visits per day */}
      {days > 1 && (
        <Panel title="Günlük ziyaret">
          <div className="relative">
            <div className="flex items-end gap-[2px] h-40 border-b border-panel-700" role="list" aria-label="Günlük ziyaret sayıları">
              {daily.map((d) => (
                <div
                  key={d.key}
                  role="listitem"
                  aria-label={`${d.label}: ${d.count} ziyaret`}
                  tabIndex={0}
                  onMouseEnter={() => setHoverDay(d.key)}
                  onMouseLeave={() => setHoverDay(null)}
                  onFocus={() => setHoverDay(d.key)}
                  onBlur={() => setHoverDay(null)}
                  className="relative flex-1 h-full flex items-end group outline-none"
                >
                  <div
                    className={`w-full rounded-t-[4px] transition-colors ${hoverDay === d.key ? "bg-brass-300" : "bg-brass-500"}`}
                    style={{ height: `${(d.count / dailyMax) * 100}%`, minHeight: d.count ? 2 : 0 }}
                  />
                  {hoverDay === d.key && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-panel-950 border border-panel-700 text-panel-100 text-xs rounded-lg px-2.5 py-1.5 shadow-xl z-10 pointer-events-none">
                      <span className="text-panel-400">{d.label}</span> <span className="font-bold tabular-nums">{d.count}</span> ziyaret
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-panel-500 mt-1.5 tabular-nums">
              <span>{daily[0]?.label}</span>
              <span>en yüksek: {dailyMax}</span>
              <span>{daily[daily.length - 1]?.label}</span>
            </div>
          </div>
        </Panel>
      )}

      {/* Abandoned carts and orders */}
      <Panel title="Sepette ve ödemede yarım kalanlar">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Sepete ekleyen ziyaret", value: funnel.carted },
            { label: "Ödeme sayfasına gelen", value: funnel.checkout },
            { label: "Sipariş veren", value: funnel.ordered },
            { label: "Almadan ayrılan", value: funnel.open.length },
          ].map((k) => (
            <div key={k.label} className="bg-panel-950 border border-panel-800 rounded-xl p-3">
              <p className="text-[11px] text-panel-400">{k.label}</p>
              <p className="text-xl font-extrabold text-panel-50 tabular-nums">{loading ? "…" : k.value}</p>
            </div>
          ))}
        </div>
        <div role="group" aria-label="Aşama" className="inline-flex bg-panel-950 border border-panel-800 rounded-xl p-1 mb-3">
          {([
            ["all", "Hepsi"],
            ["cart", "Sepette kalan"],
            ["checkout", "Ödemede kalan"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStageFilter(id)}
              aria-pressed={stageFilter === id}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                stageFilter === id ? "bg-brass-600 text-white" : "text-panel-300 hover:text-panel-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {openShown.length === 0 ? (
          <p className="text-sm text-panel-500">{loading ? "Yükleniyor…" : "Bu aralıkta almadan ayrılan yok."}</p>
        ) : (
          <ul className="divide-y divide-panel-800">
            {openShown.slice(0, 50).map(({ visit: v, stage, products: ids, detail }) => (
              <li key={v.sid} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`px-2 py-0.5 rounded-lg border text-xs font-semibold ${STAGES[stage].cls}`}>
                    {stage === "error" ? (
                      <AlertTriangle className="w-3 h-3 inline -mt-0.5 mr-1" />
                    ) : (
                      <ShoppingCart className="w-3 h-3 inline -mt-0.5 mr-1" />
                    )}
                    {STAGES[stage].label}
                  </span>
                  <span className="text-panel-200 whitespace-nowrap">{fmtTime(v.start)}</span>
                  <span className="text-panel-400 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {place(v)}
                  </span>
                  <span className="text-panel-400 inline-flex items-center gap-1">
                    <DeviceIcon device={v.device} /> {deviceName(v.device)}
                  </span>
                  <span className="text-panel-400">
                    {v.source}
                    {v.campaign && <span className="text-brass-300"> · {v.campaign}</span>}
                  </span>
                </div>
                {detail && <p className="mt-1.5 text-xs text-red-300">{detail}</p>}
                {ids.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {ids.map((id) => {
                      const product = productById.get(id);
                      return (
                        <li key={id}>
                          <a
                            href={`/product/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 max-w-[260px] bg-panel-950 border border-panel-800 rounded-lg pr-2 hover:border-brass-500"
                          >
                            {product?.images?.[0] && (
                              <img src={product.images[0]} alt="" className="w-8 h-8 rounded-l-lg object-cover flex-shrink-0" />
                            )}
                            <span className="text-xs text-panel-200 line-clamp-1">{titleOf(id)}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-panel-500 mt-3">
          Müşterinin formda yazdıkları kaydedilmez; burada yalnızca ne zaman ve nereden geldiği, sepetindeki ürünler ve varsa aldığı hata
          görünür. Sepet ve hata kayıtları bu özelliğin eklendiği günden itibaren tutulur; daha eski ziyaretlerde yalnızca ödeme sayfasına
          gelip gelmediği görünür.
        </p>
      </Panel>

      <CampaignLinkBuilder products={products} />

      {/* Products by interest */}
      <Panel title="En çok ilgi gören ürünler">
        {topProducts.length === 0 ? (
          <p className="text-sm text-panel-500">Bu aralıkta ürün görüntülenmesi yok.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-panel-400 border-b border-panel-800">
                  <th className="py-2 pr-3 font-medium">Ürün</th>
                  <th className="py-2 px-3 font-medium text-right">Tekil ziyaretçi</th>
                  <th className="py-2 px-3 font-medium text-right">Görüntüleme</th>
                  <th className="py-2 px-3 font-medium text-right">Ort. inceleme</th>
                  <th className="py-2 pl-3 font-medium">Kampanya</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const product = productById.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-panel-800/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <span className="w-5 text-panel-500 tabular-nums">{i + 1}</span>
                          {product?.images?.[0] && (
                            <img src={product.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <a href={`/product/${p.id}`} target="_blank" rel="noreferrer" className="text-panel-100 hover:text-brass-300 line-clamp-2">
                            {titleOf(p.id)}
                          </a>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-panel-100 font-semibold">{p.visitors}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-panel-300">{p.views}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-panel-300">{fmtDuration(p.avg)}</td>
                      <td className="py-2.5 pl-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleFeatured(p.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                              product?.isFeatured ? "bg-brass-600 text-white" : "bg-panel-800 text-panel-200 hover:bg-panel-700"
                            }`}
                          >
                            <Star className="w-3 h-3" /> {product?.isFeatured ? "Vitrinde" : "Vitrine al"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyLink(p.id, "instagram")}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-panel-800 text-panel-200 hover:bg-panel-700 flex items-center gap-1"
                          >
                            <Link2 className="w-3 h-3" /> Instagram linki
                          </button>
                          <button
                            type="button"
                            onClick={() => copyLink(p.id, "whatsapp")}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-panel-800 text-panel-200 hover:bg-panel-700 flex items-center gap-1"
                          >
                            <Link2 className="w-3 h-3" /> WhatsApp linki
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-panel-500 mt-3">
              Kampanya linkiyle gelen ziyaretler “Kaynaklar” bölümünde kampanya adıyla ayrı görünür; böylece hangi paylaşımın işe yaradığını
              görürsünüz.
            </p>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Konumlar">
          <RankList rows={locations} empty="Henüz ziyaret yok." />
        </Panel>
        <Panel title="Kaynaklar">
          <RankList rows={sources} empty="Henüz ziyaret yok." />
        </Panel>
        <Panel title="Cihazlar">
          <RankList rows={devices} empty="Henüz ziyaret yok." />
        </Panel>
      </div>

      {/* Visit log */}
      <Panel title={`Son ziyaretler${visits.length > 100 ? " (son 100)" : ""}`}>
        {visits.length === 0 ? (
          <p className="text-sm text-panel-500">{loading ? "Yükleniyor…" : "Bu aralıkta ziyaret yok."}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-panel-400 border-b border-panel-800">
                  <th className="py-2 pr-3 font-medium">Zaman</th>
                  <th className="py-2 px-3 font-medium">Konum</th>
                  <th className="py-2 px-3 font-medium">Cihaz</th>
                  <th className="py-2 px-3 font-medium">Kaynak</th>
                  <th className="py-2 px-3 font-medium text-right">Sayfa</th>
                  <th className="py-2 pl-3 font-medium text-right">Süre</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 100).map((v) => {
                  const open = openVisit === v.sid;
                  return (
                    <React.Fragment key={v.sid}>
                      <tr
                        className="border-b border-panel-800/60 cursor-pointer hover:bg-panel-800/40"
                        onClick={() => setOpenVisit(open ? null : v.sid)}
                        aria-expanded={open}
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap text-panel-200">
                          <span className="inline-flex items-center gap-1.5">
                            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            {fmtTime(v.start)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-panel-200">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-panel-500" /> {place(v)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-panel-300">
                          <span className="inline-flex items-center gap-1.5">
                            <DeviceIcon device={v.device} /> {deviceName(v.device)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-panel-300">
                          {v.source}
                          {v.campaign && <span className="text-brass-300"> · {v.campaign}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-panel-200">{v.views.length}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums text-panel-200">{fmtDuration(v.seconds)}</td>
                      </tr>
                      {open && (
                        <tr className="bg-panel-950/60">
                          <td colSpan={6} className="px-4 py-3">
                            <ol className="space-y-1.5">
                              {[...v.views, ...v.events]
                                .sort((a, b) => a.at.getTime() - b.at.getTime())
                                .map((pv) =>
                                  isEventPath(pv.path) ? (
                                    <li key={pv.id} className="flex flex-wrap items-center gap-x-3 text-xs">
                                      <span className="tabular-nums text-panel-500 w-16">{fmtClock(pv.at)}</span>
                                      <span className={pv.path.includes("#hata:") ? "text-red-300" : "text-brass-300"}>
                                        <ShoppingCart className="w-3 h-3 inline -mt-0.5 mr-1" />
                                        {eventLabel(pv.path)}
                                        {pv.productId ? `: ${titleOf(pv.productId)}` : ""}
                                      </span>
                                    </li>
                                  ) : (
                                    <li key={pv.id} className="flex flex-wrap items-center gap-x-3 text-xs">
                                      <span className="tabular-nums text-panel-500 w-16">{fmtClock(pv.at)}</span>
                                      <span className="text-panel-100">
                                        {pv.productId ? titleOf(pv.productId) : pv.path === "/" ? "Anasayfa" : pv.path}
                                      </span>
                                      <span className="text-panel-400 tabular-nums">{fmtDuration(pv.seconds)}</span>
                                    </li>
                                  )
                                )}
                            </ol>
                            <p className="text-[11px] text-panel-500 mt-2">
                              Dil: {v.lang || "?"}
                              {v.region ? ` · Bölge: ${v.region}` : ""}
                              {v.views[0] && sourceLabel(v.views[0]) !== "Doğrudan" && v.views[0].ref ? ` · Geldiği site: ${v.views[0].ref}` : ""}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-panel-950 border border-brass-500/50 text-panel-100 text-sm px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
