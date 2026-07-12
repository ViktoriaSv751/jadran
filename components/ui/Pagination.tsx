"use client";

import type { Lang } from "@/lib/types";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import Icon from "./Icon";

export const PAGE_SIZE = 25;

/** Kiszámolja az aktuális oldal szeletét — max 25 elem / oldal. */
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(0, page), pageCount - 1);
  return { slice: items.slice(p * size, p * size + size), pageCount, page: p, total: items.length };
}

/**
 * Lapozó — a lista alján. Mutatja a „hányadik oldal / hány oldal"-t és az
 * összes találatszámot, plusz előző/következő + oldalszám-gombok.
 */
export default function Pagination({
  page,
  pageCount,
  total,
  onPage,
  lang
}: {
  page: number; // 0-alapú
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
  lang: Lang;
}) {
  const go = (p: number) => {
    onPage(Math.min(Math.max(0, p), pageCount - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Legfeljebb 5 oldalszám-gomb az aktuális köré.
  const nums: number[] = [];
  const from = Math.max(0, Math.min(page - 2, pageCount - 5));
  for (let i = from; i < Math.min(pageCount, from + 5); i++) nums.push(i);

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <p className="text-sm text-ink-500">
        <span className="font-bold text-ink-800">{formatNumber(total, lang)}</span> {tr("results_word", lang)}
        {pageCount > 1 && (
          <>
            {" · "}
            {page + 1} / {pageCount} {tr("page_word", lang)}
          </>
        )}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => go(page - 1)}
            disabled={page === 0}
            className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="chevronLeft" size={16} strokeWidth={2.4} />
            <span className="hidden sm:inline">{tr("pg_prev", lang)}</span>
          </button>

          {nums.map((n) => (
            <button
              key={n}
              onClick={() => go(n)}
              aria-current={n === page ? "page" : undefined}
              className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-bold transition ${
                n === page ? "bg-ink-900 text-white" : "border border-ink-200 bg-white text-ink-700 hover:border-ink-400"
              }`}
            >
              {n + 1}
            </button>
          ))}

          <button
            onClick={() => go(page + 1)}
            disabled={page >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">{tr("pg_next", lang)}</span>
            <Icon name="chevronRight" size={16} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}
