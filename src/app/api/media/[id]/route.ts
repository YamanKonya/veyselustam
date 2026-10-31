import { firebaseConfig } from "@/lib/firebaseConfig";

// Serves a photo uploaded in the admin panel. The photo is stored in Firestore
// ("media" collection, publicly readable) as base64; here it becomes a normal
// image with a one-year cache, so after the first visit Vercel's CDN and the
// browser answer without touching Firestore. Ids never change: a new photo
// always gets a new id.

const REST = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const ID = /^[A-Za-z0-9_-]{6,80}$/;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!ID.test(params.id)) return new Response("Not found", { status: 404 });
  const res = await fetch(`${REST}/media/${params.id}?key=${firebaseConfig.apiKey}`, { cache: "no-store" });
  if (!res.ok) return new Response("Not found", { status: 404 });
  const doc = await res.json();
  const data: string | undefined = doc.fields?.data?.stringValue;
  const type: string = doc.fields?.type?.stringValue || "image/webp";
  if (!data || !/^image\/(webp|jpeg|png)$/.test(type)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data, "base64"), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
