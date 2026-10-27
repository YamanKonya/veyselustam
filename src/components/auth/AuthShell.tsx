"use client";

import React from "react";
import Link from "next/link";
import { BadgePercent, MessageSquareQuote, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/layout/SiteFooter";

// Shared frame for the member sign-up and sign-in pages: the form on one side,
// what membership gives on the other.

export const authField =
  "w-full py-3 ps-10 pe-3 bg-white border border-slate-200 text-sm focus:outline-none focus:border-versace-gold-500 transition-colors placeholder:text-slate-400";

/** Where to go after signing in: a same-site path from ?next=, else the home page. */
export const nextPath = () => {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

/** Turns a Firebase Auth error into one of our translated messages. */
export const authErrorKey = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "auth_email_in_use";
    case "auth/weak-password":
      return "auth_weak_password";
    case "auth/invalid-email":
      return "auth_invalid_email";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "auth_wrong";
    default:
      return "auth_generic";
  }
};

/** Header and footer around the member pages. */
export function MemberFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1 bg-slate-50 py-12 px-4">{children}</main>
      <SiteFooter />
    </div>
  );
}

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useLanguage();
  const perks = [
    { icon: BadgePercent, text: t("reg_perk1") },
    { icon: MessageSquareQuote, text: t("reg_perk2") },
    { icon: Sparkles, text: t("reg_perk3") },
  ];
  return (
    <MemberFrame>
      <div className="max-w-4xl mx-auto grid md:grid-cols-[1.1fr_1fr] bg-white border border-slate-100 shadow-sm">
        <div className="p-8 sm:p-10">
          <h1 className="font-display text-3xl text-versace-green-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8">{subtitle}</p>
          {children}
        </div>
        <aside className="bg-versace-green-900 text-versace-gold-50 p-8 sm:p-10 flex flex-col justify-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo-128.webp" alt="" width={48} height={48} className="w-12 h-12 object-contain" />
            <span className="font-display text-2xl tracking-[0.12em] uppercase">{t("brand_name")}</span>
          </Link>
          <ul className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <Icon className="w-5 h-5 text-versace-gold-500 flex-shrink-0" /> {text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </MemberFrame>
  );
}
