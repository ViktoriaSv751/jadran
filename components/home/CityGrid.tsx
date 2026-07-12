"use client";

import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { cities, cityAvgPricePerM2 } from "@/lib/data";

// A hirdetéssel bíró városok + néhány további népszerű település, hogy a
// lefedettség látsszon (ezeknél az átlagár még '—', de a link működik).
const EXTRA_CITIES = ["Ulcinj", "Cetinje", "Nikšić", "Sutomore"];

export default function CityGrid() {
  const { lang } = useLang();
  const { items } = useListings();
  const showcase = Array.from(new Set([...cities, ...EXTRA_CITIES]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {showcase.map((c) => {
        const avg = cityAvgPricePerM2(c, items);
        return (
          <Link
            key={c}
            href={`/search?city=${encodeURIComponent(c)}`}
            className="group rounded-2xl border border-ink-100 bg-white p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
          >
            <div className="text-sm font-medium text-ink-600 group-hover:text-brand-700">{c}</div>
            <div className="mt-1 text-lg font-extrabold text-ink-900">
              {avg ? `${formatNumber(avg, lang)} €` : "—"}
            </div>
            <div className="text-xs text-ink-400">€{tr("per_m2", lang)}</div>
          </Link>
        );
      })}
    </div>
  );
}
