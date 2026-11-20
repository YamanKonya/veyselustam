"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Hand, ImageIcon, Loader2, Lock, RefreshCw, RotateCw, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { TryOnRing } from "@/data/tryOn";
import { FINGERS, FingerId, placeRing, Point } from "@/lib/tryOnGeometry";

// "Parmağımda gör": the customer photographs their hand and the ring is drawn on the
// finger. Everything runs in the browser (MediaPipe hand landmarks); the photo is never
// uploaded. Rings come from src/data/tryOn.ts.

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "/models/hand_landmarker.task";
const MAX_SIDE = 1600;

// The detector is big (model + wasm), so it is loaded once, on first use
let detectorPromise: Promise<{ detect: (img: HTMLCanvasElement) => { landmarks: Point[][] } }> | null = null;
const loadDetector = () => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        numHands: 1,
      });
    })();
    detectorPromise.catch(() => (detectorPromise = null)); // allow a retry after a failed load
  }
  return detectorPromise;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

type Stage = "intro" | "loading" | "ready" | "error";

export default function RingTryOn({ ring, title }: { ring: TryOnRing; title: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [noHand, setNoHand] = useState(false);
  const [finger, setFinger] = useState<FingerId>("ring");
  const [size, setSize] = useState(1);
  const [turn, setTurn] = useState(0); // degrees added to the detected angle

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLCanvasElement | null>(null); // the hand photo as shown (scaled down, turned)
  const sourceRef = useRef<HTMLCanvasElement | null>(null); // the hand photo as taken (scaled down)
  const quarterRef = useRef(0); // quarter turns applied with "rotate photo"
  const ringRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef<Point[] | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 }); // manual move, in photo pixels
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    const ringImg = ringRef.current;
    if (!canvas || !photo) return;
    canvas.width = photo.width;
    canvas.height = photo.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(photo, 0, 0);
    if (!ringImg) return;

    const placed = landmarksRef.current && placeRing(landmarksRef.current, photo.width, photo.height, finger);
    // No hand found: start in the middle and let the customer drag the ring into place
    const base = placed || { cx: photo.width / 2, cy: photo.height / 2, angle: 0, fingerWidth: Math.min(photo.width, photo.height) * 0.09 };
    const w = base.fingerWidth * ring.scale * size;
    const h = w * (ringImg.naturalHeight / ringImg.naturalWidth);

    ctx.save();
    ctx.translate(base.cx + offsetRef.current.x, base.cy + offsetRef.current.y);
    ctx.rotate(base.angle + (turn * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = w * 0.12;
    ctx.shadowOffsetY = w * 0.05;
    ctx.drawImage(ringImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [finger, ring.scale, size, turn]);

  useEffect(() => {
    if (stage === "ready") draw();
  }, [stage, draw]);

  // Lock page scroll while the window is open; Esc closes it
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const reset = () => {
    setStage("intro");
    setNoHand(false);
    setSize(1);
    setTurn(0);
    setFinger("ring");
    offsetRef.current = { x: 0, y: 0 };
    landmarksRef.current = null;
    photoRef.current = null;
    sourceRef.current = null;
    quarterRef.current = 0;
  };

  // Turn the photo by the chosen quarter turns, then look for the hand in it
  const analyse = async () => {
    const src = sourceRef.current;
    if (!src) return;
    const q = ((quarterRef.current % 4) + 4) % 4;
    const photo = document.createElement("canvas");
    photo.width = q % 2 ? src.height : src.width;
    photo.height = q % 2 ? src.width : src.height;
    const ctx = photo.getContext("2d")!;
    ctx.translate(photo.width / 2, photo.height / 2);
    ctx.rotate((q * Math.PI) / 2);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    photoRef.current = photo;
    offsetRef.current = { x: 0, y: 0 };

    let found: Point[] | null = null;
    try {
      const detector = await loadDetector();
      found = detector.detect(photo).landmarks?.[0] || null;
    } catch (err) {
      console.warn("hand detection unavailable", err);
    }
    landmarksRef.current = found;
    setNoHand(!found);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same photo can be picked again
    if (!file) return;
    setStage("loading");
    setNoHand(false);
    quarterRef.current = 0;
    const url = URL.createObjectURL(file);
    try {
      if (!ringRef.current) ringRef.current = await loadImage(ring.src);
      // Phone photos carry their rotation in EXIF. createImageBitmap applies it everywhere;
      // a plain <img> drawn to a canvas does not in some in-app browsers (photo came out turned).
      let pic: ImageBitmap | HTMLImageElement;
      try {
        pic = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        pic = await loadImage(url);
      }
      const pw = "naturalWidth" in pic ? pic.naturalWidth : pic.width;
      const ph = "naturalHeight" in pic ? pic.naturalHeight : pic.height;
      const k = Math.min(1, MAX_SIDE / Math.max(pw, ph));
      const source = document.createElement("canvas");
      source.width = Math.round(pw * k);
      source.height = Math.round(ph * k);
      source.getContext("2d")!.drawImage(pic, 0, 0, source.width, source.height);
      if ("close" in pic) pic.close();
      sourceRef.current = source;
      await analyse();
      setStage("ready");
    } catch (err) {
      console.error(err);
      setStage("error");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const rotatePhoto = async () => {
    quarterRef.current += 1;
    await analyse();
    draw();
  };

  // Drag the ring (finger or mouse); canvas pixels differ from screen pixels
  const toPhoto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = toPhoto(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const p = toPhoto(e);
    offsetRef.current = { x: offsetRef.current.x + p.x - dragRef.current.x, y: offsetRef.current.y + p.y - dragRef.current.y };
    dragRef.current = p;
    draw();
  };
  const onPointerUp = () => (dragRef.current = null);

  const pickFinger = (f: FingerId) => {
    offsetRef.current = { x: 0, y: 0 };
    setFinger(f);
  };

  const save = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "veysel-ustam-yuzuk.jpg";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      },
      "image/jpeg",
      0.92
    );
  };

  const fileButton = (label: string, Icon: typeof Camera, capture: boolean, primary: boolean) => (
    <label
      className={`flex-1 py-3.5 px-3 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
        primary
          ? "bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50"
          : "border border-versace-green-900/30 text-versace-green-900 hover:bg-slate-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <input type="file" accept="image/*" {...(capture ? { capture: "environment" as const } : {})} onChange={onFile} className="sr-only" />
    </label>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="w-full py-3 border border-versace-gold-500 text-versace-green-900 hover:bg-versace-gold-50 font-bold flex items-center justify-center gap-2 transition-colors text-sm"
      >
        <Hand className="w-4 h-4" />
        {t("tryon_button")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={t("tryon_title")}>
          <div className="bg-white w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-versace-green-900 text-versace-gold-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight">{t("tryon_title")}</p>
                <p className="text-[11px] text-versace-gold-100/80 truncate">{title}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="p-2 -me-2 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {stage === "intro" && (
                <>
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ring.src} alt="" className="w-24 h-24 object-contain flex-shrink-0" />
                    <p className="text-sm text-slate-700">{t("tryon_intro")}</p>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1.5 list-disc ps-5">
                    <li>{t("tryon_tip1")}</li>
                    <li>{t("tryon_tip2")}</li>
                  </ul>
                </>
              )}

              {stage === "loading" && (
                <div className="py-16 flex flex-col items-center gap-3 text-slate-600 text-sm">
                  <Loader2 className="w-7 h-7 animate-spin text-versace-green-900" />
                  {t("tryon_loading")}
                </div>
              )}

              {stage === "error" && <p role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{t("tryon_error")}</p>}

              {stage === "ready" && (
                <>
                  {noHand && <p role="status" className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">{t("tryon_nohand")}</p>}
                  <canvas
                    ref={canvasRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="w-full h-auto max-h-[58vh] object-contain bg-slate-100 touch-none cursor-grab active:cursor-grabbing"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-slate-500">{t("tryon_drag")}</p>
                    <button
                      type="button"
                      onClick={rotatePhoto}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {t("tryon_rotate_photo")}
                    </button>
                  </div>

                  {!noHand && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">{t("tryon_finger")}</p>
                      <div role="group" aria-label={t("tryon_finger")} className="grid grid-cols-4 gap-1.5">
                        {FINGERS.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => pickFinger(f)}
                            aria-pressed={finger === f}
                            className={`py-2 text-xs font-semibold border transition-colors ${
                              finger === f ? "bg-versace-green-900 text-versace-gold-50 border-versace-green-900" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {t(`tryon_finger_${f}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t("tryon_size")}
                      <input type="range" min={0.5} max={2} step={0.02} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full mt-2 accent-versace-green-900" />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t("tryon_rotate")}
                      <input type="range" min={-180} max={180} step={1} value={turn} onChange={(e) => setTurn(Number(e.target.value))} className="w-full mt-2 accent-versace-green-900" />
                    </label>
                  </div>
                </>
              )}

              {stage !== "loading" && (
                <div className="flex gap-2">
                  {stage === "ready" ? (
                    <>
                      <label className="flex-1 py-3.5 px-3 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border border-versace-green-900/30 text-versace-green-900 hover:bg-slate-50">
                        <RefreshCw className="w-4 h-4" />
                        {t("tryon_retake")}
                        <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
                      </label>
                      <button type="button" onClick={save} className="flex-1 py-3.5 px-3 font-bold text-sm flex items-center justify-center gap-2 bg-versace-green-900 hover:bg-versace-green-700 text-versace-gold-50">
                        <Download className="w-4 h-4" />
                        {t("tryon_save")}
                      </button>
                    </>
                  ) : (
                    <>
                      {fileButton(t("tryon_take"), Camera, true, true)}
                      {fileButton(t("tryon_pick"), ImageIcon, false, false)}
                    </>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {t("tryon_privacy")} {t("tryon_note")}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
