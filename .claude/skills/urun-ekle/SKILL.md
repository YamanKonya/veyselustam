---
name: urun-ekle
description: Add a new product to the Veysel Ustam shop from the owner's photos — images, 6-language title and description, price, stock, shared case stock — and publish it to the website (and from there to the Meta/WhatsApp/Instagram catalogue feed). Use when the user sends ring/jewellery photos and says to add, list, upload or publish a product ("ürün ekle", "bunu siteye koy", "yeni model").
---

# Ürün ekle (photos → live product)

The website is the single source of truth. A product added here appears on
veyselustam.com and, through `/feed/meta.csv`, in the Meta catalogue that feeds the
WhatsApp Business catalogue and the Instagram/Facebook shop (refreshed by Meta on its
schedule). Etsy and Amazon are not connected yet — say so if asked.

No credentials are needed: products live in the code (`src/data/initialProducts.ts`)
and the admin panel copies missing ones into Firestore the next time the owner opens
`/admin`.

## 1. Gather what you need

Look at every photo (Read the image). Then confirm with the user only what you cannot
see or infer — usually **price**, **stock**, and whether it uses a **shared case**
(e.g. "Sidre"; case stock lives in `stockGroups`, see `src/services/stockService.ts`).
Stone type, engraving, model name you can propose from the photos and ask to confirm
in the same message. Ask everything in one go, in Turkish.

## 2. Pick ids

- Product id: `vu-<model>-<stone>` in ascii kebab-case (e.g. `vu-sidre-akik`). Must be
  unique in `initialProducts.ts`.
- Image slug: the id without `vu-` (e.g. `sidre-akik`).
- Catalogue key: snake_case of the slug (e.g. `sidre_akik`).

## 3. Images

1. Copy the user's photos into the scratchpad (never edit their originals).
2. Find pixel boxes for the ring, the stone and the engraved side in the first/best
   photo (after EXIF rotation; check `Image.open(...).size` with `python -P`).
3. Write a spec JSON and run:
   `python -P scripts/product_images.py <spec.json> --sheet <scratchpad>/sheet.jpg`
   (format documented at the top of the script; default 10 images, 1200×1200).
4. Read the contact sheet and check: ring centred, nothing important cut off, no
   fingers dominating the close-ups. Adjust boxes and rerun until it looks right.
   Image 1 is the hero shown everywhere — make it the best one.

### 3b. Hover video (product card)

Cut-out photos give the best images and video: run
`npx hyperframes remove-background <photo> -o <scratchpad>/cut.png` (needs FFmpeg on
PATH) and pass it as
`"cutout"` in the spec (plus `clip_top`, `stone_oval`, `clear` to wipe leftover tools).

For the 5 s hover loop: `npx hyperframes init <scratchpad>/videos/<slug> --non-interactive
--example=blank --skill=motion-graphics`, copy `scripts/hover_video_template.html` to its
`index.html`, put 720×720 copies of image 1 and image 3 at `assets/hero.jpg` and
`assets/stone.jpg`, `npx hyperframes check .`, render, then compress:
`ffmpeg -i renders/video.mp4 -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p
-movflags +faststart public/videos/<slug>.mp4` (aim for under 500 KB). Check frames at
0 s and 4.9 s match (seamless loop), then set `"videoUrl": "/videos/<slug>.mp4"` on the
product. Cards play it on mouse hover; an admin-set video URL overrides it.

### 3c. Premium scene shots (optional, free, local AI)

`scripts/ai_scenes/` makes 18 staged shots per ring (velvet + lantern, wet slate,
antique box; 6 angles) with Qwen-Image-Edit in local ComfyUI (setup notes at the top
of `qwen_edit.py`; start the server first). `batch.py <model>` generates,
`integrate.py <model> [dir]` copies them into public/ after the real main photo and
sets `imagesVersion` so /admin pushes the list to Firestore. Review every shot: the
model may reshape the stone. For inscribed stones (calligraphy) the AI garbles the
text, so run `stone_swap.py` with the real stone close-up and hand-measured ellipses
(see `hematit_stones.txt`). Keep the real photo as image 1. Work files go to a
ComfyUI-work folder outside the repo (the scratchpad gets wiped).

## 4. Text in all six languages (tr, en, es, de, ar, ru)

The shop must never show a mixed-language page. Edit `src/i18n/catalogContent.ts`:

- `TITLES[<key>]` — tr/en/es/de/ar/ru. Follow the existing pattern:
  "<Model> Model <Taş> Taşlı El Oyması Gümüş Erkek Yüzüğü".
- `STORIES[<key>]` — 2–3 sentences per language: what the piece is, the engraving,
  the stone. Match the tone of the existing stories (warm, factual, no hype).
- `STONES` — reuse a `StoneKey`; if the stone is new, add the key to the `StoneKey`
  union and all six translations.
- `ENTRIES["<id>"] = { title, story, stone, weight?, sacred? }` — `sacred: true` when
  the piece carries a holy inscription (adds the care note).

## 5. The product record

Append to `INITIAL_VEYSELUSTAM_PRODUCTS` in `src/data/initialProducts.ts`, modelled
on the `vu-sidre-*` entries: `id`, Turkish `title` (= TITLES tr) and a short Turkish
`description`, `price` (TRY, number), `images` (paths printed by the script),
`category` (reuse an existing one), `ringSize` (15–30 unless told otherwise),
`stock`, optional `stockGroup`, `createdAt` = now (ISO) so it shows first under
"Yeni Ürünler". A new `stockGroup` id creates its case automatically when the
admin opens (`ensureStockGroups`, starting stock = sum of its products' stock).
Adding a model to an existing case does not change that case's stock — tell the
owner to adjust it under Admin → Kasa Stokları if they have more cases.

## 6. Check, ship, report

1. `npx tsc --noEmit -p .` (ignore errors under guzel/, scratch/, scripts/).
2. Stop the preview server, `npx next build`, start the `prod` preview, open
   `/product/<id>` and switch the language to Arabic and English — no Turkish left.
3. Commit (`feat: add <model> product`) and push to main; Vercel deploys. Wait for
   the Vercel status on the commit, then check the live product page returns 200 and
   `https://veyselustam.com/feed/meta.csv` contains the id.
4. Tell the user, in Turkish: the product link, that they should open `/admin` once
   so it is saved to Firestore (stock tracking starts then), and that WhatsApp /
   Instagram pick it up on Meta's next feed refresh.

Never place real orders, never use the owner's password, never type API keys into
third-party sites.
