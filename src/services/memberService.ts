import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types";

/** Every member profile in the `users` collection (admin only), newest first. */
export const fetchMembers = async (): Promise<UserProfile[]> => {
  const snap = await getDocs(collection(db, "users"));
  const members = snap.docs.map((d) => ({ ...(d.data() as UserProfile), id: d.id }));
  return members.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
};
