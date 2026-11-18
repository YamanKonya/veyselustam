"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { btnGhost, btnPrimary, card, inputCls, sortedGroups, WorkshopData } from "./shared";

/** Address a case's QR label opens: the Atölye page with that case open */
export const caseUrl = (groupId: string) =>
  `${typeof window !== "undefined" ? window.location.origin : "https://veyselustam.com"}/admin/atolye?k=${encodeURIComponent(groupId)}`;

export default function Labels({ data }: { data: WorkshopData }) {
  const all = useMemo(() => sortedGroups(data.groups, data.caseById), [data.groups, data.caseById]);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [qr, setQr] = useState<Record<string, string>>({});
  const [size, setSize] = useState<"small" | "large">("small");

  const filtered = all.filter((g) =>
    `${data.caseById[g.id]?.code || ""} ${g.name}`.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr"))
  );
  const chosen = all.filter((g) => picked.includes(g.id));

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, string> = {};
      for (const g of chosen) {
        next[g.id] = qr[g.id] || (await QRCode.toDataURL(caseUrl(g.id), { margin: 1, width: 240, errorCorrectionLevel: "M" }));
      }
      if (alive) setQr(next);
    })().catch((err) => console.error("QR:", err));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked.join(",")]);

  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  return (
    <div className="space-y-5">
      <style>{`@media print {
        @page { margin: 8mm; }
        body * { visibility: hidden; }
        .label-sheet, .label-sheet * { visibility: visible; }
        .label-sheet { position: absolute; left: 0; top: 0; width: 100%; }
      }`}</style>

      <div className={`${card} no-print`}>
        <h2 className="font-bold text-panel-50">QR etiketler</h2>
        <p className="text-xs text-panel-400 mt-1">
          Etiketi kasa kutusuna yapıştırın. Telefon kamerasıyla okutunca o kasanın sayfası açılır. Döküm geldi, satış ve sayım
          oradan tek dokunuşla girilir. Açmak için yönetici girişi gerekir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kasa ara" className={`${inputCls} sm:max-w-xs`} />
          <button type="button" onClick={() => setPicked(Array.from(new Set([...picked, ...filtered.map((g) => g.id)])))} className={btnGhost}>
            Listedekileri seç ({filtered.length})
          </button>
          <button type="button" onClick={() => setPicked([])} className={btnGhost}>
            Seçimi temizle
          </button>
          <select value={size} onChange={(e) => setSize(e.target.value as "small" | "large")} className="px-2 py-2 bg-panel-950 border border-panel-700 rounded-lg text-xs text-panel-100">
            <option value="small">Küçük (A4'e 24)</option>
            <option value="large">Büyük (A4'e 12)</option>
          </select>
          <button type="button" onClick={() => window.print()} disabled={!chosen.length} className={btnPrimary}>
            <Printer className="w-4 h-4" /> Yazdır ({chosen.length})
          </button>
        </div>
        <div className="mt-3 max-h-64 overflow-y-auto grid sm:grid-cols-2 gap-1">
          {filtered.map((g) => (
            <label key={g.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-panel-800 text-sm text-panel-200 cursor-pointer">
              <input type="checkbox" checked={picked.includes(g.id)} onChange={() => toggle(g.id)} />
              <span className="font-mono text-xs text-brass-400 w-14">{data.caseById[g.id]?.code || "—"}</span>
              <span className="truncate">{g.name}</span>
            </label>
          ))}
        </div>
      </div>

      {chosen.length > 0 && (
        <div className={`label-sheet grid ${size === "small" ? "grid-cols-4" : "grid-cols-3"} gap-2 bg-white p-2 rounded-xl`}>
          {chosen.map((g) => (
            <div key={g.id} className="border border-gray-300 rounded-md p-2 flex flex-col items-center text-center break-inside-avoid">
              {qr[g.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr[g.id]} alt="" className={size === "small" ? "w-24 h-24" : "w-36 h-36"} />
              ) : (
                <div className={size === "small" ? "w-24 h-24" : "w-36 h-36"} />
              )}
              <p className="font-mono font-bold text-black text-sm mt-1">{data.caseById[g.id]?.code || ""}</p>
              <p className="text-black text-xs leading-tight">{g.name}</p>
              {data.caseById[g.id]?.gram ? <p className="text-gray-600 text-[10px]">{data.caseById[g.id].gram} gr</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
