"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Banknote, Building2, CalendarClock, Check, CreditCard, Hammer, Loader2, MessageCircle, PackageCheck, Pencil, Plus, Printer, Trash2, Undo2, X } from "lucide-react";
import { JobStatus, PaymentMethod, SaleChannel, WorkshopJob } from "@/types";
import { productCode } from "@/lib/productCode";
import { printJob } from "@/lib/printJob";
import {
  ACCOUNT_LABELS,
  accountFor,
  CHANNEL_LABELS,
  deleteJob,
  deliverJob,
  JOB_STATUS_LABELS,
  JobAlreadyDeliveredError,
  NotEnoughStockError,
  saveJob,
  setJobStatus,
  tl,
  undoJobDelivery,
  whatsappLink,
} from "@/services/workshopService";
import { btnGhost, btnPrimary, card, caseLabel, inputCls, labelCls, sortedGroups, Thumb, WorkshopData } from "./shared";

// Atölye → İşler. The reminder list of what is to be made: pick the piece from the
// stock, mark it made, then delivered. Delivery takes it out of the stock and writes
// the payment (cash, IBAN or card) into the cash book.

type Filter = "open" | "teslim" | "iptal";

const PAYMENTS: { id: PaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { id: "nakit", label: "Nakit", Icon: Banknote },
  { id: "havale", label: "IBAN / Havale", Icon: Building2 },
  { id: "kart", label: "Kredi kartı", Icon: CreditCard },
];

const STATUS_CLS: Record<JobStatus, string> = {
  bekliyor: "bg-amber-950 text-amber-300 border-amber-800",
  yapildi: "bg-violet-950 text-violet-300 border-violet-800",
  teslim: "bg-emerald-950 text-emerald-300 border-emerald-800",
  iptal: "bg-panel-800 text-panel-400 border-panel-700",
};

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const fmtDue = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", weekday: "short", hour: "2-digit", minute: "2-digit" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
// <input type="datetime-local"> wants local time without a zone
const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** How urgent an open job is */
const dueState = (job: WorkshopJob): { label: string; cls: string } | null => {
  if (!job.dueAt || job.status === "teslim" || job.status === "iptal") return null;
  const due = new Date(job.dueAt);
  const days = Math.round((dayStart(due) - dayStart(new Date())) / 86400000);
  if (due.getTime() < Date.now()) return { label: "Gecikti", cls: "bg-red-950 text-red-300 border-red-800" };
  if (days === 0) return { label: "Bugün", cls: "bg-amber-950 text-amber-300 border-amber-800" };
  if (days === 1) return { label: "Yarın", cls: "bg-sky-950 text-sky-300 border-sky-800" };
  return { label: `${days} gün kaldı`, cls: "bg-panel-800 text-panel-300 border-panel-700" };
};

const errorText = (err: unknown) => {
  if (err instanceof NotEnoughStockError) return `Stok yetmiyor: bu kasadan elde ${err.available} adet var. Önce stoğu girin.`;
  if (err instanceof JobAlreadyDeliveredError) return "Bu iş zaten teslim edilmiş görünüyor.";
  if ((err as { code?: string })?.code === "permission-denied")
    return "Firebase izin vermedi. firestore.rules dosyasının güncel hâli Firebase konsolundan yayınlanmalı.";
  return "Kaydedilemedi. İnternet bağlantısını kontrol edip tekrar deneyin.";
};

export default function Jobs({ data, onError, denied }: { data: WorkshopData; onError: (m: string) => void; denied: boolean }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [editing, setEditing] = useState<WorkshopJob | "new" | null>(null);
  const [delivering, setDelivering] = useState<WorkshopJob | null>(null);
  const [busyId, setBusyId] = useState("");

  const productById = useMemo(() => Object.fromEntries(data.products.map((p) => [p.id, p])), [data.products]);

  const jobs = useMemo(() => {
    const list = data.jobs.filter((j) => (filter === "open" ? j.status === "bekliyor" || j.status === "yapildi" : j.status === filter));
    if (filter !== "open") return list.sort((a, b) => (b.deliveredAt || b.createdAt).localeCompare(a.deliveredAt || a.createdAt));
    // soonest first; jobs without a date after the dated ones
    return list.sort((a, b) => (a.dueAt || "9").localeCompare(b.dueAt || "9") || a.createdAt.localeCompare(b.createdAt));
  }, [data.jobs, filter]);

  const counts = useMemo(() => {
    const open = data.jobs.filter((j) => j.status === "bekliyor" || j.status === "yapildi");
    return {
      open: open.length,
      late: open.filter((j) => j.dueAt && new Date(j.dueAt).getTime() < Date.now()).length,
      today: open.filter((j) => j.dueAt && dayStart(new Date(j.dueAt)) === dayStart(new Date()) && new Date(j.dueAt).getTime() >= Date.now()).length,
      ready: open.filter((j) => j.status === "yapildi").length,
    };
  }, [data.jobs]);

  // A6 work sheet to hand to the craftsman
  const print = (job: WorkshopJob) => {
    const product = job.productId ? productById[job.productId] : undefined;
    const group = job.groupId ? data.groupById[job.groupId] : undefined;
    printJob(job, {
      caseLabel: group ? caseLabel(group, data.caseById[group.id]) : undefined,
      productCode: product ? productCode(product) : undefined,
      image: product?.images?.[0],
      sourceLabel: job.source ? CHANNEL_LABELS[job.source] : undefined,
    });
  };

  const run = async (job: WorkshopJob, fn: () => Promise<unknown>) => {
    setBusyId(job.id);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      onError(errorText(err));
    } finally {
      setBusyId("");
    }
  };

  if (denied)
    return (
      <div role="alert" className="p-3 rounded-xl text-sm flex items-start gap-2 border bg-amber-950 border-amber-800 text-amber-200">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          İşler listesi için izin yok. Depodaki güncel <b>firestore.rules</b> dosyası Firebase konsolundan yayınlanınca bu sekme
          çalışır (Firestore → Kurallar → içeriği yapıştır → Yayınla).
        </span>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Açık iş", value: counts.open, cls: "" },
          { label: "Geciken", value: counts.late, cls: counts.late ? "text-red-300" : "" },
          { label: "Bugün teslim", value: counts.today, cls: counts.today ? "text-amber-300" : "" },
          { label: "Yapıldı, teslim bekliyor", value: counts.ready, cls: "" },
        ].map((k) => (
          <div key={k.label} className={`${card} !p-3`}>
            <p className="text-[11px] text-panel-400">{k.label}</p>
            <p className={`text-2xl font-extrabold tabular-nums text-panel-50 ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Durum" className="inline-flex bg-panel-900 border border-panel-800 rounded-xl p-1">
          {([
            ["open", "Açık işler"],
            ["teslim", "Teslim edilenler"],
            ["iptal", "İptal"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${filter === id ? "bg-brass-600 text-white" : "text-panel-300 hover:text-panel-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setEditing("new")} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Yeni iş
        </button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-panel-400">
          {filter === "open" ? "Bekleyen iş yok. “Yeni iş” ile yapılacak yüzüğü ekleyin." : "Bu listede kayıt yok."}
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const product = job.productId ? productById[job.productId] : undefined;
            const group = job.groupId ? data.groupById[job.groupId] : undefined;
            const due = dueState(job);
            const short = group && job.status !== "teslim" && job.status !== "iptal" && group.stock < job.qty;
            const busy = busyId === job.id;
            return (
              <li key={job.id} className={card}>
                <div className="flex items-start gap-3">
                  <Thumb src={product?.images?.[0]} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${STATUS_CLS[job.status]}`}>{JOB_STATUS_LABELS[job.status]}</span>
                      {due && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${due.cls}`}>{due.label}</span>}
                      {short && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border bg-red-950 text-red-300 border-red-800">
                          Kasada {group!.stock} adet var
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-semibold text-panel-100 break-words">
                      {job.qty > 1 && <span className="text-brass-300">{job.qty} × </span>}
                      {job.title}
                    </p>
                    <p className="text-xs text-panel-400 mt-0.5">
                      {[
                        group ? caseLabel(group, data.caseById[group.id]) : job.groupId ? job.groupName : "Stok dışı iş",
                        product ? productCode(product) : "",
                        job.size ? `Ölçü ${job.size}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-panel-300">
                      {job.customer && <span className="font-semibold text-panel-200">{job.customer}</span>}
                      {job.source && (
                        <span className="px-1.5 py-0.5 rounded-md bg-panel-800 border border-panel-700 text-panel-200">{CHANNEL_LABELS[job.source]}</span>
                      )}
                      {job.phone && (
                        <a
                          href={whatsappLink(job.phone, job.status === "yapildi" ? `Merhaba, ${job.title} siparişiniz hazır.` : "Merhaba,")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-brass-300"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> {job.phone}
                        </a>
                      )}
                      {job.dueAt && job.status !== "teslim" && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5" /> {fmtDue(job.dueAt)}
                        </span>
                      )}
                      {typeof job.price === "number" && job.status !== "teslim" && <span>Anlaşılan: {tl(job.price)}</span>}
                    </div>
                    {job.note && <p className="mt-1.5 text-xs text-panel-400 break-words">{job.note}</p>}
                    {job.status === "teslim" && (
                      <p className="mt-2 text-xs text-emerald-300">
                        {job.deliveredAt ? fmtDay(job.deliveredAt) : ""} teslim edildi
                        {typeof job.amount === "number" && job.payment
                          ? ` · ${tl(job.amount)} · ${PAYMENTS.find((p) => p.id === job.payment)?.label || job.payment} → ${ACCOUNT_LABELS[accountFor(job.payment)]}`
                          : " · ödeme girilmedi"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.status === "bekliyor" && (
                    <button type="button" disabled={busy} onClick={() => run(job, () => setJobStatus(job, "yapildi"))} className={btnPrimary}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />} Yapıldı
                    </button>
                  )}
                  {(job.status === "bekliyor" || job.status === "yapildi") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDelivering(job)}
                      className={job.status === "yapildi" ? btnPrimary : btnGhost}
                    >
                      <PackageCheck className="w-4 h-4" /> Teslim edildi
                    </button>
                  )}
                  {job.status === "yapildi" && (
                    <button type="button" disabled={busy} onClick={() => run(job, () => setJobStatus(job, "bekliyor"))} className={btnGhost}>
                      <Undo2 className="w-3.5 h-3.5" /> Yapılmadı
                    </button>
                  )}
                  {job.status === "teslim" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        window.confirm("Teslim geri alınsın mı? Stok geri eklenir, para defterindeki kayıt silinir.") &&
                        run(job, () => undoJobDelivery(job))
                      }
                      className={btnGhost}
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />} Teslimi geri al
                    </button>
                  )}
                  {job.status === "iptal" && (
                    <button type="button" disabled={busy} onClick={() => run(job, () => setJobStatus(job, "bekliyor"))} className={btnGhost}>
                      <Undo2 className="w-3.5 h-3.5" /> Geri aç
                    </button>
                  )}
                  <button type="button" onClick={() => print(job)} className={btnGhost}>
                    <Printer className="w-3.5 h-3.5" /> Yazdır
                  </button>
                  {job.status !== "teslim" && (
                    <button type="button" disabled={busy} onClick={() => setEditing(job)} className={btnGhost}>
                      <Pencil className="w-3.5 h-3.5" /> Düzenle
                    </button>
                  )}
                  {(job.status === "bekliyor" || job.status === "yapildi") && (
                    <button type="button" disabled={busy} onClick={() => run(job, () => setJobStatus(job, "iptal"))} className={btnGhost}>
                      <X className="w-3.5 h-3.5" /> İptal
                    </button>
                  )}
                  {job.status === "iptal" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => window.confirm("Bu iş kalıcı olarak silinsin mi?") && run(job, () => deleteJob(job.id))}
                      className={btnGhost}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && <JobForm data={data} job={editing === "new" ? null : editing} onClose={() => setEditing(null)} onPrint={print} />}
      {delivering && <DeliverDialog data={data} job={delivering} onClose={() => setDelivering(null)} />}
    </div>
  );
}

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto bg-panel-900 border border-panel-700 rounded-t-2xl sm:rounded-2xl shadow-2xl">
      <div className="sticky top-0 bg-panel-900 px-5 py-4 border-b border-panel-800 flex items-center justify-between">
        <h2 className="text-base font-bold text-panel-100">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Kapat" className="p-1.5 text-panel-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

/* ---------- new job / edit job ---------- */

function JobForm({
  data,
  job,
  onClose,
  onPrint,
}: {
  data: WorkshopData;
  job: WorkshopJob | null;
  onClose: () => void;
  onPrint: (job: WorkshopJob) => void;
}) {
  const [groupId, setGroupId] = useState(job?.groupId || "");
  const [productId, setProductId] = useState(job?.productId || "");
  const [title, setTitle] = useState(job?.title || "");
  const [titleTouched, setTitleTouched] = useState(!!job);
  const [qty, setQty] = useState<number | "">(job?.qty ?? 1);
  const [size, setSize] = useState(job?.size || "");
  const [customer, setCustomer] = useState(job?.customer || "");
  const [phone, setPhone] = useState(job?.phone || "");
  const [source, setSource] = useState<SaleChannel | "">(job?.source || "");
  const [dueAt, setDueAt] = useState(toLocalInput(job?.dueAt));
  const [price, setPrice] = useState<number | "">(job?.price ?? "");
  const [priceTouched, setPriceTouched] = useState(typeof job?.price === "number");
  const [note, setNote] = useState(job?.note || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const groups = useMemo(() => sortedGroups(data.groups, data.caseById), [data.groups, data.caseById]);
  const group = data.groupById[groupId];
  const variants = data.variants[groupId] || [];
  const product = variants.find((p) => p.id === productId);

  // Picking the case narrows the models; a case with a single model picks it
  useEffect(() => {
    if (productId && !variants.some((p) => p.id === productId)) setProductId("");
    else if (!productId && variants.length === 1) setProductId(variants[0].id!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // The name and price follow the chosen piece until they are typed by hand
  useEffect(() => {
    if (!titleTouched) setTitle(product?.title || group?.name || "");
    if (!priceTouched) setPrice(product?.price && qty ? product.price * Number(qty) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, groupId, qty]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // which button was pressed: "Kaydet" or "Kaydet ve yazdır"
    const andPrint = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "print";
    setError("");
    const n = Number(qty);
    if (!title.trim()) return setError("Ne yapılacağını yazın ya da stoktan bir yüzük seçin.");
    if (qty === "" || n <= 0) return setError("Adet girin.");
    setBusy(true);
    try {
      const fields = {
        id: job?.id,
        title: title.trim(),
        qty: Math.floor(n),
        groupId: groupId || undefined,
        groupName: group?.name,
        caseCode: data.caseById[groupId]?.code,
        productId: product?.id,
        productCode: product?.code,
        size: size.trim() || undefined,
        customer: customer.trim() || undefined,
        phone: phone.trim() || undefined,
        source: source || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        price: price === "" ? undefined : Number(price),
        note: note.trim() || undefined,
      };
      const id = await saveJob(fields);
      if (andPrint)
        onPrint({ status: "bekliyor", createdAt: new Date().toISOString(), ...job, ...fields, id });
      onClose();
    } catch (err) {
      console.error(err);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={job ? "İşi düzenle" : "Yeni iş"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>1. Kasa (stoktan)</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
              <option value="">Stok dışı iş (tamir, özel iş…)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {caseLabel(g, data.caseById[g.id])} ({g.stock} stokta)
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>2. Çeşit (taş / model)</span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={!variants.length} className={`${inputCls} disabled:opacity-50`}>
              <option value="">{variants.length ? "Seçin" : groupId ? "Bu kasaya bağlı ürün yok" : "Önce kasa seçin"}</option>
              {variants.map((p) => (
                <option key={p.id} value={p.id}>
                  {[productCode(p), p.title].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </label>
        </div>

        {group && (
          <p className={`text-xs ${group.stock < Number(qty || 0) ? "text-red-300" : "text-panel-400"}`}>
            Bu kasadan elde {group.stock} adet var. Teslim edilince {Number(qty || 0)} adet stoktan düşer.
          </p>
        )}

        <label className="block">
          <span className={labelCls}>Ne yapılacak *</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleTouched(true);
            }}
            placeholder="Örn: Emin Model akik yüzük, 21 numara"
            className={inputCls}
          />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className={labelCls}>Adet</span>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Ölçü</span>
            <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="21" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Fiyat (TL)</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value === "" ? "" : Number(e.target.value));
                setPriceTouched(true);
              }}
              className={inputCls}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>Müşteri</span>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Telefon</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" className={inputCls} />
          </label>
        </div>

        <div>
          <p className={labelCls}>Müşteri nereden geldi?</p>
          <div role="group" aria-label="Müşteri nereden geldi" className="flex flex-wrap gap-1.5">
            {(Object.keys(CHANNEL_LABELS) as SaleChannel[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSource(source === id ? "" : id)}
                aria-pressed={source === id}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                  source === id ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-950 border-panel-700 text-panel-200 hover:border-brass-500"
                }`}
              >
                {CHANNEL_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className={labelCls}>Ne zamana hazır olacak</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls} />
        </label>

        <label className="block">
          <span className={labelCls}>Not</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} />
        </label>

        {error && (
          <p role="alert" className="p-3 rounded-xl text-sm border bg-red-950 border-red-800 text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="submit" value="save" disabled={busy} className={`${btnGhost} !py-2.5 !text-sm justify-center`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {job ? "Kaydet" : "İşi ekle"}
          </button>
          <button type="submit" value="print" disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Kaydet ve yazdır
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- delivery: stock out + payment in ---------- */

function DeliverDialog({ data, job, onClose }: { data: WorkshopData; job: WorkshopJob; onClose: () => void }) {
  const [payment, setPayment] = useState<PaymentMethod>("nakit");
  const [amount, setAmount] = useState<number | "">(job.price ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const group = job.groupId ? data.groupById[job.groupId] : undefined;
  const product = job.productId ? data.products.find((p) => p.id === job.productId) : undefined;
  const short = !!group && group.stock < job.qty;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await deliverJob(job, { payment, amount: amount === "" ? undefined : Number(amount), product });
      onClose();
    } catch (err) {
      console.error(err);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Teslim edildi" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="p-3 rounded-xl bg-panel-950 border border-panel-800 text-sm">
          <p className="font-semibold text-panel-100">
            {job.qty > 1 ? `${job.qty} × ` : ""}
            {job.title}
          </p>
          {job.customer && <p className="text-xs text-panel-400 mt-0.5">{job.customer}</p>}
        </div>

        <div>
          <p className={labelCls}>Ödeme nasıl alındı?</p>
          <div role="group" aria-label="Ödeme yöntemi" className="grid grid-cols-3 gap-2">
            {PAYMENTS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPayment(id)}
                aria-pressed={payment === id}
                className={`py-3 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  payment === id ? "bg-brass-600 border-brass-500 text-white" : "bg-panel-950 border-panel-700 text-panel-200 hover:border-brass-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className={labelCls}>Alınan tutar (TL)</span>
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
        </label>

        <ul className="text-xs text-panel-300 space-y-1 list-disc ps-5">
          {group ? (
            <li>
              {caseLabel(group, data.caseById[group.id])} kasasından <b>{job.qty} adet</b> düşer ({group.stock} → {Math.max(0, group.stock - job.qty)}).
            </li>
          ) : (
            <li>Stok dışı iş: stok değişmez.</li>
          )}
          {amount !== "" && Number(amount) > 0 ? (
            <li>
              <b>{tl(Number(amount))}</b> para defterinde <b>{ACCOUNT_LABELS[accountFor(payment)]}</b> hesabına gelir yazılır.
            </li>
          ) : (
            <li>Tutar girilmedi: para defterine kayıt yazılmaz.</li>
          )}
        </ul>

        {short && (
          <p role="alert" className="p-3 rounded-xl text-sm border bg-red-950 border-red-800 text-red-300">
            Kasada {group!.stock} adet var, bu iş {job.qty} adet. Önce “Hareket gir” ile döküm ya da sayım girin.
          </p>
        )}
        {error && (
          <p role="alert" className="p-3 rounded-xl text-sm border bg-red-950 border-red-800 text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy || short} className={`${btnPrimary} w-full`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />} Teslim et ve kaydet
        </button>
      </form>
    </Modal>
  );
}
