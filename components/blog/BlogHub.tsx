"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { useBlogContent } from "@/lib/blog/useContent";
import Icon from "@/components/ui/Icon";

/** Egy blog-lista elem (kód-alapú vagy tulajdonosi DB-cikk egyaránt). */
interface Card {
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  date: string;
}

/** A tulajdonosi CMS (DB) cikkek — a szerver adja át, egynyelvűek. */
export interface DbPost {
  slug: string;
  title: string;
  excerpt: string;
  cover: string | null;
  createdAt: string;
}

const PER_PAGE = 6;

export default function BlogHub({ dbPosts = [] }: { dbPosts?: DbPost[] }) {
  const { lang } = useLang();
  const { content } = useBlogContent();
  const [page, setPage] = useState(0);

  // Kód-alapú (többnyelvű) cikkek + tulajdonosi DB-cikkek egy listában, dátum
  // szerint csökkenő sorrendben. A kód-cikkek slugja garantáltan nem ütközik a
  // DB-slugokkal (más névtér), de ha mégis, a kód-cikk az elsődleges.
  const cards: Card[] = useMemo(() => {
    const codeSlugs = new Set(BLOG_POSTS.map((p) => p.slug));
    const codeCards: Card[] = BLOG_POSTS.map((p) => {
      const t = content.posts[p.slug];
      return {
        slug: p.slug,
        title: t?.title ?? p.slug,
        excerpt: t?.excerpt ?? "",
        cover: p.cover,
        date: p.date
      };
    });
    const dbCards: Card[] = dbPosts
      .filter((d) => !codeSlugs.has(d.slug))
      .map((d) => ({ slug: d.slug, title: d.title, excerpt: d.excerpt, cover: d.cover, date: d.createdAt }));
    return [...codeCards, ...dbCards].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [content, dbPosts]);

  const pageCount = Math.max(1, Math.ceil(cards.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PER_PAGE;
  const pageCards = cards.slice(start, start + PER_PAGE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-[2.6rem] leading-none text-ink-900 sm:text-5xl">
          {tr("blog_title", lang)}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{tr("blog_subtitle", lang)}</p>
      </header>

      <section className="mt-8 sm:mt-12">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-900">{tr("blog_latest", lang)}</h2>
          <span className="shrink-0 text-xs font-semibold text-ink-400">
            {start + 1}–{start + pageCards.length} / {cards.length} {tr("kb_article_unit", lang)}
            {pageCount > 1 && (
              <>
                {" · "}
                {safePage + 1}/{pageCount} {tr("kb_page_unit", lang)}
              </>
            )}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageCards.map((c) => (
            <Link
              key={c.slug}
              href={`/blog/${c.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-pop"
            >
              {c.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.cover}
                  alt={c.title}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold leading-snug text-ink-900 group-hover:underline">
                  {c.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">
                  {c.excerpt}
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
              </div>
            </Link>
          ))}
        </div>

        {pageCount > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-1.5"
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
    </div>
  );
}
