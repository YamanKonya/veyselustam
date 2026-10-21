"""Product images for the shop from the owner's photos.

Usage:
    python -P scripts/product_images.py spec.json [--sheet out.jpg]

spec.json:
{
  "slug": "sidre-akik",                 # folder + file prefix under public/images/products/
  "label": "Sidre Akik",                # small line under VEYSEL USTAM on the branded frame
  "count": 10,                          # how many images to produce (default 10)
  "photos": [
    {
      "path": "C:/.../IMG_1.jpg",
      "ring":  [x0, y0, x1, y1],        # optional: box around the whole ring (pixels, after EXIF rotation)
      "stone": [x0, y0, x1, y1],        # optional: box around the stone / top face
      "side":  [x0, y0, x1, y1]         # optional: box around the engraved side
    },
    {"path": "C:/.../IMG_2.jpg"}        # extra photos: used as they are (square crop)
  ]
}

Boxes are optional; without them the photo's centre is used. Every photo given is
used once as a clean square image, then the first photo fills the remaining slots
with close-ups and tone variants (studio light, warm, silver, vignette, branded frame).
Output: 1200x1200 progressive JPEGs, <slug>-1.jpg … <slug>-N.jpg. Image 1 is the hero.
"""
import json, os, sys
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps, ImageDraw, ImageFont

SIZE = 1200
GREEN, GOLD, IVORY = (12, 36, 23), (197, 160, 89), (243, 236, 220)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def square(im, box=None, pad=0.12):
    """Square crop around a box (with padding), clamped inside the image."""
    if box is None:
        s = min(im.width, im.height)
        box = ((im.width - s) / 2, (im.height - s) / 2, (im.width + s) / 2, (im.height + s) / 2)
        pad = 0
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    s = min(max(x1 - x0, y1 - y0) * (1 + 2 * pad), im.width, im.height)
    left = min(max(cx - s / 2, 0), im.width - s)
    top = min(max(cy - s / 2, 0), im.height - s)
    return im.crop((int(left), int(top), int(left + s), int(top + s))).resize((SIZE, SIZE), Image.LANCZOS)


def inner(box, frac):
    """A centred box `frac` the size of `box`."""
    x0, y0, x1, y1 = box
    w, h = (x1 - x0) * frac, (y1 - y0) * frac
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)


def studio(im):
    im = ImageOps.autocontrast(im, cutoff=1)
    im = ImageEnhance.Brightness(im).enhance(1.06)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=3))


def tone(im, r, g, b):
    lut = lambda f: [min(255, int(i * f)) for i in range(256)]
    return Image.merge("RGB", [ch.point(lut(f)) for ch, f in zip(im.split(), (r, g, b))])


def silver(im):
    g = ImageOps.grayscale(ImageOps.autocontrast(im, cutoff=1))
    return ImageOps.colorize(g, black=(18, 22, 26), white=(246, 248, 250), mid=(128, 134, 140))


def vignette(im, strength=0.65):
    mask = Image.new("L", im.size, 0)
    m = int(im.width * 0.08)
    ImageDraw.Draw(mask).ellipse((m, m, im.width - m, im.height - m), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(im.width * 0.12))
    return Image.composite(im, ImageEnhance.Brightness(im).enhance(1 - strength), mask)


def font(size):
    for f in ("C:/Windows/Fonts/georgia.ttf", "C:/Windows/Fonts/times.ttf", "C:/Windows/Fonts/arial.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def branded(im_square, label):
    canvas = Image.new("RGB", (SIZE, SIZE), GREEN)
    side = 880
    x, y = (SIZE - side) // 2, 110
    canvas.paste(im_square.resize((side, side), Image.LANCZOS), (x, y))
    d = ImageDraw.Draw(canvas)
    d.rectangle((x - 10, y - 10, x + side + 9, y + side + 9), outline=GOLD, width=2)
    d.rectangle((x - 22, y - 22, x + side + 21, y + side + 21), outline=GOLD, width=1)
    for text, f, fill, dy in (("VEYSEL USTAM", font(64), IVORY, 48), (label, font(34), GOLD, 128)):
        d.text(((SIZE - d.textlength(text, font=f)) / 2, y + side + dy), text, font=f, fill=fill)
    return canvas


BACKDROPS = {
    "green": ((28, 70, 46), (7, 24, 15)),
    "ivory": ((250, 246, 238), (222, 212, 192)),
    "charcoal": ((58, 62, 66), (14, 16, 18)),
}


def backdrop(kind):
    """Square radial-gradient studio backdrop."""
    inner_c, outer_c = BACKDROPS[kind]
    small = 256
    grad = Image.new("L", (small, small))
    px = grad.load()
    for y in range(small):
        for x in range(small):
            d = ((x - small / 2) ** 2 + (y - small * 0.45) ** 2) ** 0.5 / (small * 0.72)
            px[x, y] = int(255 * min(1, d))
    grad = grad.resize((SIZE, SIZE), Image.BICUBIC).filter(ImageFilter.GaussianBlur(8))
    return Image.composite(Image.new("RGB", (SIZE, SIZE), outer_c), Image.new("RGB", (SIZE, SIZE), inner_c), grad)


def staged(cut_square, kind="green"):
    """Cut-out subject on a studio backdrop with a soft contact shadow."""
    bg = backdrop(kind).convert("RGBA")
    alpha = cut_square.getchannel("A")
    shadow = Image.new("RGBA", cut_square.size, (0, 0, 0, 0))
    shadow.putalpha(alpha.point(lambda a: int(a * 0.45)).filter(ImageFilter.GaussianBlur(28)))
    bg.alpha_composite(shadow, (0, 22))
    bg.alpha_composite(cut_square)
    return bg.convert("RGB")


def load_cutout(path, clip_top=None, stone_oval=None, clear=()):
    cut = Image.open(path).convert("RGBA")
    a = cut.getchannel("A")
    d = ImageDraw.Draw(a)
    if clip_top:
        # Drop anything above the ring (tools left behind by the matting)
        d.rectangle((0, 0, cut.width, int(clip_top)), fill=0)
    for box in clear:
        # Leftover tools next to the ring
        if len(box) == 4:
            d.rectangle(tuple(int(v) for v in box), fill=0)
        else:  # polygon: x0, y0, x1, y1, ...
            d.polygon([(box[i], box[i + 1]) for i in range(0, len(box), 2)], fill=0)
    if stone_oval:
        # Around a domed stone: keep only the stone's oval in its upper part
        x0, y0, x1, y1 = stone_oval
        keep = Image.new("L", cut.size, 255)
        kd = ImageDraw.Draw(keep)
        kd.rectangle((0, 0, cut.width, int(y0 + (y1 - y0) * 0.45)), fill=0)
        dx = (x1 - x0) * 0.04
        kd.ellipse((x0 - dx, y0, x1 + dx, y1 + (y1 - y0)), fill=255)
        keep = keep.filter(ImageFilter.GaussianBlur(2))
        a = ImageChops.darker(a, keep)
    cut.putalpha(a)
    return cut



def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    spec = json.load(open(args[0], encoding="utf-8"))
    sheet_path = args[args.index("--sheet") + 1] if "--sheet" in args else None
    slug, label, count = spec["slug"], spec.get("label", ""), int(spec.get("count", 10))

    photos = []
    for p in spec["photos"]:
        im = ImageOps.exif_transpose(Image.open(p["path"])).convert("RGB")
        photos.append((im, p))

    images = [square(im, p.get("ring"), pad=0.10) for im, p in photos]
    first, fp = photos[0]
    ring = fp.get("ring") or (0, 0, first.width, first.height)
    hero = images[0]

    if fp.get("cutout"):
        # Studio set: the photo's subject matted onto brand backdrops, then the
        # untouched workshop photo for authenticity
        cut = load_cutout(fp["cutout"], fp.get("clip_top"), fp.get("stone_oval"), fp.get("clear", ()))
        cut_hero = square(cut, ring, pad=0.34)
        cut_studio = studio(cut_hero.convert("RGB"))
        cut_studio.putalpha(cut_hero.getchannel("A"))
        silver_cut = silver(cut_hero.convert("RGB")).convert("RGBA")
        silver_cut.putalpha(cut_hero.getchannel("A"))
        stone = square(cut, fp.get("stone") or inner(ring, 0.45), pad=0.32)
        side = square(cut, fp.get("side") or inner(ring, 0.7), pad=0.02)
        images = [
            staged(cut_studio, "green"),                                # 1 hero on brand green
            staged(cut_studio, "ivory"),                                # 2 hero on ivory
            staged(stone, "green"),                                     # 3 stone close-up
            staged(side, "green"),                                      # 4 hand-chased engraving
            studio(hero),                                               # 5 workshop photo
            staged(silver_cut, "charcoal"),                             # 6 silver tone
            tone(studio(hero), 1.06, 1.0, 0.9),                         # 7 warm workshop
            branded(staged(cut_studio, "green"), label),                # 8 branded frame
            studio(square(first, fp.get("stone") or inner(ring, 0.45), pad=0.05)),  # 9 bezel detail
            square(first, ring, pad=0.45),                              # 10 wider view
        ] + images[1:]
        extras = []
    else:
        extras = None

    if extras is None:
        extras = [
            square(first, fp.get("stone") or inner(ring, 0.45), pad=0.18),  # stone close-up
            square(first, fp.get("side") or inner(ring, 0.7), pad=0.02),    # engraving / detail
            studio(hero),                                                   # studio light
            tone(studio(hero), 1.06, 1.0, 0.9),                             # warm
            silver(hero),                                                   # silver tone
            vignette(studio(hero)),                                         # vignette
            branded(studio(hero), label),                                   # branded frame
            square(first, ring, pad=0.45),                                  # wider view
        ]
    images += extras
    images = images[:count]

    out_dir = os.path.join(ROOT, "public", "images", "products", slug)
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for i, im in enumerate(images, 1):
        path = os.path.join(out_dir, f"{slug}-{i}.jpg")
        im.save(path, "JPEG", quality=84, optimize=True, progressive=True)
        paths.append(f"/images/products/{slug}/{slug}-{i}.jpg")

    if sheet_path:
        cols = 5
        rows = (len(images) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 240, rows * 240), "white")
        for i, im in enumerate(images):
            t = im.copy()
            t.thumbnail((240, 240))
            sheet.paste(t, ((i % cols) * 240, (i // cols) * 240))
        sheet.save(sheet_path, quality=85)

    print(json.dumps(paths, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
