"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth, useLang, useMoney, useListingsByOwner, useProfiles } from "@/lib/store";
import { tr, typeLabels, modeLabels, loc } from "@/lib/i18n";
import { pricePerM2, formatCompact } from "@/lib/format";
import type { Listing } from "@/lib/types";
import * as db from "@/lib/db";
import { toast } from "@/lib/ui";
import Photo from "@/components/Photo";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import PageHeading from "@/components/ui/PageHeading";
import Pagination, { paginate } from "@/components/ui/Pagination";
import SearchModal from "@/components/home/SearchModal";
import PromoteButton from "@/components/host/PromoteButton";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full rounded-3xl" />
});

export default function ManageListings() {
  const { lang } = useLang();
  const money = useMoney();
  const { user } = useAuth();
  const all = useListingsByOwner(user?.id);
  const { profiles } = useProfiles();
  const roleOf = useMemo(() => new Map(profiles.map((p) => [p.id, p.role])), [profiles]);

  const [status, setStatus] = useState<"" | "active" | "paused">("");
  const [mode, setMode] = useState<"" | "sale" | "rent">("");
  const [sellerType, setSellerType] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"list" | "map">("list");
  const [detailedOpen, setDetailedOpen] = useState(false);

  const listings = useMemo(() => {
    const query = q.trim().toLowerCase();
    const out = all.filter((l) => {
      if (status && l.status !== status) return false;
      if (mode && l.mode !== mode) return false;
      if (sellerType && roleOf.get(l.ownerId) !== sellerType) return false;
      if (type && l.type !== type) return false;
      if (query && !`${l.city} ${l.district} ${loc(l.title, lang)}`.toLowerCase().includes(query)) return false;
      return true;
    });
    const by: Record<string, (a: Listing, b: Listing) => number> = {
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      ppm2: (a, b) => pricePerM2(a.price, a.area) - pricePerM2(b.price, b.area)
    };
    return [...out].sort(by[sort] ?? by.newest);
  }, [all, status, mode, sellerType, roleOf, type, q, sort, lang]);

  const { slice, pageCount, page: safePage, total } = paginate(listings, page);

  // Dashboard-összegzés (a SZŰRETLEN teljes portfólióra).
  const dash = useMemo(() => {
    const activeCount = all.filter((l) => l.status === "active").length;
    return {
      total: all.length,
      active: activeCount,
      paused: all.length - activeCount,
      views: all.reduce((s, l) => s + l.views, 0)
    };
  }, [all]);

  const applyQs = (qs: string) => {
    const p = new URLSearchParams(qs);
    setMode((p.get("mode") as "" | "sale" | "rent") || "");
    setSellerType(p.get("sellerType") || "");
    setType(p.get("type") || "");
    setQ(p.get("q") || p.get("city") || "");
    setPage(0);
  };

  if (!user) return null;

  const togglePause = (id: string, s: string) =>
    db.updateListing(id, { status: s === "active" ? "paused" : "active" });

  const remove = (id: string) => {
    if (window.confirm(tr("confirm_delete", lang))) {
      db.deleteListing(id);
      toast(tr("listing_deleted_toast", lang));
    }
  };

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      onClick={() => {
        onClick();
        setPage(0);
      }}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        on ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeading
        icon="building"
        className="mb-6"
        right={
          // Telefonon rejtve — az alsó menüsor közepén ott a „+" gomb; itt csak
          // asztali nézetben mutatjuk.
          <Link href="/listings/new" className="hidden sm:block">
            <Button>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="plus" size={16} strokeWidth={2.2} /> {tr("new_listing", lang)}
              </span>
            </Button>
          </Link>
        }
      >
        {tr("manage_listings", lang)}
      </PageHeading>

      {/* Dashboard-statisztika — a teljes portfólió egy pillantásra. */}
      {all.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: tr("ml_stat_total", lang), value: String(dash.total), icon: "building" as const, tone: "text-ink-900" },
            { label: tr("ml_stat_active", lang), value: String(dash.active), icon: "check" as const, tone: "text-emerald-600" },
            { label: tr("ml_stat_paused", lang), value: String(dash.paused), icon: "minus" as const, tone: "text-amber-600" },
            { label: tr("ml_stat_views", lang), value: formatCompact(dash.views, lang), icon: "eye" as const, tone: "text-ink-900" }
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <Icon name={s.icon} size={13} /> {s.label}
              </div>
              <div className={`mt-1 text-2xl font-black tracking-tight ${s.tone} [font-variant-numeric:tabular-nums]`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Szűrő a saját hirdetésekre — állapot, mód, kereső, rendezés, részletes,
          térkép — mint a hirdetés-lista oldalon. */}
      {all.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {/* 1. sor: állapot-gombok balra, Részletes + Térképnézet jobbra. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-soft">
              {chip(tr("my_listings_filter_all", lang), status === "", () => setStatus(""))}
              {chip(tr("status_active_f", lang), status === "active", () => setStatus("active"))}
              {chip(tr("status_paused_f", lang), status === "paused", () => setStatus("paused"))}
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
          {/* 2. sor: kereső + rendezés. */}
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
                className="w-full rounded-full border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm shadow-soft transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="shrink-0 rounded-full border border-ink-200 bg-white px-3 py-3 text-sm shadow-soft focus:outline-none"
            >
              <option value="newest">{tr("sort_newest", lang)}</option>
              <option value="price_asc">{tr("sort_price_asc", lang)}</option>
              <option value="price_desc">{tr("sort_price_desc", lang)}</option>
              <option value="ppm2">{tr("sort_ppm2", lang)}</option>
            </select>
          </div>
          {/* 3. sor: mód-váltó (Összes / Vásárlás / Bérlés) — a kereső és a
              rendezés ALÁ helyezve. */}
          <div className="inline-flex self-start rounded-full border border-ink-200 bg-white p-1 shadow-soft">
            {chip(tr("cat_all", lang), mode === "", () => setMode(""))}
            {chip(tr("buy", lang), mode === "sale", () => setMode("sale"))}
            {chip(tr("rent_tab", lang), mode === "rent", () => setMode("rent"))}
          </div>
        </div>
      )}

      <SearchModal open={detailedOpen} onClose={() => setDetailedOpen(false)} initialMode={mode} onApply={applyQs} />

      {all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
            <Icon name="home" size={28} />
          </div>
          <p className="font-semibold text-ink-800">{tr("no_listings_yet", lang)}</p>
          <Link
            href="/listings/new"
            className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
          >
            {tr("create_first_listing", lang)} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      ) : view === "map" ? (
        <div className="h-[70vh] overflow-hidden rounded-3xl border border-ink-100 shadow-card">
          <MapView listings={listings} lang={lang} />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 shadow-soft">
          {tr("no_results", lang)}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
              {/* Teljes kép — mint a keresés-listanézet kártyáján */}
              <Link href={`/listing/${l.id}`} className="relative block">
                <Photo src={l.images[0]} alt={loc(l.title, lang)} className="aspect-[4/3] w-full" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-soft ${
                    l.status === "active" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {l.status === "active" ? tr("status_active", lang) : tr("status_paused", lang)}
                </span>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Icon name="eye" size={12} /> {l.views}
                </span>
              </Link>

              <div className="p-4">
                <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-600">
                  {modeLabels[l.mode][lang]} · {typeLabels[l.type][lang]}
                </span>
                <Link href={`/listing/${l.id}`}>
                  <h3 className="mt-2 line-clamp-1 font-bold tracking-tight text-ink-900 hover:text-brand-700">
                    {loc(l.title, lang)}
                  </h3>
                </Link>
                <div className="mt-1 text-xl font-black tracking-tight text-ink-900">
                  {money(l.price)}
                  {l.mode === "rent" && <span className="text-xs font-semibold text-ink-400">{tr("per_month", lang)}</span>}
                </div>

                {/* Kezelő-gombok */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <Link href={`/listings/new?id=${l.id}`} className="flex-1">
                    <Button size="sm" variant="outline" full>
                      <Icon name="sliders" size={14} className="mr-1" /> {tr("edit_btn", lang)}
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => togglePause(l.id, l.status)}>
                    {l.status === "active" ? tr("pause_listing", lang) : tr("activate_listing", lang)}
                  </Button>
                  <PromoteButton listing={l} />
                  <Button size="sm" variant="danger" onClick={() => remove(l.id)} aria-label={tr("delete_btn", lang)}>
                    <Icon name="close" size={15} strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={safePage} pageCount={pageCount} total={total} onPage={setPage} lang={lang} />
        </>
      )}
    </div>
  );
}
