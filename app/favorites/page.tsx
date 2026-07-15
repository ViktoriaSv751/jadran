"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLang, useFavorites, useListings, useProfiles } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import { pricePerM2 } from "@/lib/format";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import RequireAuth from "@/components/auth/RequireAuth";
import PageHeading from "@/components/ui/PageHeading";
import Pagination, { paginate } from "@/components/ui/Pagination";
import SearchModal from "@/components/home/SearchModal";
import Icon from "@/components/ui/Icon";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full rounded-3xl" />
});

export default function FavoritesPage() {
  return (
    <RequireAuth message="login_to_save">
      <FavoritesInner />
    </RequireAuth>
  );
}

function FavoritesInner() {
  const { lang } = useLang();
  const favorites = useFavorites();
  const { items: all } = useListings();
  const { profiles } = useProfiles();
  const roleOf = useMemo(() => new Map(profiles.map((p) => [p.id, p.role])), [profiles]);

  const [mode, setMode] = useState<"" | "sale" | "rent">("");
  const [sellerType, setSellerType] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"list" | "map">("list");
  const [detailedOpen, setDetailedOpen] = useState(false);

  const saved = useMemo(() => all.filter((l) => favorites.has(l.id)), [all, favorites]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const out = saved.filter((l) => {
      if (mode && l.mode !== mode) return false;
      if (sellerType && roleOf.get(l.ownerId) !== sellerType) return false;
      if (type && l.type !== type) return false;
      if (query) {
        const hay = `${l.city} ${l.district} ${loc(l.title, lang)} ${l.agency}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    const by: Record<string, (a: Listing, b: Listing) => number> = {
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      ppm2: (a, b) => pricePerM2(a.price, a.area) - pricePerM2(b.price, b.area)
    };
    return [...out].sort(by[sort] ?? by.newest);
  }, [saved, mode, sellerType, roleOf, type, q, sort, lang]);

  const { slice, pageCount, page: safePage, total } = paginate(filtered, page);

  // A részletes keresőből (SearchModal) érkező szűrők alkalmazása helyben.
  const applyQs = (qs: string) => {
    const p = new URLSearchParams(qs);
    setMode((p.get("mode") as "" | "sale" | "rent") || "");
    setSellerType(p.get("sellerType") || "");
    setType(p.get("type") || "");
    setQ(p.get("q") || p.get("city") || "");
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeading icon="heartFilled">{tr("favorites", lang)}</PageHeading>

      {saved.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {/* mód-váltó + térkép/lista + részletes */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-soft">
              {([
                { v: "", label: tr("cat_all", lang) },
                { v: "sale", label: tr("buy", lang) },
                { v: "rent", label: tr("rent_tab", lang) }
              ] as const).map((m) => (
                <button
                  key={m.v || "all"}
                  onClick={() => {
                    setMode(m.v);
                    setPage(0);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition sm:px-5 ${
                    mode === m.v ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDetailedOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-800 shadow-soft transition hover:border-ink-400"
              >
                <Icon name="sliders" size={16} strokeWidth={2.2} />
                <span className="hidden sm:inline">{tr("advanced_filters", lang)}</span>
              </button>
              <button
                onClick={() => setView((v) => (v === "map" ? "list" : "map"))}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold shadow-soft transition ${
                  view === "map" ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-800 hover:border-ink-400"
                }`}
              >
                <Icon name={view === "map" ? "menu" : "globe"} size={16} strokeWidth={2.2} />
                <span className="hidden sm:inline">{view === "map" ? tr("list", lang) : tr("map", lang)}</span>
              </button>
            </div>
          </div>
          {/* kereső + rendezés */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder={tr("search_placeholder", lang)}
                className="w-full rounded-full border border-ink-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-soft transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="shrink-0 rounded-full border border-ink-200 bg-white px-3 py-3.5 text-sm shadow-soft focus:outline-none"
            >
              <option value="newest">{tr("sort_newest", lang)}</option>
              <option value="price_asc">{tr("sort_price_asc", lang)}</option>
              <option value="price_desc">{tr("sort_price_desc", lang)}</option>
              <option value="ppm2">{tr("sort_ppm2", lang)}</option>
            </select>
          </div>
        </div>
      )}

      {!favorites.ready ? null : saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 shadow-soft">
          {tr("no_favorites", lang)}
          <div className="mt-3">
            <Link href="/search" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
              {tr("search", lang)} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      ) : view === "map" ? (
        <div className="h-[70vh] overflow-hidden rounded-3xl border border-ink-100 shadow-card">
          <MapView listings={filtered} lang={lang} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 shadow-soft">
          {tr("no_results", lang)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {slice.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          <Pagination page={safePage} pageCount={pageCount} total={total} onPage={setPage} lang={lang} />
        </>
      )}

      <SearchModal open={detailedOpen} onClose={() => setDetailedOpen(false)} initialMode={mode} onApply={applyQs} />
    </div>
  );
}
