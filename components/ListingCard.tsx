"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Listing } from "@/lib/types";
import { useLang, useFavorites, useCompare } from "@/lib/store";
import { tr, typeLabels, modeLabels } from "@/lib/i18n";
import { formatPrice, pricePerM2, distanceLabel, formatNumber } from "@/lib/format";
import VerificationBadge from "./VerificationBadge";
import Photo from "./Photo";
import Icon from "./ui/Icon";

const TODAY = new Date("2026-05-31");

export default function ListingCard({
  listing,
  active = false,
  onActivate
}: {
  listing: Listing;
  active?: boolean;
  onActivate?: (id: string | null) => void;
}) {
  const { lang } = useLang();
  const favorites = useFavorites();
  const compare = useCompare();
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const isFav = favorites.has(listing.id);
  const inCompare = compare.has(listing.id);

  const isNew = (TODAY.getTime() - new Date(listing.createdAt).getTime()) / 86400000 <= 7;
  const ph = listing.priceHistory;
  const priceDropped = ph.length > 1 && ph[ph.length - 1].price < ph[0].price;

  const total = listing.images.length;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIdx((prev) => (prev === i ? prev : i));
  };

  const step = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    const el = trackRef.current;
    if (!el) return;
    const next = (idx + d + total) % total;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIdx(next);
  };

  return (
    <article
      onMouseEnter={() => onActivate?.(listing.id)}
      onMouseLeave={() => onActivate?.(null)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 ${
        active ? "shadow-card -translate-y-1 ring-2 ring-ink-900" : "shadow-soft hover:-translate-y-1 hover:shadow-card"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex h-full snap-x-mandatory overflow-x-auto">
          {listing.images.map((img, i) => (
            <Link
              key={i}
              href={`/listing/${listing.id}`}
              aria-label={listing.title[lang]}
              className="h-full w-full shrink-0 snap-center"
              style={{ flex: "0 0 100%" }}
            >
              <Photo src={img} alt={listing.title[lang]} eager={i === 0} className="h-full w-full" />
            </Link>
          ))}
        </div>

        {/* top badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-soft ${
              listing.mode === "rent" ? "bg-brand-500 text-white" : "bg-ink-950/90 text-white backdrop-blur"
            }`}
          >
            {modeLabels[listing.mode][lang]}
          </span>
          {isNew && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-900 shadow-soft">
              {tr("badge_new", lang)}
            </span>
          )}
          {priceDropped && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">
              <Icon name="trendUp" size={12} strokeWidth={2.4} className="rotate-90" />
              {tr("price_drop", lang)}
            </span>
          )}
        </div>

        {/* favorite */}
        <button
          onClick={(e) => {
            e.preventDefault();
            favorites.toggle(listing.id);
          }}
          aria-label="favorite"
          className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full shadow-float transition active:scale-90 ${
            isFav ? "bg-brand-500 text-white" : "bg-white/95 text-ink-700 backdrop-blur hover:text-brand-500"
          }`}
        >
          <Icon name={isFav ? "heartFilled" : "heart"} size={18} strokeWidth={2} />
        </button>

        {/* carousel controls */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => step(e, -1)}
              aria-label="prev"
              className="absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink-800 shadow-float transition group-hover:grid hover:bg-white"
            >
              <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
            </button>
            <button
              onClick={(e) => step(e, 1)}
              aria-label="next"
              className="absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink-800 shadow-float transition group-hover:grid hover:bg-white"
            >
              <Icon name="chevronRight" size={18} strokeWidth={2.2} />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {listing.images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="pointer-events-none absolute bottom-3 right-3 z-10">
          <VerificationBadge level={listing.verification} lang={lang} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-600">
            {typeLabels[listing.type][lang]}
          </span>
          {listing.view === "sea" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              <Icon name="waves" size={14} strokeWidth={2} />
              {distanceLabel(listing.distanceToSea)}
            </span>
          )}
        </div>

        <Link href={`/listing/${listing.id}`} className="mt-2">
          <h3 className="line-clamp-1 text-[15px] font-bold tracking-tight text-ink-900 transition group-hover:text-brand-600">
            {listing.title[lang]}
          </h3>
        </Link>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-400">
          <Icon name="mapPin" size={13} />
          {listing.city} · {listing.district}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-600">
          <span className="inline-flex items-center gap-1">
            <Icon name="area" size={14} className="text-ink-400" />
            {formatNumber(listing.area, lang)} m²
          </span>
          {listing.rooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icon name="bed" size={14} className="text-ink-400" />
              {listing.rooms}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-ink-100 pt-3">
          <div>
            <span className="text-lg font-black tracking-tight text-ink-900">{formatPrice(listing.price, lang)}</span>
            {listing.mode === "rent" ? (
              <span className="text-sm font-semibold text-ink-400">{tr("per_month", lang)}</span>
            ) : (
              <span className="block text-[11px] font-medium text-ink-400">
                {formatNumber(pricePerM2(listing.price, listing.area), lang)} €{tr("per_m2", lang)}
              </span>
            )}
          </div>
          <button
            onClick={() => compare.toggle(listing.id)}
            aria-label={tr("compare", lang)}
            title={tr("compare", lang)}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
              inCompare
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900"
            }`}
          >
            <Icon name={inCompare ? "check" : "plus"} size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}
