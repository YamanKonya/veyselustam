"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { whatsappLink } from "@/lib/contact";

// WhatsApp button on the right of every page. Nothing opens by itself: a click
// starts the chat in WhatsApp with a greeting (and the product link on a product
// page) already typed.

const WA_PATH =
  "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41";

export default function WhatsAppChat() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [href, setHref] = useState(whatsappLink());

  // the product link needs the page's own address, known only in the browser
  useEffect(() => {
    const parts = [t("wa_default_msg")];
    if (pathname?.startsWith("/product/")) parts.push(`${t("wa_about_product")} ${window.location.origin}${pathname}`);
    setHref(whatsappLink(parts.join("\n\n")));
  }, [pathname, t]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("wa_open")}
      title={t("wa_open")}
      className="group fixed bottom-5 end-5 z-50 flex items-center gap-3"
    >
      <span className="hidden sm:block px-3 py-2 bg-white text-sm font-semibold text-slate-700 shadow-lg border border-slate-100 opacity-0 translate-x-2 rtl:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
        {t("wa_open")}
      </span>
      <span className="w-14 h-14 rounded-full bg-[#25D366] group-hover:bg-[#1ebe5b] text-white shadow-xl flex items-center justify-center transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
          <path d={WA_PATH} />
        </svg>
      </span>
    </a>
  );
}
