"use client";

import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Hero from "./home/Hero";
import CategoryRow from "./home/CategoryRow";
import CityGrid from "./home/CityGrid";
import Shelf from "./home/Shelf";

export default function HomeClient() {
  const { lang } = useLang();
  const { items } = useListings();

  const active = items.filter((l) => l.status === "active");

  const featured = active.filter((l) => l.mode === "sale" && l.verification === "full").slice(0, 8);
  const seaview = active.filter((l) => l.view === "sea").slice(0, 8);
  const newBuilds = active.filter((l) => l.type === "new").slice(0, 8);

  return (
    <div className="flex flex-col pb-4">
      <div className="order-1">
        <Hero />
      </div>

      {/* Categories — minden méreten az „Új építésű" polc alá kerül (order-5) */}
      <section className="order-5 mx-auto w-full max-w-7xl px-4 pt-6 lg:pt-10">
        <h2 className="display mb-5 text-center text-2xl text-ink-900 sm:text-3xl">
          {tr("browse_by_type", lang)}
        </h2>
        <CategoryRow />
      </section>

      {/* Shelves */}
      <div className="order-2 lg:order-3">
        <Shelf
          title={tr("featured", lang)}
          subtitle={tr("shelf_featured_sub", lang)}
          href="/search?mode=sale"
          cta={tr("view_all", lang)}
          listings={featured}
        />
      </div>

      <div className="order-3 bg-white lg:order-4">
        <Shelf
          title={tr("shelf_sea_title", lang)}
          subtitle={tr("shelf_sea_sub", lang)}
          href="/search?view=sea"
          cta={tr("view_all", lang)}
          listings={seaview}
        />
      </div>

      <div className="order-4 lg:order-5">
        <Shelf
          title={tr("shelf_new_title", lang)}
          subtitle={tr("shelf_new_sub", lang)}
          href="/search?type=new"
          cta={tr("view_all", lang)}
          listings={newBuilds}
        />
      </div>

      {/* Average price by city */}
      <section className="order-6 mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mx-auto mb-6 max-w-xl text-center">
          <h2 className="display text-2xl text-ink-900 sm:text-3xl">{tr("avg_by_city", lang)}</h2>
          <p className="mt-2 text-sm text-ink-500">{tr("avg_by_city_sub", lang)}</p>
        </div>
        <CityGrid />
      </section>

    </div>
  );
}
