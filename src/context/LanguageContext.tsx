"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, LANGUAGES, LanguageOption, translations } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentLangObj: LanguageOption;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    const isLanguage = (code: string | null): code is Language => !!code && LANGUAGES.some((l) => l.code === code);
    // A ?lang= link (e.g. from an English Pinterest pin) wins and is remembered for the rest of the visit
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLanguage(fromUrl)) {
      setLanguageState(fromUrl);
      localStorage.setItem("veyselustam_lang", fromUrl);
      return;
    }
    const saved = localStorage.getItem("veyselustam_lang");
    if (isLanguage(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("veyselustam_lang", lang);
  };

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
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangObj, dir }}>
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
