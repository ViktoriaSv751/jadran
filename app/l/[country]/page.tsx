import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRY_CODES, isCountryCode } from "@/lib/geo";
import { SITE_URL } from "@/lib/supabase-server";
import CountryLanding from "@/components/CountryLanding";

/** SEO szöveg országonként (angolul, a legszélesebb elérésért). */
const SEO: Record<string, { name: string; title: string; desc: string }> = {
  ME: { name: "Montenegro", title: "Property for sale in Montenegro", desc: "Verified apartments, villas and houses for sale in Montenegro — Budva, Kotor, Tivat and the Adriatic coast. Transparent prices, map search." },
  HR: { name: "Croatia", title: "Property for sale in Croatia", desc: "Verified real estate for sale in Croatia — Dubrovnik, Split, Rovinj and the Adriatic. Sea-view apartments, villas and new builds." },
  AL: { name: "Albania", title: "Property for sale in Albania", desc: "Verified property for sale on the Albanian Riviera — Sarandë, Vlorë, Ksamil. Affordable seafront apartments with strong rental potential." },
  RS: { name: "Serbia", title: "Property for sale in Serbia", desc: "Verified apartments and investment property in Serbia — Belgrade, Novi Sad and mountain resorts like Zlatibor." },
  TR: { name: "Turkey", title: "Property for sale in Turkey", desc: "Verified property for sale in Turkey — Istanbul, Antalya, Bodrum. Citizenship-eligible homes and sea-view villas." },
  ID: { name: "Bali", title: "Property for sale in Bali, Indonesia", desc: "Leasehold and freehold villas in Bali — Canggu, Seminyak, Ubud, Uluwatu. Strong short-let rental yields." }
};

export function generateStaticParams() {
  return COUNTRY_CODES.map((c) => ({ country: c }));
}

export function generateMetadata({ params }: { params: { country: string } }): Metadata {
  const code = params.country.toUpperCase();
  const s = SEO[code];
  if (!s) return { title: "Proopify" };
  const url = `${SITE_URL}/l/${code}`;
  return {
    title: `${s.title} · Proopify`,
    description: s.desc,
    alternates: { canonical: url },
    openGraph: { title: `${s.title} · Proopify`, description: s.desc, url, type: "website" }
  };
}

export default function CountryLandingPage({ params }: { params: { country: string } }) {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) notFound();
  return <CountryLanding country={code} />;
}
