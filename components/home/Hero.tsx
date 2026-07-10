"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { cities } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import SearchModal from "./SearchModal";

export default function Hero() {
  const { lang } = useLang();
  const { items } = useListings();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"sale" | "rent">("sale");

  const active = items.filter((l) => l.status === "active");
  const count = active.length;
  const cityCount = new Set(active.map((l) => l.city)).size;
  const saleWithArea = active.filter((l) => l.mode === "sale" && l.area > 0);
  const avgPerM2 =
    saleWithArea.length > 0
      ? Math.round(saleWithArea.reduce((s, l) => s + l.price / l.area, 0) / saleWithArea.length)
      : 0;

  const stats: { value: string; label: string }[] = [
    { value: String(count), label: tr("stat_listings", lang) },
    { value: String(cityCount), label: tr("stat_cities", lang) },
    { value: avgPerM2 > 0 ? `${formatNumber(avgPerM2, lang)} €` : "—", label: tr("stat_avg_m2", lang) }
  ];

  return (
    <section className="relative isolate overflow-hidden bg-white text-ink-900 lg:bg-ink-950 lg:text-white">
      {/* Full-bleed photo — desktop only; on phones the hero is clean white */}
      <div className="absolute inset-0 -z-10 hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/p/view4.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 to-transparent" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-10 text-center lg:min-h-[80vh] lg:items-start lg:py-20 lg:text-left">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink-200 bg-ink-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-600 lg:border-white/20 lg:bg-white/10 lg:text-white/90 lg:backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {tr("hero_eyebrow", lang)}
        </div>

        <h1 className="display mt-5 max-w-3xl text-[2.75rem] font-black leading-[1.02] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl lg:text-white">
          {tr("hero_headline", lang)}
        </h1>
        <p className="mt-4 max-w-xl text-base text-ink-500 sm:text-lg lg:text-white/70">{tr("hero_sub", lang)}</p>

        {/* Search bar */}
        <div className="mt-7 flex w-full max-w-2xl flex-col items-center lg:items-start">
          {/* Mode toggle */}
          <div className="inline-flex rounded-full bg-ink-100 p-1 lg:bg-white/10 lg:backdrop-blur">
            {(["sale", "rent"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "bg-ink-900 text-white shadow-soft lg:bg-white lg:text-ink-900"
                    : "text-ink-500 hover:text-ink-900 lg:text-white/80 lg:hover:text-white"
                }`}
              >
                {m === "sale" ? tr("buy", lang) : tr("rent_tab", lang)}
              </button>
            ))}
          </div>

          {/* The bar */}
          <button
            onClick={() => setOpen(true)}
            className="group mt-3 flex w-full items-center gap-3 rounded-2xl bg-white p-2 pl-5 text-left shadow-pop transition hover:shadow-glow"
          >
            <Icon name="search" size={22} className="shrink-0 text-ink-400" />
            <span className="min-w-0 flex-1 py-1.5">
              <span className="block text-[15px] font-bold text-ink-900">{tr("where_q", lang)}</span>
              <span className="block truncate text-xs font-medium text-ink-400">
                {tr("anywhere", lang)} · {mode === "sale" ? tr("buy", lang) : tr("rent_tab", lang)}
              </span>
            </span>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-glow transition group-hover:bg-brand-600">
              <Icon name="search" size={22} strokeWidth={2.2} />
            </span>
          </button>
        </div>

        {/* City quick chips — strictly uniform */}
        <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => router.push(`/search?city=${encodeURIComponent(c)}&mode=${mode}`)}
              className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white lg:border-white/25 lg:text-white/85 lg:backdrop-blur lg:hover:border-white lg:hover:bg-white lg:hover:text-ink-900"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Live stats band — fills the hero with trust signals + "wow" */}
        <div className="mt-9 grid w-full max-w-2xl grid-cols-3 gap-2.5 sm:gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-100 bg-white/90 px-3 py-4 text-center shadow-soft lg:border-white/15 lg:bg-white/10 lg:backdrop-blur lg:shadow-none"
            >
              <div className="text-2xl font-black tracking-tight text-ink-900 sm:text-3xl lg:text-white">
                {s.value}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500 sm:text-xs lg:text-white/70">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-500 lg:justify-start lg:text-white/65">
          <Icon name="shield" size={18} className="text-brand-500 lg:text-brand-400" />
          <span>{tr("trust_verified", lang)}</span>
        </div>
      </div>

      <SearchModal open={open} onClose={() => setOpen(false)} initialMode={mode} />
    </section>
  );
}
