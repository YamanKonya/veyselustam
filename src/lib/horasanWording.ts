// The shop's agate is described as Khorasan agate only. Old texts (and products
// already saved in Firestore) still say "Horasan ve Yemen" / "Yemen akik"; these
// replacements rewrite them in every language. Longer phrases come first.
export const OLD_AGATE_CATEGORY = "Horasan ve Yemen Akik Taşlı";
export const AGATE_CATEGORY = "Horasan Akik Taşlı";

const REPLACEMENTS: [string, string][] = [
  [OLD_AGATE_CATEGORY, AGATE_CATEGORY],
  ["Horasan-Yemen akik", "Horasan akik"],
  ["Yemen Akik", "Horasan Akik"],
  ["Yemen akik", "Horasan akik"],
  ["Khorasan & Yemeni Agate", "Khorasan Agate"],
  ["Khorasan & Yemen Agate", "Khorasan Agate"],
  ["Khorasan–Yemeni agate", "Khorasan agate"],
  ["Yemeni Agate", "Khorasan Agate"],
  ["Yemen Agate", "Khorasan Agate"],
  ["Yemeni agate", "Khorasan agate"],
  ["Ágata de Jorasán y Yemen", "Ágata de Jorasán"],
  ["de Jorasán y Yemen", "de Jorasán"],
  ["Ágata de Yemen", "Ágata de Jorasán"],
  ["ágata yemení", "ágata de Jorasán"],
  ["Chorasan- & Jemen-Achat", "Chorasan-Achat"],
  ["Chorasan-Jemen-Achats", "Chorasan-Achats"],
  ["jemenitischem Achat", "Chorasan-Achat"],
  ["Jemen Achat", "Chorasan-Achat"],
  ["عقيق خراساني ويمني", "عقيق خراساني"],
  ["العقيق الخراساني اليمني", "العقيق الخراساني"],
  ["العقيق اليمني", "العقيق الخراساني"],
  ["عقيق يمني", "عقيق خراساني"],
];

export const toHorasanWording = (text: string) => REPLACEMENTS.reduce((s, [from, to]) => s.split(from).join(to), text);
