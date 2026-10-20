// The ikas CDN serves any photo at fixed widths: /images/<shop>/<id>/<width>/<file>
const IKAS_WIDTH = /(cdn\.myikas\.com\/images\/[^/]+\/[^/]+\/)\d+(\/)/;
const WIDTHS = [180, 360, 540, 720, 1080] as const;

export type ImageWidth = (typeof WIDTHS)[number];

/** Same photo at a smaller width when the host supports it; other URLs pass through. */
export const imageAt = (url: string | undefined, width: ImageWidth): string => {
  if (!url) return "";
  return IKAS_WIDTH.test(url) ? url.replace(IKAS_WIDTH, `$1${width}$2`) : url;
};

/** srcSet for responsive <img>; empty when the host has no size variants. */
export const imageSrcSet = (url: string | undefined, widths: ImageWidth[] = [360, 540, 720, 1080]) => {
  if (!url || !IKAS_WIDTH.test(url)) return undefined;
  return widths.map((w) => `${imageAt(url, w)} ${w}w`).join(", ");
};
