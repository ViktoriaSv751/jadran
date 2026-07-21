import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLE_BY_SLUG, ARTICLE_SLUGS, CATEGORY_LABEL } from "@/lib/articles";
import { breadcrumbJsonLd, definedTermSetJsonLd, faqJsonLd, howToJsonLd, ORG_ID, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";
import ArticleBody from "@/components/tudastar/ArticleBody";

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

  // Extra strukturált adat két speciális cikknél (magyar forrásból, a JSON-LD
  // is magyar — mint a FAQPage). A folyamat-cikk HowTo-t, a fogalomtár
  // DefinedTermSetet kap; mindkettő erős AEO-építőelem.
  const extraSchema: object[] = [];
  if (a.slug === "kulfoldi-ingatlanvasarlas-lepesei") {
    extraSchema.push(
      howToJsonLd(
        url,
        a.title,
        a.sections.map((s) => ({ name: s.h, text: s.p.join(" ") }))
      )
    );
  }
  if (a.slug === "ingatlanszotar-fogalmak") {
    // A definíciók „Fogalom — magyarázat" formában vannak a bekezdésekben.
    const terms = a.sections
      .flatMap((s) => s.p)
      .map((p) => {
        const i = p.indexOf(" — ");
        return i > 0 ? { term: p.slice(0, i).trim(), def: p.slice(i + 3).trim() } : null;
      })
      .filter((t): t is { term: string; def: string } => !!t);
    if (terms.length) extraSchema.push(definedTermSetJsonLd(url, a.title, terms));
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={[
          articleJsonLd,
          faqJsonLd(a.faq),
          ...extraSchema,
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Tudástár", url: `${SITE_URL}/tudastar` },
            { name: a.title, url }
          ])
        ]}
      />
      <ArticleBody slug={a.slug} />
    </article>
  );
}
