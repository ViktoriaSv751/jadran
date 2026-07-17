"use client";

import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { COUNTRIES } from "@/lib/geo";

/**
 * Célpont-rács (Airbnb-stílus): a hat ország kártyaként, zászlóval, aktív
 * hirdetésszámmal és átlagos €/m²-árral. A kártyák a keresőbe visznek az adott
 * országra szűrve.
 */
export default function CountryGrid() {
  const { lang } = useLang();
  const { items } = useListings();
  const active = items.filter((l) => l.status === "active");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {COUNTRIES.map((c) => {
        const inCountry = active.filter((l) => l.country === c.code);
        const saleWithArea = inCountry.filter((l) => l.mode === "sale" && l.area > 0);
        const avg =
          saleWithArea.length > 0
            ? Math.round(saleWithArea.reduce((s, l) => s + l.price / l.area, 0) / saleWithArea.length)
            : 0;
        return (
          <Link
            key={c.code}
            href={`/search?country=${c.code}`}
            className="group flex flex-col items-center rounded-2xl border border-ink-100 bg-white p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
          >
            <span className="text-3xl leading-none transition group-hover:scale-110">{c.flag}</span>
            <div className="mt-2 text-sm font-bold text-ink-900 group-hover:text-brand-700">
              {tr(c.nameKey, lang)}
            </div>
            <div className="mt-1 text-xs font-semibold text-ink-500">
              {inCountry.length} {tr("listings_in", lang)}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-400">
              {avg ? `${formatNumber(avg, lang)} €${tr("per_m2", lang)}` : "—"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
