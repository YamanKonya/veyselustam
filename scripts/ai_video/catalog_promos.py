"""Cinematic hover/promo video for every catalogue product from its own photos.

No AI redraw: the real photos keep every inscription and stone exactly as shot. The
motion (camera moves, gold light pass, dust, grain, brand intro and end card) is in
scripts/ai_video/catalog_template.html, rendered with HyperFrames.

Usage: python -P scripts/ai_video/catalog_promos.py [product_id ...]
Photos come from C:/Users/ROGSTRIX/ComfyUI-work/catalog/<id>/1..3.jpg (downloaded from the
product's image list). Writes public/videos/<id>.mp4 and sets "videoUrl" on the product
in src/data/initialProducts.ts. Existing videos are skipped; delete one to redo it.
"""
import glob, json, os, shutil, subprocess, sys
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
WORK = "C:/Users/ROGSTRIX/ComfyUI-work"
FFMPEG = shutil.which("ffmpeg") or "C:/Users/ROGSTRIX/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"
NPX = shutil.which("npx") or "npx.cmd"
BASE = os.path.join(WORK, "promo", "base")
NL = "\n"

ids = sys.argv[1:] or [p["id"] for p in json.load(open(f"{WORK}/catalog/list.json", encoding="utf-8"))]
done = []
for pid in ids:
    out = os.path.join(REPO, "public", "videos", f"{pid}.mp4")
    if os.path.exists(out):
        done.append(pid)
        continue
    photos = sorted(glob.glob(f"{WORK}/catalog/{pid}/[0-9].jpg"))
    if not photos:
        print(pid, "no photos", flush=True)
        continue
    while len(photos) < 3:  # products with one or two photos reuse them
        photos.append(photos[len(photos) % max(1, len(photos))])
    proj = os.path.join(WORK, "promo", "runs", pid)
    os.makedirs(os.path.join(proj, "assets"), exist_ok=True)
    for f in ("package.json", "hyperframes.json", "meta.json", "watermark.webp", "pattern-seljuk-dark.svg"):
        shutil.copy(os.path.join(BASE, f), proj)
    shutil.copy(os.path.join(HERE, "catalog_template.html"), os.path.join(proj, "index.html"))
    for i, src in enumerate(photos[:3], 1):
        im = ImageOps.fit(Image.open(src).convert("RGB"), (1080, 1080), Image.LANCZOS)  # square, centred
        im.save(os.path.join(proj, "assets", f"{i}.jpg"), quality=92)
    raw = os.path.join(proj, "renders", "video.mp4")
    r = subprocess.run([NPX, "hyperframes", "render", ".", "--skill=motion-graphics", "-q", "high", "-o", "./renders/video.mp4"],
                       cwd=proj, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=os.name == "nt")
    if not os.path.exists(raw):
        print(pid, "render failed", (r.stderr or r.stdout)[-400:], flush=True)
        continue
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", raw, "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True)
    done.append(pid)
    print(pid, f"{os.path.getsize(out) / 1e6:.2f} MB", flush=True)

# videoUrl on each product in the catalogue
path = os.path.join(REPO, "src", "data", "initialProducts.ts")
text = open(path, encoding="utf-8").read()
crlf = "\r\n" in text
text = text.replace("\r\n", NL)
for pid in done:
    start = text.index(f'"id": "{pid}",')
    nxt = text.find('"id": "', start + 10)
    own = text[start: nxt if nxt != -1 else len(text)]
    if '"videoUrl"' in own:
        continue
    after = text.index(NL + "    ],", start) + len(NL + "    ],")  # after the images list
    text = text[:after] + NL + f'    "videoUrl": "/videos/{pid}.mp4",' + text[after:]
open(path, "w", encoding="utf-8").write(text.replace(NL, "\r\n") if crlf else text)
print("videoUrl set on", len(done), "products")
