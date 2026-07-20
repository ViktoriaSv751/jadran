"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import { COUNTRY_SEO, gvThresholdText, transferTaxPct } from "@/lib/seo";
import { countryArticleSlug } from "@/lib/articles";
import { useTudastarContent } from "@/lib/tudastar/useContent";
import type { CountryCode } from "@/lib/types";

/**
 * Az ország-landing tényszöveg-blokkja, a látogató nyelvén.
 *
 * A magyar változat szerver-oldalon renderelődik (ezt látják a keresőrobotok
 * JS futtatása nélkül is), majd a kliens lecseréli a választott nyelvre.
 */
export default function CountrySeoSection({
  country,
  listingCount
}: {
  country: CountryCode;
  listingCount: number;
}) {
  const { lang } = useLang();
  const { content, exact } = useTudastarContent();

  const seo = COUNTRY_SEO[country];
  const info = COUNTRY_BY_CODE[country];
  const gvText = gvThresholdText(country);
  const t = content.countries[country];

  const name = t?.nameHu ?? seo.nameHu;
  const intro = t?.intro ?? seo.introHu;
  const highlights = t?.highlights ?? seo.highlightsHu;
  const faq = t?.faq ?? seo.faqHu;

  return (
    <section className="mx-auto max-w-3xl px-4 pb-14">
      <div className="rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
        {/* Semleges szerkezetű cím: „<Ingatlanbefektetés> — <Ország>". Így nem
            kell nyelvenként ragozott helyhatározót gyártani (magyarul
            „Montenegróban", görögül más szerkezet) — a kötőjeles forma minden
            nyelven helyes marad. */}
        <h2 className="display text-2xl text-ink-900">
          {tr("kb_investment_heading", lang)} — {name}
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{intro}</p>

        <ul className="mt-5 space-y-2">
          {highlights.map((h, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-900" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* Gyors ténytáblázat — ezt tudják a legkönnyebben kinyerni az LLM-ek. */}
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {tr("kb_fact_transfer_tax", lang)}
            </dt>
            <dd className="mt-1 text-lg font-black text-ink-900">{transferTaxPct(country)}</dd>
          </div>
          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {tr("kb_fact_currency", lang)}
            </dt>
            <dd className="mt-1 text-lg font-black text-ink-900">{info.currency}</dd>
          </div>
          <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {tr("kb_fact_active_listings", lang)}
            </dt>
            <dd className="mt-1 text-lg font-black text-ink-900">{listingCount}</dd>
          </div>
        </dl>

        {gvText && (
          <p className="mt-5 rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 p-4 text-[15px] font-medium leading-relaxed text-ink-900">
            <strong>
              {info.goldenVisa!.kind === "citizenship"
                ? tr("kb_cat_citizenship", lang)
                : tr("kb_cat_golden_visa", lang)}
              :
            </strong>{" "}
            {gvText}.{" "}
            <Link href={`/tudastar/${countryArticleSlug(country)}`} className="underline">
              {tr("kb_full_guide", lang)} →
            </Link>
          </p>
        )}

        {!exact && lang !== "hu" && (
          <p className="mt-5 text-xs leading-relaxed text-ink-400">
            {tr("kb_translation_note", lang)}
          </p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-ink-900">
          {tr("kb_faq", lang)} — {name}
        </h2>
        <div className="mt-4 space-y-3">
          {faq.map((f, i) => (
            <details
              key={i}
              open={i === 0}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
            >
              <summary className="cursor-pointer text-[15px] font-bold text-ink-900">{f.q}</summary>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href={`/tudastar/${countryArticleSlug(country)}`}
          className="text-sm font-semibold text-ink-900 underline underline-offset-4"
        >
          {tr("kb_full_guide", lang)} →
        </Link>
      </div>
    </section>
  );
}
