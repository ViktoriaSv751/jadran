"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Listing } from "@/lib/types";
import { useLang, useMoney, useFavorites, useCompare, useAuth } from "@/lib/store";
import { qualifiesGoldenVisa } from "@/lib/geo";
import { openAuth } from "@/lib/ui";
import { tr, typeLabels, modeLabels, loc } from "@/lib/i18n";
import { pricePerM2, distanceLabel, formatNumber } from "@/lib/format";
import VerificationBadge from "./VerificationBadge";
import { isFeatured } from "@/lib/mappers";
import Photo from "./Photo";
import Icon from "./ui/Icon";

// A „friss hirdetés" kort a MAI naphoz mérjük (a befagyasztott dátum idővel
// vagy mindent, vagy semmit tett volna „új"-vá).
const daysSince = (iso: string) => (Date.now() - +new Date(iso)) / 86400000;

export default function ListingCard({
  listing,
  active = false,
  onActivate,
  tall = false
}: {
  listing: Listing;
  active?: boolean;
  onActivate?: (id: string | null) => void;
  /** Magasabb kártya (nagyobb kép) — a Mentett oldalon használjuk. */
  tall?: boolean;
}) {
  const { lang } = useLang();
  const money = useMoney();
  const { user } = useAuth();
  const favorites = useFavorites();
  const compare = useCompare();
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const isFav = favorites.has(listing.id);
  const inCompare = compare.has(listing.id);

  const isNew = daysSince(listing.createdAt) <= 7;
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
      <div className={`relative w-full overflow-hidden ${tall ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
        <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex h-full snap-x-mandatory overflow-x-auto">
          {listing.images.map((img, i) => (
            <Link
              key={i}
              href={`/listing/${listing.id}`}
              aria-label={loc(listing.title, lang)}
              className="h-full w-full shrink-0 snap-center"
              style={{ flex: "0 0 100%" }}
            >
              <Photo src={img} alt={loc(listing.title, lang)} eager={i === 0} className="h-full w-full" />
            </Link>
          ))}
        </div>

        {/* top badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {isFeatured(listing) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-soft">
              <Icon name="star" size={11} strokeWidth={2.6} />
              {tr("featured_badge", lang)}
            </span>
          )}
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
          {qualifiesGoldenVisa(listing.country, listing.price) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#c8ff00] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-ink-950 shadow-soft">
              <Icon name="globe" size={11} strokeWidth={2.6} />
              {tr("golden_visa", lang)}
            </span>
          )}
        </div>

        {/* favorite — mindig megbízhatóan bekapcsol; a stopPropagation megakadályozza,
            hogy a kártya körüli görgetés/link „elnyelje" a koppintást. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Mentéshez BE KELL jelentkezni — kilépve a belépő-ablakot hozzuk fel.
            if (!user) return openAuth("login");
            favorites.toggle(listing.id);
          }}
          aria-pressed={isFav}
          aria-label="favorite"
          className={`absolute right-2.5 top-2.5 z-20 grid h-10 w-10 place-items-center rounded-full shadow-float transition active:scale-90 ${
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
              {listing.images.slice(0, 8).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === Math.min(idx, 7) ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
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
            {loc(listing.title, lang)}
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
            <span className="text-2xl font-black tracking-tight text-ink-900">{money(listing.price)}</span>
            {listing.mode === "rent" ? (
              <span className="text-sm font-semibold text-ink-400">{tr("per_month", lang)}</span>
            ) : (
              <span className="mt-1.5 block text-xs font-medium text-ink-400">
                {formatNumber(pricePerM2(listing.price, listing.area), lang)} €{tr("per_m2", lang)}
              </span>
            )}
          </div>
          <button
            onClick={() => (user ? compare.toggle(listing.id) : openAuth("login"))}
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
