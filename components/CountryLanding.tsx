"use client";

import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import type { CountryCode } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import Icon from "@/components/ui/Icon";

/**
 * Ország-landing (SEO + felfedezés): egy ország aktív hirdetései, gyors
 * statisztikák, város-chipek, CTA a keresőbe. A metaadat az oldal
 * (server) komponensében készül.
 */
export default function CountryLanding({ country }: { country: CountryCode }) {
  const { lang } = useLang();
  const { items } = useListings();
  const info = COUNTRY_BY_CODE[country];

  const active = items.filter((l) => l.status === "active" && l.country === country);
  const saleWithArea = active.filter((l) => l.mode === "sale" && l.area > 0);
  const avg =
    saleWithArea.length > 0
      ? Math.round(saleWithArea.reduce((s, l) => s + l.price / l.area, 0) / saleWithArea.length)
      : 0;
  const citiesWithListings = Array.from(new Set(active.map((l) => l.city)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="rounded-3xl border border-ink-100 bg-gradient-to-b from-ink-50 to-white p-8 text-center shadow-soft">
        <div className="text-5xl leading-none">{info.flag}</div>
        <h1 className="display mt-3 text-3xl text-ink-900 sm:text-4xl">
          {tr("browse_by_country", lang)} — {tr(info.nameKey, lang)}
        </h1>
        <p className="mt-2 text-sm text-ink-500">{tr("destinations_sub", lang)}</p>

        <div className="mx-auto mt-5 flex max-w-md justify-center gap-3">
          <div className="flex-1 rounded-2xl border border-ink-100 bg-white px-3 py-3 shadow-soft">
            <div className="text-2xl font-black text-ink-900">{active.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{tr("listings_in", lang)}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-ink-100 bg-white px-3 py-3 shadow-soft">
            <div className="text-2xl font-black text-ink-900">{avg ? `${formatNumber(avg, lang)} €` : "—"}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{tr("stat_avg_m2", lang)}</div>
          </div>
        </div>

        <Link
          href={`/search?country=${country}`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
        >
          {tr("search", lang)} <Icon name="arrowRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>

      {/* Város-chipek */}
      {citiesWithListings.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {citiesWithListings.map((c) => (
            <Link
              key={c}
              href={`/search?country=${country}&city=${encodeURIComponent(c)}`}
              className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {/* Hirdetés-rács */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {active.slice(0, 12).map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
