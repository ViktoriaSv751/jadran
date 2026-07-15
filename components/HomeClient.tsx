"use client";

import { useEffect, useState } from "react";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Hero from "./home/Hero";
import CategoryRow from "./home/CategoryRow";
import CityGrid from "./home/CityGrid";
import Shelf from "./home/Shelf";
import Icon from "./ui/Icon";
import { smoothScrollToId } from "@/lib/scroll";

/**
 * Főoldal. TELEFONON hagyományos, folyamatos görgetés.
 * SZÁMÍTÓGÉPEN a szekciók teljes-képernyős „diákként" viselkednek: lágy
 * scroll-snap + oldalsó pont-navigáció, amivel egy kattintással a következő
 * szekcióra lehet ugrani — profi, interaktív, de lefelé görgetve látszik, hogy
 * ez EGY oldal.
 *
 * Sorrend (mindkét méreten): Hero → Böngéssz típus → Átlagár városonként →
 * Kiemelt → Tengerre néző → Új építésű.
 */
export default function HomeClient() {
  const { lang } = useLang();
  const { items } = useListings();

  // SZÁMÍTÓGÉPES NÉZET: a főoldalon NINCS szabad görgetés — szekciót váltani csak
  // a pont-navigációval / „Tovább" gombbal lehet (programozott scroll, ez működik).
  // A wheel/touch görgetést letiltjuk; ha modál van nyitva (body lock), átengedjük,
  // hogy a modálon belül lehessen görgetni. Telefonon nincs korlátozás.
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const block = (e: Event) => {
      if (document.body.style.overflow === "hidden") return; // nyitott modál → engedjük
      e.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, []);

  const active = items.filter((l) => l.status === "active");
  const featured = active.filter((l) => l.mode === "sale" && l.verification === "full").slice(0, 8);
  const seaview = active.filter((l) => l.view === "sea").slice(0, 8);
  const newBuilds = active.filter((l) => l.type === "new").slice(0, 8);

  const sections = [
    { id: "home-hero", label: tr("hero_eyebrow", lang) },
    { id: "home-browse", label: tr("browse_by_type", lang) },
    { id: "home-avg", label: tr("avg_by_city", lang) },
    { id: "home-featured", label: tr("featured", lang) },
    { id: "home-sea", label: tr("shelf_sea_title", lang) },
    { id: "home-new", label: tr("shelf_new_title", lang) }
  ];

  // Asztali szekció-burok: teljes magasság + függőleges közepre igazítás — így
  // minden rész „különálló oldalként" tölti ki a képernyőt, de lefelé görgetve
  // látszik, hogy ez EGY oldal. A pont-navigáció ugrik köztük.
  const sec = "lg:flex lg:min-h-[calc(100vh-3.5rem)] lg:scroll-mt-14 lg:flex-col lg:justify-center";

  return (
    <div className="flex flex-col pb-4">
      <SectionNav sections={sections} />

      <div id="home-hero" className={`order-1 lg:order-1 ${sec}`}>
        <Hero />
        <NextButton to="home-browse" />
      </div>

      {/* TELEFONON a „Böngéssz típus" az oldal LEGALJÁRA kerül (order-last), az
          átlagár szekció alá — DESKTOPON viszont marad a 2. helyen (lg:order-2). */}
      <section id="home-browse" className={`order-last lg:order-2 mx-auto w-full max-w-7xl px-4 pt-6 lg:pt-10 ${sec}`}>
        <div className="w-full">
          <h2 className="display mb-5 text-center text-2xl text-ink-900 sm:text-3xl">{tr("browse_by_type", lang)}</h2>
          <CategoryRow />
        </div>
      </section>

      <section id="home-avg" className={`order-2 lg:order-3 mx-auto w-full max-w-7xl px-4 py-10 ${sec}`}>
        <div className="w-full">
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
        </div>
      </section>

      <div id="home-featured" className={`order-3 lg:order-4 ${sec}`}>
        <Shelf
          title={tr("featured", lang)}
          subtitle={tr("shelf_featured_sub", lang)}
          listings={featured}
          image="/cat/villa.png"
        />
      </div>

      <div id="home-sea" className={`order-4 lg:order-5 bg-white ${sec}`}>
        <Shelf
          title={tr("shelf_sea_title", lang)}
          subtitle={tr("shelf_sea_sub", lang)}
          listings={seaview}
          image="/cat/house.png"
        />
      </div>

      <div id="home-new" className={`order-5 lg:order-6 ${sec}`}>
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

/**
 * „Tovább a következő szekcióra" gomb — CSAK asztalon, a szekció tartalma ALATT,
 * bőséges térközzel és pontosan középre igazítva. Feliratos pill (Tovább +
 * lefelé nyíl), hogy egyértelmű legyen: ez visz a következő szekcióra.
 */
function NextButton({ to }: { to: string }) {
  const { lang } = useLang();
  return (
    <div className="mt-16 hidden w-full justify-center lg:flex">
      <button
        onClick={() => smoothScrollToId(to)}
        className="group inline-flex items-center gap-2 rounded-full border-2 border-ink-950 bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-ink-950 shadow-soft transition hover:bg-ink-950 hover:text-white active:scale-95"
      >
        {tr("next_step", lang)}
        <Icon
          name="chevronDown"
          size={20}
          strokeWidth={2.6}
          className="transition-transform duration-300 group-hover:translate-y-0.5"
        />
      </button>
    </div>
  );
}

/**
 * Oldalsó pont-navigáció (CSAK asztalon) — minden szekcióhoz egy pötty; az
 * aktív szekció ki van emelve, kattintásra pedig odaugrik.
 */
function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = els.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const go = (id: string) => smoothScrollToId(id);

  return (
    <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex">
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => go(s.id)}
          className="group flex items-center gap-2"
          aria-label={s.label}
        >
          <span
            className={`whitespace-nowrap rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100 ${
              i === active ? "" : ""
            }`}
          >
            {s.label}
          </span>
          <span
            className={`rounded-full transition-all ${
              i === active ? "h-2.5 w-2.5 bg-ink-900" : "h-2 w-2 bg-ink-300 group-hover:bg-ink-500"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
