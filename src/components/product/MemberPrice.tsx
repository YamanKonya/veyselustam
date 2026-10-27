"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BadgePercent, Lock } from "lucide-react";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePrice } from "@/lib/currency";

/** The members-only price, when the piece has one below its sale price. */
export const memberPriceOf = (p: Product) => (p.memberPrice && p.memberPrice > 0 && p.memberPrice < p.price ? p.memberPrice : undefined);

/** The product as a signed-in member buys it (member price in place of the sale price). */
export const forMember = (p: Product, isMember: boolean): Product => {
  const mp = memberPriceOf(p);
  return isMember && mp ? { ...p, price: mp } : p;
};

// Under a discounted price: the discount is for members; guests get a link to join.
export function MemberDiscountNote({ productId, tone = "light" }: { productId?: string; tone?: "light" | "dark" }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const member = mounted && !!user;
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wider ${tone === "dark" ? "text-versace-gold-500" : "text-versace-gold-700"}`}>
      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
      {t("member_discount_note")}
      {!member && (
        <Link href={`/register${productId ? `?next=/product/${productId}` : ""}`} className="normal-case tracking-normal underline underline-offset-2">
          {t("member_join")}
        </Link>
      )}
    </p>
  );
}

// Under the normal price: members see their price, guests see it as a reason to join.
export default function MemberPrice({ product, tone = "light", size = "sm" }: { product: Product; tone?: "light" | "dark"; size?: "sm" | "lg" }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { price } = usePrice();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mp = memberPriceOf(product);
  if (!mp) return null;
  const member = mounted && !!user;
  const accent = tone === "dark" ? "text-emerald-300" : "text-emerald-700";
  const amount = size === "lg" ? "text-2xl sm:text-3xl" : "text-base";

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 ${tone === "dark" ? "text-versace-gold-50/80" : "text-slate-600"} text-xs`}>
      <BadgePercent className={`w-4 h-4 ${accent}`} />
      <span className="font-semibold uppercase tracking-wider">{member ? t("member_price") : t("member_price_teaser")}</span>
      <span className={`font-bold tabular-nums ${accent} ${amount}`}>{price(mp)}</span>
      {!member && (
        <Link href={`/register?next=/product/${product.id}`} className={`font-semibold underline underline-offset-2 ${tone === "dark" ? "text-versace-gold-500" : "text-versace-gold-700"}`}>
          {t("member_join")}
        </Link>
      )}
    </div>
  );
}
