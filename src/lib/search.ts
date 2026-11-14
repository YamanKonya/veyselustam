/**
 * Shop search helpers. "kufi" must find "Kûfi", "KUFİ", "kûfî"; "suleyman" finds
 * "Süleyman"; several words match in any order ("akik kufi").
 */
// Anything that is not a letter or digit in any script (Latin, Arabic, Cyrillic) splits words.
const NON_WORD = new RegExp("[^\\p{L}\\p{N}]+", "gu");
// Accents and Arabic hamza/harakat, removed after NFD splits them off the letter.
const MARKS = new RegExp("\\p{M}+", "gu");

export const normalizeSearch = (s: string) =>
  (s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(MARKS, "") // â û î ü ö ç ş ğ → a u i u o c s g
    .replace(NON_WORD, " ")
    .replace(/yuzug/g, "yuzuk") // "yüzük" and "yüzüğü" are the same word for search
    .trim();

/** True when every word of the query appears somewhere in the given texts. */
export const matchesSearch = (texts: (string | undefined | null)[], query: string) => {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const hay = " " + normalizeSearch(texts.filter(Boolean).join(" ")) + " ";
  return words.every((w) => hay.includes(w));
};
