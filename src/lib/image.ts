// The ikas CDN serves any photo at fixed widths: /images/<shop>/<id>/<width>/<file>
const IKAS_WIDTH = /(cdn\.myikas\.com\/images\/[^/]+\/[^/]+\/)\d+(\/)/;
const WIDTHS = [180, 360, 540, 720, 1080] as const;

export type ImageWidth = (typeof WIDTHS)[number];

// Photos uploaded in the admin panel (/api/media/<id>) also exist as a 720 px copy (<id>_s)
const MEDIA = /^\/api\/media\/([A-Za-z0-9-]+)$/;

/** Same photo at a smaller width when the host supports it; other URLs pass through. */
export const imageAt = (url: string | undefined, width: ImageWidth): string => {
  if (!url) return "";
  if (MEDIA.test(url)) return width <= 720 ? `${url}_s` : url;
  return IKAS_WIDTH.test(url) ? url.replace(IKAS_WIDTH, `$1${width}$2`) : url;
};

/** srcSet for responsive <img>; empty when the host has no size variants. */
export const imageSrcSet = (url: string | undefined, widths: ImageWidth[] = [360, 540, 720, 1080]) => {
  if (url && MEDIA.test(url)) return `${url}_s 720w, ${url} 1600w`;
  if (!url || !IKAS_WIDTH.test(url)) return undefined;
  return widths.map((w) => `${imageAt(url, w)} ${w}w`).join(", ");
};
