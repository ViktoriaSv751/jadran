"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { ARTICLES, countryArticleSlug } from "@/lib/articles";
import { COUNTRIES } from "@/lib/geo";
import { transferTaxPct } from "@/lib/seo";
import { useTudastarContent } from "@/lib/tudastar/useContent";
import Icon, { type IconName } from "@/components/ui/Icon";

/**
 * Tudástár nyitóoldal.
 *
 * Két, vizuálisan eltérő szerepű blokkra bomlik: a pillér-cikkekre (kevés,
 * nagy, kártyás) és az országkalauzokra (sok, kicsi, csempés). Korábban közös,
 * kategóriánkénti rácsban voltak — mivel kategóriánként csak 1-2 cikk van,
 * a rács fele üresen maradt és az oldal szétesett.
 */
export default function KnowledgeHub() {
  const { lang } = useLang();
  const { content } = useTudastarContent();

  const pillars = ARTICLES.filter((a) => a.category !== "country");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-3xl text-ink-900 sm:text-5xl">{tr("kb_title", lang)}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{tr("kb_subtitle", lang)}</p>
      </header>

      {/* ---------- Pillér-cikkek ---------- */}
      <section className="mt-10 sm:mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink-900">{tr("kb_pillars", lang)}</h2>
          <span className="text-xs font-semibold text-ink-400">
            {pillars.length} {tr("kb_article_unit", lang)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pillars.map((a) => {
            const t = content.articles[a.slug];
            return (
              <Link
                key={a.slug}
                href={`/tudastar/${a.slug}`}
                className="group flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-pop"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
                  <Icon name={(a.icon ?? "compass") as IconName} size={20} strokeWidth={2.2} />
                </span>
                <h3 className="mt-4 text-lg font-bold leading-snug text-ink-900">
                  {t?.title ?? a.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                  {t?.description ?? a.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  {tr("kb_read", lang)}
                  <Icon
                    name="arrowRight"
                    size={15}
                    strokeWidth={2.6}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Országkalauzok ---------- */}
      <section className="mt-12 sm:mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-ink-900">{tr("kb_country_guides", lang)}</h2>
          <span className="text-xs font-semibold text-ink-400">
            {COUNTRIES.length} {tr("kb_country_unit", lang)}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-500">{tr("kb_country_guides_sub", lang)}</p>

        {/* Sűrű csempe-rács: mobilon 2, tableten 3, desktopon 4 oszlop — így
            egyik töréspontnál sem marad félig üres sor. */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COUNTRIES.map((c) => {
            const gv = c.goldenVisa;
            const strong = !!gv;
            const badge = gv
              ? gv.kind === "citizenship"
                ? tr("kb_cat_citizenship", lang)
                : tr("kb_cat_golden_visa", lang)
              : `${tr("kb_fact_transfer_tax", lang)} ${transferTaxPct(c.code)}`;
            return (
              <Link
                key={c.code}
                href={`/tudastar/${countryArticleSlug(c.code)}`}
                className="group rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-pop"
              >
                <div className="text-3xl leading-none">{c.flag}</div>
                <div className="mt-2 text-sm font-bold leading-snug text-ink-900">
                  {content.countries[c.code]?.nameHu ?? tr(c.nameKey, lang)}
                </div>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    strong ? "bg-[#c8ff00] text-ink-950" : "bg-ink-50 text-ink-500"
                  }`}
                >
                  {badge}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Átvezetés a kínálatra ---------- */}
      <section className="mt-12 rounded-3xl border border-ink-100 bg-ink-50 px-6 py-8 text-center sm:mt-16">
        <h2 className="display text-2xl text-ink-900">{tr("kb_cta_title", lang)}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
          {tr("kb_cta_sub", lang)}
        </p>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
        >
          {tr("kb_cta_button", lang)}
          <Icon name="arrowRight" size={16} strokeWidth={2.4} />
        </Link>
      </section>
    </div>
  );
}
