"""Premium scene shots for a Sidre ring: 3 scenes x 6 angles via qwen_edit.py.

Usage: python -P scripts/ai_scenes/batch.py <model> [<model> ...]   (akik, hematit, firuze, yesil)
Output: C:/Users/ROGSTRIX/ComfyUI-work/scenes/<model>/<scene>-<angle>.png (existing files are skipped)
Inputs are the site's own images: sidre-<model>-1 (hero), -3 (stone close-up), -4 (engraved side).
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qwen_edit import edit

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(REPO, "public", "images", "products")
WORK = os.environ.get("SCENES_DIR", "C:/Users/ROGSTRIX/ComfyUI-work/scenes")
# The real stones are horizontal ovals: seen face-on the long axis runs across the
# finger (left to right), about 4:3. The model tends to draw them upright, so say it.
OVAL = ("The stone is a horizontal oval, about 4:3: its long axis runs left to right across the ring, "
        "never upright or round. Keep this exact oval shape and proportion. ")

STONES = {
    "akik": "polished deep red agate cabochon",
    "hematit": "black hematite stone",
    "firuze": "blue-green turquoise stone with dark matrix veins",
    "yesil": "faceted pale green quartz stone",
}
SCENES = {
    "velvet": ("resting on a deep emerald green velvet cushion, background softly blurred with the warm glow of an ornate Ottoman copper lantern, rich cinematic lighting", 5),
    "slate": ("on wet black slate stone with small water droplets around it (not on the stone), dark background, warm rim light from one side and cool light from the other", 9),
    "casket": ("inside an open antique carved walnut jewelry box lined with dark green silk, warm candlelight in the blurred background", 6),
}
# Every angle keeps the real photo's viewpoint (the engraved side, stone seen as a
# wide oval). Asking for front or top views makes the model draw an upright oval stone.
ANGLES = [
    ("hero", 1, "Keep exactly the same camera angle as the photo, the whole ring visible and centred"),
    ("wide", 1, "Keep the same camera angle as the photo, the ring a little smaller in the frame so more of the scene shows"),
    ("low", 4, "Keep the same camera angle as the photo, camera slightly lower so the ring looks monumental, the whole ring visible"),
    ("side", 4, "Keep the same camera angle as the photo, showing the hand-engraved shoulder, the whole ring visible"),
    ("stone", 3, "Close-up of the stone and its silver bezel from the same angle as the photo, razor sharp detail, shallow depth of field"),
    ("engrave", 4, "Close-up of the hand-engraved floral pattern on the silver shoulder from the same angle as the photo, razor sharp detail"),
]

for m in sys.argv[1:] or list(STONES):
    out_dir = os.path.join(WORK, m)
    os.makedirs(out_dir, exist_ok=True)
    for scene, (desc, seed) in SCENES.items():
        for name, src_n, view in ANGLES:
            out = os.path.join(out_dir, f"{scene}-{name}.png")
            if os.path.exists(out):
                continue
            src = os.path.join(PUB, f"sidre-{m}", f"sidre-{m}-{src_n}.jpg")
            prompt = (f"Remove the hand and fingers holding the ring. {view}. Place this exact silver ring {desc}. {OVAL}"
                      f"Keep the ring itself exactly as in the photo: same {STONES[m]}, same hand-engraved floral scroll pattern, "
                      "same bezel and the same tall flared shoulders. Premium luxury jewelry photograph, photorealistic, sharp focus on the ring.")
            secs = edit(src, out, prompt, seed, 4)
            print(m, scene, name, f"{secs:.0f}s", flush=True)
