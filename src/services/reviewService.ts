import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Customer reviews. Signed-in members can send one; it stays "pending" until the admin
// approves it (firestore.rules). Reviews received elsewhere (WhatsApp, Instagram)
// are added by the admin with their source shown on the card.

export type ReviewSource = "site" | "whatsapp" | "instagram";

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  lang: string;
  status: "pending" | "approved";
  source: ReviewSource;
  createdAt: Date;
}

const REVIEWS = "reviews";
export const REVIEW_LIMITS = { name: 60, text: 1500 };

const fromDoc = (d: { id: string; data: () => Record<string, any> }): Review => {
  const x = d.data();
  return {
    id: d.id,
    productId: x.productId || "",
    name: x.name || "",
    rating: Number(x.rating) || 5,
    text: x.text || "",
    lang: x.lang || "tr",
    status: x.status === "approved" ? "approved" : "pending",
    source: (x.source as ReviewSource) || "site",
    createdAt: x.createdAt instanceof Timestamp ? x.createdAt.toDate() : new Date(x.createdAt || 0),
  };
};

const newestFirst = (a: Review, b: Review) => b.createdAt.getTime() - a.createdAt.getTime();

/** Approved reviews for one product, newest first. */
export const fetchApprovedReviews = async (productId: string): Promise<Review[]> => {
  const snap = await getDocs(
    query(collection(db, REVIEWS), where("productId", "==", productId), where("status", "==", "approved"))
  );
  return snap.docs.map(fromDoc).sort(newestFirst);
};

/** A customer's review from the product page; waits for admin approval. */
export const submitReview = async (r: { uid: string; productId: string; name: string; rating: number; text: string; lang: string }) => {
  await addDoc(collection(db, REVIEWS), {
    uid: r.uid,
    productId: r.productId,
    name: r.name.trim().slice(0, REVIEW_LIMITS.name),
    rating: Math.min(5, Math.max(1, Math.round(r.rating))),
    text: r.text.trim().slice(0, REVIEW_LIMITS.text),
    lang: r.lang.slice(0, 5),
    status: "pending",
    source: "site",
    createdAt: serverTimestamp(),
  });
};

// ---- admin ----

export const fetchAllReviews = async (): Promise<Review[]> => {
  const snap = await getDocs(collection(db, REVIEWS));
  return snap.docs.map(fromDoc).sort(newestFirst);
};

export const setReviewStatus = (id: string, status: Review["status"]) => updateDoc(doc(db, REVIEWS, id), { status });

export const deleteReview = (id: string) => deleteDoc(doc(db, REVIEWS, id));

/** A review the customer sent another way (e.g. WhatsApp), published right away. */
export const addReviewAsAdmin = async (r: {
  productId: string;
  name: string;
  rating: number;
  text: string;
  source: ReviewSource;
  date?: Date;
}) => {
  await addDoc(collection(db, REVIEWS), {
    productId: r.productId,
    name: r.name.trim().slice(0, REVIEW_LIMITS.name),
    rating: Math.min(5, Math.max(1, Math.round(r.rating))),
    text: r.text.trim().slice(0, REVIEW_LIMITS.text),
    lang: "tr",
    status: "approved",
    source: r.source,
    createdAt: r.date ? Timestamp.fromDate(r.date) : serverTimestamp(),
  });
};
