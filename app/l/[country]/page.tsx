import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRY_CODES, isCountryCode } from "@/lib/geo";
import { SITE_URL, supabaseServer } from "@/lib/supabase-server";
import {
  COUNTRY_SEO,
  breadcrumbJsonLd,
  countryCollectionJsonLd,
  faqJsonLd
} from "@/lib/seo";
import type { CountryCode } from "@/lib/types";
import CountryLanding from "@/components/CountryLanding";
import CountrySeoSection from "@/components/tudastar/CountrySeoSection";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return COUNTRY_CODES.map((c) => ({ country: c }));
}

export function generateMetadata({ params }: { params: { country: string } }): Metadata {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) return { title: "Proopify" };
  const s = COUNTRY_SEO[code];
  const url = `${SITE_URL}/l/${code}`;
  return {
    title: s.title,
    description: s.desc,
    keywords: s.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${s.title} · Proopify`,
      description: s.desc,
      url,
      type: "website"
    },
    twitter: { card: "summary_large_image", title: s.title, description: s.desc }
  };
}

/** Aktív hirdetések száma az adott országban (a strukturált adathoz). */
async function activeCount(code: CountryCode): Promise<number> {
  if (!supabaseServer) return 0;
  const { count } = await supabaseServer
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("country", code);
  return count ?? 0;
}

export default async function CountryLandingPage({ params }: { params: { country: string } }) {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) notFound();

  const seo = COUNTRY_SEO[code];
  const count = await activeCount(code);
  const url = `${SITE_URL}/l/${code}`;

  return (
    <>
      <JsonLd
        data={[
          countryCollectionJsonLd(code, count),
          faqJsonLd(seo.faqHu),
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: seo.nameHu, url }
          ])
        ]}
      />

      {/* Interaktív rész (hirdetések, statisztikák, város-chipek). */}
      <CountryLanding country={code} />

      {/* Tényszöveg + GYIK a látogató nyelvén. A magyar változat a
          szerver-renderben benne van, így a JS-t nem futtató keresőrobotok is
          látják; a kliens ezt cseréli le a választott nyelvre. */}
      <CountrySeoSection country={code} listingCount={count} />
    </>
  );
}
