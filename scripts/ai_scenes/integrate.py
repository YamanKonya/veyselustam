"""Copy a Sidre model's 18 scene shots into public/ and update its image list.

Usage: python -P scripts/ai_scenes/integrate.py <model> [<source_dir>]
  source_dir defaults to C:/Users/ROGSTRIX/ComfyUI-work/scenes/<model> (PNG or JPG
  named <scene>-<angle>). Image order: real main photo, 18 scene shots, real 2-5.
Sets "imagesVersion": 2 on the product so the admin panel pushes the new list to
Firestore the next time it is opened.
"""
import os, sys
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCENES = ["velvet", "casket", "slate"]
ORDER = ["hero", "side", "front", "top", "stone", "engrave"]
NL = "\n"

m = sys.argv[1]
src_dir = sys.argv[2] if len(sys.argv) > 2 else f"C:/Users/ROGSTRIX/ComfyUI-work/scenes/{m}"
slug = f"sidre-{m}"
pub = os.path.join(REPO, "public", "images", "products", slug)

ai = []
for angle in ORDER:
    for scene in SCENES:
        base = os.path.join(src_dir, f"{scene}-{angle}")
        src = next(p for p in (base + ".jpg", base + ".png") if os.path.exists(p))
        name = f"{slug}-{scene}-{angle}.jpg"
        Image.open(src).convert("RGB").save(os.path.join(pub, name), "JPEG", quality=86, optimize=True, progressive=True)
        ai.append(f"/images/products/{slug}/{name}")
real = [f"/images/products/{slug}/{slug}-{i}.jpg" for i in (1, 2, 3, 4, 5)]
images = [real[0]] + ai + real[1:]

path = os.path.join(REPO, "src", "data", "initialProducts.ts")
text = open(path, encoding="utf-8").read()
crlf = "\r\n" in text
text = text.replace("\r\n", NL)
pstart = text.index(f'"id": "vu-{slug}",')
open_i = text.index('"images": [', pstart) + len('"images": [')
close_i = text.index(NL + "    ],", open_i)
text = text[:open_i] + ",".join(f'{NL}      "{p}"' for p in images) + text[close_i:]
nxt = text.find('"id": "vu-', pstart + 10)
if '"imagesVersion"' not in text[pstart: nxt if nxt != -1 else len(text)]:
    after = text.index(NL + "    ],", pstart) + len(NL + "    ],")
    text = text[:after] + NL + '    "imagesVersion": 2,' + text[after:]
open(path, "w", encoding="utf-8").write(text.replace(NL, "\r\n") if crlf else text)
print(slug, len(images), "images")
