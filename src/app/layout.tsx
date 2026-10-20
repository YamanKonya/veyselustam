import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminEditProvider } from "@/components/admin/AdminEditProvider";

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
  title: "Veysel Ustam | Takı & E-Ticaret Platformu",
  description: "Özel tasarım takı ve aksesuar mağazası. En seçkin koleksiyonlar.",
  keywords: ["takı", "aksesuar", "yüzük", "kolye", "bileklik", "e-ticaret", "özel tasarım"],
  icons: {
    icon: "/images/logo-256.png",
    apple: "/images/logo-256.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${inter.variable} ${cormorant.variable} ${arabicDisplay.variable} ${arabicSans.variable} font-sans min-h-screen text-slate-900 antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <AdminEditProvider>{children}</AdminEditProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
