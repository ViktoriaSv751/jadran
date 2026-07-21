import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES, citySlug, isCountryCode } from "@/lib/geo";
import { TYPE_FACETS, typeFacetSlug, INTENT_SLUG } from "@/lib/facets";
import { COUNTRY_SEO, breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import { typeLabels } from "@/lib/i18n";
import { countryArticleSlug } from "@/lib/articles";
import { SITE_URL, supabaseServer } from "@/lib/supabase-server";
import type { CountryCode, PropertyType } from "@/lib/types";
import JsonLd from "@/components/JsonLd";

/**
 * Célpont-hub (/celpontok) — HTML oldaltérkép.
 *
 * A videó „mappa-hierarchia" tanulsága: minden fontos oldalnak legyen befelé
 * mutató belső linkje egy hubról, és a struktúra legyen egy helyen áttekinthető.
 * Ez az oldal a teljes ország → város → típus → szándék fát linkeli — szerver-
 * oldalon renderelve, tehát a crawlerek JS nélkül is bejárják. Csak a VALÓS
 * kínálatú (indexelt) facet-oldalakra mutat, hogy ne linkeljünk üres oldalakra.
 */

const TITLE = "Összes célpont — ország, város és ingatlantípus szerint";
const DESC =
  "Teljes oldaltérkép: külföldi ingatlan 12 országban, városonként és típusonként. Ország-kalauzok, Golden Visa és állampolgársági oldalak egy helyen.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/celpontok` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/celpontok`, type: "website" }
};

/** Mely (ország, város) és (ország, típus) kombinációknak van aktív kínálata. */
async function inventory(): Promise<{
  cities: Record<string, Set<string>>;
  types: Record<string, Set<string>>;
}> {
  const cities: Record<string, Set<string>> = {};
  const types: Record<string, Set<string>> = {};
  if (!supabaseServer) return { cities, types };
  const { data } = await supabaseServer
    .from("listings")
    .select("country, city, type")
    .eq("status", "active");
  for (const l of data ?? []) {
    const code = String(l.country);
    if (!isCountryCode(code)) continue;
    (cities[code] ??= new Set()).add(String(l.city));
    (types[code] ??= new Set()).add(String(l.type));
  }
  return { cities, types };
}

export default async function DestinationsPage() {
  const { cities, types } = await inventory();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            url: `${SITE_URL}/celpontok`,
            name: TITLE,
            description: DESC,
            isPartOf: { "@id": SITE_ID }
          },
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Célpontok", url: `${SITE_URL}/celpontok` }
          ])
        ]}
      />

      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">Összes célpont</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{DESC}</p>
      </header>

      <div className="mt-10 space-y-8">
        {COUNTRIES.map((c) => {
          const seo = COUNTRY_SEO[c.code];
          const cityList = c.cities.filter((city) => cities[c.code]?.has(city));
          const typeList = TYPE_FACETS.filter((t) => types[c.code]?.has(t));
          return (
            <section key={c.code} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">{c.flag}</span>
                <Link
                  href={`/l/${c.code}`}
                  className="text-lg font-bold text-ink-900 hover:underline"
                >
                  {seo.nameHu}
                </Link>
                {c.goldenVisa && (
                  <Link
                    href={`/l/${c.code}/${INTENT_SLUG}`}
                    className="ml-1 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-950"
                  >
                    {c.goldenVisa.kind === "citizenship" ? "Állampolgárság" : "Golden Visa"}
                  </Link>
                )}
              </div>

              {cityList.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Városok
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-600">
                    {cityList.map((city) => (
                      <Link
                        key={city}
                        href={`/l/${c.code}/${citySlug(city)}`}
                        className="hover:text-ink-900 hover:underline"
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {typeList.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    Ingatlantípusok
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-600">
                    {typeList.map((t) => (
                      <Link
                        key={t}
                        href={`/l/${c.code}/${typeFacetSlug(t as PropertyType)}`}
                        className="hover:text-ink-900 hover:underline"
                      >
                        {typeLabels[t]?.hu ?? t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm">
                <Link
                  href={`/tudastar/${countryArticleSlug(c.code)}`}
                  className="font-semibold text-ink-900 underline underline-offset-2"
                >
                  {seo.nameHu} — teljes országkalauz →
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
