"""Build each Sidre model's image set from the real ring set into AI scene plates.

Usage: python -P scripts/ai_scenes/build_sets.py [model ...]
Plates: C:/Users/ROGSTRIX/ComfyUI-work/plates/<scene>-<n>.png (empty scenes made with
qwen_edit.py). Writes public/images/products/sidre-<m>/sidre-<m>-scene-<k>.jpg, removes
the older AI shots (they drew the oval stone upright), and sets the product's image
list: real main photo, the composites, then real photos 2-5. imagesVersion is raised
so /admin copies the list to Firestore.
"""
import glob, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
PLATES = "C:/Users/ROGSTRIX/ComfyUI-work/plates"
VERSION = 3
SHOTS = [  # plate, mode, args
    ("velvet-1", "insert", ["530", "705", "380", "left", "warm"]),
    ("casket-1", "insert", ["480", "636", "300", "right", "candle"]),
    ("velvet-3", "insert", ["512", "672", "400", "left", "warm"]),
    ("slate-1", "macro", ["512", "820", "left", "cool"]),
    ("velvet-2", "macro", ["560", "800", "left", "warm"]),
    ("casket-1", "macro", ["480", "820", "right", "candle"]),
    ("slate-2", "macro", ["512", "860", "right", "cool"]),
    ("velvet-1", "macro", ["600", "820", "left", "warm"]),
    ("slate-3", "macro", ["512", "780", "left", "cool"]),
]
NL = "\n"

for m in sys.argv[1:] or ["akik", "hematit", "firuze", "yesil"]:
    slug = f"sidre-{m}"
    pub = os.path.join(REPO, "public", "images", "products", slug)
    for old in glob.glob(os.path.join(pub, f"{slug}-*-*.jpg")):  # older AI scene shots
        os.remove(old)
    shots = []
    for k, (plate, mode, args) in enumerate(SHOTS, 1):
        name = f"{slug}-scene-{k}.jpg"
        subprocess.run([sys.executable, "-P", os.path.join(HERE, "compose.py"), m, f"{PLATES}/{plate}.png",
                        os.path.join(pub, name), mode, *args], check=True, capture_output=True)
        shots.append(f"/images/products/{slug}/{name}")
    real = [f"/images/products/{slug}/{slug}-{i}.jpg" for i in (1, 2, 3, 4, 5)]
    images = [real[0]] + shots + real[1:]

    path = os.path.join(REPO, "src", "data", "initialProducts.ts")
    text = open(path, encoding="utf-8").read()
    crlf = "\r\n" in text
    text = text.replace("\r\n", NL)
    pstart = text.index(f'"id": "vu-{slug}",')
    open_i = text.index('"images": [', pstart) + len('"images": [')
    close_i = text.index(NL + "    ],", open_i)
    text = text[:open_i] + ",".join(f'{NL}      "{p}"' for p in images) + text[close_i:]
    nxt = text.find('"id": "vu-', pstart + 10)
    own_end = nxt if nxt != -1 else len(text)
    own = text[pstart:own_end]
    if '"imagesVersion"' in own:
        own = own.replace(own[own.index('"imagesVersion"'):].split(",", 1)[0], f'"imagesVersion": {VERSION}', 1)
        text = text[:pstart] + own + text[own_end:]
    else:
        after = text.index(NL + "    ],", pstart) + len(NL + "    ],")
        text = text[:after] + NL + f'    "imagesVersion": {VERSION},' + text[after:]
    open(path, "w", encoding="utf-8").write(text.replace(NL, "\r\n") if crlf else text)
    print(slug, len(images), "images")
