"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { ARTICLES, countryArticleSlug, type Article } from "@/lib/articles";
import type { Lang } from "@/lib/types";
import { COUNTRIES } from "@/lib/geo";
import { transferTaxPct } from "@/lib/seo";
import { useTudastarContent, type UseTudastarContent } from "@/lib/tudastar/useContent";
import Icon, { type IconName } from "@/components/ui/Icon";

/** Ékezet- és kisbetű-független normalizálás — így az „illeték" az „illetek"-re
 *  is talál, és a keresés minden nyelven robustus (a diakritikát ledobja). */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

type Cat = Article["category"] | "all";

/** Egy kereshető cikk-kártya (pillér vagy ország egyaránt ide képződik). */
interface Hit {
  key: string;
  href: string;
  title: string;
  desc: string;
  icon?: IconName;
  flag?: string;
  badge?: { label: string; strong: boolean };
  category: Cat;
  /** Az egész kereshető szöveg (cím + leírás + szekciók + GYIK), normalizálva. */
  haystack: string;
}

/** GYIK-találat: konkrét kérdés → a hozzá tartozó cikk. */
interface QaHit {
  q: string;
  a: string;
  href: string;
  source: string;
}

/**
 * Tudástár nyitóoldal keresővel.
 *
 * A keresés TELJESEN kliens-oldali: a cikktartalom (a kiválasztott nyelven) már
 * a böngészőben van (useTudastarContent), így backend nélkül, azonnal szűrhető —
 * nem csak a címben, hanem a leírásban, a szekciókban ÉS a GYIK-kérdésekben is.
 */
export default function KnowledgeHub() {
  const { lang } = useLang();
  const ct = useTudastarContent();
  const { content } = ct;

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const pillars = useMemo(() => ARTICLES.filter((a) => a.category !== "country"), []);

  // Lapozás a „Befektetői útvonalak" listán — oldalanként 6 cikk. Az
  // országkalauzok NEM lapoznak, végig láthatók maradnak (külön szekció).
  const PER_PAGE = 6;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(pillars.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * PER_PAGE;
  const pagePillars = pillars.slice(pageStart, pageStart + PER_PAGE);

  // Kereshető index a MEGJELENÍTETT nyelven. A content vagy a nyelv váltásakor
  // épül újra.
  const { hits, qaAll } = useMemo(() => buildIndex(ct, lang), [ct, lang]);

  // Több szó = ÉS-keresés: minden szónak szerepelnie kell (bárhol), nem a
  // teljes kifejezésnek egyben. Így az „illeték horvátország" is talál.
  const tokens = norm(query.trim()).split(/\s+/).filter(Boolean);
  const active = tokens.length > 0 || cat !== "all";
  const matches = (hay: string) => tokens.every((t) => hay.includes(t));

  const filtered = hits.filter(
    (h) => (cat === "all" || h.category === cat) && (!tokens.length || matches(h.haystack))
  );
  const pillarHits = filtered.filter((h) => h.category !== "country");
  const countryHits = filtered.filter((h) => h.category === "country");
  const qaHits = tokens.length
    ? qaAll.filter((x) => matches(norm(`${x.q} ${x.a}`))).slice(0, 6)
    : [];

  const CATS: { key: Cat; label: string }[] = [
    { key: "all", label: tr("kb_filter_all", lang) },
    { key: "citizenship", label: tr("kb_cat_citizenship", lang) },
    { key: "golden-visa", label: tr("kb_cat_golden_visa", lang) },
    { key: "guide", label: tr("kb_cat_guide", lang) },
    { key: "country", label: tr("kb_cat_country", lang) }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-[2.6rem] leading-none text-ink-900 sm:text-5xl">
          {tr("kb_title", lang)}
        </h1>
      </header>

      {/* ---------- Kereső + kategóriaszűrő ---------- */}
      <div className="mx-auto mt-7 max-w-2xl">
        <div className="relative">
          <Icon
            name="search"
            size={18}
            strokeWidth={2.2}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("kb_search_placeholder", lang)}
            aria-label={tr("kb_search_placeholder", lang)}
            className="w-full rounded-full border-2 border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-ink-900"
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                cat === c.key
                  ? "border-ink-950 bg-ink-950 text-white"
                  : "border-ink-200 text-ink-600 hover:border-ink-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {active ? (
        /* ---------- Keresési nézet ---------- */
        <div className="mt-8">
          {qaHits.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {tr("kb_questions", lang)}
              </h2>
              <div className="mt-3 space-y-2">
                {qaHits.map((x, i) => (
                  <Link
                    key={i}
                    href={x.href}
                    className="block rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition hover:border-ink-900"
                  >
                    <div className="text-sm font-bold text-ink-900">{x.q}</div>
                    <div className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
                      {x.a}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {pillarHits.length + countryHits.length === 0 && qaHits.length === 0 ? (
            <div className="rounded-3xl border border-ink-100 bg-ink-50 px-6 py-12 text-center">
              <p className="text-sm text-ink-600">{tr("kb_no_results", lang)}</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCat("all");
                }}
                className="mt-4 text-sm font-semibold text-ink-900 underline"
              >
                {tr("kb_clear_search", lang)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...pillarHits, ...countryHits].map((h) => (
                <HitCard key={h.key} hit={h} readLabel={tr("kb_read", lang)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---------- Alap nézet: pillérek + országkalauzok ---------- */
        <>
          <section className="mt-8 sm:mt-12">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold text-ink-900">{tr("kb_pillars", lang)}</h2>
              <span className="shrink-0 text-xs font-semibold text-ink-400">
                {pageStart + 1}–{pageStart + pagePillars.length} / {pillars.length}{" "}
                {tr("kb_article_unit", lang)}
                {pageCount > 1 && (
                  <>
                    {" · "}
                    {safePage + 1}/{pageCount} {tr("kb_page_unit", lang)}
                  </>
                )}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pagePillars.map((a) => {
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

            {/* Oldalváltó — csak a befektetői útvonalak listáját lapozza; az
                országkalauzok szekció ettől függetlenül végig ott marad. */}
            {pageCount > 1 && (
              <nav
                className="mt-6 flex items-center justify-center gap-1.5"
                aria-label={tr("kb_pagination", lang)}
              >
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 0}
                  aria-label={tr("kb_prev_page", lang)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-ink-600 transition enabled:hover:border-ink-900 enabled:hover:text-ink-900 disabled:opacity-40"
                >
                  <Icon name="arrowRight" size={16} strokeWidth={2.4} className="rotate-180" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`${tr("kb_page_unit", lang)} ${i + 1}`}
                    aria-current={i === safePage ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-full px-3 text-sm font-bold transition ${
                      i === safePage
                        ? "border-2 border-ink-950 bg-ink-950 text-white"
                        : "border border-ink-200 text-ink-600 hover:border-ink-900"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pageCount - 1}
                  aria-label={tr("kb_next_page", lang)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 text-ink-600 transition enabled:hover:border-ink-900 enabled:hover:text-ink-900 disabled:opacity-40"
                >
                  <Icon name="arrowRight" size={16} strokeWidth={2.4} />
                </button>
              </nav>
            )}
          </section>

          <section className="mt-12 sm:mt-16">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-ink-900">{tr("kb_country_guides", lang)}</h2>
              <span className="text-xs font-semibold text-ink-400">
                {COUNTRIES.length} {tr("kb_country_unit", lang)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-500">{tr("kb_country_guides_sub", lang)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {COUNTRIES.map((c) => {
                const gv = c.goldenVisa;
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
                        gv ? "bg-[#c8ff00] text-ink-950" : "bg-ink-50 text-ink-500"
                      }`}
                    >
                      {badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

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
        </>
      )}
    </div>
  );
}

/** Egységes találati csempe (pillér és ország ugyanúgy). */
function HitCard({ hit, readLabel }: { hit: Hit; readLabel: string }) {
  return (
    <Link
      href={hit.href}
      className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-pop"
    >
      {hit.flag ? (
        <div className="text-3xl leading-none">{hit.flag}</div>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
          <Icon name={hit.icon ?? "compass"} size={18} strokeWidth={2.2} />
        </span>
      )}
      <h3 className="mt-2.5 text-sm font-bold leading-snug text-ink-900">{hit.title}</h3>
      {hit.desc && (
        <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-500">{hit.desc}</p>
      )}
      {hit.badge && (
        <span
          className={`mt-2 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            hit.badge.strong ? "bg-[#c8ff00] text-ink-950" : "bg-ink-50 text-ink-500"
          }`}
        >
          {hit.badge.label}
        </span>
      )}
    </Link>
  );
}

/** A kereshető index felépítése a betöltött (nyelvfüggő) tartalomból. */
function buildIndex({ content }: UseTudastarContent, lang: Lang) {
  const hits: Hit[] = [];
  const qaAll: QaHit[] = [];

  // Pillér-cikkek
  for (const a of ARTICLES.filter((x) => x.category !== "country")) {
    const t = content.articles[a.slug];
    const title = t?.title ?? a.title;
    const desc = t?.description ?? a.description;
    const parts = [title, desc, t?.answer ?? a.answer];
    for (const s of t?.sections ?? a.sections) {
      parts.push(s.h, ...s.p);
    }
    for (const f of t?.faq ?? a.faq) {
      parts.push(f.q, f.a);
      qaAll.push({ q: f.q, a: f.a, href: `/tudastar/${a.slug}`, source: title });
    }
    hits.push({
      key: a.slug,
      href: `/tudastar/${a.slug}`,
      title,
      desc,
      icon: (a.icon ?? "compass") as IconName,
      category: a.category,
      haystack: norm(parts.join(" "))
    });
  }

  // Országkalauzok
  for (const c of COUNTRIES) {
    const cc = content.countries[c.code];
    const name = cc?.nameHu ?? tr(c.nameKey, lang);
    const gv = c.goldenVisa;
    const parts = [name];
    if (cc) {
      parts.push(cc.intro, ...cc.highlights);
      for (const f of cc.faq) {
        parts.push(f.q, f.a);
        qaAll.push({
          q: f.q,
          a: f.a,
          href: `/tudastar/${countryArticleSlug(c.code)}`,
          source: name
        });
      }
    }
    hits.push({
      key: `c-${c.code}`,
      href: `/tudastar/${countryArticleSlug(c.code)}`,
      title: name,
      desc: "",
      flag: c.flag,
      category: "country",
      badge: {
        label: gv
          ? gv.kind === "citizenship"
            ? tr("kb_cat_citizenship", lang)
            : tr("kb_cat_golden_visa", lang)
          : `${tr("kb_fact_transfer_tax", lang)} ${transferTaxPct(c.code)}`,
        strong: !!gv
      },
      haystack: norm(parts.join(" "))
    });
  }

  return { hits, qaAll };
}
