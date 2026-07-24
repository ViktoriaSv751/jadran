import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { HU_BLOG } from "@/lib/blog/content";
import { breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";
import BlogHub, { type DbPost } from "@/components/blog/BlogHub";

// A tulajdonosi (DB) cikkek dinamikusan jelenhetnek meg — nem kell újradeploy.
export const dynamic = "force-dynamic";

const TITLE = "Blog — külföldi ingatlanbefektetés, országkalauzok és piaci trendek";
const DESC =
  "Mélyre menő, friss cikkek külföldi ingatlanvásárlásról és -befektetésről: országkalauzok, hozam, adózás, finanszírozás és 2026-os piaci trendek — 14 nyelven.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/blog`, type: "website" }
};

export default async function BlogIndexPage() {
  const db = await getPublishedPosts();
  const dbPosts: DbPost[] = db.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: p.cover,
    createdAt: p.createdAt
  }));

  const codeSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
  const blogPostLd = [
    ...BLOG_POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: HU_BLOG.posts[p.slug]?.title ?? p.slug,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      image: `${SITE_URL}${p.cover}`
    })),
    ...dbPosts
      .filter((d) => !codeSlugs.has(d.slug))
      .map((d) => ({
        "@type": "BlogPosting",
        headline: d.title,
        url: `${SITE_URL}/blog/${d.slug}`,
        datePublished: d.createdAt
      }))
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            url: `${SITE_URL}/blog`,
            name: TITLE,
            description: DESC,
            isPartOf: { "@id": SITE_ID },
            blogPost: blogPostLd
          },
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` }
          ])
        ]}
      />
      <BlogHub dbPosts={dbPosts} />
    </>
  );
}
