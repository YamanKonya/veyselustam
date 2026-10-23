import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminEditProvider } from "@/components/admin/AdminEditProvider";
import VisitTracker from "@/components/VisitTracker";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, storeJsonLd } from "@/lib/seo";

// latin-ext carries the Turkish glyphs (ğ, ş, ı, İ)
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: 'swap',
  variable: '--font-inter',
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-display",
});

// Arabic glyphs fall back to these (the Latin faces have none). Not preloaded:
// the browser only downloads them when Arabic text is on the page.
const arabicDisplay = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-arabic-display",
});

const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
  variable: "--font-arabic-sans",
});

export const viewport: Viewport = {
  themeColor: "#0c2417",
  width: "device-width",
  initialScale: 1,

};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veysel Ustam | El Yapımı 925 Ayar Gümüş Yüzük, Konya",
    template: "%s | Veysel Ustam",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "el yapımı gümüş yüzük",
    "925 ayar gümüş yüzük",
    "erkek gümüş yüzük",
    "akik yüzük",
    "firuze yüzük",
    "hematit yüzük",
    "nakkaş yüzük",
    "Konya gümüş yüzük",
    "kişiye özel yüzük",
    "Veysel Ustam",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "Veysel Ustam | El Yapımı 925 Ayar Gümüş Yüzük",
    description: SITE_DESCRIPTION,
    locale: "tr_TR",
    images: [{ url: "/images/logo-256.png", width: 256, height: 256, alt: SITE_NAME }],
  },
  twitter: { card: "summary", title: SITE_NAME, description: SITE_DESCRIPTION },
  icons: {
    icon: "/images/logo-256.png",
    apple: "/images/logo-256.png",
  },
  // Pinterest website claim (Settings → Claimed accounts); needed for the product catalogue
  verification: { other: { "p:domain_verify": "d735687dc8c3e68a2793b01e3e600aad" } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${inter.variable} ${cormorant.variable} ${arabicDisplay.variable} ${arabicSans.variable} font-sans min-h-screen text-slate-900 antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              storeJsonLd(),
              { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "tr-TR" },
            ]),
          }}
        />
        <LanguageProvider>
          <AuthProvider>
            <AdminEditProvider>
              {children}
              <VisitTracker />
            </AdminEditProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
