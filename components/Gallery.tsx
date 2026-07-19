"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Photo from "./Photo";
import Icon from "./ui/Icon";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (d: number) => setActive((i) => (i + d + images.length) % images.length),
    [images.length]
  );

  // Sync active index from the mobile scroll position.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === i ? prev : i));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, move]);

  return (
    <div>
      {/* ---------- Mobile: full-bleed swipeable carousel ---------- */}
      <div className="relative -mx-4 sm:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x-mandatory overflow-x-auto"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActive(i);
                setOpen(true);
              }}
              className="w-full shrink-0 snap-center"
              style={{ flex: "0 0 100%" }}
            >
              <Photo src={img} alt={`${alt} ${i + 1}`} eager={i === 0} className="aspect-[4/3] w-full" />
            </button>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">
              {active + 1} / {images.length}
            </div>
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.slice(0, 8).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === Math.min(active, 7) ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---------- Desktop: Airbnb 1 + 4 grid ---------- */}
      <div className="hidden sm:block">
        {images.length >= 5 ? (
          <div className="grid h-[440px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
            <button
              onClick={() => {
                setActive(0);
                setOpen(true);
              }}
              className="col-span-2 row-span-2 overflow-hidden"
            >
              <Photo src={images[0]} alt={alt} eager className="h-full w-full transition hover:brightness-95" />
            </button>
            {images.slice(1, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setActive(i + 1);
                  setOpen(true);
                }}
                className="relative overflow-hidden"
              >
                <Photo src={img} alt={`${alt} ${i + 2}`} className="h-full w-full transition hover:brightness-95" />
                {i === 3 && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-soft">
                    {images.length} foto
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => {
              setActive(0);
              setOpen(true);
            }}
            className="block w-full overflow-hidden rounded-2xl"
          >
            <Photo src={images[active]} alt={alt} eager className="h-[440px] w-full" />
          </button>
        )}
      </div>

      {/* ---------- Lightbox ---------- */}
      {open && (
        <div
          className="fixed inset-0 z-[110] flex animate-fade-in flex-col bg-black"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white/80">
            <span className="text-sm">
              {active + 1} / {images.length}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="close"
            >
              <Icon name="close" size={18} strokeWidth={2.2} />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                onClick={() => move(-1)}
                aria-label="prev"
                className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Icon name="chevronLeft" size={24} strokeWidth={2.2} />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active]}
              alt={alt}
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-pop"
            />
            {images.length > 1 && (
              <button
                onClick={() => move(1)}
                aria-label="next"
                className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <Icon name="chevronRight" size={24} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
