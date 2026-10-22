"""Set the real ring (cut from its photo) into an AI-made empty scene.

The ring's shape, oval stone and engraving stay exactly as photographed; only the
setting is generated. Tricks that hide the montage:
  insert: the ring stands in a cushion slit; the cushion's front lip is painted back
          over the ring's base so it sinks in, with a contact shadow.
  macro:  the ring fills the frame, its cut base below the frame edge, scene blurred.
  Both:   light-matched colour, a warm rim light on the side facing the light, a soft
          defocus and grain so the photo and the generated plate read as one image.

Usage: python -P compose.py <model> <plate.png> <out.jpg> insert <cx> <cy> <width> <light: left|right> <tone: warm|candle|cool>
       python -P compose.py <model> <plate.png> <out.jpg> macro <cx> <width> <light> <tone>
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = 1200
# photos whose silver reflects warm light (skin test would punch holes in it);
# their outline is traced tight enough instead
NO_SKIN_PASS = {"hematit"}
TONES = {"warm": (1.08, 1.0, 0.86), "candle": (1.12, 1.0, 0.82), "cool": (0.93, 1.0, 1.1)}


def ring_cutout(model):
    poly = json.load(open(os.path.join(HERE, "ring_polys.json")))[model]
    im = Image.open(os.path.join(REPO, "public", "images", "products", f"sidre-{model}", f"sidre-{model}-2.jpg")).convert("RGB")
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(1.6))
    # intersect with a learned matte (hyperframes remove-background) so no studio
    # backdrop is left around the stone; the polygon removes the hand
    matte = os.path.join("C:/Users/ROGSTRIX/ComfyUI-work/cutouts", f"{model}-2.png")
    if os.path.exists(matte):
        from scipy import ndimage as ndi
        ma = np.asarray(Image.open(matte).getchannel("A").resize(im.size)) > 110
        ma = ndi.binary_fill_holes(ndi.binary_closing(ma, iterations=4))  # outer edge only
        ma = Image.fromarray((ma * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        m = ImageChops.darker(m, ma)
    # fingers behind the lower shoulders: drop skin-coloured pixels in the lower part of
    # the ring only (the stones sit in the upper part, so a red agate is never touched)
    x0, y0, x1, y1 = m.getbbox()
    ycc = np.asarray(im.convert("YCbCr")).astype(np.int16)
    skin = (ycc[..., 2] > 136) & (ycc[..., 1] < 128) & (ycc[..., 0] > 60)
    rows = np.arange(im.height)[:, None]
    skin &= rows > y0 + (y1 - y0) * 0.42
    if model in NO_SKIN_PASS:
        skin[:] = False
    from scipy import ndimage as ndi
    skin = ndi.binary_dilation(ndi.binary_opening(skin, iterations=2), iterations=3)
    keep = Image.fromarray(((~skin) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    m = ImageChops.darker(m, keep)
    r = im.convert("RGBA")
    r.putalpha(m)
    return r.crop(m.getbbox())


def grade(ring, tone, light, plate_lum):
    rgb = ring.convert("RGB")
    a = np.asarray(rgb).astype(np.float32) / 255
    # low-key look of the scene: deeper mid-tones, highlights kept (silver keeps its sparkle)
    a = np.power(a, 1.45)
    target = (60 + plate_lum * 0.9) / 255
    gain = np.clip(target / max(a.mean(), 1e-3), 0.6, 1.1)
    a = a * gain * 255 * np.array(TONES[tone])
    h, w = a.shape[:2]
    # light falloff: brighter on the side facing the light
    ramp = np.linspace(1.12, 0.82, w) if light == "left" else np.linspace(0.82, 1.12, w)
    a = a * ramp[None, :, None]
    rgb = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    alpha = ring.getchannel("A")
    # rim light: a thin warm glow along the edge that faces the light
    edge = ImageChops.subtract(alpha, alpha.filter(ImageFilter.MinFilter(9))).filter(ImageFilter.GaussianBlur(3))
    side = Image.linear_gradient("L").rotate(90 if light == "left" else -90).resize(alpha.size)
    rim = ImageChops.multiply(edge, side)
    glow = Image.new("RGB", rgb.size, (255, 214, 150) if tone != "cool" else (190, 220, 255))
    rgb = Image.composite(ImageChops.screen(rgb, glow), rgb, rim.point(lambda v: int(v * 0.55)))
    rgb = rgb.filter(ImageFilter.GaussianBlur(0.6))  # match the plate's softness
    noise = np.random.default_rng(3).normal(0, 3.0, (h, w, 1))
    rgb = Image.fromarray(np.clip(np.asarray(rgb).astype(np.float32) + noise, 0, 255).astype(np.uint8))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def local_lum(plate, box):
    a = np.asarray(plate.crop(box).convert("L")).astype(np.float32)
    return float(a.mean())


def main():
    a = sys.argv[1:]
    model, plate_p, out_p, mode = a[:4]
    plate = Image.open(plate_p).convert("RGB").resize((OUT, OUT), Image.BICUBIC)
    k = OUT / 1024
    ring = ring_cutout(model)

    if mode == "insert":
        cx, cy, width = float(a[4]) * k, float(a[5]) * k, float(a[6]) * k
        light, tone = a[7], a[8]
        s = width / ring.width
        ring = ring.resize((int(ring.width * s), int(ring.height * s)), Image.LANCZOS)
        sink = int(ring.height * 0.12)  # how far the base goes into the slit
        x, y = int(cx - ring.width / 2), int(cy - ring.height + sink)
        lum = local_lum(plate, (max(0, x), max(0, y), min(OUT, x + ring.width), min(OUT, y + ring.height)))
        ring = grade(ring, tone, light, lum)
        # contact shadow on the cushion around the slit
        sh = Image.new("L", plate.size, 0)
        ImageDraw.Draw(sh).ellipse((cx - ring.width * 0.55, cy - 18 * k, cx + ring.width * 0.55, cy + 26 * k), fill=170)
        sh = sh.filter(ImageFilter.GaussianBlur(18 * k))
        base = Image.composite(Image.new("RGB", plate.size, (0, 0, 0)), plate, sh)
        comp = base.copy()
        comp.paste(ring, (x, y), ring)
        # the cushion lip in front of the slit covers the ring's base
        lip = Image.new("L", plate.size, 0)
        ImageDraw.Draw(lip).ellipse((cx - ring.width * 1.6, cy - 6 * k, cx + ring.width * 1.6, cy - 6 * k + ring.width * 1.1), fill=255)
        lip = lip.filter(ImageFilter.GaussianBlur(3 * k))
        comp = Image.composite(base, comp, lip)
        placed = Image.new("L", plate.size, 0)
        placed.paste(ring.getchannel("A"), (x, y))
        ring_a = ImageChops.multiply(placed, ImageChops.invert(lip))
        shadow_a = sh
    else:  # macro
        cx, width = float(a[4]) * k, float(a[5]) * k
        light, tone = a[6], a[7]
        plate = plate.filter(ImageFilter.GaussianBlur(10 * k))
        s = width / ring.width
        ring = ring.resize((int(ring.width * s), int(ring.height * s)), Image.LANCZOS)
        x = int(cx - ring.width / 2)
        y = OUT - ring.height + int(ring.height * 0.12)  # cut base sits below the frame
        lum = local_lum(plate, (max(0, x), max(0, y), min(OUT, x + ring.width), OUT))
        ring = grade(ring, tone, light, lum)
        sh = Image.new("L", plate.size, 0)
        ImageDraw.Draw(sh).rectangle((x + ring.width * 0.08, y + ring.height * 0.25, x + ring.width * 0.92, OUT), fill=130)
        sh = sh.filter(ImageFilter.GaussianBlur(40 * k))
        comp = Image.composite(Image.new("RGB", plate.size, (0, 0, 0)), plate, sh)
        comp.paste(ring, (x, y), ring)
        ring_a = Image.new("L", plate.size, 0)
        ring_a.paste(ring.getchannel("A"), (x, y))
        shadow_a = sh

    if "--layer" in a:
        # foreground for video: the ring (and its shadow) over a moving plate
        lp = a[a.index("--layer") + 1]
        ra = np.asarray(ring_a).astype(np.float32) / 255
        sa = np.asarray(shadow_a).astype(np.float32) / 255
        total = ra + sa * (1 - ra)
        col = np.asarray(comp).astype(np.float32) * (ra / np.maximum(total, 1e-4))[..., None]
        rgba = np.dstack([np.clip(col, 0, 255), total * 255]).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(lp)
        ring_a.save(lp.replace(".png", "-mask.png"))

    # gentle vignette ties it together
    v = Image.radial_gradient("L").resize((OUT, OUT)).point(lambda p: int(min(255, max(0, (p - 120) * 0.9))))
    comp = Image.composite(ImageEnhance.Brightness(comp).enhance(0.72), comp, v)
    comp.save(out_p, quality=90)
    print("ok", out_p)


if __name__ == "__main__":
    main()
