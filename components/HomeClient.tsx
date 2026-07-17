"use client";

import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/geo";
import Hero from "./home/Hero";
import CategoryRow from "./home/CategoryRow";
import CountryGrid from "./home/CountryGrid";
import Shelf from "./home/Shelf";

/**
 * Főoldal — GLOBÁLIS piac, folyamatosan görgethető. Sorrend:
 * Hero → Böngéssz típus → Célpontok (országrács) → Kiemelt (globális) →
 * országonkénti polcok (minden országhoz egy, ahol van hirdetés).
 * Telefonon a „Böngéssz típus" az oldal aljára kerül (order-last).
 */
export default function HomeClient() {
  const { lang } = useLang();
  const { items } = useListings();

  const active = items.filter((l) => l.status === "active");
  const featured = active
    .filter((l) => l.mode === "sale" && l.verification === "full")
    .slice(0, 8);

  return (
    <div className="flex flex-col pb-6">
      <div className="order-1">
        <Hero />
      </div>

      {/* TELEFONON a „Böngéssz típus" az oldal LEGALJÁRA kerül (order-last),
          DESKTOPON marad a 2. helyen (lg:order-2). */}
      <section className="order-last mx-auto w-full max-w-7xl px-4 pt-8 lg:order-2 lg:pt-12">
        <h2 className="display mb-5 text-center text-2xl text-ink-900 sm:text-3xl">{tr("browse_by_type", lang)}</h2>
        <CategoryRow />
      </section>

      {/* Célpontok — a hat ország kártyaként (Airbnb-stílus). */}
      <section className="order-2 mx-auto w-full max-w-7xl px-4 py-12 lg:order-3">
        <div className="mx-auto mb-6 max-w-xl text-center">
          <h2 className="display text-2xl text-ink-900 sm:text-3xl">{tr("destinations_title", lang)}</h2>
          <p className="mt-2 text-sm text-ink-500">{tr("destinations_sub", lang)}</p>
        </div>
        <CountryGrid />
      </section>

      {/* Kiemelt — globális, minden országból. */}
      <div className="order-3 lg:order-4">
        <Shelf
          title={tr("featured", lang)}
          subtitle={tr("shelf_featured_sub", lang)}
          listings={featured}
          image="/cat/villa.png"
        />
      </div>

      {/* Országonkénti polcok — dinamikusan, csak ahol van aktív hirdetés. */}
      <div className="order-4 flex flex-col lg:order-5">
        {COUNTRIES.map((c) => {
          const listings = active.filter((l) => l.country === c.code).slice(0, 12);
          if (listings.length === 0) return null;
          return (
            <Shelf
              key={c.code}
              title={`${c.flag} ${tr(c.nameKey, lang)}`}
              subtitle={`${active.filter((l) => l.country === c.code).length} ${tr("listings_in", lang)}`}
              href={`/search?country=${c.code}`}
              cta={tr("view_all", lang)}
              listings={listings}
            />
          );
        })}
      </div>
    </div>
  );
}
