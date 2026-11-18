"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Loader2, Plus, Trash2 } from "lucide-react";
import { CashAccount, CashEntry, CashType } from "@/types";
import {
  ACCOUNT_LABELS,
  addCashEntry,
  cashBalances,
  collectOrder,
  deleteCashEntry,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  startOfMonth,
  tl,
} from "@/services/workshopService";
import { btnPrimary, card, dateTime, inputCls, labelCls, liveOrders, WorkshopData } from "./shared";

const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso: string) => iso.slice(0, 7);

export default function Money({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const { cash } = data;
  const bal = cashBalances(cash);
  const monthFrom = startOfMonth().toISOString();
  const month = cash.filter((e) => e.at >= monthFrom);
  const income = month.filter((e) => e.type === "gelir").reduce((n, e) => n + e.amount, 0);
  const expense = month.filter((e) => e.type === "gider").reduce((n, e) => n + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Tile label={ACCOUNT_LABELS.nakit} value={tl(bal.nakit)} />
        <Tile label={ACCOUNT_LABELS.banka} value={tl(bal.banka)} />
        <Tile label="Toplam" value={tl(bal.toplam)} strong />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Bu ay gelir" value={tl(income)} />
        <Tile label="Bu ay gider" value={tl(expense)} />
        <Tile label="Bu ay net" value={tl(income - expense)} tone={income - expense < 0 ? "bad" : "good"} />
      </div>

      <EntryForm onError={onError} />
      <Uncollected data={data} onError={onError} />
      <EntryList entries={cash} onError={onError} />
    </div>
  );
}

const Tile = ({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "good" | "bad" }) => (
  <div className={`p-3 rounded-2xl border ${strong ? "bg-brass-900/40 border-brass-800" : "bg-panel-900 border-panel-800"}`}>
    <p className="text-[11px] text-panel-400">{label}</p>
    <p
      className={`text-lg sm:text-2xl font-extrabold tabular-nums ${
        tone === "bad" ? "text-red-400" : tone === "good" ? "text-emerald-300" : "text-panel-50"
      }`}
    >
      {value}
    </p>
  </div>
);

function EntryForm({ onError }: { onError: (m: string) => void }) {
  const [type, setType] = useState<CashType>("gider");
  const [account, setAccount] = useState<CashAccount>("nakit");
  const [toAccount, setToAccount] = useState<CashAccount>("banka");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const categories = type === "gelir" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const pickType = (t: CashType) => {
    setType(t);
    setCategory(t === "gelir" ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1] : t === "gider" ? EXPENSE_CATEGORIES[0] : "Transfer");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return onError("Tutar girin.");
    if (type === "transfer" && account === toAccount) return onError("Transfer için farklı iki hesap seçin.");
    setBusy(true);
    try {
      // Keep the time of day for today's entries so they sort naturally
      const at = date === today() ? new Date().toISOString() : new Date(`${date}T12:00:00`).toISOString();
      await addCashEntry({
        type,
        account,
        toAccount: type === "transfer" ? toAccount : undefined,
        category: type === "transfer" ? "Transfer" : category,
        amount: Number(amount),
        note,
        at,
      });
      setAmount("");
      setNote("");
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (err) {
      console.error(err);
      onError("Kayıt yazılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const TYPES: [CashType, string, React.ReactNode][] = [
    ["gelir", "Gelir", <ArrowDownLeft key="i" className="w-4 h-4" />],
    ["gider", "Gider", <ArrowUpRight key="o" className="w-4 h-4" />],
    ["transfer", "Transfer", <ArrowLeftRight key="t" className="w-4 h-4" />],
  ];

  return (
    <form onSubmit={submit} className={card}>
      <h2 className="font-bold text-panel-50">Para girişi / çıkışı</h2>
      <p className="text-xs text-panel-400 mt-1">
        Elden satışlar ve dökümcüye ödenen işçilik buraya kendiliğinden düşer. Diğer gelir ve giderleri buradan girin.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TYPES.map(([t, label, icon]) => (
          <button
            key={t}
            type="button"
            onClick={() => pickType(t)}
            className={`px-2 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
              type === t ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-950 border-panel-700 text-panel-300"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label>
          <span className={labelCls}>{type === "transfer" ? "Nereden" : "Hesap"}</span>
          <select value={account} onChange={(e) => setAccount(e.target.value as CashAccount)} className={inputCls}>
            <option value="nakit">{ACCOUNT_LABELS.nakit}</option>
            <option value="banka">{ACCOUNT_LABELS.banka}</option>
          </select>
        </label>
        {type === "transfer" ? (
          <label>
            <span className={labelCls}>Nereye</span>
            <select value={toAccount} onChange={(e) => setToAccount(e.target.value as CashAccount)} className={inputCls}>
              <option value="nakit">{ACCOUNT_LABELS.nakit}</option>
              <option value="banka">{ACCOUNT_LABELS.banka}</option>
            </select>
          </label>
        ) : (
          <label>
            <span className={labelCls}>Kategori</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span className={labelCls}>Tutar (TL)</span>
          <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Tarih</span>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </label>
        <label className="col-span-2 sm:col-span-4">
          <span className={labelCls}>Not</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ör. 500 gr has alındı" className={inputCls} />
        </label>
      </div>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full mt-3`}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {ok ? "Kaydedildi" : "Kaydet"}
      </button>
    </form>
  );
}

function Uncollected({ data, onError }: { data: WorkshopData; onError: (m: string) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [account, setAccount] = useState<CashAccount>("banka");
  const collected = useMemo(() => new Set(data.cash.filter((e) => e.source === "siparis").map((e) => e.refId)), [data.cash]);
  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  const list = liveOrders(data.orders).filter((o) => o.createdAt >= since && o.id && !collected.has(o.id));
  if (list.length === 0) return null;

  const collect = async (o: (typeof list)[number]) => {
    setBusy(o.id!);
    try {
      await collectOrder(o, account);
    } catch (err) {
      console.error(err);
      onError("Tahsilat yazılamadı.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold text-panel-50 flex-1">Parası alınmamış site siparişleri ({list.length})</h2>
        <select value={account} onChange={(e) => setAccount(e.target.value as CashAccount)} className="px-2 py-1.5 bg-panel-950 border border-panel-700 rounded-lg text-xs text-panel-100">
          <option value="banka">Bankaya geldi</option>
          <option value="nakit">Nakit / kapıda</option>
        </select>
      </div>
      <ul className="mt-3 space-y-2">
        {list.slice(0, 30).map((o) => (
          <li key={o.id} className="flex items-center gap-2 p-2 rounded-xl bg-panel-950 border border-panel-800">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-panel-100 truncate">{o.items.map((i) => i.title).join(", ")}</p>
              <p className="text-[11px] text-panel-500">
                {dateTime(o.createdAt)} · {o.customerInfo?.city || ""} · durum: {o.status}
              </p>
            </div>
            <span className="text-sm font-bold tabular-nums text-panel-50">{tl(o.totalAmount || 0)}</span>
            <button
              type="button"
              disabled={busy === o.id}
              onClick={() => collect(o)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              {busy === o.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Tahsil edildi
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryList({ entries, onError }: { entries: CashEntry[]; onError: (m: string) => void }) {
  const months = useMemo(() => Array.from(new Set(entries.map((e) => monthKey(e.at)))).sort().reverse(), [entries]);
  const [month, setMonth] = useState(monthKey(new Date().toISOString()));
  const [type, setType] = useState<CashType | "all">("all");
  const list = entries.filter((e) => monthKey(e.at) === month && (type === "all" || e.type === type));

  const remove = async (e: CashEntry) => {
    if (e.source === "satis" || e.source === "dokumcu") {
      onError(
        e.source === "satis"
          ? "Bu kayıt bir elden satıştan geldi. Hareketler sekmesinden satışı geri alın, para kaydı da silinir."
          : "Bu kayıt bir dökümcü ödemesinden geldi. Dökümcüler sekmesinde o cari kaydını silin."
      );
      return;
    }
    if (!window.confirm(`Bu kayıt silinsin mi?\n${e.category} · ${tl(e.amount)}`)) return;
    try {
      await deleteCashEntry(e.id);
    } catch (err) {
      console.error(err);
      onError("Silinemedi.");
    }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold text-panel-50 flex-1">Para defteri</h2>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-2 py-1.5 bg-panel-950 border border-panel-700 rounded-lg text-xs text-panel-100">
          {(months.includes(month) ? months : [month, ...months]).map((m) => (
            <option key={m} value={m}>
              {new Date(`${m}-01T12:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as CashType | "all")} className="px-2 py-1.5 bg-panel-950 border border-panel-700 rounded-lg text-xs text-panel-100">
          <option value="all">Hepsi</option>
          <option value="gelir">Gelir</option>
          <option value="gider">Gider</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>
      <ul className="mt-3 space-y-1.5">
        {list.length === 0 && <li className="text-sm text-panel-400">Bu ay kayıt yok.</li>}
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-panel-950 text-sm">
            <span className="w-20 text-[11px] text-panel-500 flex-shrink-0">{dateTime(e.at)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-panel-100 truncate">
                {e.category}
                <span className="text-panel-500 text-xs">
                  {" · "}
                  {e.type === "transfer" && e.toAccount
                    ? `${ACCOUNT_LABELS[e.account]} → ${ACCOUNT_LABELS[e.toAccount]}`
                    : ACCOUNT_LABELS[e.account]}
                </span>
              </p>
              {e.note && <p className="text-[11px] text-panel-500 truncate">{e.note}</p>}
            </div>
            <span
              className={`font-bold tabular-nums ${
                e.type === "gelir" ? "text-emerald-300" : e.type === "gider" ? "text-red-300" : "text-panel-300"
              }`}
            >
              {e.type === "gelir" ? "+" : e.type === "gider" ? "−" : ""}
              {tl(e.amount)}
            </span>
            <button type="button" aria-label="Sil" onClick={() => remove(e)} className="text-panel-600 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
