import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { LangProvider, CurrencyProvider, AuthProvider } from "@/lib/store";
import Header from "@/components/layout/Header";
import OwnerBar from "@/components/owner/OwnerBar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import AuthModalHost from "@/components/auth/AuthModalHost";
import LogoutConfirmHost from "@/components/auth/LogoutConfirmHost";
import Toaster from "@/components/ui/Toaster";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

// Display betű a nagy címsorokhoz — ez adja az "ingatlan-magazin" karaktert.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"]
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const SITE_TITLE = "Proopify — Külföldi ingatlan, Golden Visa és állampolgárság 12 országban";
const SITE_DESC =
  "Verifikált külföldi ingatlanhirdetések 12 országban — Montenegró, Horvátország, Görögország, Spanyolország, Törökország, Bali, Magyarország és több. Golden Visa és ingatlanbefektetéssel szerezhető állampolgárság országonkénti küszöbökkel, átlátható árak, térképes keresés.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Proopify"
  },
  description: SITE_DESC,
  applicationName: "Proopify",
  keywords: [
    "külföldi ingatlan",
    "ingatlanbefektetés külföldön",
    "Golden Visa ingatlannal",
    "állampolgárság ingatlanbefektetéssel",
    "ingatlan Montenegró",
    "ingatlan Görögország Golden Visa",
    "török állampolgárság ingatlan",
    "Bali villa leasehold",
    "horvát tengerparti ingatlan",
    "spanyol Golden Visa",
    "overseas property investment"
  ],
  authors: [{ name: "Proopify" }],
  creator: "Proopify",
  publisher: "Proopify",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "Proopify",
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    locale: "hu_HU",
    alternateLocale: ["en_GB", "de_DE", "ru_RU", "tr_TR", "el_GR", "es_ES", "it_IT"]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description:
      "Verifikált külföldi ingatlan 12 országban — Golden Visa és állampolgárság ingatlanbefektetéssel, országonkénti küszöbökkel."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        {/* Márka- és keresőszintű strukturált adat. Minden aloldalon jelen van,
            így a Google és az AI-crawlerek egyértelműen azonosítják a kiadót. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <LangProvider>
          <CurrencyProvider>
            <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <OwnerBar />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <MobileNav />
            </div>
            <AuthModalHost />
            <LogoutConfirmHost />
            <Toaster />
            </AuthProvider>
          </CurrencyProvider>
        </LangProvider>
      </body>
    </html>
  );
}
