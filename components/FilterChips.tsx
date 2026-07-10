"use client";

import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { FilterState } from "./Filters";

type ChipKey = "sea" | "new" | "under200" | "verified" | "furnished" | "pets" | "utilities";

const chipDefs: Record<
  ChipKey,
  { labelKey: string; isActive: (f: FilterState) => boolean; toggle: (f: FilterState) => FilterState }
> = {
  sea: {
    labelKey: "chip_sea",
    isActive: (f) => f.view === "sea",
    toggle: (f) => ({ ...f, view: f.view === "sea" ? "" : "sea" })
  },
  new: {
    labelKey: "chip_new",
    isActive: (f) => f.type === "new",
    toggle: (f) => ({ ...f, type: f.type === "new" ? "" : "new" })
  },
  under200: {
    labelKey: "chip_under200",
    isActive: (f) => f.priceMax === "200000",
    toggle: (f) => ({ ...f, priceMax: f.priceMax === "200000" ? "" : "200000" })
  },
  verified: {
    labelKey: "chip_verified",
    isActive: (f) => f.verifiedOnly === "1",
    toggle: (f) => ({ ...f, verifiedOnly: f.verifiedOnly === "1" ? "" : "1" })
  },
  furnished: {
    labelKey: "chip_furnished",
    isActive: (f) => f.furnished === "1",
    toggle: (f) => ({ ...f, furnished: f.furnished === "1" ? "" : "1" })
  },
  pets: {
    labelKey: "chip_pets",
    isActive: (f) => f.petsOnly === "1",
    toggle: (f) => ({ ...f, petsOnly: f.petsOnly === "1" ? "" : "1" })
  },
  utilities: {
    labelKey: "chip_utilities",
    isActive: (f) => f.utilitiesIncluded === "1",
    toggle: (f) => ({ ...f, utilitiesIncluded: f.utilitiesIncluded === "1" ? "" : "1" })
  }
};

// Context-aware chip sets — pets/utilities only surface for rentals.
const SALE_CHIPS: ChipKey[] = ["sea", "new", "under200", "verified"];
const RENT_CHIPS: ChipKey[] = ["sea", "furnished", "utilities", "pets"];
const ALL_CHIPS: ChipKey[] = ["sea", "new", "verified", "furnished"];

export default function FilterChips({
  value,
  onChange
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const { lang } = useLang();
  const keys = value.mode === "rent" ? RENT_CHIPS : value.mode === "sale" ? SALE_CHIPS : ALL_CHIPS;

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {keys.map((key) => {
        const c = chipDefs[key];
        const active = c.isActive(value);
        return (
          <button
            key={key}
            onClick={() => onChange(c.toggle(value))}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                : "border-ink-200 bg-white text-ink-700 hover:border-ink-300"
            }`}
          >
            {tr(c.labelKey, lang)}
          </button>
        );
      })}
    </div>
  );
}
