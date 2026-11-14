// Dil adresleri. Türkçe adresler önek almaz (/, /product/x). Diğer diller
// /en, /es, /de, /ar, /ru önekiyle açılır (/en/product/x). Bu dosya sunucu ve
// tarayıcı tarafından ortak kullanılır; içinde React ya da sunucu bağımlılığı yoktur.

export const LOCALES = ["tr", "en", "es", "de", "ar", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const isLocale = (value: string | null | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

/** "/en/product/x" → { locale: "en", rest: "/product/x" }. Önek yoksa ya da "tr" ise null. */
export function splitLocale(pathname: string): { locale: Locale; rest: string } | null {
  const first = pathname.split("/")[1] ?? "";
  if (!isLocale(first) || first === "tr") return null;
  const rest = pathname.slice(first.length + 1) || "/";
  return { locale: first, rest };
}

/** Adresteki dil önekini (varsa) verir; yoksa null. */
export const pathLocale = (pathname: string): Locale | null => splitLocale(pathname)?.locale ?? null;

/** Dil önekini kaldırır: "/en/product/x" → "/product/x". */
export const stripLocale = (pathname: string): string => splitLocale(pathname)?.rest ?? pathname;

/** Yalnızca anasayfa ve ürün sayfaları dil adresine sahiptir. */
export const isLocalizablePath = (path: string): boolean =>
  path === "/" || path.startsWith("/?") || path.startsWith("/#") || path.startsWith("/product/");

/** Bir yolu verilen dilin adresine çevirir. Dil adresi olmayan sayfalar olduğu gibi kalır. */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === "tr" || !isLocalizablePath(path)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
