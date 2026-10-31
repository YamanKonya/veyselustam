// Shrinks a photo in the browser before upload. Phone photos are 3–12 MB at
// 4000+ px; product pages never show more than ~800 px (1600 px on sharp screens),
// so a 1600 px WebP looks the same and is a few hundred KB. A 720 px copy is made
// for product cards and lists.

export const FULL_SIZE = 1600;
export const SMALL_SIZE = 720;

// Each copy is stored in one Firestore document (1 MiB limit, base64 adds a third).
const MAX_BYTES = 700 * 1024;

export interface CompressedImage {
  full: Blob;
  small: Blob;
  type: string;
}

const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

const draw = (bitmap: ImageBitmap, maxSide: number) => {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
};

// WebP where the browser can write it (all current ones), JPEG otherwise.
const encode = async (bitmap: ImageBitmap, maxSide: number, startQuality: number) => {
  let side = maxSide;
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = draw(bitmap, side);
    for (const quality of [startQuality, startQuality - 0.06, startQuality - 0.12]) {
      let blob = await canvasBlob(canvas, "image/webp", quality);
      if (!blob || blob.type !== "image/webp") blob = await canvasBlob(canvas, "image/jpeg", quality);
      if (blob && blob.size <= MAX_BYTES) return blob;
    }
    side = Math.round(side * 0.85); // still too big (very detailed photo): a little smaller
  }
  throw new Error("Fotoğraf küçültülemedi.");
};

export async function compressImage(file: File): Promise<CompressedImage> {
  // imageOrientation applies the phone's rotation (EXIF) so photos aren't sideways
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const full = await encode(bitmap, FULL_SIZE, 0.88);
    const small = await encode(bitmap, SMALL_SIZE, 0.84);
    return { full, small, type: full.type };
  } finally {
    bitmap.close();
  }
}
