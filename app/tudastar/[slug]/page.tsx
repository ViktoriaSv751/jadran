import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ARTICLE_BY_SLUG,
  ARTICLE_SLUGS,
  CATEGORY_LABEL,
  relatedArticles
} from "@/lib/articles";
import { breadcrumbJsonLd, faqJsonLd, ORG_ID, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";

export function generateStaticParams() {
  return ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = ARTICLE_BY_SLUG[params.slug];
  if (!a) return { title: "Tudástár" };
  const url = `${SITE_URL}/tudastar/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: a.title,
      description: a.description,
      url,
      type: "article",
      publishedTime: a.updated,
      modifiedTime: a.updated
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.description }
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = ARTICLE_BY_SLUG[params.slug];
  if (!a) notFound();

  const url = `${SITE_URL}/tudastar/${a.slug}`;
  const related = relatedArticles(a);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.description,
    /** A rövid, önálló válasz — ezt idézik a leggyakrabban az AI-asszisztensek. */
    abstract: a.answer,
    inLanguage: "hu",
    datePublished: a.updated,
    dateModified: a.updated,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: a.keywords.join(", "),
    articleSection: CATEGORY_LABEL[a.category]
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={[
          articleJsonLd,
          faqJsonLd(a.faq),
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Tudástár", url: `${SITE_URL}/tudastar` },
            { name: a.title, url }
          ])
        ]}
      />

      <nav className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href="/tudastar" className="hover:text-ink-900">
          Tudástár
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-600">{CATEGORY_LABEL[a.category]}</span>
      </nav>

      <h1 className="display mt-4 text-3xl leading-tight text-ink-900 sm:text-4xl">
        <span className="mr-2">{a.emoji}</span>
        {a.title}
      </h1>
      <p className="mt-3 text-sm text-ink-500">
        Frissítve: {a.updated} · {a.readMinutes} perc olvasás
      </p>

      {/* Rövid válasz. Ez a blokk szolgálja ki a kiemelt találatot (featured
          snippet) és az AI-asszisztensek idézetét — ezért áll közvetlenül a cím
          alatt, önmagában is értelmes, teljes mondatokban. */}
      <div className="mt-6 rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 p-5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-950">
          Röviden
        </div>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-900">{a.answer}</p>
      </div>

      {a.sections.map((s, i) => (
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

      {/* GYIK — a FAQPage strukturált adat vizuális párja. */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink-900">Gyakori kérdések</h2>
        <div className="mt-4 space-y-3">
          {a.faq.map((f, i) => (
            <details
              key={i}
              open={i === 0}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
            >
              <summary className="cursor-pointer text-[15px] font-bold text-ink-900">
                {f.q}
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {a.country && (
        <div className="mt-10 rounded-2xl border border-ink-100 bg-ink-50 p-6 text-center">
          <p className="text-sm font-medium text-ink-700">
            Nézze meg az aktuális, verifikált kínálatot ebben az országban.
          </p>
          <Link
            href={`/l/${a.country}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95"
          >
            {a.emoji} Hirdetések megtekintése
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Kapcsolódó cikkek
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/tudastar/${r.slug}`}
                className="rounded-2xl border border-ink-100 bg-white p-4 text-sm font-medium text-ink-900 shadow-soft transition hover:border-ink-900"
              >
                <span className="mr-1.5">{r.emoji}</span>
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
