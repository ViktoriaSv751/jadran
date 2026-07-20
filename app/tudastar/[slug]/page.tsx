import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLE_BY_SLUG, ARTICLE_SLUGS, CATEGORY_LABEL } from "@/lib/articles";
import { breadcrumbJsonLd, faqJsonLd, ORG_ID, SITE_ID } from "@/lib/seo";
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
      <ArticleBody slug={a.slug} />
    </article>
  );
}
