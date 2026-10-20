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
import {
  verifyAdminLogin,
  startAdminSession,
  readAdminSession,
  endAdminSession,
} from "@/lib/adminAuth";

interface AuthContextType {
  // Customer account (Firebase Auth)
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  // Shop owner (admin panel), separate from customer accounts
  isAdmin: boolean;
  adminChecked: boolean;
  adminUsername: string | null;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  setUserProfile: () => {},
  isAdmin: false,
  adminChecked: false,
  adminUsername: null,
  adminLogin: async () => false,
  adminLogout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    setAdminUsername(readAdminSession()?.username ?? null);
    setAdminChecked(true);
  }, []);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        if (!currentUser) {
          setProfile(null);
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          setProfile(
            userDoc.exists()
              ? (userDoc.data() as UserProfile)
              : { id: currentUser.uid, email: currentUser.email || "", role: "customer" }
          );
        } catch {
          setProfile({ id: currentUser.uid, email: currentUser.email || "", role: "customer" });
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase auth listener error (ignored):", err);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setUser(null);
    setProfile(null);
  };

  const adminLogin = async (username: string, password: string) => {
    const ok = await verifyAdminLogin(username, password);
    if (ok) {
      startAdminSession(username.trim());
      setAdminUsername(username.trim());
    }
    return ok;
  };

  const adminLogout = () => {
    endAdminSession();
    setAdminUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
        setUserProfile: setProfile,
        isAdmin: !!adminUsername,
        adminChecked,
        adminUsername,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
