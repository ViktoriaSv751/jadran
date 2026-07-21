"use client";

import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { COUNTRY_BY_CODE, qualifiesGoldenVisa } from "@/lib/geo";
import { gvThresholdText } from "@/lib/seo";
import { countryArticleSlug } from "@/lib/articles";
import type { CountryCode } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import Icon from "@/components/ui/Icon";

/**
 * Szándék × ország landing: Golden Visa / állampolgárság ingatlanbefektetéssel
 * egy adott országban, dedikált URL-en (/l/GR/golden-visa). A legmagasabb
 * szándékú (drága) kulcsszavakat célozza. A H1 a program típusához igazodik
 * (letelepedés vs állampolgárság), és a KÜSZÖBÖT ELÉRŐ hirdetéseket emeli ki.
 */
export default function IntentLanding({ country }: { country: CountryCode }) {
  const { lang } = useLang();
  const { items } = useListings();
  const info = COUNTRY_BY_CODE[country];
  const gv = info.goldenVisa;
  const countryName = tr(info.nameKey, lang);
  const isCitizenship = gv?.kind === "citizenship";

  const active = items.filter((l) => l.status === "active" && l.country === country);
  const qualifying = active.filter((l) => l.mode === "sale" && qualifiesGoldenVisa(country, l.price));
  // Ha egy sincs a küszöb felett, a legdrágább eladó hirdetéseket mutatjuk.
  const shown =
    qualifying.length > 0
      ? qualifying
      : active.filter((l) => l.mode === "sale").sort((a, b) => b.price - a.price);

  const h1 = tr(isCitizenship ? "seo_cbi_h1" : "seo_gv_h1", lang).replace("{country}", countryName);
  const gvText = gvThresholdText(country);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href={`/l/${country}`} className="hover:text-ink-900">
          {info.flag} {countryName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-600">
          {isCitizenship ? tr("kb_cat_citizenship", lang) : tr("kb_cat_golden_visa", lang)}
        </span>
      </nav>

      <div className="rounded-3xl border border-ink-100 bg-gradient-to-b from-ink-50 to-white p-8 text-center shadow-soft">
        <div className="text-5xl leading-none">{info.flag}</div>
        <h1 className="display mt-3 text-3xl text-ink-900 sm:text-4xl">{h1}</h1>
        {gvText && (
          <p className="mx-auto mt-3 max-w-xl rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 px-4 py-2.5 text-sm font-medium text-ink-900">
            {gvText}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/tudastar/${countryArticleSlug(country)}`}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
          >
            {tr("intent_read_guide", lang)} <Icon name="arrowRight" size={16} strokeWidth={2.4} />
          </Link>
          <Link
            href={`/search?country=${country}&goldenVisa=1`}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-200 bg-white px-6 py-2.5 text-sm font-bold text-ink-900 transition hover:border-ink-900"
          >
            {tr("search", lang)}
          </Link>
        </div>
      </div>

      {shown.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold text-ink-900">
            {tr("intent_qualifying", lang)}
            {qualifying.length > 0 && (
              <span className="ml-2 text-ink-400">
                ({qualifying.length} · {info.currency === "USD" ? "" : ""}
                {gv ? `${formatNumber(gv.minEur, lang)} €+` : ""})
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.slice(0, 12).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
