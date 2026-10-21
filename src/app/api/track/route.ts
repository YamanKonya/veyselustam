import { NextResponse } from "next/server";
import { firebaseConfig } from "@/lib/firebaseConfig";

// Visit tracking for the admin "Ziyaretler" tab. Location comes from Vercel's
// geo headers at city level; the visitor's IP address is never stored. Writes go
// through Firestore's REST API and are validated by firestore.rules.

const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const KEY = `key=${firebaseConfig.apiKey}`;

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|headless|pingdom|uptime/i;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const header = (req: Request, name: string) => {
  const v = req.headers.get(name) || "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export async function POST(request: Request) {
  if (BOT.test(request.headers.get("user-agent") || "")) return new NextResponse(null, { status: 204 });

  let body: any;
  try {
    body = JSON.parse(await request.text()); // sendBeacon posts text/plain
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // A view ended: store how long it was visible
  if (body?.t === "leave") {
    const id = str(body.id, 40);
    const seconds = Math.min(14400, Math.max(0, Math.round(Number(body.seconds) || 0)));
    if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    const res = await fetch(`${BASE}/pageviews/${id}?${KEY}&updateMask.fieldPaths=seconds&currentDocument.exists=true`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { seconds: { integerValue: String(seconds) } } }),
    });
    return new NextResponse(null, { status: res.ok ? 204 : 202 });
  }

  if (body?.t !== "view") return NextResponse.json({ error: "bad type" }, { status: 400 });

  const sid = str(body.sid, 40);
  if (sid.length < 8) return NextResponse.json({ error: "bad sid" }, { status: 400 });
  const device = ["mobile", "tablet", "desktop"].includes(body.device) ? body.device : "desktop";
  const fields = {
    sid: { stringValue: sid },
    path: { stringValue: str(body.path, 200) },
    productId: { stringValue: str(body.productId, 80) },
    seconds: { integerValue: "0" },
    country: { stringValue: header(request, "x-vercel-ip-country").slice(0, 8) },
    region: { stringValue: header(request, "x-vercel-ip-country-region").slice(0, 60) },
    city: { stringValue: header(request, "x-vercel-ip-city").slice(0, 80) },
    device: { stringValue: device },
    ref: { stringValue: str(body.ref, 120) },
    utmSource: { stringValue: str(body.utmSource, 60) },
    utmMedium: { stringValue: str(body.utmMedium, 60) },
    utmCampaign: { stringValue: str(body.utmCampaign, 80) },
    lang: { stringValue: str(body.lang, 5) },
    landing: { booleanValue: body.landing === true },
  };

  // Random document id; "at" is set to the server's time in the same write
  const id = Array.from(crypto.getRandomValues(new Uint8Array(15)), (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
  const name = `projects/${firebaseConfig.projectId}/databases/(default)/documents/pageviews/${id}`;
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:commit?${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          update: { name, fields },
          currentDocument: { exists: false },
          updateTransforms: [{ fieldPath: "at", setToServerValue: "REQUEST_TIME" }],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn("track view failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "store failed" }, { status: 502 });
  }
  return NextResponse.json({ id });
}
