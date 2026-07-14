"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLang, useListings } from "@/lib/store";
import { tr, typeLabels, viewLabels, conditionLabels, amenityLabels, heatingLabels } from "@/lib/i18n";
import { cities, montenegroPlaces } from "@/lib/data";
import Icon from "@/components/ui/Icon";

type Mode = "" | "sale" | "rent";

interface Draft {
  mode: Mode;
  loc: string; // free-text location (matched against city/district/title)
  city: string; // exact city chosen from the quick chips
  type: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  roomsMin: string;
  // sale-only
  view: string;
  condition: string;
  minYear: string;
  maxCommonCost: string;
  verifiedOnly: string;
  // rent-only
  furnished: string;
  petsOnly: string;
  utilitiesIncluded: string;
  minTerm: string;
  maxDeposit: string;
  // advanced / detailed
  roomsMax: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  energyClass: string;
  verifLevel: string;
  maxSeaDist: string;
  amenities: string; // comma-joined Amenity keys
  maxYear: string;
  plotMin: string;
  heatingType: string;
}

const empty: Draft = {
  mode: "sale",
  loc: "",
  city: "",
  type: "",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  roomsMin: "",
  view: "",
  condition: "",
  minYear: "",
  maxCommonCost: "",
  verifiedOnly: "",
  furnished: "",
  petsOnly: "",
  utilitiesIncluded: "",
  minTerm: "",
  maxDeposit: "",
  roomsMax: "",
  areaMax: "",
  floorMin: "",
  floorMax: "",
  energyClass: "",
  verifLevel: "",
  maxSeaDist: "",
  amenities: "",
  maxYear: "",
  plotMin: "",
  heatingType: ""
};

export default function SearchModal({
  open,
  onClose,
  initialMode = "sale",
  onApply
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
  /** Ha meg van adva, alkalmazáskor ezt hívja (query string) navigálás helyett —
   *  a keresés-listanézet közvetlenül frissíti a szűrőit. */
  onApply?: (qs: string) => void;
}) {
  const { lang } = useLang();
  const { items } = useListings();
  const router = useRouter();
  const [d, setD] = useState<Draft>({ ...empty, mode: initialMode });
  const [mounted, setMounted] = useState(false);
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setD((prev) => ({ ...prev, mode: initialMode }));
  }, [open, initialMode]);

  // A mögöttes oldal fix, nem görgethető (html + body zár).
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  const set = (k: keyof Draft, v: string) => setD((p) => ({ ...p, [k]: v }));
  const toggle = (k: keyof Draft) => setD((p) => ({ ...p, [k]: p[k] === "1" ? "" : "1" }));

  const isRent = d.mode === "rent";
  const isSale = d.mode === "sale";
  const typeKeys = Object.keys(typeLabels);
  const energyClasses = ["A", "B", "C", "D", "E", "F", "G"];

  const amenityList = d.amenities ? d.amenities.split(",").filter(Boolean) : [];
  const toggleAmenity = (a: string) => {
    const next = new Set(amenityList);
    next.has(a) ? next.delete(a) : next.add(a);
    set("amenities", Array.from(next).join(","));
  };

  // Count of active advanced refinements — drives the toggle badge.
  const advancedKeys: (keyof Draft)[] = [
    "roomsMax", "areaMax", "floorMin", "floorMax", "energyClass", "verifLevel",
    "maxSeaDist", "amenities", "maxYear", "plotMin", "heatingType"
  ];
  const advancedCount = advancedKeys.filter((k) => d[k]).length;

  // Live count so the CTA feels alive (Airbnb-style) — mirrors the /search filter.
  const count = useMemo(() => {
    const q = d.loc.trim().toLowerCase();
    return items.filter((l) => {
      if (l.status !== "active") return false;
      if (d.mode && l.mode !== d.mode) return false;
      if (q) {
        const hay =
          `${l.city} ${l.district} ${l.title.hu} ${l.title.me} ${l.title.en} ${l.title.ru} ${l.agency}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (d.city && l.city !== d.city) return false;
      if (d.type && l.type !== d.type) return false;
      if (d.priceMin && l.price < Number(d.priceMin)) return false;
      if (d.priceMax && l.price > Number(d.priceMax)) return false;
      if (d.areaMin && l.area < Number(d.areaMin)) return false;
      if (d.areaMax && l.area > Number(d.areaMax)) return false;
      if (d.roomsMin && l.rooms < Number(d.roomsMin)) return false;
      if (d.roomsMax && l.rooms > Number(d.roomsMax)) return false;
      if (d.floorMin && (l.floor == null || l.floor < Number(d.floorMin))) return false;
      if (d.floorMax && (l.floor == null || l.floor > Number(d.floorMax))) return false;
      if (d.view && l.view !== d.view) return false;
      if (d.condition && l.condition !== d.condition) return false;
      if (d.energyClass && l.energy !== d.energyClass) return false;
      if (d.verifiedOnly === "1" && l.verification === "none") return false;
      if (d.verifLevel) {
        const rank: Record<string, number> = { none: 0, basic: 1, deed: 2, full: 3 };
        if ((rank[l.verification] ?? 0) < (rank[d.verifLevel] ?? 0)) return false;
      }
      if (d.maxSeaDist && l.distanceToSea > Number(d.maxSeaDist)) return false;
      if (d.amenities) {
        const need = d.amenities.split(",").filter(Boolean);
        if (!need.every((a) => l.amenities.includes(a as (typeof l.amenities)[number]))) return false;
      }
      if (d.minYear && l.year > 0 && l.year < Number(d.minYear)) return false;
      if (d.maxYear && l.year > 0 && l.year > Number(d.maxYear)) return false;
      if (d.plotMin && (l.plotArea == null || l.plotArea < Number(d.plotMin))) return false;
      if (d.heatingType && l.heatingType !== d.heatingType) return false;
      if (d.maxCommonCost && l.monthlyCommonCost != null && l.monthlyCommonCost > Number(d.maxCommonCost)) return false;
      if (d.furnished === "1" && !l.furnished) return false;
      if (d.petsOnly === "1" && !l.petsAllowed) return false;
      if (d.utilitiesIncluded === "1" && !l.utilitiesIncluded) return false;
      if (d.minTerm && l.minTermMonths != null && l.minTermMonths > Number(d.minTerm)) return false;
      if (d.maxDeposit && l.deposit != null && l.deposit > Number(d.maxDeposit)) return false;
      return true;
    }).length;
  }, [items, d]);

  if (!open || !mounted) return null;

  const go = () => {
    const p = new URLSearchParams();
    if (d.mode) p.set("mode", d.mode);
    if (d.loc.trim()) p.set("q", d.loc.trim());
    if (d.city) p.set("city", d.city);
    if (d.type) p.set("type", d.type);
    if (d.priceMin) p.set("priceMin", d.priceMin);
    if (d.priceMax) p.set("priceMax", d.priceMax);
    if (d.areaMin) p.set("areaMin", d.areaMin);
    if (d.areaMax) p.set("areaMax", d.areaMax);
    if (d.roomsMin) p.set("roomsMin", d.roomsMin);
    if (d.roomsMax) p.set("roomsMax", d.roomsMax);
    if (d.floorMin) p.set("floorMin", d.floorMin);
    if (d.floorMax) p.set("floorMax", d.floorMax);
    if (d.view) p.set("view", d.view);
    if (d.condition) p.set("condition", d.condition);
    if (d.energyClass) p.set("energyClass", d.energyClass);
    if (d.verifLevel) p.set("verifLevel", d.verifLevel);
    if (d.maxSeaDist) p.set("maxSeaDist", d.maxSeaDist);
    if (d.amenities) p.set("amenities", d.amenities);
    if (d.minYear) p.set("minYear", d.minYear);
    if (d.maxYear) p.set("maxYear", d.maxYear);
    if (d.plotMin) p.set("plotMin", d.plotMin);
    if (d.heatingType) p.set("heatingType", d.heatingType);
    if (d.maxCommonCost) p.set("maxCommonCost", d.maxCommonCost);
    if (d.verifiedOnly) p.set("verifiedOnly", d.verifiedOnly);
    if (d.furnished) p.set("furnished", d.furnished);
    if (d.petsOnly) p.set("petsOnly", d.petsOnly);
    if (d.utilitiesIncluded) p.set("utilitiesIncluded", d.utilitiesIncluded);
    if (d.minTerm) p.set("minTerm", d.minTerm);
    if (d.maxDeposit) p.set("maxDeposit", d.maxDeposit);
    const qs = p.toString();
    onClose();
    if (onApply) onApply(qs);
    else router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  const inp =
    "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm text-ink-800 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none";
  const selectCls = `${inp} select-pretty cursor-pointer`;
  const sectionLabel = "mb-2 block text-xs font-bold uppercase tracking-wide text-ink-400";

  // Compact pill toggle for boolean refinements.
  const Pill = ({ k, label }: { k: keyof Draft; label: string }) => {
    const active = d[k] === "1";
    return (
      <button
        type="button"
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          active
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-ink-200 text-ink-600 hover:border-ink-300"
        }`}
      >
        {active && <Icon name="check" size={15} strokeWidth={2.6} />}
        {label}
      </button>
    );
  };

  return createPortal(
    // TELJES OLDALAS minden méreten (asztalon is), FEKETE kerettel; a mögöttes
    // oldal 100% fehér és fix (nem görgethető).
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-white" onClick={onClose} />
      <div className="absolute inset-0 flex animate-sheet-up flex-col overflow-hidden border-2 border-ink-950 bg-white">
        {/* Header — bold dark band with neon glow */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(115deg,#070708_0%,#0d0d10_45%,#3a4a00_78%,#c8ff00_100%)] px-5 pb-7 pt-[calc(1.75rem+env(safe-area-inset-top))] text-center text-white sm:pt-7">
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[#c8ff00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-[-3.5rem] h-44 w-44 rounded-full bg-[#c8ff00]/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
          <button
            onClick={onClose}
            aria-label={tr("close", lang)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-ink-950 shadow-soft transition hover:bg-ink-100"
          >
            <Icon name="close" size={18} strokeWidth={2.4} />
          </button>
          <h2 className="display relative text-2xl sm:text-3xl">
            {tr("search_cta", lang)}
          </h2>
          <p className="relative mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/55">
            {tr("hero_eyebrow", lang)}
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Mode */}
          <div className="mx-auto flex w-full max-w-sm rounded-full border border-ink-200 bg-ink-50 p-1">
            {([
              { v: "sale", label: tr("buy", lang) },
              { v: "rent", label: tr("rent_tab", lang) },
              { v: "", label: tr("cat_all", lang) }
            ] as { v: Mode; label: string }[]).map((m) => (
              <button
                key={m.v || "all"}
                onClick={() => set("mode", m.v)}
                className={`flex-1 rounded-full py-2 text-sm font-bold transition ${
                  d.mode === m.v ? "bg-ink-900 text-white shadow-soft" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Where — free-text location with full Montenegro autocomplete */}
          <div>
            <span className={sectionLabel}>{tr("where_q", lang)}</span>
            <div className="relative">
              <Icon
                name="mapPin"
                size={22}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500"
              />
              <input
                list="mne-places"
                className="w-full rounded-2xl border-2 border-ink-200 bg-white py-4 pl-12 pr-4 text-lg font-bold text-ink-900 shadow-soft transition placeholder:font-semibold placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
                placeholder={tr("location_placeholder", lang)}
                value={d.loc}
                onChange={(e) => set("loc", e.target.value)}
              />
              <datalist id="mne-places">
                {montenegroPlaces.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {/* Popular quick chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setD((p) => ({ ...p, city: "", loc: "" }))}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  d.city === "" && d.loc === ""
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 text-ink-700 hover:border-ink-300"
                }`}
              >
                {tr("anywhere", lang)}
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setD((p) => ({ ...p, city: c, loc: "" }))}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    d.city === c ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-700 hover:border-ink-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Type — big playful 3D tiles, matching the home "browse by type" grid.
              Show the first 6; a "more" toggle reveals the rest. */}
          <div>
            <span className={sectionLabel}>{tr("type", lang)}</span>
            <div className="grid grid-cols-3 gap-3">
              {(typeExpanded ? typeKeys : typeKeys.slice(0, 6)).map((k) => {
                const active = d.type === k;
                return (
                  <button
                    key={k}
                    onClick={() => set("type", active ? "" : k)}
                    className={`group flex flex-col items-center rounded-2xl border p-3 text-center transition ${
                      active
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                        : "border-ink-100 bg-gradient-to-br from-white to-ink-50 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/cat/${k}.png`}
                      alt={typeLabels[k][lang]}
                      loading="lazy"
                      className={`h-14 w-14 object-contain transition duration-300 group-hover:scale-110 sm:h-16 sm:w-16 ${
                        active ? "" : "opacity-95"
                      }`}
                    />
                    <span
                      className={`mt-1.5 text-xs font-bold leading-tight ${
                        active ? "text-brand-700" : "text-ink-700"
                      }`}
                    >
                      {typeLabels[k][lang]}
                    </span>
                  </button>
                );
              })}
            </div>
            {typeKeys.length > 6 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setTypeExpanded((v) => !v)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-5 py-2 text-sm font-bold text-ink-700 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  {typeExpanded ? tr("show_less", lang) : tr("show_more", lang)}
                  <Icon
                    name="chevronDown"
                    size={15}
                    strokeWidth={2.4}
                    className={`transition-transform duration-300 ${typeExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <span className={sectionLabel}>
              {tr("price", lang)} {isRent ? `(€${tr("per_month_short", lang)})` : "(€)"}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inp}
                type="number"
                inputMode="numeric"
                placeholder={tr("price_min", lang)}
                value={d.priceMin}
                onChange={(e) => set("priceMin", e.target.value)}
              />
              <input
                className={inp}
                type="number"
                inputMode="numeric"
                placeholder={tr("price_max", lang)}
                value={d.priceMax}
                onChange={(e) => set("priceMax", e.target.value)}
              />
            </div>
          </div>

          {/* Size */}
          <div>
            <span className={sectionLabel}>
              {tr("area", lang)} / {tr("rooms", lang)}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inp}
                type="number"
                inputMode="numeric"
                placeholder={`${tr("area", lang)} min m²`}
                value={d.areaMin}
                onChange={(e) => set("areaMin", e.target.value)}
              />
              <select className={selectCls} value={d.roomsMin} onChange={(e) => set("roomsMin", e.target.value)}>
                <option value="">{tr("rooms", lang)}: {tr("any", lang)}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}+ {tr("rooms", lang).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---- SALE-specific detailed panel ---- */}
          {isSale && (
            <div className="space-y-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
              <span className="block text-xs font-bold uppercase tracking-wide text-ink-400">
                {tr("sale_specifics", lang)}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("condition", lang)}</label>
                  <select className={selectCls} value={d.condition} onChange={(e) => set("condition", e.target.value)}>
                    <option value="">{tr("any", lang)}</option>
                    {Object.keys(conditionLabels).map((k) => (
                      <option key={k} value={k}>
                        {conditionLabels[k][lang]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("view", lang)}</label>
                  <select className={selectCls} value={d.view} onChange={(e) => set("view", e.target.value)}>
                    <option value="">{tr("any", lang)}</option>
                    {Object.keys(viewLabels).map((k) => (
                      <option key={k} value={k}>
                        {viewLabels[k][lang]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("min_year_label", lang)}</label>
                  <input
                    className={inp}
                    type="number"
                    inputMode="numeric"
                    placeholder="2000"
                    value={d.minYear}
                    onChange={(e) => set("minYear", e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("common_cost_max", lang)}</label>
                  <input
                    className={inp}
                    type="number"
                    inputMode="numeric"
                    placeholder="€/hó"
                    value={d.maxCommonCost}
                    onChange={(e) => set("maxCommonCost", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill k="verifiedOnly" label={tr("chip_verified", lang)} />
              </div>
            </div>
          )}

          {/* ---- RENT-specific detailed panel ---- */}
          {isRent && (
            <div className="space-y-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
              <span className="block text-xs font-bold uppercase tracking-wide text-ink-400">
                {tr("rent_specifics", lang)}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">
                    {tr("min_term_label", lang)}
                  </label>
                  <select className={selectCls} value={d.minTerm} onChange={(e) => set("minTerm", e.target.value)}>
                    <option value="">{tr("any", lang)}</option>
                    {[1, 3, 6, 12].map((n) => (
                      <option key={n} value={n}>
                        ≤ {n} {tr("months_short", lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("deposit_max", lang)}</label>
                  <input
                    className={inp}
                    type="number"
                    inputMode="numeric"
                    placeholder="€"
                    value={d.maxDeposit}
                    onChange={(e) => set("maxDeposit", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill k="furnished" label={tr("furnished", lang)} />
                <Pill k="utilitiesIncluded" label={tr("utilities_included", lang)} />
                <Pill k="petsOnly" label={tr("pets_allowed", lang)} />
              </div>
            </div>
          )}

          {/* ---- Detailed / advanced filters (collapsed by default) ---- */}
          <div>
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-left transition hover:bg-ink-50"
            >
              <span className="flex items-center gap-2">
                <Icon name="sliders" size={18} className="text-brand-500" />
                <span className="text-sm font-bold text-ink-900">{tr("advanced_filters", lang)}</span>
                {advancedCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {advancedCount}
                  </span>
                )}
              </span>
              <Icon
                name="chevronDown"
                size={18}
                strokeWidth={2.2}
                className={`text-ink-500 transition-transform duration-300 ${advanced ? "rotate-180" : ""}`}
              />
            </button>

            {advanced && (
              <div className="mt-4 space-y-5 animate-fade-in">
                {/* Rooms / area max */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("rooms_max", lang)}</label>
                    <select className={selectCls} value={d.roomsMax} onChange={(e) => set("roomsMax", e.target.value)}>
                      <option value="">{tr("any", lang)}</option>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("area_max", lang)}</label>
                    <input
                      className={inp}
                      type="number"
                      inputMode="numeric"
                      placeholder="m²"
                      value={d.areaMax}
                      onChange={(e) => set("areaMax", e.target.value)}
                    />
                  </div>
                </div>

                {/* Floor min / max */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("floor_min", lang)}</label>
                    <input
                      className={inp}
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={d.floorMin}
                      onChange={(e) => set("floorMin", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("floor_max", lang)}</label>
                    <input
                      className={inp}
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={d.floorMax}
                      onChange={(e) => set("floorMax", e.target.value)}
                    />
                  </div>
                </div>

                {/* Energy class / verification level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("energy_label", lang)}</label>
                    <select className={selectCls} value={d.energyClass} onChange={(e) => set("energyClass", e.target.value)}>
                      <option value="">{tr("any", lang)}</option>
                      {energyClasses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("verif_level_label", lang)}</label>
                    <select className={selectCls} value={d.verifLevel} onChange={(e) => set("verifLevel", e.target.value)}>
                      <option value="">{tr("any", lang)}</option>
                      <option value="basic">{tr("verif_min_basic", lang)}</option>
                      <option value="deed">{tr("verif_min_deed", lang)}</option>
                      <option value="full">{tr("verif_min_full", lang)}</option>
                    </select>
                  </div>
                </div>

                {/* Sea distance */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-500">
                    {tr("max_sea_dist", lang)}: {d.maxSeaDist || "∞"}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={2000}
                    step={50}
                    value={d.maxSeaDist || 2000}
                    onChange={(e) => set("maxSeaDist", e.target.value === "2000" ? "" : e.target.value)}
                    className="w-full accent-brand-500"
                  />
                </div>

                {/* Sale-only extras */}
                {isSale && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("max_year_label", lang)}</label>
                      <input
                        className={inp}
                        type="number"
                        inputMode="numeric"
                        placeholder="2026"
                        value={d.maxYear}
                        onChange={(e) => set("maxYear", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("plot_min", lang)}</label>
                      <input
                        className={inp}
                        type="number"
                        inputMode="numeric"
                        placeholder="m²"
                        value={d.plotMin}
                        onChange={(e) => set("plotMin", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-ink-500">{tr("heating_type_label", lang)}</label>
                      <select className={selectCls} value={d.heatingType} onChange={(e) => set("heatingType", e.target.value)}>
                        <option value="">{tr("any", lang)}</option>
                        {Object.keys(heatingLabels).map((k) => (
                          <option key={k} value={k}>
                            {heatingLabels[k][lang]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div>
                  <span className={sectionLabel}>{tr("amenities_label", lang)}</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(amenityLabels).map((a) => {
                      const on = amenityList.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAmenity(a)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            on
                              ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                              : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
                          }`}
                        >
                          {amenityLabels[a][lang]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — extra breathing room below so it isn't jammed to the screen edge */}
        <div
          className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 border-t border-ink-100 px-5 pt-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        >
          <button
            onClick={() => setD({ ...empty, mode: d.mode })}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 underline-offset-2 hover:underline"
          >
            {tr("clear_all", lang)}
          </button>
          <button
            onClick={go}
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold text-white shadow-glow transition hover:from-brand-600 hover:to-brand-700 active:scale-[0.99]"
          >
            <Icon name="search" size={18} strokeWidth={2.2} className="transition group-hover:scale-110" />
            <span className="tabular-nums">{count}</span> {tr("results", lang)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
