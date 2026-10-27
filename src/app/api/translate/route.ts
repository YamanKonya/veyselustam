import { NextResponse } from "next/server";

// Translates Turkish product text into the shop's other languages for the admin
// panel. Uses free Google Translate endpoints (no key); if one is rate-limited the
// next provider is tried. Runs on the server so browsers never hit these hosts.

const TARGETS = ["en", "es", "de", "ar", "ru"] as const;
type Target = (typeof TARGETS)[number];

const MAX_TEXTS = 10;
const MAX_CHARS = 5000;

const withTimeout = async (url: string, init: RequestInit = {}, ms = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
};

// Provider 1: Chrome dictionary endpoint, accepts several texts in one POST
const viaChromeDict = async (texts: string[], target: Target) => {
  const body = texts.map((t) => `q=${encodeURIComponent(t)}`).join("&");
  const res = await withTimeout(
    `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=tr&tl=${target}`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body }
  );
  if (!res.ok) throw new Error(`chrome-dict ${res.status}`);
  const data = await res.json();
  const list: unknown[] = Array.isArray(data) ? data : [];
  const out = list.map((item) => (Array.isArray(item) ? String(item[0]) : String(item)));
  if (out.length !== texts.length) throw new Error("chrome-dict length mismatch");
  return out;
};

// Provider 2: gtx endpoint, one text per request, response split into segments
const viaGtx = async (texts: string[], target: Target) => {
  const out: string[] = [];
  for (const text of texts) {
    const res = await withTimeout(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=${target}&dt=t`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: `q=${encodeURIComponent(text)}` }
    );
    if (!res.ok) throw new Error(`gtx ${res.status}`);
    const data = await res.json();
    out.push((data?.[0] || []).map((seg: unknown[]) => seg?.[0] ?? "").join(""));
  }
  return out;
};

// Provider 3: MyMemory, 500-character chunks split on line/sentence boundaries
const chunk = (text: string, size = 480) => {
  const pieces = text.split(/(?<=[\n.!?])/);
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if ((current + piece).length > size && current) {
      chunks.push(current);
      current = "";
    }
    current += piece;
  }
  if (current) chunks.push(current);
  return chunks;
};

const viaMyMemory = async (texts: string[], target: Target) => {
  const out: string[] = [];
  for (const text of texts) {
    let translated = "";
    for (const part of chunk(text)) {
      const lead = part.match(/^\s*/)?.[0] ?? "";
      const res = await withTimeout(
        `https://api.mymemory.translated.net/get?langpair=tr|${target}&q=${encodeURIComponent(part.trim())}`
      );
      if (!res.ok) throw new Error(`mymemory ${res.status}`);
      const data = await res.json();
      if (data?.responseStatus !== 200) throw new Error(`mymemory ${data?.responseStatus}`);
      translated += lead + data.responseData.translatedText;
    }
    out.push(translated);
  }
  return out;
};

const PROVIDERS = [viaChromeDict, viaGtx, viaMyMemory];

const translateAll = async (texts: string[], target: Target) => {
  const errors: string[] = [];
  for (const provider of PROVIDERS) {
    try {
      return await provider(texts, target);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  throw new Error(errors.join("; "));
};

export async function POST(request: Request) {
  let texts: unknown;
  let targets: unknown;
  try {
    ({ texts, targets } = await request.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    texts.some((t) => typeof t !== "string") ||
    (texts as string[]).join("").length > MAX_CHARS
  ) {
    return NextResponse.json({ error: "Çevrilecek metin sayısı veya uzunluğu sınırın dışında." }, { status: 400 });
  }

  const source = texts as string[];
  // Empty strings stay empty; only non-empty ones are sent out
  const indexes = source.map((t, i) => (t.trim() ? i : -1)).filter((i) => i >= 0);
  const payload = indexes.map((i) => source[i]);

  try {
    const results = await Promise.all(
      // "targets" narrows the languages, e.g. to fill in a language added later
      TARGETS.filter((t) => !Array.isArray(targets) || targets.includes(t)).map(async (target) => {
        const translated = payload.length ? await translateAll(payload, target) : [];
        const full = source.map(() => "");
        indexes.forEach((i, n) => (full[i] = translated[n]));
        return [target, full] as const;
      })
    );
    return NextResponse.json({ translations: Object.fromEntries(results) });
  } catch (err) {
    console.error("translate failed:", err);
    return NextResponse.json(
      { error: "Çeviri servisine şu an ulaşılamıyor. Birkaç dakika sonra tekrar deneyin ya da çevirileri elle girin." },
      { status: 502 }
    );
  }
}
