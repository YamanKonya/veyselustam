"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Mail, Phone, BadgePercent } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { MemberFrame } from "@/components/auth/AuthShell";

// A member's own page: who is signed in, and a way out.
export default function AccountPage() {
  const { user, profile, loading, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/account");
  }, [loading, user, router]);

  if (!user) return <MemberFrame><div className="min-h-[50vh]" /></MemberFrame>;

  return (
    <MemberFrame>
      <div className="max-w-xl mx-auto bg-white border border-slate-100 shadow-sm p-8 sm:p-10">
        <h1 className="font-display text-3xl text-versace-green-900">{t("member_welcome")}</h1>
        <p className="mt-2 text-sm text-versace-gold-700 flex items-center gap-2">
          <BadgePercent className="w-4 h-4" /> {t("member_logged_note")}
        </p>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <dt className="sr-only">{t("reg_email")}</dt>
            <dd dir="ltr">{user.email}</dd>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <dt className="sr-only">{t("reg_phone")}</dt>
              <dd dir="ltr">{profile.phone}</dd>
            </div>
          )}
        </dl>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#koleksiyon" className="px-5 py-3 text-sm font-semibold bg-versace-green-900 text-versace-gold-50 hover:bg-versace-green-700 transition-colors">
            {t("nav_collection")}
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="px-5 py-3 text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> {t("nav_logout")}
          </button>
        </div>
      </div>
    </MemberFrame>
  );
}
