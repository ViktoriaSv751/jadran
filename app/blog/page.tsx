import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog";
import { breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";

export const dynamic = "force-dynamic";

const TITLE = "Blog — friss cikkek külföldi ingatlanról";
const DESC = "Naprakész írások, tippek és hírek a külföldi ingatlanvásárlásról és -befektetésről.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/blog`, type: "website" }
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            url: `${SITE_URL}/blog`,
            name: TITLE,
            description: DESC,
            isPartOf: { "@id": SITE_ID },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${SITE_URL}/blog/${p.slug}`,
              datePublished: p.createdAt
            }))
          },
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` }
          ])
        ]}
      />

      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">Blog</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{DESC}</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-ink-400">Hamarosan érkeznek az első cikkek.</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-pop"
            >
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover}
                  alt={p.title}
                  className="mb-4 aspect-[16/9] w-full rounded-2xl object-cover"
                />
              )}
              <h2 className="text-lg font-bold leading-snug text-ink-900 group-hover:underline">
                {p.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{p.excerpt}</p>
              <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {new Date(p.createdAt).toLocaleDateString("hu-HU")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
