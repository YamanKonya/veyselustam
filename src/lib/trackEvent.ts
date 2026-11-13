/**
 * Shopping events for the admin "Ziyaretler" tab (add to cart, checkout steps,
 * order errors). They are stored as page views whose path holds the event
 * after a "#" (e.g. "/checkout#hata:stok"), so firestore.rules need no change.
 * Only the event and a product id are sent: nothing the customer types.
 *
 * Uses the visit id VisitTracker keeps in sessionStorage; when there is none
 * (admin browsing, storage blocked) nothing is sent.
 */
export type ShopEvent =
  | "sepet#ekle" // added to cart
  | "checkout#sepet" // opened the checkout page with this item in the cart
  | "checkout#gonder" // pressed "place order" with the form filled
  | "checkout#hata:form" // pressed "place order" with required fields empty
  | "checkout#hata:stok" // stopped: not enough stock
  | `checkout#hata:${string}`; // stopped by another error (connection, permission…)

export const isEventPath = (path: string) => path.includes("#");

export function trackEvent(event: ShopEvent, productId = "") {
  try {
    const sid = sessionStorage.getItem("vu_sid"); // same key as VisitTracker
    if (!sid) return;
    const src = JSON.parse(sessionStorage.getItem("vu_src") || "{}");
    const w = Math.min(window.screen?.width || window.innerWidth, window.innerWidth);
    const body = JSON.stringify({
      t: "view",
      sid,
      path: "/" + event.slice(0, 120),
      productId: productId.slice(0, 80),
      device: w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop",
      lang: (document.documentElement.lang || "").slice(0, 5),
      landing: false,
      ...src,
    });
    if (!navigator.sendBeacon?.("/api/track", body)) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* tracking must never break shopping */
  }
}
