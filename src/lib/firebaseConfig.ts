// Firebase web config. These values are not secrets: they ship to every visitor's
// browser; access is controlled by firestore.rules / storage.rules. Env vars
// (e.g. on Vercel) still take precedence when set.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAvtZD8wWNcg6A3zCcHy6tfBuDRo-XXUWM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "veyselustam-e53d3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "veyselustam-e53d3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "veyselustam-e53d3.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "274880639811",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:274880639811:web:1454c8400114f9be0df5f6",
};
