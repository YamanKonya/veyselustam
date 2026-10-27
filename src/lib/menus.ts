"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import { toHorasanWording } from "@/lib/horasanWording";

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

export const DEFAULT_ENABLED: Record<FilterId, boolean> = {
  koleksiyon: true,
  erkek: true,
  bayan: false,
  kolye: false,
  alyans: false,
  bros: false,
  hematit: true,
  dogal: false,
  yemen: false,
  firuze: false,
  seref: true,
  yesil: false,
  horasan: true,
  kizil: true,
};

// Stone subcategories under "Erkek Yüzük". Each is switched on or off like a menu.
export const SUBMENUS = [
  { id: "hematit", parent: "erkek", key: "sub_hematit" },
  { id: "dogal", parent: "erkek", key: "sub_dogal" },
  { id: "yemen", parent: "erkek", key: "sub_yemen" },
  { id: "firuze", parent: "erkek", key: "sub_firuze" },
  { id: "seref", parent: "erkek", key: "sub_seref" },
  { id: "yesil", parent: "erkek", key: "sub_yesil" },
  { id: "horasan", parent: "erkek", key: "sub_horasan" },
  { id: "kizil", parent: "erkek", key: "sub_kizil" },
] as const;

export type SubMenuId = (typeof SUBMENUS)[number]["id"];
/** A home page filter: a menu or one of its subcategories. */
export type FilterId = MenuId | SubMenuId;

export const SUBMENU_LABELS: Record<SubMenuId, string> = {
  hematit: "Hematit Taş",
  dogal: "Doğal Taş",
  yemen: "Yemen Akik",
  firuze: "Firuze - Turkuaz",
  seref: "Şeref-ül Şems",
  yesil: "Yeşil Akik",
  horasan: "Horasan Akik",
  kizil: "Kızıl Akik",
};

export const isSubMenu = (id: string): id is SubMenuId => SUBMENUS.some((m) => m.id === id);
export const subMenusOf = (parent: MenuId) => SUBMENUS.filter((m) => m.parent === parent);

const SIGNATURE_CATEGORIES = ["özel el yapımı gümüş yüzükler", "nakkaş el oyması taşlı"];

/** Menus a product appears under: its own choice, or a guess from its category and title. */
export const productMenus = (p: Product): MenuId[] => {
  if (p.menus) return p.menus as MenuId[]; // set by hand (an empty list hides it from every menu)
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

/** Stone subcategories of a piece: its own choice, or a guess from its stone (men's rings only). */
export const productSubmenus = (p: Product): SubMenuId[] => {
  if (!productMenus(p).includes("erkek")) return [];
  if (p.submenus) return p.submenus as SubMenuId[];
  // saved products may still say "Horasan ve Yemen" until the admin panel rewrites them
  const text = toHorasanWording(`${p.title} ${p.description} ${p.category}`).toLocaleLowerCase("tr");
  const out: SubMenuId[] = [];
  if (text.includes("hematit")) out.push("hematit");
  if (/kuvars|oniks|doğal taş/.test(text)) out.push("dogal");
  if (text.includes("yemen")) out.push("yemen");
  if (/firuze|turkuaz/.test(text)) out.push("firuze");
  if (text.includes("şeref")) out.push("seref");
  if (text.includes("yeşil akik")) out.push("yesil");
  if (text.includes("horasan")) out.push("horasan");
  if (/kızıl akik|kırmızı akik/.test(text)) out.push("kizil");
  return out;
};

/** Does the piece belong under this menu or subcategory? */
export const inFilter = (p: Product, id: FilterId) =>
  isSubMenu(id) ? productSubmenus(p).includes(id) : productMenus(p).includes(id);

const ref = () => doc(db, "settings", "menus");

/** Which menus are switched on, live from Firestore (defaults until it answers). */
export const useMenuSettings = () => {
  const [enabled, setEnabled] = useState<Record<FilterId, boolean>>(DEFAULT_ENABLED);
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

export const saveMenuSettings = (enabled: Record<FilterId, boolean>) => setDoc(ref(), { enabled }, { merge: true });

/** Open a menu on the home page (the home page listens for this event). */
export const openMenu = (id: FilterId) => {
  window.dispatchEvent(new CustomEvent("menu-filter", { detail: id }));
};
