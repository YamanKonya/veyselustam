/**
 * "Parmağımda gör" (ring try-on) pictures.
 *
 * Each entry is the ring cut out of a photo taken straight from above (stone facing the
 * camera), saved with a transparent background in public/images/tryon/. A product without
 * an entry simply shows no try-on button.
 *
 * `scale` = how wide the picture is compared with the finger it sits on (1 = exactly as
 * wide as the finger). A large signet face is about 1.2 to 1.3.
 *
 * To add a ring: take the photo from directly above, remove the background
 * (rembg / hyperframes remove-background), save as webp (max 640 px) and add a line here.
 */
export interface TryOnRing {
  src: string;
  scale: number;
}

export const TRY_ON_RINGS: Record<string, TryOnRing> = {
  "vu-hilal": { src: "/images/tryon/hilal.webp", scale: 1.2 },
  "vu-emin": { src: "/images/tryon/emin.webp", scale: 1.3 },
  "vu-semse": { src: "/images/tryon/semse.webp", scale: 1.3 },
  "vu-hatem": { src: "/images/tryon/hatem.webp", scale: 1.25 },
  "vu-vav": { src: "/images/tryon/vav.webp", scale: 1.25 },
};

export const tryOnFor = (productId?: string): TryOnRing | undefined =>
  productId ? TRY_ON_RINGS[productId] : undefined;
