import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PageView {
  id: string;
  sid: string;
  path: string;
  productId: string;
  at: Date;
  seconds: number;
  country: string;
  region: string;
  city: string;
  device: "mobile" | "tablet" | "desktop";
  ref: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  lang: string;
  landing: boolean;
}

export interface Visit {
  sid: string;
  start: Date;
  end: Date;
  views: PageView[]; // oldest first
  seconds: number;
  country: string;
  region: string;
  city: string;
  device: PageView["device"];
  source: string;
  campaign: string;
  lang: string;
}

const MAX_VIEWS = 5000;

/** Page views since `days` days ago, newest first (admin only, per firestore.rules). */
export const fetchPageViews = async (days: number): Promise<PageView[]> => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const snap = await getDocs(
    query(collection(db, "pageviews"), where("at", ">=", Timestamp.fromDate(since)), orderBy("at", "desc"), limit(MAX_VIEWS))
  );
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      sid: x.sid || "",
      path: x.path || "/",
      productId: x.productId || "",
      at: x.at?.toDate?.() ?? new Date(0),
      seconds: Number(x.seconds) || 0,
      country: x.country || "",
      region: x.region || "",
      city: x.city || "",
      device: x.device || "desktop",
      ref: x.ref || "",
      utmSource: x.utmSource || "",
      utmMedium: x.utmMedium || "",
      utmCampaign: x.utmCampaign || "",
      lang: x.lang || "",
      landing: !!x.landing,
    } as PageView;
  });
};

export const sourceLabel = (v: Pick<PageView, "utmSource" | "ref">) => {
  const s = (v.utmSource || v.ref || "").toLowerCase();
  if (!s) return "Doğrudan";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("google")) return "Google";
  if (s.includes("facebook") || s === "fb") return "Facebook";
  if (s.includes("whatsapp") || s === "wa") return "WhatsApp";
  if (s.includes("etsy")) return "Etsy";
  if (s.includes("bing")) return "Bing";
  if (s.includes("yandex")) return "Yandex";
  if (s.includes("tiktok")) return "TikTok";
  return v.utmSource || v.ref;
};

/** Groups views into visits (one browser tab session), newest visit first. */
export const groupVisits = (views: PageView[]): Visit[] => {
  const bySid = new Map<string, PageView[]>();
  for (const v of views) {
    const list = bySid.get(v.sid);
    if (list) list.push(v);
    else bySid.set(v.sid, [v]);
  }
  const visits: Visit[] = [];
  bySid.forEach((list, sid) => {
    list.sort((a, b) => a.at.getTime() - b.at.getTime());
    const first = list.find((v) => v.landing) || list[0];
    visits.push({
      sid,
      start: list[0].at,
      end: list[list.length - 1].at,
      views: list,
      seconds: list.reduce((n, v) => n + v.seconds, 0),
      country: first.country,
      region: first.region,
      city: first.city,
      device: first.device,
      source: sourceLabel(first),
      campaign: first.utmCampaign,
      lang: first.lang,
    });
  });
  return visits.sort((a, b) => b.start.getTime() - a.start.getTime());
};

/** Tracked link for sharing a product, so visits from it show up as a campaign. */
export const campaignLink = (productId: string, source: "instagram" | "whatsapp" | "facebook", campaign: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://veyselustam.com";
  const medium = source === "whatsapp" ? "messaging" : "social";
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
  return `${origin}/product/${encodeURIComponent(productId)}?${params}`;
};
