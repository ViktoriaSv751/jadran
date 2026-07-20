"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { ARTICLE_BY_SLUG, relatedArticles, type Article } from "@/lib/articles";
import { useTudastarContent } from "@/lib/tudastar/useContent";
import Icon, { type IconName } from "@/components/ui/Icon";

/** Kategória → i18n kulcs. */
const CATEGORY_KEY: Record<Article["category"], string> = {
  citizenship: "kb_cat_citizenship",
  "golden-visa": "kb_cat_golden_visa",
  guide: "kb_cat_guide",
  country: "kb_cat_country"
};

/**
 * Egy tudástár-cikk törzse a felhasználó nyelvén.
 *
 * Az országkalauzok tartalma NEM ebből a szótárból jön: azokat a
 * lib/articles.ts generálja országadatokból, hogy ne legyen adat-drift. Ezért
 * ott a lefordított ország-blokkokat (intro, highlights, faq) használjuk, a
 * táblázatokat pedig a nyelvfüggetlen számadatok adják.
 */
export default function ArticleBody({ slug }: { slug: string }) {
  const { lang } = useLang();
  const { content, exact } = useTudastarContent();

  const a = ARTICLE_BY_SLUG[slug];
  if (!a) return null;

  const related = relatedArticles(a);

  // Pillér-cikknél a fordított szöveg; országkalauznál a generált (magyar
  // vázú) cikk, amelynek a lefordítható részeit az ország-blokkból vesszük.
  const t = content.articles[slug];
  const countryT = a.country ? content.countries[a.country] : undefined;

  const title = t?.title ?? (countryT ? `${countryT.nameHu} — ${tr("kb_investment_heading", lang)}` : a.title);
  const answer = t?.answer ?? countryT?.intro ?? a.answer;
  const faq = t?.faq ?? countryT?.faq ?? a.faq;

  // Az országkalauz szekciói: a lefordított bevezető és kiemelések, majd a
  // nyelvfüggetlen (számokból generált) táblázatok az eredeti cikkből.
  const sections = t?.sections
    ? t.sections.map((s) => ({ h: s.h, p: s.p, table: s.table ?? undefined }))
    : countryT
      ? [
          { h: `${countryT.nameHu}`, p: [countryT.intro], table: undefined },
          { h: tr("kb_pillars", lang), p: countryT.highlights.map((h) => `• ${h}`), table: undefined },
          ...a.sections.filter((s) => !!s.table)
        ]
      : a.sections;

  return (
    <>
      <nav className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href="/tudastar" className="hover:text-ink-900">
          {tr("kb_title", lang)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-600">{tr(CATEGORY_KEY[a.category], lang)}</span>
      </nav>

      {a.icon ? (
        <span className="mt-4 grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
          <Icon name={a.icon as IconName} size={22} strokeWidth={2.2} />
        </span>
      ) : (
        <span className="mt-4 block text-4xl leading-none">{a.emoji}</span>
      )}
      <h1 className="display mt-3 text-3xl leading-tight text-ink-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-500">
        {tr("kb_updated", lang)}: {a.updated} · {a.readMinutes} {tr("kb_read_minutes", lang)}
      </p>

      {/* Ha nincs saját fordítás a választott nyelvre, ezt megmondjuk, nem
          tesszük úgy, mintha lenne. */}
      {!exact && lang !== "hu" && (
        <p className="mt-4 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          {tr("kb_translation_note", lang)}
        </p>
      )}

      {/* Rövid válasz. Ez szolgálja ki a kiemelt találatot és az
          AI-asszisztensek idézetét — ezért áll közvetlenül a cím alatt. */}
      <div className="mt-6 rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 p-5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-950">
          {tr("kb_in_short", lang)}
        </div>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-900">{answer}</p>
      </div>

      {sections.map((s, i) => (
        <section key={i} className="mt-9">
          <h2 className="text-xl font-bold leading-snug text-ink-900">{s.h}</h2>
          {s.p.map((para, j) => (
            <p key={j} className="mt-3 text-[15px] leading-relaxed text-ink-700">
              {para}
            </p>
          ))}
          {s.table && (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-ink-50">
                    {s.table.head.map((h, k) => (
                      <th key={k} className="px-4 py-3 font-semibold text-ink-900">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, k) => (
                    <tr key={k} className="border-t border-ink-100">
                      {row.map((cell, m) => (
                        <td
                          key={m}
                          className={`px-4 py-3 ${m === 0 ? "font-medium text-ink-900" : "text-ink-700"}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink-900">{tr("kb_faq", lang)}</h2>
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
      </section>

      {a.country && (
        <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50 p-6 text-center">
          <p className="text-sm font-medium text-ink-700">{tr("kb_country_cta", lang)}</p>
          <Link
            href={`/l/${a.country}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
          >
            {a.emoji} {tr("kb_view_listings", lang)}
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {tr("kb_related", lang)}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => {
              const rt = content.articles[r.slug];
              const rc = r.country ? content.countries[r.country] : undefined;
              return (
                <Link
                  key={r.slug}
                  href={`/tudastar/${r.slug}`}
                  className="flex items-start gap-2.5 rounded-2xl border border-ink-100 bg-white p-4 text-sm font-medium text-ink-900 shadow-soft transition hover:border-ink-900"
                >
                  {r.icon ? (
                    <Icon
                      name={r.icon as IconName}
                      size={17}
                      strokeWidth={2.2}
                      className="mt-0.5 shrink-0 text-ink-500"
                    />
                  ) : (
                    <span className="shrink-0 leading-none">{r.emoji}</span>
                  )}
                  <span>{rt?.title ?? rc?.nameHu ?? r.title}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
