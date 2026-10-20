import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase web config. These values are not secrets: they ship to every visitor's
// browser; access is controlled by firestore.rules / storage.rules. Env vars
// (e.g. on Vercel) still take precedence when set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAvtZD8wWNcg6A3zCcHy6tfBuDRo-XXUWM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "veyselustam-e53d3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veyselustam-e53d3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "veyselustam-e53d3.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "274880639811",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:274880639811:web:1454c8400114f9be0df5f6",
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.warn("Firebase initialization safely guarded:", e);
}

export { app, auth, db, storage };
export default app;
