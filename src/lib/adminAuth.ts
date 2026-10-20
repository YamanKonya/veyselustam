import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Admin credentials live in Firestore (settings/adminCredentials) as a salted
// SHA-256 hash, so they can be changed from the admin panel. Until the shop
// sets its own, the starting login is veysel / 2026 (stored here only as a hash).
const CREDENTIALS_DOC = ["settings", "adminCredentials"] as const;
const CACHE_KEY = "veyselustam_admin_credentials";
const SESSION_KEY = "veyselustam_admin_session";
const SESSION_HOURS = 12;

export interface AdminCredentials {
  username: string;
  salt: string;
  passwordHash: string;
  updatedAt?: string;
}

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: "veysel",
  salt: "vu-default-2026",
  passwordHash: "1f45dcf6323ac27bd72ce3b89c7afbe2703fc92bbbad97c0e61d66ecf68907f8",
};

export const sha256 = async (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const readCache = (): AdminCredentials | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AdminCredentials) : null;
  } catch {
    return null;
  }
};

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

// Firestore copy wins; if Firestore can't be reached, fall back to the last copy
// this browser saw, then to the starting credentials.
const loadCredentials = async (): Promise<AdminCredentials> => {
  try {
    const snap = await withTimeout(getDoc(doc(db, ...CREDENTIALS_DOC)), 5000);
    if (snap.exists()) {
      const creds = snap.data() as AdminCredentials;
      localStorage.setItem(CACHE_KEY, JSON.stringify(creds));
      return creds;
    }
    return DEFAULT_CREDENTIALS;
  } catch {
    return readCache() || DEFAULT_CREDENTIALS;
  }
};

export const verifyAdminLogin = async (username: string, password: string) => {
  const creds = await loadCredentials();
  if (username.trim().toLocaleLowerCase("tr") !== creds.username.toLocaleLowerCase("tr")) return false;
  return (await sha256(`${creds.salt}:${password}`)) === creds.passwordHash;
};

export const changeAdminCredentials = async (
  currentPassword: string,
  newUsername: string,
  newPassword: string
) => {
  const creds = await loadCredentials();
  if ((await sha256(`${creds.salt}:${currentPassword}`)) !== creds.passwordHash) {
    throw new Error("Mevcut şifre yanlış.");
  }
  const salt = crypto.getRandomValues(new Uint32Array(4)).join("-");
  const next: AdminCredentials = {
    username: newUsername.trim(),
    salt,
    passwordHash: await sha256(`${salt}:${newPassword}`),
    updatedAt: new Date().toISOString(),
  };
  await withTimeout(setDoc(doc(db, ...CREDENTIALS_DOC), next), 8000);
  localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  return next.username;
};

export const startAdminSession = (username: string) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username, expires: Date.now() + SESSION_HOURS * 3600 * 1000 })
  );
};

export const readAdminSession = (): { username: string } | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.expires || session.expires < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { username: session.username };
  } catch {
    return null;
  }
};

export const endAdminSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
};
