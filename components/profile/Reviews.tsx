"use client";

import { useMemo, useState } from "react";
import { useAuth, useLang, useReviews } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { openAuth, toast } from "@/lib/ui";
import * as db from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

/** Csillagsor (kitöltött/üres). Interaktív, ha `onPick` meg van adva. */
function Stars({
  value,
  size = 16,
  onPick
}: {
  value: number;
  size?: number;
  onPick?: (v: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={onPick ? "transition hover:scale-110" : "cursor-default"}
          aria-label={`${n}`}
        >
          <Icon
            name="star"
            size={size}
            className={n <= value ? "text-amber-400" : "text-ink-200"}
          />
        </button>
      ))}
    </span>
  );
}

export default function Reviews({ targetUserId }: { targetUserId: string }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const reviews = useReviews(targetUserId);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  const { avg, count } = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }, [reviews]);

  const alreadyReviewed = !!user && reviews.some((r) => r.authorId === user.id);
  const canReview = !!user && user.id !== targetUserId && !alreadyReviewed;

  const submit = () => {
    if (!user || rating < 1) return;
    db.addReview({
      targetUserId,
      authorId: user.id,
      authorName: user.name,
      rating,
      text: text.trim()
    });
    setRating(0);
    setText("");
    toast(tr("review_thanks", lang));
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold text-ink-900">{tr("reviews_title", lang)}</h2>
        {count > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
            <Stars value={Math.round(avg)} />
            <span className="font-bold text-ink-900">{avg.toFixed(1)}</span>
            <span>· {count} {tr("reviews_count", lang)}</span>
          </span>
        )}
      </div>

      {/* Írás-blokk */}
      {user ? (
        canReview ? (
          <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-semibold text-ink-700">{tr("your_rating", lang)}</span>
              <Stars value={rating} size={22} onPick={setRating} />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={tr("review_placeholder", lang)}
              className="w-full resize-none rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submit}
                disabled={rating < 1}
                className="rounded-full bg-ink-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-200"
              >
                {tr("submit_review", lang)}
              </button>
            </div>
          </div>
        ) : alreadyReviewed ? (
          <p className="mb-6 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-500">
            {tr("already_reviewed", lang)}
          </p>
        ) : null
      ) : (
        <button
          onClick={() => openAuth("login")}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition hover:border-ink-400"
        >
          <Icon name="star" size={15} /> {tr("login_to_review", lang)}
        </button>
      )}

      {/* Lista */}
      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
          {tr("no_reviews_yet", lang)}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Avatar name={r.authorName} src={null} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink-900">{r.authorName}</div>
                  <Stars value={r.rating} size={14} />
                </div>
                <span className="shrink-0 text-xs text-ink-400">{r.createdAt.slice(0, 10)}</span>
              </div>
              {r.text && <p className="mt-2 text-sm leading-relaxed text-ink-600">{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
