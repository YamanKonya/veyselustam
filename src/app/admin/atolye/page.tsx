"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Factory, Loader2, Plus, Tags } from "lucide-react";
import { Order, Product } from "@/types";
import { subscribeProducts } from "@/services/productService";
import { subscribeOrders } from "@/services/orderService";
import { useStockGroups } from "@/services/stockService";
import {
  assignCaseCodes,
  useCasterLedger,
  useCasters,
  useCashbook,
  useCastOrders,
  useMovements,
  useWorkshopCases,
  useWorkshopSettings,
} from "@/services/workshopService";
import { INITIAL_VEYSELUSTAM_PRODUCTS } from "@/data/initialProducts";
import { MovementPreset, WorkshopData } from "@/components/admin/atolye/shared";
import Summary from "@/components/admin/atolye/Summary";
import Cases from "@/components/admin/atolye/Cases";
import Ledger from "@/components/admin/atolye/Ledger";
import Casters from "@/components/admin/atolye/Casters";
import Casting from "@/components/admin/atolye/Casting";
import Costs from "@/components/admin/atolye/Costs";
import Money from "@/components/admin/atolye/Money";
import Reports from "@/components/admin/atolye/Reports";
import Labels from "@/components/admin/atolye/Labels";
import MovementForm from "@/components/admin/atolye/MovementForm";

type Tab = "summary" | "cases" | "ledger" | "casting" | "casters" | "money" | "costs" | "reports" | "labels";
const TABS: [Tab, string][] = [
  ["summary", "Özet"],
  ["cases", "Kasalar"],
  ["ledger", "Hareketler"],
  ["casting", "Döküm"],
  ["casters", "Dökümcüler"],
  ["money", "Para"],
  ["costs", "Maliyet"],
  ["reports", "Rapor"],
  ["labels", "QR Etiket"],
];

export default function AtolyePage() {
  const [tab, setTab] = useState<Tab>("summary");
  const { groups, loaded: groupsLoaded } = useStockGroups();
  const cases = useWorkshopCases();
  const casters = useCasters();
  const movements = useMovements(120);
  const castOrders = useCastOrders();
  const ledger = useCasterLedger();
  const settings = useWorkshopSettings();
  const cash = useCashbook();
  // A QR label opens /admin/atolye?k=<case id>: show that case
  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k");
    if (k) {
      setFocusId(k);
      setTab("cases");
    }
  }, []);
  const [products, setProducts] = useState<Product[]>(INITIAL_VEYSELUSTAM_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [preset, setPreset] = useState<MovementPreset | null>(null);
  const [error, setError] = useState("");
  const [coding, setCoding] = useState(false);

  useEffect(() => {
    const u1 = subscribeProducts((d) => d.length && setProducts(d));
    const u2 = subscribeOrders(setOrders);
    return () => {
      u1();
      u2();
    };
  }, []);

  const data: WorkshopData = useMemo(() => {
    const caseById = Object.fromEntries(cases.data.map((c) => [c.id, c]));
    const groupById = Object.fromEntries(groups.map((g) => [g.id, g]));
    const variants: Record<string, Product[]> = {};
    for (const p of products) if (p.stockGroup) (variants[p.stockGroup] ||= []).push(p);
    return {
      groups,
      cases: cases.data,
      casters: casters.data,
      movements: movements.data,
      products,
      orders,
      castOrders: castOrders.data,
      ledger: ledger.data,
      settings: settings.data,
      cash: cash.data,
      caseById,
      groupById,
      variants,
    };
  }, [groups, cases.data, casters.data, movements.data, products, orders, castOrders.data, ledger.data, settings.data, cash.data]);

  const denied = [cases, casters, movements, castOrders, ledger, cash].some((s) => s.error === "permission-denied");
  const uncoded = cases.loaded && !denied ? groups.filter((g) => !data.caseById[g.id]?.code).length : 0;

  const giveCodes = async () => {
    setCoding(true);
    setError("");
    try {
      await assignCaseCodes(groups, cases.data);
    } catch (err) {
      console.error(err);
      setError("Kodlar verilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.");
    } finally {
      setCoding(false);
    }
  };

  const loading = !groupsLoaded || !cases.loaded || !movements.loaded;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-panel-100 flex items-center gap-2">
            <Factory className="w-6 h-6 text-brass-400" /> Atölye
          </h1>
          <p className="text-sm text-panel-400 mt-1">Ne yapıldı, ne satıldı, elde ne kaldı. Kasa ve hareket takibi.</p>
        </div>
        <button
          type="button"
          onClick={() => setPreset({})}
          disabled={denied}
          className="px-4 py-3 bg-brass-600 hover:bg-brass-500 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Hareket gir
        </button>
      </div>

      {denied && (
        <div role="alert" className="mt-5 p-3 rounded-xl text-sm flex items-start gap-2 border bg-amber-950 border-amber-800 text-amber-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Atölye kayıtlarına erişim izni yok. Depodaki güncel <b>firestore.rules</b> dosyası Firebase konsolundan
            yayınlanınca bu sayfa çalışır (Firestore → Kurallar → içeriği yapıştır → Yayınla).
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 p-3 rounded-xl text-sm flex items-start gap-2 border bg-red-950 border-red-800 text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-400 text-xs">
            kapat
          </button>
        </div>
      )}

      {uncoded > 0 && (
        <div className="mt-5 p-3 rounded-xl text-sm flex flex-wrap items-center gap-3 border bg-panel-900 border-panel-700 text-panel-200">
          <Tags className="w-4 h-4 text-brass-400" />
          <span className="flex-1">{uncoded} kasanın henüz kodu yok. Ada göre sırayla K-001, K-002… verilsin mi? Sonra elle değiştirebilirsiniz.</span>
          <button type="button" onClick={giveCodes} disabled={coding} className="px-3 py-2 bg-brass-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
            {coding && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Kod ver
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-1 border-b border-panel-800 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${
              tab === k ? "border-brass-500 text-panel-50" : "border-transparent text-panel-400 hover:text-panel-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && !denied ? (
          <p className="text-sm text-panel-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…
          </p>
        ) : tab === "summary" ? (
          <Summary data={data} onMove={setPreset} />
        ) : tab === "cases" ? (
          <Cases data={data} onMove={setPreset} onError={setError} focusId={focusId} />
        ) : tab === "ledger" ? (
          <Ledger data={data} onError={setError} />
        ) : tab === "casting" ? (
          <Casting data={data} onError={setError} />
        ) : tab === "casters" ? (
          <Casters data={data} onError={setError} />
        ) : tab === "money" ? (
          <Money data={data} onError={setError} />
        ) : tab === "costs" ? (
          <Costs data={data} onError={setError} />
        ) : tab === "reports" ? (
          <Reports data={data} onError={setError} />
        ) : (
          <Labels data={data} />
        )}
      </div>

      {preset && <MovementForm data={data} preset={preset} onClose={() => setPreset(null)} />}
    </div>
  );
}
