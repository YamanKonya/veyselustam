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
import { adminSignIn, isAdminUser, loadAdminLoginInfo, AdminLoginResult } from "@/lib/adminAuth";

interface AuthContextType {
  // Customer account (Firebase Auth)
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  // Shop owner (admin panel): a Firebase Auth account listed in "admins"
  isAdmin: boolean;
  adminChecked: boolean;
  adminUsername: string | null;
  setAdminUsername: (username: string) => void;
  adminLogin: (username: string, password: string) => Promise<AdminLoginResult>;
  adminLogout: () => Promise<void>;
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
  setAdminUsername: () => {},
  adminLogin: async () => "wrong",
  adminLogout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        const admin = await isAdminUser(currentUser);
        setIsAdmin(admin);
        setAdminUsername(admin ? (await loadAdminLoginInfo()).username : null);
        setAdminChecked(true);
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
      setAdminChecked(true);
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
    const result = await adminSignIn(username, password);
    if (result === "ok") {
      // onAuthStateChanged fills the rest; set these now so the panel opens at once.
      setIsAdmin(true);
      setAdminUsername((await loadAdminLoginInfo()).username);
    }
    return result;
  };

  const adminLogout = async () => {
    await logout();
    setIsAdmin(false);
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
        isAdmin,
        adminChecked,
        adminUsername,
        setAdminUsername,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
