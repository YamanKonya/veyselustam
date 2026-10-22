"""Remove the holding hand from a staged ring photo by skin colour, keep the ring.

Usage: python -P ring_only.py <in.jpg> <out.png> [bg_hex]
Skin is found in YCbCr; the stone keeps its pixels even when reddish (largest
non-skin blob wins). The removed area is filled with the flat backdrop colour so an
image model only has to complete the hidden band, not reinvent the ring.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
bg = tuple(int(sys.argv[3][i:i + 2], 16) for i in (0, 2, 4)) if len(sys.argv) > 3 else (12, 36, 23)
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int16)
ycc = np.asarray(im.convert("YCbCr")).astype(np.int16)
Y, Cb, Cr = ycc[..., 0], ycc[..., 1], ycc[..., 2]
skin = (Cr > 135) & (Cr < 180) & (Cb > 85) & (Cb < 130) & (Y > 70)
sat = a.max(-1) - a.min(-1)
backdrop = (a[..., 1] > a[..., 0] + 8) & (sat > 12) & (Y < 90)  # the green studio backdrop
ring = ~skin & ~backdrop
ring = ndi.binary_opening(ring, iterations=3)
lab, n = ndi.label(ring)
sizes = ndi.sum(ring, lab, range(1, n + 1))
ring = ndi.binary_fill_holes(lab == (np.argmax(sizes) + 1))
mask = Image.fromarray((ring * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
canvas = Image.new("RGB", im.size, bg)
canvas.paste(im, (0, 0), mask)
canvas.save(out)
print("ok", out)
