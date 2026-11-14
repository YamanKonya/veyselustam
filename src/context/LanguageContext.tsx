"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Language, LANGUAGES, LanguageOption, translations } from "@/i18n/translations";
import { isLocale, isLocalizablePath, localizedPath, pathLocale, stripLocale } from "@/lib/locale";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentLangObj: LanguageOption;
  dir: "ltr" | "rtl";
  /** Verilen yolu aktif dilin adresine çevirir (ör. "/?menu=x" → "/en/?menu=x") */
  localizedHref: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const STORAGE_KEY = "veyselustam_lang";

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || "/";
  const router = useRouter();
  // Dil adreste ise (/en/...) o belirler; değilse tarayıcıdaki tercih kullanılır
  const routeLocale = pathLocale(pathname);
  const [savedLanguage, setSavedLanguage] = useState<Language>("tr");
  const language: Language = routeLocale ?? savedLanguage;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(fromUrl) && fromUrl !== "tr" && !routeLocale && isLocalizablePath(pathname)) {
      // Eski ?lang= bağlantıları (ör. İngilizce Pinterest pini) dil adresine yönlendirilir
      router.replace(localizedPath(fromUrl, pathname));
      return;
    }
    if (isLocale(fromUrl)) {
      setSavedLanguage(fromUrl);
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) setSavedLanguage(saved);
    // routeLocale is only read for the first load; later changes come from the URL itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (routeLocale) localStorage.setItem(STORAGE_KEY, routeLocale);
  }, [routeLocale]);

  const setLanguage = (lang: Language) => {
    setSavedLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Dil adresi olan bir sayfadaysak aynı sayfanın yeni dildeki adresine git
    const current = stripLocale(pathname);
    if (isLocalizablePath(current)) {
      const target = localizedPath(lang, current);
      if (target !== pathname) router.push(target);
    }
  };

  const localizedHref = (path: string) => localizedPath(language, path);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const dir = currentLangObj.dir;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = (key: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Turkish if key missing in selected language
    return translations.tr[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangObj, dir, localizedHref }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
