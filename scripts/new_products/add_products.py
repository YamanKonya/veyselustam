"""Add the products in products.py to the catalogue (inactive) with photos and 5-language text.

Usage: python -P scripts/new_products/add_products.py <photos_dir>
  photos_dir: folder with the extracted photos (sorted file names = photo numbers).
Writes public/images/products/<key>/<key>-N.jpg, appends to src/data/initialProducts.ts
(isActive: false) and to TITLES / STORIES / ENTRIES in src/i18n/catalogContent.ts.
Products already in the catalogue are skipped.
"""
import json, os, sys
from datetime import datetime, timezone, timedelta
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from products import P, SIZES

photos_dir = sys.argv[1]
files = sorted(os.listdir(photos_dir))
NL = "\n"
LANGS = ("tr", "en", "es", "de", "ar")


def read(path):
    s = open(path, encoding="utf-8").read()
    return s, "\r\n" in s


def write(path, s, crlf):
    open(path, "w", encoding="utf-8").write(s.replace(NL, "\r\n") if crlf else s)


def js(s):
    return json.dumps(s, ensure_ascii=False)


def insert_into_object(src, header, block):
    """Insert block before the closing '};' of the object literal starting at header."""
    start = src.index(header)
    end = src.index(NL + "};", start)
    return src[:end] + NL + block.rstrip(NL) + src[end:]


prod_path = os.path.join(REPO, "src", "data", "initialProducts.ts")
cat_path = os.path.join(REPO, "src", "i18n", "catalogContent.ts")
prod_src, prod_crlf = read(prod_path)
cat_src, cat_crlf = read(cat_path)
prod_src = prod_src.replace("\r\n", NL)
cat_src = cat_src.replace("\r\n", NL)

base_time = datetime.now(timezone.utc)
added = []
for i, p in enumerate(P):
    key, pid = p["key"], "vu-" + p["key"]
    if f'"id": "{pid}"' in prod_src:
        print("skip (exists)", pid)
        continue
    ckey = "n_" + key.replace("-", "_")

    # photos
    out_dir = os.path.join(REPO, "public", "images", "products", key)
    os.makedirs(out_dir, exist_ok=True)
    images = []
    for k, n in enumerate(p["photos"], 1):
        im = ImageOps.exif_transpose(Image.open(os.path.join(photos_dir, files[n]))).convert("RGB")
        im.thumbnail((1400, 1400), Image.LANCZOS)
        name = f"{key}-{k}.jpg"
        im.save(os.path.join(out_dir, name), "JPEG", quality=85, optimize=True, progressive=True)
        images.append(f"/images/products/{key}/{name}")

    # catalogue text (5 languages)
    t = p["title"]
    st = p["story"]
    cat_src = insert_into_object(cat_src, "const TITLES: Record<string, L> = {",
        f"  {ckey}: {{" + NL + "".join(f"    {l}: {js(t[l])},{NL}" for l in LANGS) + "  },")
    cat_src = insert_into_object(cat_src, "const STORIES: Record<string, L> = {",
        f"  {ckey}: {{" + NL + "".join(f"    {l}: {js(st[l])},{NL}" for l in LANGS) + "  },")
    entry = f'title: "{ckey}", story: "{ckey}"'
    if p["stone"]:
        entry += f', stone: "{p["stone"]}"'
    if p["sacred"]:
        entry += ", sacred: true"
    cat_src = insert_into_object(cat_src, "const ENTRIES: Record<string, CatalogEntry> = {", f'  "{pid}": {{ {entry} }},')

    # product record (newest first: earlier list items get the later timestamp)
    created = (base_time - timedelta(seconds=i)).isoformat().replace("+00:00", "Z")
    rec = {
        "id": pid,
        "title": t["tr"],
        "description": st["tr"],
        "price": p["price"],
        "images": images,
        "category": p["cat"],
        "ringSize": p.get("sizes", SIZES),
        "stock": 1,
        "isActive": False,
        "createdAt": created,
    }
    body = json.dumps(rec, ensure_ascii=False, indent=2)
    body = NL.join("  " + line for line in body.split(NL))
    end = prod_src.rindex(NL + "];")
    prod_src = prod_src[:end] + "," + NL + body + prod_src[end:]
    added.append(pid)
    print(pid, len(images), "photos")

write(prod_path, prod_src, prod_crlf)
write(cat_path, cat_src, cat_crlf)
print("added", len(added))
