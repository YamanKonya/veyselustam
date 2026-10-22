"""Three 5 s cinematic clips per Sidre model with Wan 2.2 (wan_i2v.py).

Usage: python -P scripts/ai_video/sidre_clips.py [model ...]
Start frames are the site's scene shots; clips go to C:/Users/ROGSTRIX/ComfyUI-work/video/<model>/.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wan_i2v import run

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.environ.get("VIDEO_DIR", "C:/Users/ROGSTRIX/ComfyUI-work/video")
STONES = {
    "akik": "polished red agate stone",
    "hematit": "black hematite stone with its engraved calligraphy",
    "firuze": "turquoise stone",
    "yesil": "faceted green quartz stone",
}
KEEP = ("The ring does not rotate or change: same shape, same wide oval stone, same engraving, no new parts. "
        "Luxury jewelry commercial, photorealistic, smooth cinematic motion.")
# No orbiting: a turning camera makes the model invent the ring's hidden side and it
# redraws the oval stone upright. Slow push-ins and moving light keep the real ring.
CLIPS = [
    ("velvet", "scene-1", "Very slow cinematic push-in toward the silver ring standing in the green velvet cushion. "
     "The lantern flame flickers warmly, soft glints of light travel across the {stone} and the hand-engraved silver, golden dust particles drift in the air."),
    ("casket", "scene-2", "Very slow cinematic push-in toward the silver ring standing in the open antique walnut box. "
     "The candle flame flickers gently, warm highlights shimmer and move across the {stone} and the engraved silver, soft bokeh."),
    ("slate", "scene-4", "Very slow sideways camera drift past the silver ring on wet black slate. "
     "A sweep of warm light glides across the polished silver and the {stone}, tiny water droplets glisten, dramatic dark background."),
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
