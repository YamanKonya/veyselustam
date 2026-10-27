"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { whatsappLink } from "@/lib/contact";

// WhatsApp chat box on the right of every page. It opens by itself on the first
// page of a visit; once closed it stays a round button for the rest of the visit.
// "Start chat" opens WhatsApp with the visitor's message (and the product link on
// a product page) already typed.

const CLOSED_KEY = "wa-chat-closed";

const WA_PATH =
  "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41";

const readClosed = () => {
  try {
    return sessionStorage.getItem(CLOSED_KEY) === "1";
  } catch {
    return false;
  }
};

export default function WhatsAppChat() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (readClosed()) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {}
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [text.trim() || t("wa_default_msg")];
    if (pathname?.startsWith("/product/")) parts.push(`${t("wa_about_product")} ${window.location.origin}${pathname}`);
    window.open(whatsappLink(parts.join("\n\n")), "_blank", "noopener,noreferrer");
    setText("");
    close();
  };

  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label={t("wa_open")}
          className="w-[min(340px,calc(100vw-2.5rem))] bg-white shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <img src="/images/logo-128.webp" alt="" width={40} height={40} className="w-10 h-10 rounded-full bg-white object-contain p-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t("wa_title")}</p>
              <p className="text-[11px] text-white/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" aria-hidden="true" /> {t("wa_status")}
              </p>
            </div>
            <button type="button" onClick={close} aria-label={t("close")} className="p-1.5 text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-[#ECE5DD] px-4 py-5">
            <p className="relative max-w-[85%] bg-white text-sm text-slate-800 leading-relaxed px-3 py-2 shadow-sm rounded-lg rounded-tl-none">
              {t("wa_greeting")}
            </p>
          </div>
          <form onSubmit={start} className="p-3 flex items-center gap-2 border-t border-slate-100">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("wa_placeholder")}
              aria-label={t("wa_placeholder")}
              className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-[#25D366]"
            />
            <button
              type="submit"
              aria-label={t("wa_start")}
              title={t("wa_start")}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white flex items-center justify-center"
            >
              <Send className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={t("wa_open")}
        aria-expanded={open}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
          <path d={WA_PATH} />
        </svg>
      </button>
    </div>
  );
}
