import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRY_BY_CODE, isCountryCode } from "@/lib/geo";
import { COUNTRY_FACET_PARAMS, resolveFacet, type Facet } from "@/lib/facets";
import { SITE_URL, supabaseServer } from "@/lib/supabase-server";
import { COUNTRY_SEO, breadcrumbJsonLd, cityCollectionJsonLd } from "@/lib/seo";
import { typeLabels } from "@/lib/i18n";
import type { CountryCode } from "@/lib/types";
import CityLanding from "@/components/CityLanding";
import TypeLanding from "@/components/TypeLanding";
import IntentLanding from "@/components/IntentLanding";
import JsonLd from "@/components/JsonLd";

/** Minden (ország, facet-slug) párra statikus oldalt generálunk. */
export function generateStaticParams() {
  return COUNTRY_FACET_PARAMS;
}

/** Aktív hirdetések száma egy facethez (city/type szűrővel). */
async function facetCount(code: CountryCode, facet: Facet): Promise<number> {
  if (!supabaseServer) return 0;
  let qb = supabaseServer
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("country", code);
  if (facet.kind === "city") qb = qb.eq("city", facet.city);
  else if (facet.kind === "type") qb = qb.eq("type", facet.type);
  const { count } = await qb;
  return count ?? 0;
}

/** A facet angol címe (a <title>-hoz — a site konvenciója szerint angolul). */
function facetTitle(code: CountryCode, facet: Facet): { title: string; desc: string; label: string } {
  const en = COUNTRY_SEO[code].name;
  if (facet.kind === "city") {
    return {
      title: `Property for sale in ${facet.city}, ${en}`,
      desc: `Property for sale and rent in ${facet.city}, ${en}. Verified listings, average €/m², map search.`,
      label: facet.city
    };
  }
  if (facet.kind === "type") {
    const t = typeLabels[facet.type]?.en ?? facet.type;
    return {
      title: `${t} for sale in ${en}`,
      desc: `${t} for sale and rent in ${en}. Verified listings, average €/m², map search.`,
      label: t
    };
  }
  // intent — a pontos cím a program típusától függ (állampolgárság vs letelepedés)
  const isCbi = COUNTRY_BY_CODE[code].goldenVisa?.kind === "citizenship";
  return {
    title: isCbi
      ? `Citizenship by property investment in ${en}`
      : `Golden Visa property in ${en}`,
    desc: `Residence or citizenship through real-estate investment in ${en}. Threshold, conditions and qualifying listings.`,
    label: "Golden Visa"
  };
}

export async function generateMetadata({
  params
}: {
  params: { country: string; facet: string };
}): Promise<Metadata> {
  const code = params.country.toUpperCase();
  const noindex = { title: "Proopify", robots: { index: false, follow: false } };
  if (!isCountryCode(code)) return noindex;
  const facet = resolveFacet(code, params.facet);
  if (!facet) return noindex;

  const url = `${SITE_URL}/l/${code}/${params.facet}`;
  const { title, desc } = facetTitle(code, facet);

  // Vékony (üres) város/típus oldal ne indexeljen; az intent-oldal mindig
  // indexelhető (önálló tartalmi értéke van a küszöb/feltételek miatt).
  let robots = { index: true, follow: true };
  if (facet.kind !== "intent") {
    const count = await facetCount(code, facet);
    if (count === 0) robots = { index: false, follow: true };
  }

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots,
    openGraph: { title: `${title} · Proopify`, description: desc, url, type: "website" },
    twitter: { card: "summary_large_image", title, description: desc }
  };
}

export default async function FacetLandingPage({
  params
}: {
  params: { country: string; facet: string };
}) {
  const code = params.country.toUpperCase();
  if (!isCountryCode(code)) notFound();
  const facet = resolveFacet(code, params.facet);
  if (!facet) notFound();

  const seo = COUNTRY_SEO[code];
  const url = `${SITE_URL}/l/${code}/${params.facet}`;
  const { label } = facetTitle(code, facet);

  // Strukturált adat: városnál a dedikált City-séma, egyébként egy általános
  // gyűjtőoldal az országhoz kötve.
  const count = facet.kind === "city" ? await facetCount(code, facet) : 0;
  const collection =
    facet.kind === "city"
      ? cityCollectionJsonLd(code, facet.city, count)
      : {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${url}#collection`,
          url,
          name: `${label} — ${seo.name}`,
          isPartOf: { "@id": `${SITE_URL}/l/${code}#collection` },
          about: { "@type": "Country", name: seo.name }
        };

  return (
    <>
      <JsonLd
        data={[
          collection,
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: seo.nameHu, url: `${SITE_URL}/l/${code}` },
            { name: label, url }
          ])
        ]}
      />

      {facet.kind === "city" && <CityLanding country={code} city={facet.city} />}
      {facet.kind === "type" && <TypeLanding country={code} type={facet.type} />}
      {facet.kind === "intent" && <IntentLanding country={code} />}

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
