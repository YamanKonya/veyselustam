import { WorkshopJob } from "@/types";

/**
 * Prints a job (Atölye → İşler) as an A6 portrait work sheet to hand to the craftsman.
 * The sheet is built in a hidden iframe so the admin page itself is not printed.
 * It carries what the craftsman needs: the piece, case, size, quantity, due time and
 * note. The price is left out on purpose.
 */
export interface JobSheetInfo {
  caseLabel?: string;
  productCode?: string;
  image?: string;
  sourceLabel?: string;
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmt = (iso?: string, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "";

export function jobSheetHtml(job: WorkshopJob, info: JobSheetInfo, origin: string) {
  const abs = (url?: string) => (url ? (/^(https?:|data:)/.test(url) ? url : origin + url) : "");
  const row = (label: string, value?: string) =>
    value ? `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>` : "";
  const no = job.id.slice(0, 6).toUpperCase();

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>İş ${esc(no)} · ${esc(job.title)}</title>
<style>
  /* A6 portrait. Browsers know "A5" by name but not "A6", so the size is given in mm. */
  @page { size: 105mm 148mm; margin: 6mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 8.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5mm solid #133B27; padding-bottom: 2mm; }
  .brand { display: flex; align-items: center; gap: 2mm; }
  .brand img { width: 10mm; height: 10mm; object-fit: contain; }
  .brand b { font-size: 10.5pt; color: #133B27; letter-spacing: .04em; }
  .brand span { display: block; font-size: 6pt; color: #555; letter-spacing: .12em; text-transform: uppercase; }
  .no { text-align: right; font-size: 6.5pt; color: #555; }
  .no b { display: block; font-size: 10pt; color: #111; letter-spacing: .06em; }
  .main { display: flex; gap: 3mm; margin-top: 3mm; }
  .photo { width: 30mm; height: 30mm; flex: none; border: 0.3mm solid #bbb; object-fit: cover; }
  .main > div { min-width: 0; flex: 1; }
  h1 { font-size: 10.5pt; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .case { margin-top: 1mm; font-size: 7.5pt; color: #444; }
  .big { display: flex; gap: 2mm; margin-top: 2mm; }
  .big div { flex: 1; border: 0.5mm solid #133B27; padding: 1mm 2mm; text-align: center; }
  .big small { display: block; font-size: 6pt; letter-spacing: .12em; text-transform: uppercase; color: #555; }
  .big b { font-size: 16pt; line-height: 1.1; }
  table { width: 100%; border-collapse: collapse; margin-top: 3mm; }
  th, td { text-align: left; vertical-align: top; padding: 1.3mm 0; border-bottom: 0.2mm solid #ccc; font-size: 8.5pt; }
  th { width: 24mm; font-weight: normal; color: #555; }
  td { font-weight: bold; }
  .note { margin-top: 3mm; border: 0.3mm solid #999; padding: 2mm; min-height: 17mm; }
  .note small, .checks small { display: block; font-size: 6pt; letter-spacing: .1em; text-transform: uppercase; color: #555; margin-bottom: 1mm; }
  .note p { white-space: pre-wrap; font-size: 8.5pt; }
  .checks { display: flex; gap: 4mm; margin-top: 3.5mm; }
  .checks div { flex: 1; }
  .line { border-bottom: 0.3mm solid #333; height: 7mm; }
  .box { display: inline-block; width: 3.2mm; height: 3.2mm; border: 0.4mm solid #111; vertical-align: -0.7mm; margin-right: 1.2mm; }
  .foot { margin-top: 3mm; font-size: 6pt; color: #777; display: flex; justify-content: space-between; }
</style></head>
<body>
  <div class="head">
    <div class="brand"><img src="${esc(origin)}/images/logo-256.png" alt=""><div><b>VEYSEL USTAM</b><span>İş Emri</span></div></div>
    <div class="no">İş no<b>${esc(no)}</b>${esc(fmt(job.createdAt, false))}</div>
  </div>

  <div class="main">
    ${info.image ? `<img class="photo" src="${esc(abs(info.image))}" alt="">` : ""}
    <div>
      <h1>${esc(job.title)}</h1>
      <p class="case">${esc([info.caseLabel || (job.groupId ? job.groupName : "Stok dışı iş"), info.productCode].filter(Boolean).join(" · "))}</p>
      <div class="big">
        <div><small>Adet</small><b>${esc(job.qty)}</b></div>
        <div><small>Ölçü</small><b>${esc(job.size || "—")}</b></div>
      </div>
    </div>
  </div>

  <table>
    ${row("Hazır olacak", fmt(job.dueAt))}
    ${row("Müşteri", job.customer)}
    ${row("Telefon", job.phone)}
    ${row("Nereden geldi", info.sourceLabel)}
  </table>

  <div class="note"><small>Not</small><p>${esc(job.note || "")}</p></div>

  <div class="checks">
    <div><small><span class="box"></span>Yapıldı · imza</small><div class="line"></div></div>
    <div><small><span class="box"></span>Teslim · imza</small><div class="line"></div></div>
  </div>

  <div class="foot"><span>veyselustam.com</span><span>Yazdırıldı: ${esc(fmt(new Date().toISOString()))}</span></div>
</body></html>`;
}

/** Opens the print dialog with the A6 sheet of this job */
export function printJob(job: WorkshopJob, info: JobSheetInfo) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(jobSheetHtml(job, info, window.location.origin));
  doc.close();

  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60000); // long enough for the print dialog on phones
  };
  // Print once the pictures are in (or after 3 s if one is slow or missing)
  const imgs = Array.from(doc.images);
  let left = imgs.filter((i) => !i.complete).length;
  if (!left) return setTimeout(go, 100);
  imgs.forEach((i) => {
    if (i.complete) return;
    const done = () => --left <= 0 && go();
    i.addEventListener("load", done);
    i.addEventListener("error", done);
  });
  setTimeout(go, 3000);
}
