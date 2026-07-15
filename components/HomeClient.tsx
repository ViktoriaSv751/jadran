"use client";

import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Hero from "./home/Hero";
import CategoryRow from "./home/CategoryRow";
import CityGrid from "./home/CityGrid";
import Shelf from "./home/Shelf";

/**
 * Főoldal — letisztult, FOLYAMATOSAN GÖRGETHETŐ oldal minden méreten (nincs
 * „diavetítés"/scroll-lock). Sorrend: Hero → Böngéssz típus → Átlagár városonként
 * → Kiemelt → Tengerre néző → Új építésű. Telefonon a „Böngéssz típus" az oldal
 * aljára kerül (order-last), a többi natúr sorrendben.
 */
export default function HomeClient() {
  const { lang } = useLang();
  const { items } = useListings();

  const active = items.filter((l) => l.status === "active");
  const featured = active.filter((l) => l.mode === "sale" && l.verification === "full").slice(0, 8);
  const seaview = active.filter((l) => l.view === "sea").slice(0, 8);
  const newBuilds = active.filter((l) => l.type === "new").slice(0, 8);

  return (
    <div className="flex flex-col pb-6">
      <div className="order-1">
        <Hero />
      </div>

      {/* TELEFONON a „Böngéssz típus" az oldal LEGALJÁRA kerül (order-last), az
          átlagár szekció alá — DESKTOPON marad a 2. helyen (lg:order-2). */}
      <section className="order-last mx-auto w-full max-w-7xl px-4 pt-8 lg:order-2 lg:pt-12">
        <h2 className="display mb-5 text-center text-2xl text-ink-900 sm:text-3xl">{tr("browse_by_type", lang)}</h2>
        <CategoryRow />
      </section>

      <section className="order-2 mx-auto w-full max-w-7xl px-4 py-12 lg:order-3">
        <div className="mx-auto mb-6 max-w-xl text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cat/apartment.png"
            alt=""
            aria-hidden
            className="mx-auto mb-1 h-24 w-24 object-contain drop-shadow-[0_12px_24px_rgba(16,26,38,0.18)] sm:h-28 sm:w-28"
          />
          <h2 className="display text-2xl text-ink-900 sm:text-3xl">{tr("avg_by_city", lang)}</h2>
          <p className="mt-2 text-sm text-ink-500">{tr("avg_by_city_sub", lang)}</p>
        </div>
        <CityGrid />
      </section>

      <div className="order-3 lg:order-4">
        <Shelf
          title={tr("featured", lang)}
          subtitle={tr("shelf_featured_sub", lang)}
          listings={featured}
          image="/cat/villa.png"
        />
      </div>

      <div className="order-4 bg-white lg:order-5">
        <Shelf
          title={tr("shelf_sea_title", lang)}
          subtitle={tr("shelf_sea_sub", lang)}
          listings={seaview}
          image="/cat/house.png"
        />
      </div>

      <div className="order-5 lg:order-6">
        <Shelf
          title={tr("shelf_new_title", lang)}
          subtitle={tr("shelf_new_sub", lang)}
          listings={newBuilds}
          image="/cat/new.png"
        />
      </div>
    </div>
  );
}
