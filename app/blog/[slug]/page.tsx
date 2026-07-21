import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/blog";
import { breadcrumbJsonLd, ORG_ID, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";

// Új (tulajdonos által írt) cikkek dinamikusan jelennek meg — nem kell újradeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Blog" };
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt.slice(0, 160),
      url,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      ...(post.cover ? { images: [{ url: post.cover }] } : {})
    }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const related = (await getPublishedPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    inLanguage: "hu",
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.cover ? { image: post.cover } : {})
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={[
          articleJsonLd,
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: post.title, url }
          ])
        ]}
      />

      <nav className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href="/blog" className="hover:text-ink-900">
          Blog
        </Link>
      </nav>

      <h1 className="display mt-4 text-3xl leading-tight text-ink-900 sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-ink-500">
        {new Date(post.createdAt).toLocaleDateString("hu-HU")}
      </p>

      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover}
          alt={post.title}
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}

      {post.excerpt && (
        <p className="mt-6 text-lg font-medium leading-relaxed text-ink-700">{post.excerpt}</p>
      )}

      {post.body.map((s, i) => (
        <section key={i} className="mt-8">
          {s.h && <h2 className="text-xl font-bold leading-snug text-ink-900">{s.h}</h2>}
          {s.p.map((para, j) => (
            <p key={j} className="mt-3 text-[15px] leading-relaxed text-ink-700">
              {para}
            </p>
          ))}
        </section>
      ))}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            További cikkek
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="rounded-2xl border border-ink-100 bg-white p-4 text-sm font-medium text-ink-900 shadow-soft transition hover:border-ink-900"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
