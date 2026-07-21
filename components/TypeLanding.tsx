"use client";

import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr, typeLabels } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import { TYPE_FACETS, typeFacetSlug } from "@/lib/facets";
import type { CountryCode, PropertyType } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import Icon from "@/components/ui/Icon";

/**
 * Típus × ország landing (programmatic SEO): egy ingatlantípus kínálata egy
 * országban, dedikált URL-en (/l/ME/villa). Kulcsszó-első H1 („Eladó villa –
 * Montenegró"), valós, típusonként eltérő adattal.
 */
export default function TypeLanding({
  country,
  type
}: {
  country: CountryCode;
  type: PropertyType;
}) {
  const { lang } = useLang();
  const { items } = useListings();
  const info = COUNTRY_BY_CODE[country];
  const countryName = tr(info.nameKey, lang);
  const typeName = typeLabels[type]?.[lang] ?? typeLabels[type]?.en ?? type;

  const active = items.filter(
    (l) => l.status === "active" && l.country === country && l.type === type
  );
  const saleWithArea = active.filter((l) => l.mode === "sale" && l.area > 0);
  const avg =
    saleWithArea.length > 0
      ? Math.round(saleWithArea.reduce((s, l) => s + l.price / l.area, 0) / saleWithArea.length)
      : 0;

  const h1 = tr("seo_type_h1", lang).replace("{type}", typeName).replace("{country}", countryName);
  const otherTypes = TYPE_FACETS.filter((t) => t !== type);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href={`/l/${country}`} className="hover:text-ink-900">
          {info.flag} {countryName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-600">{typeName}</span>
      </nav>

      <div className="rounded-3xl border border-ink-100 bg-gradient-to-b from-ink-50 to-white p-8 text-center shadow-soft">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">{h1}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {tr("seo_city_sub", lang).replace("{country}", countryName)}
        </p>

        <div className="mx-auto mt-5 flex max-w-md justify-center gap-3">
          <div className="flex-1 rounded-2xl border border-ink-100 bg-white px-3 py-3 shadow-soft">
            <div className="text-2xl font-black text-ink-900">{active.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {tr("listings_in", lang)}
            </div>
          </div>
          <div className="flex-1 rounded-2xl border border-ink-100 bg-white px-3 py-3 shadow-soft">
            <div className="text-2xl font-black text-ink-900">
              {avg ? `${formatNumber(avg, lang)} €` : "—"}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {tr("stat_avg_m2", lang)}
            </div>
          </div>
        </div>

        <Link
          href={`/search?country=${country}&type=${type}`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
        >
          {tr("search", lang)} <Icon name="arrowRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>

      {active.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {active.slice(0, 12).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-ink-100 bg-ink-50 px-6 py-10 text-center">
          <p className="text-sm text-ink-600">
            {tr("city_no_listings", lang).replace("{city}", `${typeName} · ${countryName}`)}
          </p>
          <Link
            href={`/l/${country}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-5 py-2 text-sm font-bold text-ink-950 transition hover:brightness-95"
          >
            {tr("city_all_country", lang).replace("{country}", countryName)}
          </Link>
        </div>
      )}

      {/* Testvér-típusok — belső linkháló */}
      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {tr("city_all_types", lang).replace("{country}", countryName)}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherTypes.map((t) => (
            <Link
              key={t}
              href={`/l/${country}/${typeFacetSlug(t)}`}
              className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              {typeLabels[t]?.[lang] ?? typeLabels[t]?.en ?? t}
            </Link>
          ))}
          <Link
            href={`/l/${country}`}
            className="rounded-full border border-ink-900 bg-ink-900 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            {tr("city_all_country", lang).replace("{country}", countryName)}
          </Link>
        </div>
      </section>
    </div>
  );
}
