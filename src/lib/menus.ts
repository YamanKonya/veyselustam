"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";

// Shop menus in the header. Each can be switched on or off in the admin panel
// (settings/menus), so a menu for a line that isn't ready yet (e.g. brooches)
// can wait and go live with one tick once its products are in.

export const MENUS = [
  { id: "koleksiyon", key: "menu_koleksiyon" },
  { id: "erkek", key: "menu_erkek" },
  { id: "bayan", key: "menu_bayan" },
  { id: "kolye", key: "menu_kolye" },
  { id: "alyans", key: "menu_alyans" },
  { id: "bros", key: "menu_bros" },
] as const;

export type MenuId = (typeof MENUS)[number]["id"];

/** Turkish names for the admin panel. */
export const MENU_LABELS: Record<MenuId, string> = {
  koleksiyon: "Ustanın Koleksiyonu",
  erkek: "Erkek Yüzük",
  bayan: "Bayan Yüzük",
  kolye: "Kolye & Madalyon",
  alyans: "Alyans",
  bros: "Broş & Rozet",
};

export const DEFAULT_ENABLED: Record<MenuId, boolean> = {
  koleksiyon: true,
  erkek: true,
  bayan: false,
  kolye: false,
  alyans: false,
  bros: false,
};

const SIGNATURE_CATEGORIES = ["özel el yapımı gümüş yüzükler", "nakkaş el oyması taşlı"];

/** Menus a product appears under: its own choice, or a guess from its category and title. */
export const productMenus = (p: Product): MenuId[] => {
  if (p.menus?.length) return p.menus as MenuId[];
  const cat = (p.category || "").toLocaleLowerCase("tr");
  const text = `${p.title} ${p.description}`.toLocaleLowerCase("tr");
  if (cat.includes("özel yapım") && text.includes("tasarım")) return []; // design service
  const out: MenuId[] = [];
  if (cat.includes("kolye") || text.includes("kolye")) out.push("kolye");
  else if (text.includes("kadın") || text.includes("bayan")) out.push("bayan");
  else out.push("erkek");
  if (p.id?.startsWith("vu-sidre") || SIGNATURE_CATEGORIES.some((c) => cat.includes(c)) || p.isFeatured) out.unshift("koleksiyon");
  return out;
};

const ref = () => doc(db, "settings", "menus");

/** Which menus are switched on, live from Firestore (defaults until it answers). */
export const useMenuSettings = () => {
  const [enabled, setEnabled] = useState<Record<MenuId, boolean>>(DEFAULT_ENABLED);
  useEffect(() => {
    try {
      return onSnapshot(
        ref(),
        (snap) => {
          const data = snap.data()?.enabled;
          if (data) setEnabled({ ...DEFAULT_ENABLED, ...data });
        },
        () => {}
      );
    } catch {
      return undefined;
    }
  }, []);
  return enabled;
};

export const saveMenuSettings = (enabled: Record<MenuId, boolean>) => setDoc(ref(), { enabled }, { merge: true });

/** Open a menu on the home page (the home page listens for this event). */
export const openMenu = (id: MenuId) => {
  window.dispatchEvent(new CustomEvent("menu-filter", { detail: id }));
};
