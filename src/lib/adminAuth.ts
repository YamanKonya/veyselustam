import {
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// The admin is a normal Firebase Auth email/password account whose uid has a
// document in the "admins" collection (added by hand in the Firebase console;
// firestore.rules only lets that uid write products/settings and read orders).
// The login screen asks for a short username ("veysel"); settings/adminLogin
// maps it to the account's email so the email never has to be typed.
const LOGIN_DOC = ["settings", "adminLogin"] as const;

export const DEFAULT_ADMIN_USERNAME = "veysel";
export const DEFAULT_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "veysel@veyselustam.com";

export interface AdminLoginInfo {
  username: string;
  email: string;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const normalize = (s: string) => s.trim().toLocaleLowerCase("tr");

export const loadAdminLoginInfo = async (): Promise<AdminLoginInfo> => {
  try {
    const snap = await withTimeout(getDoc(doc(db, ...LOGIN_DOC)), 5000);
    if (snap.exists()) return snap.data() as AdminLoginInfo;
  } catch {}
  return { username: DEFAULT_ADMIN_USERNAME, email: DEFAULT_ADMIN_EMAIL };
};

// Firestore rules are the real gate; this only decides what the UI shows.
export const isAdminUser = async (user: User | null) => {
  if (!user) return false;
  try {
    const snap = await withTimeout(getDoc(doc(db, "admins", user.uid)), 8000);
    return snap.exists();
  } catch {
    return false;
  }
};

export type AdminLoginResult = "ok" | "wrong" | "not-admin";

export const adminSignIn = async (username: string, password: string): Promise<AdminLoginResult> => {
  const input = username.trim();
  let email = input;
  if (!input.includes("@")) {
    const info = await loadAdminLoginInfo();
    if (normalize(input) !== normalize(info.username)) return "wrong";
    email = info.email;
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (await isAdminUser(cred.user)) return "ok";
    await signOut(auth);
    return "not-admin";
  } catch (err: any) {
    const code = err?.code || "";
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found" ||
      code === "auth/invalid-email"
    ) {
      return "wrong";
    }
    throw err;
  }
};

export class WrongPasswordError extends Error {}

export const changeAdminCredentials = async (
  currentPassword: string,
  newUsername: string,
  newPassword: string
) => {
  const user: User | null = auth.currentUser;
  if (!user || !user.email) throw new Error("not-signed-in");
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      throw new WrongPasswordError("Mevcut şifre yanlış.");
    }
    throw err;
  }
  if (newPassword) await updatePassword(user, newPassword);
  const info: AdminLoginInfo = { username: newUsername.trim(), email: user.email };
  await withTimeout(
    setDoc(doc(db, ...LOGIN_DOC), { ...info, updatedAt: new Date().toISOString() }),
    8000
  );
  return info.username;
};
