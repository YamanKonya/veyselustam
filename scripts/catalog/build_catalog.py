"""Printable A4 product catalogue (PDF) built from the live product feed.

Usage (from the repo root):
    python -P scripts/catalog/build_catalog.py [--out katalog] [--feed URL_OR_FILE]

Reads https://veyselustam.com/feed/meta.csv (active products, current prices and
photos), downloads/resizes the first photo of each product, writes katalog.html and
prints it to katalog/Veysel-Ustam-Katalog.pdf with headless Chrome.

Needs: Pillow, qrcode (pip install --user qrcode), Google Chrome.
"""
from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import html
import io
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image, ImageOps

SITE = "https://veyselustam.com"
FEED = f"{SITE}/feed/meta.csv"
ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
PHONE = "0533 620 30 85"
INSTAGRAM = "@veysel.ustam"
PER_PAGE = 4
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
]
# Order of the groups in the catalogue (feed product_type); unknown types go last.
TYPE_ORDER = [
    "Horasan Akik Taşlı",
    "Nakkaş El Oyması Taşlı",
    "Özel El Yapımı Gümüş Yüzükler",
    "Özel Yapım Ürünler",
    "Gümüş Yüzük",
]
TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz",
             "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]


def fetch(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "VeyselUstam-Catalog/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def load_feed(src: str) -> list[dict]:
    csv.field_size_limit(10**9)
    data = Path(src).read_bytes() if os.path.exists(src) else fetch(src)
    rows = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"))))
    return [r for r in rows if r.get("availability", "").strip() == "in stock"]


def image_bytes(link: str) -> bytes:
    link = link.strip()
    if link.startswith(SITE + "/data:"):  # admin uploads saved inline in the feed
        link = link[len(SITE) + 1:]
    if link.startswith("data:"):
        return base64.b64decode(link.split(",", 1)[1])
    if link.startswith(SITE + "/images/"):
        local = PUBLIC / link[len(SITE) + 1:]
        if local.exists():
            return local.read_bytes()
    return fetch(link)


def prepare_image(row: dict, cache: Path) -> Path:
    out = cache / f"{row['id']}.jpg"
    if out.exists():
        return out
    im = Image.open(io.BytesIO(image_bytes(row["image_link"])))
    im = ImageOps.exif_transpose(im).convert("RGB")
    im = ImageOps.fit(im, (1100, 1100), Image.LANCZOS)
    im.save(out, "JPEG", quality=90, optimize=True)
    return out


def qr_svg(url: str) -> str:
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, border=0,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    svg = img.to_string(encoding="unicode")
    svg = re.sub(r"<\?xml[^>]*\?>", "", svg)
    svg = re.sub(r'width="[^"]*mm" height="[^"]*mm" ', "", svg, count=1)
    return svg


def split_title(raw: str) -> tuple[str, str]:
    t = raw.split(" | ")[0].strip()
    t = t.replace("Yemen", "Horasan")
    t = re.split(r"(?<=[a-zçğıöşü])\. ", t, maxsplit=1)[0]  # drop marketing tails after a full stop
    m = re.match(r'^(.*?)\s*"(.+?)"\s*$', t)
    if m and m.group(1):
        return m.group(1).strip(), m.group(2).strip()
    return t.strip('"'), ""


def short_desc(raw: str, limit: int = 150) -> str:
    d = re.sub(r"\s+", " ", raw.replace("Yemen", "Horasan")).strip()
    if re.match(r"(?i)malzeme\s*:", d) or re.search(r"(?i)kargo", d[:200]):
        return ""  # imported listings start with shipping boilerplate, not a description
    first = re.split(r"(?<=[^\d\s][.!?])\s", d, maxsplit=1)[0]  # "129. Ayet" is not a sentence end
    if len(first) > limit:
        first = first[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return first


def price_tr(raw: str) -> str:
    n = float(raw.split()[0])
    return f"{n:,.0f}".replace(",", ".") + " ₺"


def build_html(products: list[dict], date_label: str) -> str:
    pages: list[str] = []
    e = html.escape

    # Cover
    pages.append(f"""
<section class="page cover">
  <div class="cover-frame">
    <img class="cover-logo" src="{(PUBLIC / 'images' / 'logo.png').as_uri()}" alt="">
    <div class="rule"><span></span></div>
    <h1>Koleksiyon Kataloğu</h1>
    <p class="cover-sub">El yapımı 925 ayar gümüş yüzükler</p>
    <p class="cover-place">Konya · {date_label}</p>
  </div>
</section>""")

    # Index + how to order
    rows = "".join(
        f'<li><span class="ix-no">{p["no"]:02d}</span><span class="ix-name">{e(p["title"])}</span>'
        f'<span class="ix-dots"></span><span class="ix-price">{p["price"]}</span></li>'
        for p in products)
    pages.append(f"""
<section class="page index">
  <header class="ph"><span>Veysel Ustam</span><span>Fihrist</span></header>
  <h2>Fihrist</h2>
  <ol class="ix">{rows}</ol>
  <footer class="pf"><span>veyselustam.com</span><span>2</span></footer>
</section>""")

    # Product pages
    page_no = 3
    for i in range(0, len(products), PER_PAGE):
        cards = []
        for p in products[i:i + PER_PAGE]:
            sub = f'<p class="sub">{e(p["subtitle"])}</p>' if p["subtitle"] else ""
            cards.append(f"""
  <article class="card">
    <div class="ph-img"><img src="{p['img']}" alt=""><span class="no">No. {p['no']:02d}</span></div>
    <div class="info">
      <h3>{e(p['title'])}</h3>
      {sub}
      <p class="desc">{e(p['desc'])}</p>
      <div class="buy">
        <div><span class="price">{p['price']}</span><span class="silver">925 ayar gümüş · el yapımı</span></div>
        <div class="qr">{p['qr']}</div>
      </div>
    </div>
  </article>""")
        pages.append(f"""
<section class="page products">
  <header class="ph"><span>Veysel Ustam</span><span>Koleksiyon</span></header>
  <div class="grid">{''.join(cards)}</div>
  <footer class="pf"><span>veyselustam.com · WhatsApp {PHONE}</span><span>{page_no}</span></footer>
</section>""")
        page_no += 1

    # Pad to a multiple of 4 pages (saddle-stitch printing) before the back cover.
    while (len(pages) + 1) % 4:
        pages.append(f"""
<section class="page notes">
  <header class="ph"><span>Veysel Ustam</span><span>Notlar</span></header>
  <h2>Notlar</h2>
  <div class="lines"></div>
  <footer class="pf"><span>veyselustam.com</span><span>{len(pages) + 1}</span></footer>
</section>""")

    # Back cover: how to order
    pages.append(f"""
<section class="page back">
  <div class="back-inner">
    <h2>Nasıl sipariş verilir?</h2>
    <ol class="steps">
      <li>Beğendiğiniz yüzüğün <b>numarasını</b> not edin ya da kartındaki karekodu okutun.</li>
      <li>Siparişinizi <b>veyselustam.com</b> üzerinden verin veya WhatsApp'tan yazın.</li>
      <li>Yüzük ölçünüzü bize bildirin; bilmiyorsanız ölçü almanıza yardımcı oluruz.</li>
      <li>Ödeme <b>kapıda ödeme</b> veya <b>havale</b> ile yapılır; sipariş sonrası sizinle iletişime geçilir.</li>
    </ol>
    <div class="contact">
      <div class="qr big">{qr_svg(SITE)}</div>
      <div>
        <p class="c-site">veyselustam.com</p>
        <p>WhatsApp &amp; telefon: <b>{PHONE}</b></p>
        <p>Instagram: <b>{INSTAGRAM}</b></p>
        <p>Konya, Türkiye</p>
      </div>
    </div>
    <p class="fine">Fiyatlar {date_label} tarihi itibarıyla geçerlidir. Güncel fiyat ve stok için karekodu okutun.
    Her yüzük el işçiliğiyle yapıldığından fotoğraftakinden küçük farklılıklar gösterebilir.</p>
    <img class="back-logo" src="{(PUBLIC / 'images' / 'logo.png').as_uri()}" alt="">
  </div>
</section>""")

    css = (Path(__file__).parent / "catalog.css").read_text(encoding="utf-8")
    return f"""<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Veysel Ustam Katalog</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=block" rel="stylesheet">
<style>{css}</style></head>
<body>{''.join(pages)}</body></html>"""


def find_chrome() -> str:
    for c in CHROME_CANDIDATES:
        if os.path.isabs(c) and os.path.exists(c):
            return c
        if not os.path.isabs(c):
            from shutil import which
            if which(c):
                return which(c)  # type: ignore[return-value]
    sys.exit("Chrome bulunamadı.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "katalog"))
    ap.add_argument("--feed", default=FEED)
    args = ap.parse_args()
    out = Path(args.out)
    cache = out / "_img"
    cache.mkdir(parents=True, exist_ok=True)

    rows = load_feed(args.feed)
    order = {t: i for i, t in enumerate(TYPE_ORDER)}
    rows.sort(key=lambda r: (order.get(r.get("product_type", ""), 99), r["title"]))

    products = []
    for n, r in enumerate(rows, 1):
        title, subtitle = split_title(r["title"])
        products.append({
            "no": n,
            "title": title,
            "subtitle": subtitle,
            "desc": short_desc(r.get("description", "")),
            "price": price_tr(r["price"]),
            "img": prepare_image(r, cache).as_uri(),
            "qr": qr_svg(r["link"]),
        })
        print(f"{n:02d} {title[:60]}")

    today = dt.date.today()
    date_label = f"{today.day} {TR_MONTHS[today.month - 1]} {today.year}"
    html_path = out / "katalog.html"
    html_path.write_text(build_html(products, date_label), encoding="utf-8")

    pdf = out / "Veysel-Ustam-Katalog.pdf"
    subprocess.run([
        find_chrome(), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--allow-file-access-from-files", "--virtual-time-budget=20000",
        f"--print-to-pdf={pdf}", html_path.as_uri(),
    ], check=True, capture_output=True)
    print(f"{len(products)} ürün -> {pdf}")


if __name__ == "__main__":
    main()
