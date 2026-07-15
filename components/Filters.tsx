"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr, typeLabels, viewLabels, conditionLabels, amenityLabels, heatingLabels } from "@/lib/i18n";
import { cities } from "@/lib/data";
import Icon from "@/components/ui/Icon";

export interface FilterState {
  q: string;
  mode: string;
  city: string;
  sellerType: string; // "" | "private" | "agency"
  type: string;
  priceMin: string;
  priceMax: string;
  roomsMin: string;
  roomsMax: string;
  areaMin: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  view: string;
  condition: string;
  maxSeaDist: string;
  energyClass: string;
  verifiedOnly: string;
  verifLevel: string;
  furnished: string;
  amenities: string; // comma-joined Amenity keys
  // sale-only
  minYear: string;
  maxYear: string;
  plotMin: string;
  heatingType: string;
  maxCommonCost: string;
  // rent-only
  petsOnly: string;
  utilitiesIncluded: string;
  minTerm: string;
  maxDeposit: string;
  sort: string;
}

export const emptyFilters: FilterState = {
  q: "",
  mode: "",
  city: "",
  sellerType: "",
  type: "",
  priceMin: "",
  priceMax: "",
  roomsMin: "",
  roomsMax: "",
  areaMin: "",
  areaMax: "",
  floorMin: "",
  floorMax: "",
  view: "",
  condition: "",
  maxSeaDist: "",
  energyClass: "",
  verifiedOnly: "",
  verifLevel: "",
  furnished: "",
  amenities: "",
  minYear: "",
  maxYear: "",
  plotMin: "",
  heatingType: "",
  maxCommonCost: "",
  petsOnly: "",
  utilitiesIncluded: "",
  minTerm: "",
  maxDeposit: "",
  sort: "newest"
};

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-0.5 text-left"
    >
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${
          checked ? "bg-brand-500" : "bg-ink-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function Filters({
  value,
  onChange,
  onReset
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}) {
  const { lang } = useLang();
  const set = (k: keyof FilterState, v: string) => onChange({ ...value, [k]: v });

  const isRent = value.mode === "rent";

  // The detailed block is collapsed by default (like ingatlan.com's "Részletes
  // keresés"). It auto-opens if the user arrives with any advanced filter set.
  const advancedKeys: (keyof FilterState)[] = [
    "roomsMax", "areaMax", "floorMin", "floorMax", "view", "condition", "maxSeaDist",
    "energyClass", "verifLevel", "verifiedOnly", "furnished", "amenities",
    "minYear", "maxYear", "plotMin", "heatingType", "maxCommonCost",
    "minTerm", "maxDeposit", "utilitiesIncluded", "petsOnly"
  ];
  const advancedActive = advancedKeys.filter((k) => value[k]).length;
  const [advanced, setAdvanced] = useState(advancedActive > 0);

  const amenityList = value.amenities ? value.amenities.split(",").filter(Boolean) : [];
  const toggleAmenity = (a: string) => {
    const next = new Set(amenityList);
    next.has(a) ? next.delete(a) : next.add(a);
    set("amenities", Array.from(next).join(","));
  };

  const energyClasses = ["A", "B", "C", "D", "E", "F", "G"];

  const sel =
    "w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none";
  const selectCls = `${sel} select-pretty cursor-pointer`;
  const labelCls = "block text-xs font-semibold text-ink-500 mb-1.5";
  const sectionCls = "text-[11px] font-bold uppercase tracking-wide text-ink-400";

  return (
    <div className="space-y-5">
      {/* ---- Basics (always visible) ---- */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>{tr("city", lang)}</label>
          <select className={selectCls} value={value.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">{tr("any", lang)}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>{tr("type", lang)}</label>
          <select className={selectCls} value={value.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">{tr("any", lang)}</option>
            {Object.keys(typeLabels).map((k) => (
              <option key={k} value={k}>
                {typeLabels[k][lang]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>
              {tr("price_min", lang)}
              {isRent ? ` ${tr("per_month_short", lang)}` : ""}
            </label>
            <input
              className={sel}
              type="number"
              inputMode="numeric"
              placeholder="€"
              value={value.priceMin}
              onChange={(e) => set("priceMin", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>
              {tr("price_max", lang)}
              {isRent ? ` ${tr("per_month_short", lang)}` : ""}
            </label>
            <input
              className={sel}
              type="number"
              inputMode="numeric"
              placeholder="€"
              value={value.priceMax}
              onChange={(e) => set("priceMax", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>{tr("rooms", lang)} (min)</label>
            <select className={selectCls} value={value.roomsMin} onChange={(e) => set("roomsMin", e.target.value)}>
              <option value="">{tr("any", lang)}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{tr("area", lang)} (min m²)</label>
            <input
              className={sel}
              type="number"
              inputMode="numeric"
              placeholder="m²"
              value={value.areaMin}
              onChange={(e) => set("areaMin", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ---- Detailed filters toggle ---- */}
      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-ink-200 bg-ink-50/60 px-3.5 py-2.5 text-left transition hover:bg-ink-50"
      >
        <span className="flex items-center gap-2">
          <Icon name="sliders" size={16} className="text-brand-500" />
          <span className="text-sm font-bold text-ink-900">{tr("advanced_filters", lang)}</span>
          {advancedActive > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {advancedActive}
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

      {/* ---- Detailed / advanced block (collapsible) ---- */}
      {advanced && (
        <div className="space-y-5 animate-fade-in">
          {/* Common refinements */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>{tr("rooms_max", lang)}</label>
                <select className={selectCls} value={value.roomsMax} onChange={(e) => set("roomsMax", e.target.value)}>
                  <option value="">{tr("any", lang)}</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tr("area_max", lang)}</label>
                <input
                  className={sel}
                  type="number"
                  inputMode="numeric"
                  placeholder="m²"
                  value={value.areaMax}
                  onChange={(e) => set("areaMax", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>{tr("floor_min", lang)}</label>
                <input
                  className={sel}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={value.floorMin}
                  onChange={(e) => set("floorMin", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>{tr("floor_max", lang)}</label>
                <input
                  className={sel}
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={value.floorMax}
                  onChange={(e) => set("floorMax", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>{tr("view", lang)}</label>
                <select className={selectCls} value={value.view} onChange={(e) => set("view", e.target.value)}>
                  <option value="">{tr("any", lang)}</option>
                  {Object.keys(viewLabels).map((k) => (
                    <option key={k} value={k}>
                      {viewLabels[k][lang]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tr("condition", lang)}</label>
                <select className={selectCls} value={value.condition} onChange={(e) => set("condition", e.target.value)}>
                  <option value="">{tr("any", lang)}</option>
                  {Object.keys(conditionLabels).map((k) => (
                    <option key={k} value={k}>
                      {conditionLabels[k][lang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>{tr("energy_label", lang)}</label>
                <select className={selectCls} value={value.energyClass} onChange={(e) => set("energyClass", e.target.value)}>
                  <option value="">{tr("any", lang)}</option>
                  {energyClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tr("verif_level_label", lang)}</label>
                <select className={selectCls} value={value.verifLevel} onChange={(e) => set("verifLevel", e.target.value)}>
                  <option value="">{tr("any", lang)}</option>
                  <option value="basic">{tr("verif_min_basic", lang)}</option>
                  <option value="deed">{tr("verif_min_deed", lang)}</option>
                  <option value="full">{tr("verif_min_full", lang)}</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {tr("max_sea_dist", lang)}: {value.maxSeaDist || "∞"}
              </label>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={value.maxSeaDist || 2000}
                onChange={(e) => set("maxSeaDist", e.target.value === "2000" ? "" : e.target.value)}
                className="w-full accent-brand-500"
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2 border-t border-ink-100 pt-4">
            <p className={sectionCls}>{tr("amenities_label", lang)}</p>
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

          {/* SALE-specific */}
          {!isRent && (
            <div className="space-y-3 border-t border-ink-100 pt-4">
              <p className={sectionCls}>{tr("sale_specifics", lang)}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>{tr("min_year_label", lang)}</label>
                  <input
                    className={sel}
                    type="number"
                    inputMode="numeric"
                    placeholder="2000"
                    value={value.minYear}
                    onChange={(e) => set("minYear", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>{tr("max_year_label", lang)}</label>
                  <input
                    className={sel}
                    type="number"
                    inputMode="numeric"
                    placeholder="2026"
                    value={value.maxYear}
                    onChange={(e) => set("maxYear", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>{tr("plot_min", lang)}</label>
                  <input
                    className={sel}
                    type="number"
                    inputMode="numeric"
                    placeholder="m²"
                    value={value.plotMin}
                    onChange={(e) => set("plotMin", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>{tr("common_cost_max", lang)}</label>
                  <input
                    className={sel}
                    type="number"
                    inputMode="numeric"
                    placeholder={`€${tr("per_month_short", lang)}`}
                    value={value.maxCommonCost}
                    onChange={(e) => set("maxCommonCost", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>{tr("heating_type_label", lang)}</label>
                <select className={selectCls} value={value.heatingType} onChange={(e) => set("heatingType", e.target.value)}>
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

          {/* RENT-specific */}
          {isRent && (
            <div className="space-y-3 border-t border-ink-100 pt-4">
              <p className={sectionCls}>{tr("rent_specifics", lang)}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>
                    {tr("min_term_label", lang)} ({tr("months_short", lang)})
                  </label>
                  <select className={selectCls} value={value.minTerm} onChange={(e) => set("minTerm", e.target.value)}>
                    <option value="">{tr("any", lang)}</option>
                    {[1, 3, 6, 12].map((n) => (
                      <option key={n} value={n}>
                        ≤ {n} {tr("months_short", lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tr("deposit_max", lang)}</label>
                  <input
                    className={sel}
                    type="number"
                    inputMode="numeric"
                    placeholder="€"
                    value={value.maxDeposit}
                    onChange={(e) => set("maxDeposit", e.target.value)}
                  />
                </div>
              </div>
              <Toggle
                label={tr("utilities_included", lang)}
                checked={value.utilitiesIncluded === "1"}
                onChange={(v) => set("utilitiesIncluded", v ? "1" : "")}
              />
              <Toggle
                label={tr("pets_allowed", lang)}
                checked={value.petsOnly === "1"}
                onChange={(v) => set("petsOnly", v ? "1" : "")}
              />
            </div>
          )}

          {/* Shared toggles */}
          <div className="space-y-3 border-t border-ink-100 pt-4">
            {!isRent && (
              <Toggle
                label={tr("furnished", lang)}
                checked={value.furnished === "1"}
                onChange={(v) => set("furnished", v ? "1" : "")}
              />
            )}
            <Toggle
              label={tr("chip_verified", lang)}
              checked={value.verifiedOnly === "1"}
              onChange={(v) => set("verifiedOnly", v ? "1" : "")}
            />
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
      >
        {tr("reset", lang)}
      </button>
    </div>
  );
}
