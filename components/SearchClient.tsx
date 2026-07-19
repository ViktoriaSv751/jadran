"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Listing } from "@/lib/types";
import { useLang, useMoney, useListings, useAuth, useProfiles } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import { pricePerM2 } from "@/lib/format";
import { qualifiesGoldenVisa } from "@/lib/geo";
import { isFeatured } from "@/lib/mappers";
import type { MapBounds } from "./MapView";
import * as db from "@/lib/db";
import { extractSmart } from "@/lib/import/ai-extract-remote";
import { toast, openAuth } from "@/lib/ui";
import { FilterState, emptyFilters } from "./Filters";
import FilterChips from "./FilterChips";
import CategoryTabs from "./search/CategoryTabs";
import SearchModal from "./home/SearchModal";
import ListingCard from "./ListingCard";
import Pagination, { paginate, PAGE_SIZE } from "./ui/Pagination";
import Icon from "./ui/Icon";
import { CardSkeletonGrid } from "./Skeleton";
import EmptyState from "./EmptyState";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />
});

function applyFilters(items: Listing[], f: FilterState, roleOf?: Map<string, string>): Listing[] {
  const q = f.q.trim().toLowerCase();
  let out = items.filter((l) => {
    if (l.status !== "active") return false;
    if (f.mode && l.mode !== f.mode) return false;
    if (f.sellerType && roleOf && roleOf.get(l.ownerId) !== f.sellerType) return false;
    if (q) {
      const hay =
        `${l.city} ${l.district} ${l.title.hu} ${l.title.me} ${l.title.en} ${l.title.ru} ${l.agency}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.country && l.country !== f.country) return false;
    if (f.goldenVisa === "1" && !qualifiesGoldenVisa(l.country, l.price)) return false;
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
    case "ppm2": {
      // A 0-területű hirdetéseket (pl. telek) NEM dobjuk ki a találatokból —
      // csak a lista végére tesszük (Infinity), hogy a találatszám ne essen le.
      const ppm2 = (l: (typeof out)[number]) => (l.area > 0 ? pricePerM2(l.price, l.area) : Infinity);
      out = out.sort((a, b) => ppm2(a) - ppm2(b));
      break;
    }
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
  const money = useMoney();
  const { items } = useListings();
  const { profiles } = useProfiles();
  const { user } = useAuth();
  const params = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  // A szabadszavas kereső AZONNALI mezőértéke; a tényleges `filters.q`-t (ami az
  // O(n) applyFilters-t és a URL-írást hajtja) 250 ms-mal debounce-oljuk.
  const [qInput, setQInput] = useState("");
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Térkép 2.0: terület-keresés + mobil bottom-sheet előnézet
  const [areaSearch, setAreaSearch] = useState(false);
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Teljes képernyős mobil térképnél a háttér ne görögjön.
  useEffect(() => {
    const lock = isMobile && view === "map";
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, view]);

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

  // A gépelt szöveget 250 ms-mal késleltetve engedjük a `filters.q`-ba.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput }));
    }, 250);
    return () => clearTimeout(t);
  }, [qInput]);

  // Ha a `filters.q` KÍVÜLRŐL változik (URL-seed, AI-keresés, „mind törlése"),
  // a mező is kövesse.
  useEffect(() => {
    setQInput((prev) => (prev === filters.q ? prev : filters.q));
  }, [filters.q]);

  const roleOf = useMemo(() => new Map(profiles.map((p) => [p.id, p.role])), [profiles]);
  const results = useMemo(() => applyFilters(items, filters, roleOf), [items, filters, roleOf]);

  // Terület-keresés: a lista a térkép aktuális kivágatát tükrözi (Airbnb-minta).
  const visible = useMemo(() => {
    if (!areaSearch || !areaBounds) return results;
    return results.filter(
      (l) =>
        l.lat >= areaBounds.south &&
        l.lat <= areaBounds.north &&
        l.lng >= areaBounds.west &&
        l.lng <= areaBounds.east
    );
  }, [results, areaSearch, areaBounds]);

  // Lapozás: max 25 hirdetés / oldal a listanézetben. Szűrő-váltáskor 1. oldal.
  useEffect(() => setPage(0), [filters, areaSearch, areaBounds]);

  /* ---------------- SZERVEROLDALI szűrés + lapozás ----------------
   * A szűrést/rendezést/lapozást a Postgres végzi (indexelten), oldalanként
   * PAGE_SIZE sorral — a kliens nem tartja a teljes táblát. Ha nincs backend
   * vagy a lekérdezés hibázik (`serverSide:false`), automatikusan a korábbi
   * kliens-oldali szűrésre esünk vissza, így semmi nem törik el. */
  const [server, setServer] = useState<{ rows: Listing[]; total: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    let alive = true;
    const bounds = areaSearch && areaBounds ? areaBounds : null;
    void db.searchListings({ ...filters, bounds }, page, PAGE_SIZE).then((r) => {
      if (!alive) return;
      setServer(r.serverSide ? { rows: r.rows, total: r.total } : null);
    });
    return () => {
      alive = false;
    };
  }, [filters, page, areaSearch, areaBounds, loading]);

  // A lapozó-objektum ALAKJA azonos szerver- és kliens-módban, így a lenti
  // megjelenítés változatlan marad.
  const paged = server
    ? {
        slice: server.rows,
        pageCount: Math.max(1, Math.ceil(server.total / PAGE_SIZE)),
        page,
        total: server.total
      }
    : paginate(visible, page);
  /** Összes találat (szerver-számláló, ha van). */
  const totalCount = server ? server.total : visible.length;
  /** A térképre kerülő hirdetések (szerver-módban az aktuális oldal). */
  const mapListings = server ? server.rows : visible;

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

  // Mobil: a szűrő gomb a főoldali részletes keresőt nyitja (azonos dizájn).
  const [detailedOpen, setDetailedOpen] = useState(false);
  const applyQueryString = (qs: string) => {
    const params = new URLSearchParams(qs);
    const next: FilterState = { ...emptyFilters };
    (Object.keys(emptyFilters) as (keyof FilterState)[]).forEach((k) => {
      const v = params.get(k);
      if (v !== null) (next[k] as string) = v;
    });
    setFilters(next);
  };

  // Térkép/lista váltó. ASZTALON a térkép ki/be: split (lista + térkép) ↔ list
  // (csak lista, 3 oszlopos rács). TELEFONON teljes térkép ↔ lista.
  const mapVisible = view === "map" || (!isMobile && view === "split");
  const toggleMap = () => {
    if (isMobile) {
      setView(view === "map" ? "list" : "map");
      return;
    }
    setView(view === "split" ? "list" : "split");
  };

  // AI-keresés: szabad szöveg ("napfényes lakás Kotorban 300k alatt") → szűrők.
  const [aiBusy, setAiBusy] = useState(false);
  const runAiSearch = async () => {
    const text = filters.q.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    const { fields, detected } = await extractSmart(text);
    setAiBusy(false);
    if (!detected.length) {
      toast(tr("ai_search_none", lang));
      return;
    }
    const next: FilterState = { ...filters };
    if (fields.mode) next.mode = fields.mode;
    if (fields.type) next.type = fields.type;
    if (fields.view) next.view = fields.view;
    if (fields.condition) next.condition = fields.condition;
    if (fields.price) next.priceMax = String(fields.price);
    if (fields.rooms) next.roomsMin = String(fields.rooms);
    if (fields.area) next.areaMin = String(fields.area);
    if (fields.furnished) next.furnished = "1";
    if (fields.petsAllowed) next.petsOnly = "1";
    if (fields.amenities?.length) next.amenities = fields.amenities.join(",");
    if (fields.city && suggestions.includes(fields.city)) next.city = fields.city;
    // A szabad szöveget kiürítjük, hogy ne szűkítse tovább a strukturált találatokat.
    next.q = fields.city && !suggestions.includes(fields.city) ? fields.city : "";
    update(next);
    toast(tr("ai_search_done", lang).replace("{n}", String(detected.length)));
  };

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
        {/* 1. sor: mód-váltó balra, térkép/lista váltó jobbra-fölülre */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-soft">
            {([
              { v: "", label: tr("cat_all", lang) },
              { v: "sale", label: tr("buy", lang) },
              { v: "rent", label: tr("rent_tab", lang) }
            ] as const).map((m) => (
              <button
                key={m.v || "all"}
                onClick={() =>
                  // Mód-váltáskor a MÁSIK mód rejtett szűrőit is töröljük, hogy ne
                  // maradjanak láthatatlanul aktívak (pl. „csak verifikált" eladásról
                  // bérlésre váltva).
                  update({
                    ...filters,
                    mode: m.v,
                    // A kimenő mód REJTETT szűrőit is töröljük, hogy ne szűkítsék
                    // némán a találatokat (se sale-only, se rent-only ne ragadjon).
                    verifiedOnly: "", furnished: "", petsOnly: "", minTerm: "",
                    utilitiesIncluded: "", maxDeposit: "",
                    minYear: "", maxYear: "", plotMin: "", heatingType: "", maxCommonCost: ""
                  })
                }
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition sm:px-5 ${
                  filters.mode === m.v ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Részletes kereső — a mód-váltó mellett, felül. Mobilon ÉS asztalon
                ugyanazt a látványos teljes-képernyős modált nyitja. */}
            <button
              onClick={() => setDetailedOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-800 shadow-soft transition hover:border-ink-400"
            >
              <Icon name="sliders" size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">{tr("advanced_filters", lang)}</span>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {/* Mentett keresés — az eltávolított oldalsávból ide, csak asztalon. */}
            <button
              onClick={saveSearch}
              className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-800 shadow-soft transition hover:border-ink-400 lg:inline-flex"
            >
              <Icon name="bell" size={16} strokeWidth={2.2} />
              <span>{tr("saved_search", lang)}</span>
            </button>
            <button
              onClick={toggleMap}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold shadow-soft transition ${
                mapVisible
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-800 hover:border-ink-400"
              }`}
            >
              <Icon name={mapVisible ? "menu" : "globe"} size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">{mapVisible ? tr("list", lang) : tr("map", lang)}</span>
            </button>
          </div>
        </div>

        {/* 2. sor: kereső + rendezés + szűrő. A rendezés mobilon is látszik. */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              list="place-suggestions"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runAiSearch();
              }}
              placeholder={tr("search_placeholder", lang)}
              className="w-full rounded-full border border-ink-200 bg-white py-3.5 pl-11 pr-12 text-sm shadow-soft transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
            {/* AI-keresés: a beírt szabad szövegből szűrőket készít */}
            <button
              onClick={() => void runAiSearch()}
              disabled={!filters.q.trim() || aiBusy}
              aria-label={tr("ai_search_hint", lang)}
              title={tr("ai_search_hint", lang)}
              className={`absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition ${
                filters.q.trim()
                  ? "bg-ink-900 text-white hover:bg-ink-800"
                  : "text-ink-300"
              } ${aiBusy ? "animate-pulse" : ""}`}
            >
              <Icon name="sparkles" size={17} strokeWidth={2} />
            </button>
            <datalist id="place-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <select
            value={filters.sort}
            onChange={(e) => update({ ...filters, sort: e.target.value })}
            className="shrink-0 rounded-full border border-ink-200 bg-white px-3 py-3.5 text-sm shadow-soft focus:outline-none"
          >
            <option value="newest">{tr("sort_newest", lang)}</option>
            <option value="price_asc">{tr("sort_price_asc", lang)}</option>
            <option value="price_desc">{tr("sort_price_desc", lang)}</option>
            <option value="ppm2">{tr("sort_ppm2", lang)}</option>
          </select>
        </div>
      </div>

      {/* Kategória-fülek + gyorschipek — csak asztali nézetben */}
      <div className="mt-3 hidden border-b border-ink-100 pb-1 lg:block">
        <CategoryTabs value={filters.type} onChange={(type) => update({ ...filters, type })} />
      </div>
      <div className="mt-3 hidden lg:block">
        <FilterChips value={filters} onChange={update} />
      </div>

      <div className="mt-4">
        {/* Találatok + térkép — teljes szélességben (a részletes szűrő a felső
            „Részletes" gombbal nyíló, telefonnal azonos, látványos modál). */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm text-ink-500">
            {/* Bal: törlés (ha van szűrő) — jobbra a találatszám */}
            <span className="min-w-0">
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ ...emptyFilters })}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {tr("clear_all", lang)}
                </button>
              )}
            </span>
            <span className="shrink-0 text-right">
              {areaSearch && areaBounds && (
                <button
                  onClick={() => {
                    setAreaSearch(false);
                    setAreaBounds(null);
                  }}
                  className="mr-2 inline-flex items-center gap-1 rounded-full bg-ink-900 px-2.5 py-0.5 text-[11px] font-semibold text-white"
                >
                  {tr("map_area_chip", lang)} <Icon name="close" size={11} strokeWidth={2.6} />
                </button>
              )}
              <span className="font-bold text-ink-900">{totalCount}</span> {tr("results", lang)}
            </span>
          </div>

          {loading ? (
            <CardSkeletonGrid count={6} />
          ) : totalCount === 0 ? (
            // Ha a terület-keresés (rajzolt terület) szűrt ki mindent, más üzenet,
            // mint amikor a szűrőkre egyáltalán nincs találat.
            areaBounds && results.length > 0 ? (
              <EmptyState title={tr("no_results_area", lang)} hint={tr("no_results_area_hint", lang)} />
            ) : (
              <EmptyState title={tr("no_results", lang)} hint={tr("no_results_hint", lang)} />
            )
          ) : view === "map" ? (
            <div className="h-[calc(100vh-13rem)] overflow-hidden rounded-2xl border border-ink-100 shadow-card sm:h-[calc(100vh-9rem)]">
              <MapView
                listings={mapListings}
                lang={lang}
                fitKey={`${filters.country}|${filters.city}`}
                activeId={activeId}
                onActivate={setActiveId}
                onSelect={isMobile ? setSelected : undefined}
                areaSearchable
                areaSearch={areaSearch}
                onToggleAreaSearch={() =>
                  setAreaSearch((s) => {
                    if (s) setAreaBounds(null);
                    return !s;
                  })
                }
                onBoundsChange={setAreaBounds}
              />
            </div>
          ) : view === "list" ? (
            <>
              {/* Csak lista (térkép nélkül) — asztalon 3 hirdetés egy sorban. */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paged.slice.map((l) => (
                  <div key={l.id} className="animate-fade-in">
                    <ListingCard listing={l} active={l.id === activeId} onActivate={setActiveId} />
                  </div>
                ))}
              </div>
              <Pagination
                page={paged.page}
                pageCount={paged.pageCount}
                total={paged.total}
                onPage={setPage}
                lang={lang}
              />
            </>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
              <div>
                <div className="results-scroll grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-h-[calc(100vh-7rem)] lg:grid-cols-1 lg:overflow-y-auto lg:pr-2 xl:grid-cols-2">
                  {paged.slice.map((l) => (
                    <div key={l.id} className="animate-fade-in">
                      <ListingCard listing={l} active={l.id === activeId} onActivate={setActiveId} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={paged.page}
                  pageCount={paged.pageCount}
                  total={paged.total}
                  onPage={setPage}
                  lang={lang}
                />
              </div>
              <div className="sticky top-24 hidden h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-ink-100 shadow-card lg:block">
                {/* Térkép bezárása (X) → csak a hirdetéslista marad, 3 oszlopban. */}
                <button
                  onClick={() => setView("list")}
                  aria-label={tr("close", lang)}
                  title={tr("close", lang)}
                  className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-float backdrop-blur transition hover:bg-white hover:text-brand-600"
                >
                  <Icon name="close" size={14} strokeWidth={2.6} /> {tr("map", lang)}
                </button>
                <MapView
                  listings={mapListings}
                  lang={lang}
                  fitKey={`${filters.country}|${filters.city}`}
                  activeId={activeId}
                  onActivate={setActiveId}
                  areaSearchable
                  areaSearch={areaSearch}
                  onToggleAreaSearch={() =>
                    setAreaSearch((s) => {
                      if (s) setAreaBounds(null);
                      return !s;
                    })
                  }
                  onBoundsChange={setAreaBounds}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobil bottom-sheet előnézet — pin-koppintásra (Térkép 2.0) */}
      {selected && view === "map" && (
        <div className="fixed inset-x-3 bottom-24 z-40 animate-sheet-up md:hidden">
          <div className="relative rounded-2xl border border-ink-100 bg-white p-2.5 shadow-pop">
            <button
              onClick={() => setSelected(null)}
              aria-label={tr("close", lang)}
              className="absolute -right-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-ink-100 bg-white text-ink-600 shadow-float"
            >
              <Icon name="close" size={14} strokeWidth={2.4} />
            </button>
            <Link href={`/listing/${selected.id}`} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.images[0]}
                alt={loc(selected.title, lang)}
                className="h-20 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1 py-0.5">
                <div className="font-extrabold text-ink-900">
                  {money(selected.price)}
                  {selected.mode === "rent" && (
                    <span className="text-xs font-semibold text-ink-400">{tr("per_month", lang)}</span>
                  )}
                </div>
                <div className="truncate text-sm font-medium text-ink-700">{loc(selected.title, lang)}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                  <Icon name="mapPin" size={12} /> {selected.city} · {selected.district}
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Mobil szűrő = a főoldali részletes kereső (azonos dizájn) */}
      <SearchModal
        open={detailedOpen}
        onClose={() => setDetailedOpen(false)}
        initialMode={filters.mode as "" | "sale" | "rent"}
        onApply={applyQueryString}
      />
    </div>
  );
}
