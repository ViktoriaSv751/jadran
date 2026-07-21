import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRY_CITY_PARAMS, cityFromSlug, isCountryCode } from "@/lib/geo";
import { SITE_URL, supabaseServer } from "@/lib/supabase-server";
import { COUNTRY_SEO, breadcrumbJsonLd, cityCollectionJsonLd } from "@/lib/seo";
import type { CountryCode } from "@/lib/types";
import CityLanding from "@/components/CityLanding";
import JsonLd from "@/components/JsonLd";

/** Minden (ország, város-slug) párra statikus oldalt generálunk. */
export function generateStaticParams() {
  return COUNTRY_CITY_PARAMS;
}

/** Aktív hirdetések száma az adott városban (metaadat + strukturált adat). */
async function activeCount(code: CountryCode, city: string): Promise<number> {
  if (!supabaseServer) return 0;
  const { count } = await supabaseServer
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("country", code)
    .eq("city", city);
  return count ?? 0;
}

export async function generateMetadata({
  params
}: {
  params: { country: string; city: string };
}): Promise<Metadata> {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) return { title: "Proopify" };
  const city = cityFromSlug(code, params.city);
  if (!city) return { title: "Proopify" };

  const seo = COUNTRY_SEO[code];
  const url = `${SITE_URL}/l/${code}/${params.city}`;
  const title = `Property for sale in ${city}, ${seo.name}`;
  const description = `Property for sale and rent in ${city}, ${seo.name}. Verified listings, average €/m², map search and full purchase costs.`;

  // Üres város-oldal ne kerüljön az indexbe (vékony tartalom elkerülése) — de a
  // 404-et sem adjuk, hogy a belső linkek ne törjenek. Csak akkor indexeljük,
  // ha van valós kínálat.
  const count = await activeCount(code, city);
  const robots = count === 0 ? { index: false, follow: true } : { index: true, follow: true };

  return {
    title,
    description,
    alternates: { canonical: url },
    robots,
    openGraph: { title: `${title} · Proopify`, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function CityLandingPage({
  params
}: {
  params: { country: string; city: string };
}) {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) notFound();
  const city = cityFromSlug(code, params.city);
  if (!city) notFound();

  const seo = COUNTRY_SEO[code];
  const count = await activeCount(code, city);

  return (
    <>
      <JsonLd
        data={[
          cityCollectionJsonLd(code, city, count),
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: seo.nameHu, url: `${SITE_URL}/l/${code}` },
            { name: city, url: `${SITE_URL}/l/${code}/${params.city}` }
          ])
        ]}
      />
      <CityLanding country={code} city={city} />

      {/* Országkontextus-átvezetés a teljes kalauzra (belső link a hub felé). */}
      <div className="mx-auto max-w-7xl px-4 pb-12 text-center">
        <Link
          href={`/l/${code}`}
          className="text-sm font-semibold text-ink-900 underline underline-offset-4"
        >
          {seo.nameHu} — teljes országkalauz és mellékköltségek →
        </Link>
      </div>
    </>
  );
}
