"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import ListingCard from "../ListingCard";
import Icon from "../ui/Icon";

/**
 * Airbnb-stílusú polc.
 *
 * ASZTALON: több kártya egymás mellett, oldalra görgethető sáv, kör alakú
 * előző/következő nyilakkal a széleken.
 *
 * TELEFONON: mindig CSAK EGY hirdetés látszik teljes szélességben, és
 * nyilakkal (+ pöttyökkel) lehet előre-hátra lapozni köztük — így minden polc
 * egységesen néz ki, nem „félig kilógó" kártyákkal.
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
  const [idx, setIdx] = useState(0);

  // Aktív kártya-index követése (a pöttyökhöz + a nyilak tiltásához).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const compute = () => {
      const card = el.firstElementChild as HTMLElement | null;
      const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth;
      setIdx(step > 0 ? Math.round(el.scrollLeft / step) : 0);
    };
    // A polc mindig az ELSŐ hirdetéssel induljon. A böngésző a belső görgetést
    // olykor visszaállítja (akár az utolsó kártyára) — és ez a visszaállítás a
    // React effekt UTÁN, több képkockával később fut le. Ezért a betöltés utáni
    // rövid ablakban többször is nullázunk, majd átadjuk a vezérlést a
    // felhasználónak (a görgetés-figyelő innentől szinkronban tartja az indexet).
    let ticks = 0;
    const iv = window.setInterval(() => {
      el.scrollLeft = 0;
      compute();
      if (++ticks >= 6) clearInterval(iv);
    }, 80);
    el.scrollLeft = 0;
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    return () => {
      clearInterval(iv);
      el.removeEventListener("scroll", compute);
    };
  }, []);

  if (listings.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth;
    const current = step > 0 ? Math.round(el.scrollLeft / step) : 0;
    const target = Math.max(0, Math.min(listings.length - 1, current + dir));
    // A tényleges cél-kártyát görgetjük a sáv elejére — pontosan a snap-start
    // pozícióra igazít (a bal oldali térköz miatt a puszta index×lépés elcsúszna).
    const targetCard = el.children[target] as HTMLElement | undefined;
    if (targetCard) {
      // Megjegyzés: az azonnali görgetés megbízható; a `behavior:"smooth"` ezen a
      // vízszintes, snap-elt sávon (Chromium) visszaugrik az induló kártyára.
      el.scrollTo({ left: targetCard.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft, behavior: "auto" });
      // A programozott görgetés nem mindig vált ki „scroll" eseményt, ezért a
      // pöttyöket/nyilakat közvetlenül is szinkronizáljuk a cél-indexszel.
      setIdx(target);
    }
  };

  const atStart = idx <= 0;
  const atEnd = idx >= listings.length - 1;

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
        <ArrowBtn dir={-1} disabled={atStart} onClick={() => scrollBy(-1)} />
        <ArrowBtn dir={1} disabled={atEnd} onClick={() => scrollBy(1)} />
        <div
          ref={scroller}
          style={{ scrollSnapType: "x proximity" }}
          className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2"
        >
          {listings.map((l) => (
            <div key={l.id} className="w-full shrink-0 snap-start sm:w-[20rem] lg:w-[22rem]">
              <ListingCard listing={l} />
            </div>
          ))}
          {/* trailing spacer so the last card clears the right edge in the scroll */}
          <div aria-hidden className="w-px shrink-0" />
        </div>

        {/* Telefonos lapozó-pöttyök — csak ha egynél több hirdetés van. */}
        {listings.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
            {listings.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-5 bg-ink-900" : "w-1.5 bg-ink-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Kör alakú előző/következő nyíl. Modul-szintű komponens (nem a Shelf-en belül
 *  definiált), így a gomb NEM mountol újra minden render-nél — a kattintás mindig
 *  a friss, DOM-ban lévő elemet éri. */
function ArrowBtn({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 1 ? "next" : "previous"}
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white/95 text-ink-800 shadow-float backdrop-blur transition hover:bg-white hover:text-brand-600 active:scale-90 disabled:pointer-events-none disabled:opacity-0 ${
        dir === 1 ? "right-1" : "left-1"
      }`}
    >
      <Icon name={dir === 1 ? "arrowRight" : "arrowLeft"} size={18} strokeWidth={2.2} />
    </button>
  );
}
