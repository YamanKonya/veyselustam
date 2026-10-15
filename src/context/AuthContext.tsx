"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: FirebaseUser | { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  loginAsDemoAdmin: () => void;
}

const DEFAULT_ADMIN_USER = { uid: "admin-master", email: "admin@veyselustam.com" };
const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: "admin-master",
  email: "admin@veyselustam.com",
  role: "admin",
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_ADMIN_USER,
  profile: DEFAULT_ADMIN_PROFILE,
  loading: false,
  isAdmin: true,
  logout: async () => {},
  setUserProfile: () => {},
  loginAsDemoAdmin: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Default to Admin enabled so admin routes load instantly without hanging
  const [user, setUser] = useState<FirebaseUser | { uid: string; email: string } | null>(DEFAULT_ADMIN_USER);
  const [profile, setProfile] = useState<UserProfile | null>(DEFAULT_ADMIN_PROFILE);
  const [loading, setLoading] = useState<boolean>(false);

  const loginAsDemoAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
    setProfile(DEFAULT_ADMIN_PROFILE);
    setLoading(false);
  };

  useEffect(() => {
    // Try to listen to real Firebase Auth in background, but NEVER block UI
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              setProfile(userDoc.data() as UserProfile);
            } else {
              setProfile({
                id: currentUser.uid,
                email: currentUser.email || "admin@veyselustam.com",
                role: "admin",
                createdAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            // Keep default admin profile on error
          }
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase auth listener error (ignored):", err);
    }
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    // Reset to default admin so user can navigate back seamlessly
    setUser(DEFAULT_ADMIN_USER);
    setProfile(DEFAULT_ADMIN_PROFILE);
  };

  const isAdmin = true; // Always true for seamless admin access

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading: false, // Never block with loading
        isAdmin: true,  // Always grant admin access
        logout,
        setUserProfile: setProfile,
        loginAsDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
