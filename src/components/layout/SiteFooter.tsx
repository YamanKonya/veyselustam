"use client";

import React from "react";
import Link from "next/link";
import { Phone, Instagram, MessageCircle, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CONTACT, whatsappLink } from "@/lib/contact";

export default function SiteFooter() {
  const { t } = useLanguage();

  const columns = [
    {
      title: t("footer_corp_title"),
      links: [
        { label: t("footer_corp_about"), href: "/" },
        { label: t("footer_corp_customer"), href: "/" },
        { label: t("footer_corp_faq"), href: "/" },
        { label: t("footer_corp_privacy"), href: "/gizlilik" },
      ],
    },
    {
      title: t("footer_shopping_title"),
      links: [
        { label: t("footer_shopping_distance"), href: "/" },
        { label: t("footer_shopping_delivery"), href: "/" },
        { label: t("footer_shopping_warranty"), href: "/" },
        { label: t("footer_shopping_bank"), href: "/" },
      ],
    },
    {
      title: t("footer_membership_title"),
      links: [
        { label: t("footer_membership_new"), href: "/register" },
        { label: t("footer_membership_login"), href: "/login" },
        { label: t("footer_membership_forgot"), href: "/login" },
        { label: t("footer_membership_track"), href: "/" },
      ],
    },
  ];

  return (
    <footer className="bg-versace-green-900 bg-pattern-dark text-versace-gold-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {columns.map((col) => (
            <div key={col.title} className="space-y-5">
              <h4 className="font-display text-xl text-versace-gold-500">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-versace-green-100/70 hover:text-versace-gold-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-5">
            <h4 className="font-display text-xl text-versace-gold-500">{t("footer_contact_title")}</h4>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-versace-green-100/70 leading-relaxed">{t("footer_contact_desc")}</p>
              <a href={`tel:${CONTACT.phoneE164}`} className="text-base text-versace-gold-500 hover:text-white transition-colors font-semibold flex items-center gap-2 tabular-nums">
                <Phone className="w-4 h-4" /> {CONTACT.phoneDisplay}
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-sm text-versace-green-100/70 hover:text-white transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> {t("nav_whatsapp_support")}
              </a>
              <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-versace-green-100/70 hover:text-white transition-colors flex items-center gap-2">
                <Instagram className="w-4 h-4" /> @{CONTACT.instagram}
              </a>
              <p className="text-sm text-versace-green-100/70 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {CONTACT.address}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-versace-gold/15 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
          <div className="flex items-center gap-4">
            <img src="/images/logo-128.webp" alt="Veysel Ustam" width={64} height={64} className="w-16 h-16 object-contain" />
            <div>
              <span className="font-display text-2xl text-white block leading-none">Veysel Ustam</span>
              <span className="text-xs text-versace-gold-500 block mt-1.5">{CONTACT.address}</span>
            </div>
          </div>
          <p className="text-xs text-versace-green-100/50">{t("footer_rights")}</p>
        </div>
      </div>
    </footer>
  );
}
