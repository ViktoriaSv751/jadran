"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { BLOG_POST_BY_SLUG, relatedPosts } from "@/lib/blog/posts";
import { useBlogContent } from "@/lib/blog/useContent";
import Icon from "@/components/ui/Icon";

/** Egy SEO-blogcikk törzse a felhasználó nyelvén (a magyar a szerver-render). */
export default function BlogArticleBody({ slug }: { slug: string }) {
  const { lang } = useLang();
  const { content, exact } = useBlogContent();

  const meta = BLOG_POST_BY_SLUG[slug];
  if (!meta) return null;

  const t = content.posts[slug];
  const title = t?.title ?? slug;
  const related = relatedPosts(slug);

  return (
    <>
      <nav className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Link href="/blog" className="hover:text-ink-900">
          {tr("blog_title", lang)}
        </Link>
      </nav>

      <h1 className="display mt-4 text-3xl leading-tight text-ink-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-500">
        {meta.date} · {meta.readMinutes} {tr("kb_read_minutes", lang)}
      </p>

      {!exact && lang !== "hu" && (
        <p className="mt-4 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          {tr("kb_translation_note", lang)}
        </p>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={meta.cover}
        alt={title}
        className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover"
      />

      {t?.answer && (
        <div className="mt-6 rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 p-5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-950">
            {tr("kb_in_short", lang)}
          </div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-900">{t.answer}</p>
        </div>
      )}

      {(t?.sections ?? []).map((s, i) => (
        <section key={i} className="mt-9">
          <h2 className="text-xl font-bold leading-snug text-ink-900">{s.h}</h2>
          {s.img && (
            <figure className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.img.src}
                alt={s.img.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[16/9] w-full rounded-2xl border border-ink-100 object-cover"
              />
              <figcaption className="mt-2 text-xs text-ink-400">{s.img.alt}</figcaption>
            </figure>
          )}
          {s.p.map((para, j) => (
            <p key={j} className="mt-3 text-[15px] leading-relaxed text-ink-700">
              {para}
            </p>
          ))}
        </section>
      ))}

      {t && t.faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-ink-900">{tr("kb_faq", lang)}</h2>
          <div className="mt-4 space-y-3">
            {t.faq.map((f, i) => (
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
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {tr("kb_related", lang)}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => {
              const rt = content.posts[r.slug];
              return (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="flex items-start gap-2.5 rounded-2xl border border-ink-100 bg-white p-4 text-sm font-medium text-ink-900 shadow-soft transition hover:border-ink-900"
                >
                  <span>{rt?.title ?? r.slug}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
