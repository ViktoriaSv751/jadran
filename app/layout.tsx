import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LangProvider, AuthProvider } from "@/lib/store";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import AuthModalHost from "@/components/auth/AuthModalHost";
import Toaster from "@/components/ui/Toaster";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JADRAN — Ingatlan Montenegróban",
    template: "%s | JADRAN"
  },
  description:
    "A hely, ahol Montenegróban mindenki ingatlant keres. Verifikált hirdetések, átlátható árak, térképes keresés Budva, Kotor, Tivat, Herceg Novi és Bar térségében.",
  applicationName: "JADRAN",
  keywords: [
    "ingatlan Montenegró",
    "nekretnine Crna Gora",
    "Montenegro real estate",
    "Budva",
    "Kotor",
    "Tivat",
    "Herceg Novi",
    "tengerparti lakás",
    "eladó ház Montenegró"
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "JADRAN",
    title: "JADRAN — Ingatlan Montenegróban",
    description:
      "Verifikált ingatlanhirdetések Montenegróban — átlátható árak, térképes keresés, 4 nyelven.",
    url: SITE_URL,
    locale: "hu_HU"
  },
  twitter: {
    card: "summary_large_image",
    title: "JADRAN — Ingatlan Montenegróban",
    description: "Verifikált ingatlanhirdetések Montenegróban — átlátható árak, térképes keresés."
  },
  icons: { icon: "/nav/icon.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={inter.variable}>
      <body className="font-sans">
        <LangProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <MobileNav />
            </div>
            <AuthModalHost />
            <Toaster />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
