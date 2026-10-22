"""Three 5 s cinematic clips per Sidre model with Wan 2.2 (wan_i2v.py).

Usage: python -P scripts/ai_video/sidre_clips.py [model ...]
Start frames are the site's scene shots; clips go to C:/Users/ROGSTRIX/ComfyUI-work/video/<model>/.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wan_i2v import run

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = "C:/Users/ROGSTRIX/ComfyUI-work/video"
STONES = {
    "akik": "polished red agate stone",
    "hematit": "black hematite stone with its engraved calligraphy",
    "firuze": "turquoise stone",
    "yesil": "faceted green quartz stone",
}
KEEP = "The ring keeps exactly the same shape, stone and engraving throughout. Luxury jewelry commercial, photorealistic, smooth cinematic motion."
CLIPS = [
    ("velvet", "velvet-hero", "The camera slowly orbits around the handmade silver ring resting on the green velvet cushion. "
     "Warm lantern light flickers softly, glints of light travel across the {stone} and the hand-engraved silver, floating golden dust particles, shallow depth of field."),
    ("casket", "casket-hero", "The camera slowly pushes in toward the silver ring inside the open antique carved walnut box. "
     "Candle flames flicker gently in the background, warm highlights shimmer on the {stone} and the engraved silver, soft bokeh."),
    ("slate", "slate-side", "The camera glides slowly along the side of the silver ring on wet black slate, revealing the hand-engraved shoulder. "
     "A sweep of warm rim light moves across the polished silver and the {stone}, water droplets glisten, dramatic dark background."),
]

for m in sys.argv[1:] or list(STONES):
    out_dir = os.path.join(WORK, m)
    os.makedirs(out_dir, exist_ok=True)
    for name, still, motion in CLIPS:
        out = os.path.join(out_dir, f"{name}.mp4")
        if os.path.exists(out):
            continue
        start = os.path.join(REPO, "public", "images", "products", f"sidre-{m}", f"sidre-{m}-{still}.jpg")
        secs = run(start, out, motion.format(stone=STONES[m]) + " " + KEEP, size=640, frames=81, seed=3)
        print(m, name, f"{secs:.0f}s", flush=True)
