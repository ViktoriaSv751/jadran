"use client";

import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Hero from "./home/Hero";
import CategoryRow from "./home/CategoryRow";
import CityGrid from "./home/CityGrid";
import Shelf from "./home/Shelf";
import Icon, { type IconName } from "./ui/Icon";

export default function HomeClient() {
  const { lang } = useLang();
  const { items } = useListings();

  const active = items.filter((l) => l.status === "active");

  const featured = active.filter((l) => l.mode === "sale" && l.verification === "full").slice(0, 8);
  const seaview = active.filter((l) => l.view === "sea").slice(0, 8);
  const newBuilds = active.filter((l) => l.type === "new").slice(0, 8);

  const trust: { icon: IconName; title: string }[] = [
    { icon: "shield", title: tr("trust_verified", lang) },
    { icon: "euro", title: tr("trust_prices", lang) },
    { icon: "mapPin", title: tr("trust_map", lang) }
  ];

  return (
    <div className="pb-4">
      <Hero />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-10">
        <h2 className="display mb-5 text-center text-2xl text-ink-900 sm:text-3xl">
          {tr("browse_by_type", lang)}
        </h2>
        <CategoryRow />
      </section>

      {/* Shelves */}
      <Shelf
        title={tr("featured", lang)}
        subtitle={tr("shelf_featured_sub", lang)}
        href="/search?mode=sale"
        cta={tr("view_all", lang)}
        listings={featured}
      />

      <div className="bg-white">
        <Shelf
          title={tr("shelf_sea_title", lang)}
          subtitle={tr("shelf_sea_sub", lang)}
          href="/search?view=sea"
          cta={tr("view_all", lang)}
          listings={seaview}
        />
      </div>

      <Shelf
        title={tr("shelf_new_title", lang)}
        subtitle={tr("shelf_new_sub", lang)}
        href="/search?type=new"
        cta={tr("view_all", lang)}
        listings={newBuilds}
      />

      {/* Average price by city */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex flex-col items-start gap-2 text-left">
          <h2 className="display text-2xl text-ink-900 sm:text-3xl">{tr("avg_by_city", lang)}</h2>
        </div>
        <CityGrid />
      </section>

      {/* Trust strip — bold dark editorial band (desktop only) */}
      <section className="hidden bg-ink-950 text-white lg:block">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3 sm:py-16">
          {trust.map((b, i) => (
            <div key={i} className="flex items-start justify-center gap-4 sm:justify-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white">
                <Icon name={b.icon} size={24} />
              </span>
              <span className="pt-1 text-base font-semibold text-white/90">{b.title}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
