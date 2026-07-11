"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { Listing } from "@/lib/types";
import { useLang, useListings, useAuth } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { pricePerM2 } from "@/lib/format";
import { isFeatured } from "@/lib/mappers";
import * as db from "@/lib/db";
import { toast, openAuth } from "@/lib/ui";
import Filters, { FilterState, emptyFilters } from "./Filters";
import FilterChips from "./FilterChips";
import CategoryTabs from "./search/CategoryTabs";
import ListingCard from "./ListingCard";
import Icon from "./ui/Icon";
import { CardSkeletonGrid } from "./Skeleton";
import EmptyState from "./EmptyState";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />
});

function applyFilters(items: Listing[], f: FilterState): Listing[] {
  const q = f.q.trim().toLowerCase();
  let out = items.filter((l) => {
    if (l.status !== "active") return false;
    if (f.mode && l.mode !== f.mode) return false;
    if (q) {
      const hay =
        `${l.city} ${l.district} ${l.title.hu} ${l.title.me} ${l.title.en} ${l.title.ru} ${l.agency}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.city && l.city !== f.city) return false;
    if (f.type && l.type !== f.type) return false;
    if (f.view && l.view !== f.view) return false;
    if (f.condition && l.condition !== f.condition) return false;
    if (f.priceMin && l.price < Number(f.priceMin)) return false;
    if (f.priceMax && l.price > Number(f.priceMax)) return false;
    if (f.roomsMin && l.rooms < Number(f.roomsMin)) return false;
    if (f.roomsMax && l.rooms > Number(f.roomsMax)) return false;
    if (f.areaMin && l.area < Number(f.areaMin)) return false;
    if (f.areaMax && l.area > Number(f.areaMax)) return false;
    if (f.floorMin && (l.floor == null || l.floor < Number(f.floorMin))) return false;
    if (f.floorMax && (l.floor == null || l.floor > Number(f.floorMax))) return false;
    if (f.maxSeaDist && l.distanceToSea > Number(f.maxSeaDist)) return false;
    if (f.energyClass && l.energy !== f.energyClass) return false;
    if (f.verifiedOnly === "1" && l.verification === "none") return false;
    if (f.verifLevel) {
      const rank: Record<string, number> = { none: 0, basic: 1, deed: 2, full: 3 };
      if ((rank[l.verification] ?? 0) < (rank[f.verifLevel] ?? 0)) return false;
    }
    if (f.furnished === "1" && !l.furnished) return false;
    if (f.amenities) {
      const need = f.amenities.split(",").filter(Boolean);
      if (!need.every((a) => l.amenities.includes(a as (typeof l.amenities)[number]))) return false;
    }
    // sale-only refinements
    if (f.minYear && l.year > 0 && l.year < Number(f.minYear)) return false;
    if (f.maxYear && l.year > 0 && l.year > Number(f.maxYear)) return false;
    if (f.plotMin && (l.plotArea == null || l.plotArea < Number(f.plotMin))) return false;
    if (f.heatingType && l.heatingType !== f.heatingType) return false;
    if (f.maxCommonCost && l.monthlyCommonCost != null && l.monthlyCommonCost > Number(f.maxCommonCost)) return false;
    // rent-only refinements
    if (f.petsOnly === "1" && !l.petsAllowed) return false;
    if (f.utilitiesIncluded === "1" && !l.utilitiesIncluded) return false;
    if (f.minTerm && l.minTermMonths != null && l.minTermMonths > Number(f.minTerm)) return false;
    if (f.maxDeposit && l.deposit != null && l.deposit > Number(f.maxDeposit)) return false;
    return true;
  });

  switch (f.sort) {
    case "price_asc":
      out = out.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      out = out.sort((a, b) => b.price - a.price);
      break;
    case "ppm2":
      out = out
        .filter((l) => l.area > 0)
        .sort((a, b) => pricePerM2(a.price, a.area) - pricePerM2(b.price, b.area));
      break;
    default:
      out = out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  // Kiemelt hirdetések mindig elöl (a kiválasztott rendezésen belül, stabilan).
  out = out.sort((a, b) => (isFeatured(b) ? 1 : 0) - (isFeatured(a) ? 1 : 0));
  return out;
}

function filtersToQuery(f: FilterState): string {
  const p = new URLSearchParams();
  (Object.keys(f) as (keyof FilterState)[]).forEach((k) => {
    const v = f[k];
    if (v && !(k === "sort" && v === "newest")) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default function SearchClient() {
  const { lang } = useLang();
  const { items } = useListings();
  const { user } = useAuth();
  const params = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seeded: FilterState = { ...emptyFilters };
    (Object.keys(emptyFilters) as (keyof FilterState)[]).forEach((k) => {
      const v = params.get(k);
      if (v !== null) (seeded[k] as string) = v;
    });
    setFilters(seeded);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    const qs = filtersToQuery(filters);
    window.history.replaceState(null, "", `/search${qs}`);
  }, [filters, loading]);

  // Lock background scroll while the mobile filter sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobileFilters ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilters]);

  const results = useMemo(() => applyFilters(items, filters), [items, filters]);

  const suggestions = useMemo(
    () => Array.from(new Set(items.flatMap((l) => [l.city, l.district]))).sort(),
    [items]
  );

  const hasActiveFilters = (Object.keys(emptyFilters) as (keyof FilterState)[]).some(
    (k) => k !== "sort" && filters[k]
  );

  const activeFilterCount = (Object.keys(emptyFilters) as (keyof FilterState)[]).filter(
    (k) => !["sort", "mode", "q", "type"].includes(k) && filters[k]
  ).length;

  const update = (next: FilterState) => setFilters(next);

  const saveSearch = () => {
    if (!user) {
      openAuth("login");
      return;
    }
    const label =
      [filters.city, filters.q].filter(Boolean).join(" · ") ||
      (filters.mode === "rent" ? tr("rent_tab", lang) : tr("mode_sale", lang));
    db.addSavedSearch(user.id, label, filtersToQuery(filters));
    toast(tr("saved_search_done", lang));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      {/* Mode toggle + search bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-soft">
            {([
              { v: "", label: tr("cat_all", lang) },
              { v: "sale", label: tr("buy", lang) },
              { v: "rent", label: tr("rent_tab", lang) }
            ] as const).map((m) => (
              <button
                key={m.v || "all"}
                onClick={() => update({ ...filters, mode: m.v })}
                className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
                  filters.mode === m.v ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              list="place-suggestions"
              value={filters.q}
              onChange={(e) => update({ ...filters, q: e.target.value })}
              placeholder={tr("search_placeholder", lang)}
              className="w-full rounded-2xl border border-ink-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-soft transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            <datalist id="place-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <select
            value={filters.sort}
            onChange={(e) => update({ ...filters, sort: e.target.value })}
            className="rounded-2xl border border-ink-200 bg-white px-3 py-3.5 text-sm shadow-soft focus:outline-none"
          >
            <option value="newest">{tr("sort_newest", lang)}</option>
            <option value="price_asc">{tr("sort_price_asc", lang)}</option>
            <option value="price_desc">{tr("sort_price_desc", lang)}</option>
            <option value="ppm2">{tr("sort_ppm2", lang)}</option>
          </select>

          <button
            onClick={() => setMobileFilters(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-sm font-medium shadow-soft lg:hidden"
          >
            <Icon name="sliders" size={18} /> {tr("filters", lang)}
            {activeFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="hidden items-center rounded-2xl border border-ink-200 bg-white p-1 shadow-soft md:flex">
            {(["split", "list", "map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  view === v ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {v === "list" ? tr("list", lang) : v === "map" ? tr("map", lang) : tr("split", lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-3 border-b border-ink-100 pb-1">
        <CategoryTabs value={filters.type} onChange={(type) => update({ ...filters, type })} />
      </div>

      {/* Quick chips */}
      <div className="mt-3">
        <FilterChips value={filters} onChange={update} />
      </div>

      <div className="mt-4 flex gap-5">
        {/* Desktop filters sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-sm font-bold text-ink-900">{tr("filters", lang)}</h2>
            <Filters value={filters} onChange={update} onReset={() => setFilters({ ...emptyFilters })} />
            <button
              onClick={saveSearch}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-ink-800"
            >
              <Icon name="bell" size={16} /> {tr("saved_search", lang)}
            </button>
          </div>
        </aside>

        {/* Results + map */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between text-sm text-ink-500">
            <span>
              <span className="font-bold text-ink-900">{results.length}</span> {tr("results", lang)}
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({ ...emptyFilters })}
                className="font-medium text-brand-600 hover:underline"
              >
                {tr("clear_all", lang)}
              </button>
            )}
          </div>

          {loading ? (
            <CardSkeletonGrid count={6} />
          ) : results.length === 0 ? (
            <EmptyState title={tr("no_results", lang)} hint={tr("no_results_hint", lang)} />
          ) : view === "map" ? (
            <div className="h-[calc(100vh-11rem)] overflow-hidden rounded-3xl border border-ink-100 shadow-card md:h-[calc(100vh-7rem)]">
              <MapView listings={results} lang={lang} activeId={activeId} onActivate={setActiveId} />
            </div>
          ) : view === "list" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <div key={l.id} className="animate-fade-in">
                  <ListingCard listing={l} active={l.id === activeId} onActivate={setActiveId} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <div className="results-scroll grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-h-[calc(100vh-7rem)] lg:grid-cols-1 lg:overflow-y-auto lg:pr-2 xl:grid-cols-2">
                {results.map((l) => (
                  <div key={l.id} className="animate-fade-in">
                    <ListingCard listing={l} active={l.id === activeId} onActivate={setActiveId} />
                  </div>
                ))}
              </div>
              <div className="sticky top-24 hidden h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-ink-100 shadow-card lg:block">
                <MapView listings={results} lang={lang} activeId={activeId} onActivate={setActiveId} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobil lebegő térkép/lista váltó (Airbnb-minta) — asztali nézeten a
          fenti szegmenskapcsoló él, mobilon ez az egyetlen út a térképhez. */}
      {!loading && results.length > 0 && (
        <button
          onClick={() => setView(view === "map" ? "list" : "map")}
          className="fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-pop transition active:scale-95 md:hidden"
        >
          <Icon name={view === "map" ? "menu" : "globe"} size={16} strokeWidth={2.2} />
          {view === "map" ? tr("list", lang) : tr("map", lang)}
        </button>
      )}

      {/* Mobile filter bottom sheet */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setMobileFilters(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-pop">
            <div className="relative flex items-center justify-center border-b border-ink-100 px-5 py-4">
              <button
                onClick={() => setMobileFilters(false)}
                aria-label="close"
                className="absolute left-4 grid h-8 w-8 place-items-center rounded-full text-ink-600 hover:bg-ink-50"
              >
                <Icon name="close" size={18} strokeWidth={2.2} />
              </button>
              <h2 className="text-sm font-bold text-ink-900">{tr("filters", lang)}</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <Filters value={filters} onChange={update} onReset={() => setFilters({ ...emptyFilters })} />
            </div>

            <div className="flex items-center gap-3 border-t border-ink-100 px-5 py-3 pb-safe">
              <button
                onClick={() => setFilters({ ...emptyFilters })}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink-700 underline-offset-2 hover:underline"
              >
                {tr("clear_all", lang)}
              </button>
              <button
                onClick={() => setMobileFilters(false)}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
              >
                {results.length} {tr("results", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
