"""Put the real stone (with its inscription) into an AI scene shot.

AI image models redraw calligraphy as meaningless strokes, so for inscribed stones
the stone is taken from a real photo and fitted onto the stone in the AI image.

Usage: python -P stone_swap.py <real_stone.jpg> <ai.png> <out.jpg> [--src E] [--dst E] [--debug dbg.jpg]
  E = "cx,cy,hx,hy,vx,vy": ellipse centre and its two semi-axis vectors (the one
  closest to horizontal first) in pixels. Given ellipses replace auto-detection.
Works for dark stones (hematite, onyx): the stone is found as the largest dark,
low-saturation blob near the image centre and approximated by an ellipse.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi


def stone_mask(im, dark=60):
    """Dark, neutral, compact and roughly elliptical blob near the centre."""
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    lum = (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000
    sat = a.max(-1) - a.min(-1)
    h, w = lum.shape
    best, best_score = None, 0
    for thr in (dark - 20, dark, dark + 20):
        m = (lum < thr) & (sat < 22)
        m = ndi.binary_opening(m, iterations=2)
        lab, n = ndi.label(m)
        for i in range(1, n + 1):
            blob = lab == i
            area = blob.sum()
            if not (0.004 * h * w < area < 0.2 * h * w):
                continue
            blob = ndi.binary_fill_holes(ndi.binary_closing(blob, iterations=4))
            ys, xs = np.nonzero(blob)
            if xs.min() == 0 or ys.min() == 0 or xs.max() == w - 1 or ys.max() == h - 1:
                continue  # touches the frame: background, not a stone
            cov = np.cov(np.vstack([xs, ys]))
            ev = np.linalg.eigvalsh(cov)
            ell_area = np.pi * 4 * np.sqrt(max(ev[0], 1e-6) * ev[1])
            fill = blob.sum() / ell_area
            if fill < 0.75 or fill > 1.15 or ev[0] / ev[1] < 0.15:
                continue
            cx, cy = xs.mean() / w, ys.mean() / h
            score = fill * np.sqrt(blob.sum()) * (1.2 - abs(cx - 0.5)) * (1.2 - abs(cy - 0.5))
            if score > best_score:
                best, best_score = blob, score
    return best


def ellipse(mask):
    ys, xs = np.nonzero(mask)
    c = np.array([xs.mean(), ys.mean()])
    cov = np.cov(np.vstack([xs - c[0], ys - c[1]]))
    vals, vecs = np.linalg.eigh(cov)
    axes = [vecs[:, i] * 2 * np.sqrt(vals[i]) for i in range(2)]  # semi-axis vectors
    # order: the axis closest to horizontal first, both pointing right / down
    axes.sort(key=lambda v: abs(v[1]) / (np.hypot(*v) + 1e-9))
    h, v = axes
    if h[0] < 0:
        h = -h
    if v[1] < 0:
        v = -v
    return c, h, v


def main():
    args = sys.argv[1:]
    real_p, ai_p, out_p = args[:3]
    dbg = args[args.index("--debug") + 1] if "--debug" in args else None
    real = Image.open(real_p).convert("RGB")
    ai = Image.open(ai_p).convert("RGB")
    def given(flag):
        if flag not in args:
            return None
        v = [float(x) for x in args[args.index(flag) + 1].split(",")]
        return np.array(v[0:2]), np.array(v[2:4]), np.array(v[4:6])

    def find(im, flag):
        e = given(flag)
        if e:
            return e
        m = stone_mask(im)
        if m is None:
            raise SystemExit("stone not found; pass " + flag)
        return ellipse(m)

    cs, hs, vs = find(real, "--src")
    ct, ht, vt = find(ai, "--dst")
    print("dst ellipse:", ",".join(f"{x:.0f}" for x in (*ct, *ht, *vt)))

    # x_t = ct + M (x_s - cs), with M mapping the source ellipse frame onto the target's
    M = np.column_stack([ht, vt]) @ np.linalg.inv(np.column_stack([hs, vs]))
    Minv = np.linalg.inv(M)
    off = cs - Minv @ ct
    warped = real.transform(ai.size, Image.AFFINE, (Minv[0, 0], Minv[0, 1], off[0], Minv[1, 0], Minv[1, 1], off[1]), resample=Image.BICUBIC)

    # Blend inside the target ellipse, slightly shrunk, with a soft edge
    mask = Image.new("L", ai.size, 0)
    d = ImageDraw.Draw(mask)
    pts = [tuple(ct + 0.97 * (np.cos(t) * ht + np.sin(t) * vt)) for t in np.linspace(0, 2 * np.pi, 180)]
    d.polygon(pts, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(2, np.hypot(*vt) * 0.04)))

    # Match brightness to the scene's lighting
    w_arr = np.asarray(warped).astype(np.float32)
    a_arr = np.asarray(ai).astype(np.float32)
    inside = np.asarray(mask) > 200
    if inside.any():
        gain = (a_arr[inside].mean() + 1) / (w_arr[inside].mean() + 1)
        w_arr = np.clip(w_arr * (0.5 + 0.5 * gain), 0, 255)
    warped = Image.fromarray(w_arr.astype(np.uint8))
    out = Image.composite(warped, ai, mask)
    out.save(out_p, quality=90)

    if dbg:
        ov = ai.copy()
        dd = ImageDraw.Draw(ov)
        dd.line(pts + [pts[0]], fill=(255, 0, 0), width=3)
        sbs = Image.new("RGB", (ai.width * 2, ai.height))
        sbs.paste(ov, (0, 0))
        sbs.paste(out, (ai.width, 0))
        sbs.thumbnail((1400, 700))
        sbs.save(dbg, quality=85)
    print("ok", out_p)


if __name__ == "__main__":
    main()
