"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import ListingCard from "../ListingCard";
import Icon from "../ui/Icon";

/**
 * Airbnb-style horizontal "shelf": a titled row of cards that scrolls
 * sideways with snap. Left/right circular nav buttons (like hotel/shop
 * carousels) sit on the outer edges and scroll the row — on every screen size.
 */
export default function Shelf({
  title,
  subtitle,
  href,
  cta,
  listings
}: {
  title: string;
  subtitle?: string;
  href?: string;
  cta?: string;
  listings: Listing[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  if (listings.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  const ArrowBtn = ({ dir }: { dir: 1 | -1 }) => (
    <button
      type="button"
      aria-label={dir === 1 ? "next" : "previous"}
      onClick={() => scrollBy(dir)}
      className={`absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-float backdrop-blur transition hover:bg-white hover:text-brand-600 active:scale-90 ${
        dir === 1 ? "right-1" : "left-1"
      }`}
    >
      <Icon name={dir === 1 ? "arrowRight" : "arrowLeft"} size={18} strokeWidth={2.2} />
    </button>
  );

  return (
    <section className="py-7">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-1.5 px-4 text-left">
        <h2 className="display text-2xl text-ink-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
        {href && cta && (
          <Link
            href={href}
            className="group mt-1 inline-flex items-center gap-1 text-sm font-bold text-ink-900 transition hover:text-brand-600"
          >
            {cta}
            <Icon name="arrowRight" size={16} strokeWidth={2.2} className="transition group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="relative mx-auto mt-4 max-w-7xl">
        <ArrowBtn dir={-1} />
        <ArrowBtn dir={1} />
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2"
        >
          {listings.map((l) => (
            <div key={l.id} className="w-[78%] shrink-0 snap-start sm:w-[20rem] lg:w-[22rem]">
              <ListingCard listing={l} />
            </div>
          ))}
          {/* trailing spacer so the last card clears the right edge in the scroll */}
          <div aria-hidden className="w-px shrink-0" />
        </div>
      </div>
    </section>
  );
}
