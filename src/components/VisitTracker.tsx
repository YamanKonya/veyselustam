"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

// Records each page view for the admin "Ziyaretler" tab: path, product, source,
// device and how long the page was actually visible. No cookies; a random id in
// sessionStorage groups one tab's visit. Admin browsing is not counted.

const SESSION_KEY = "vu_sid";
const SOURCE_KEY = "vu_src";

const sessionId = () => {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(SESSION_KEY, sid);
      return { sid, isNew: true };
    }
    return { sid, isNew: false };
  } catch {
    return { sid: "", isNew: false };
  }
};

// Where the visit came from, captured once per session
const sessionSource = (isNew: boolean) => {
  try {
    if (!isNew) return JSON.parse(sessionStorage.getItem(SOURCE_KEY) || "{}");
    const url = new URL(window.location.href);
    let ref = "";
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.host !== window.location.host) ref = r.host.replace(/^www\./, "");
    } catch {}
    const src = {
      ref,
      utmSource: url.searchParams.get("utm_source") || "",
      utmMedium: url.searchParams.get("utm_medium") || "",
      utmCampaign: url.searchParams.get("utm_campaign") || "",
    };
    sessionStorage.setItem(SOURCE_KEY, JSON.stringify(src));
    return src;
  } catch {
    return {};
  }
};

const deviceType = () => {
  const w = Math.min(window.screen?.width || window.innerWidth, window.innerWidth);
  return w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop";
};

export default function VisitTracker() {
  const pathname = usePathname();
  const { isAdmin, adminChecked } = useAuth();
  const { language } = useLanguage();

  const view = useRef<{ id: string | null; visibleMs: number; since: number | null; sent: boolean }>({
    id: null,
    visibleMs: 0,
    since: null,
    sent: false,
  });

  useEffect(() => {
    if (!adminChecked || isAdmin || !pathname || pathname.startsWith("/admin")) return;

    const { sid, isNew } = sessionId();
    if (!sid) return;
    const src = sessionSource(isNew);

    const current = { id: null as string | null, visibleMs: 0, since: document.visibilityState === "visible" ? Date.now() : null, sent: false };
    view.current = current;

    const seconds = () => Math.round((current.visibleMs + (current.since ? Date.now() - current.since : 0)) / 1000);
    const flush = () => {
      if (!current.id || current.sent) return;
      current.sent = true;
      const payload = JSON.stringify({ t: "leave", id: current.id, seconds: seconds() });
      if (!navigator.sendBeacon?.("/api/track", payload)) {
        fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (current.since) current.visibleMs += Date.now() - current.since;
        current.since = null;
        flush();
        current.sent = false; // a later hide/leave sends the updated total again
      } else {
        current.since = Date.now();
      }
    };

    const productId = pathname.startsWith("/product/") ? decodeURIComponent(pathname.split("/")[2] || "") : "";
    fetch("/api/track", {
      method: "POST",
      body: JSON.stringify({
        t: "view",
        sid,
        path: pathname,
        productId,
        device: deviceType(),
        lang: language,
        landing: isNew,
        ...src,
      }),
      keepalive: true,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) current.id = data.id;
      })
      .catch(() => {});

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      if (current.since) current.visibleMs += Date.now() - current.since;
      current.since = null;
      flush();
    };
    // language is read once per view; changing it shouldn't count as a new view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, adminChecked, isAdmin]);

  return null;
}
