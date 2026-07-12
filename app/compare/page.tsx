"use client";

import Link from "next/link";
import React from "react";
import { useLang, useCompare, useListings } from "@/lib/store";
import {
  tr,
  typeLabels,
  conditionLabels,
  viewLabels,
  modeLabels,
  amenityLabels,
  heatingLabels,
  loc
} from "@/lib/i18n";
import { formatPrice, formatNumber, pricePerM2, distanceLabel } from "@/lib/format";
import type { Amenity, Listing } from "@/lib/types";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";
import PageHeading from "@/components/ui/PageHeading";
import RequireAuth from "@/components/auth/RequireAuth";

type Dir = "min" | "max";

interface Row {
  label: string;
  render: (l: Listing) => React.ReactNode;
  /** Numeric value used to pick the "best" cell in this row (null = skip). */
  best?: (l: Listing) => number | null;
  dir?: Dir; // default "min"
  /** Only compare within the same mode (sale vs rent shouldn't mix). */
  modeScoped?: boolean;
}

interface Section {
  title: string;
  rows: Row[];
}

export default function ComparePage() {
  return (
    <RequireAuth message="login_to_compare">
      <CompareInner />
    </RequireAuth>
  );
}

function CompareInner() {
  const { lang } = useLang();
  const compare = useCompare();
  const { items: all } = useListings();
  const items = all.filter((l) => compare.has(l.id));

  const ppm2 = (l: Listing) => pricePerM2(l.price, l.area);
  const mixedModes = new Set(items.map((l) => l.mode)).size > 1;

  // Fajlagos ár (best value) — módonként a legkisebb €/m².
  const bestByMode = new Map<string, number>();
  for (const l of items) {
    const v = ppm2(l);
    if (v > 0 && (!bestByMode.has(l.mode) || v < (bestByMode.get(l.mode) as number))) bestByMode.set(l.mode, v);
  }
  const isBestValue = (l: Listing) => ppm2(l) > 0 && ppm2(l) === bestByMode.get(l.mode);
  const premiumPct = (l: Listing) => {
    const best = bestByMode.get(l.mode);
    if (!best || ppm2(l) <= 0) return null;
    return Math.round((ppm2(l) / best - 1) * 100);
  };

  const hasRent = items.some((l) => l.mode === "rent");
  const hasSale = items.some((l) => l.mode === "sale");

  // A kijelölt hirdetésekben előforduló összes felszereltség (matrix-hoz).
  const allAmenities = (Object.keys(amenityLabels) as Amenity[]).filter((a) =>
    items.some((l) => l.amenities.includes(a))
  );

  const sections: Section[] = [
    {
      title: tr("cmp_section_value", lang),
      rows: [
        {
          label: tr("cmp_price", lang),
          render: (l) => (
            <span className="whitespace-nowrap font-bold text-ink-900">
              {formatPrice(l.price, lang)}
              {l.mode === "rent" && <span className="text-[11px] font-medium text-ink-400">{tr("per_month", lang)}</span>}
            </span>
          ),
          best: (l) => l.price || null,
          dir: "min",
          modeScoped: true
        },
        {
          label: `€${tr("per_m2", lang)}`,
          render: (l) => (ppm2(l) > 0 ? `${formatNumber(ppm2(l), lang)} €` : "—"),
          best: (l) => ppm2(l) || null,
          dir: "min",
          modeScoped: true
        },
        {
          label: tr("value_ratio", lang),
          render: (l) => {
            if (ppm2(l) <= 0) return "—";
            if (isBestValue(l))
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  <Icon name="check" size={13} strokeWidth={2.6} /> {tr("best_value", lang)}
                </span>
              );
            const pct = premiumPct(l);
            return pct == null ? (
              "—"
            ) : (
              <span className="text-xs font-semibold text-ink-500">
                +{pct}% <span className="font-normal text-ink-400">{tr("vs_best", lang)}</span>
              </span>
            );
          }
        }
      ]
    },
    {
      title: tr("cmp_section_basics", lang),
      rows: [
        { label: tr("type", lang), render: (l) => typeLabels[l.type][lang] },
        {
          label: tr("area", lang),
          render: (l) => `${formatNumber(l.area, lang)} m²`,
          best: (l) => l.area || null,
          dir: "max"
        },
        {
          label: tr("rooms", lang),
          render: (l) => (l.rooms > 0 ? l.rooms : "—"),
          best: (l) => l.rooms || null,
          dir: "max"
        },
        { label: tr("floor_short", lang), render: (l) => (l.floor === null ? "—" : l.floor) },
        {
          label: tr("year_short", lang),
          render: (l) => l.year,
          best: (l) => l.year || null,
          dir: "max"
        },
        { label: tr("condition", lang), render: (l) => conditionLabels[l.condition][lang] },
        {
          label: tr("energy_label", lang),
          render: (l) => (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-ink-100 px-1.5 text-xs font-black text-ink-800">
              {l.energy || "—"}
            </span>
          ),
          best: (l) => (l.energy ? -l.energy.toUpperCase().charCodeAt(0) : null), // 'A' a legjobb
          dir: "max"
        },
        { label: tr("furnished", lang), render: (l) => <YesNo v={l.furnished} lang={lang} /> }
      ]
    },
    {
      title: tr("cmp_section_location", lang),
      rows: [
        { label: tr("city", lang), render: (l) => `${l.city}${l.district ? ` · ${l.district}` : ""}` },
        { label: tr("view", lang), render: (l) => viewLabels[l.view][lang] },
        {
          label: tr("to_sea", lang),
          render: (l) => distanceLabel(l.distanceToSea),
          best: (l) => l.distanceToSea || null,
          dir: "min"
        }
      ]
    }
  ];

  // Mód-specifikus extrák.
  const extraRows: Row[] = [];
  if (hasSale) {
    extraRows.push(
      { label: tr("plot_area_label", lang), render: (l) => (l.plotArea ? `${formatNumber(l.plotArea, lang)} m²` : "—") },
      {
        label: tr("common_cost_label", lang),
        render: (l) => (l.monthlyCommonCost ? `${formatPrice(l.monthlyCommonCost, lang)}${tr("per_month", lang)}` : "—")
      },
      {
        label: tr("heating_label", lang),
        render: (l) => (l.heatingType ? heatingLabels[l.heatingType]?.[lang] ?? l.heatingType : "—")
      }
    );
  }
  if (hasRent) {
    extraRows.push(
      { label: tr("deposit_short", lang), render: (l) => (l.deposit != null ? formatPrice(l.deposit, lang) : "—") },
      { label: tr("min_term_label", lang), render: (l) => (l.minTermMonths != null ? l.minTermMonths : "—") },
      { label: tr("utilities_included", lang), render: (l) => <YesNo v={!!l.utilitiesIncluded} lang={lang} /> },
      { label: tr("pets_allowed", lang), render: (l) => <YesNo v={!!l.petsAllowed} lang={lang} /> }
    );
  }
  if (extraRows.length) sections.push({ title: tr("cmp_section_extra", lang), rows: extraRows });

  // Felszereltség-mátrix.
  if (allAmenities.length) {
    sections.push({
      title: tr("cmp_section_amenities", lang),
      rows: allAmenities.map((a) => ({
        label: `${amenityLabels[a].icon} ${amenityLabels[a][lang]}`,
        render: (l) =>
          l.amenities.includes(a) ? (
            <Icon name="check" size={16} strokeWidth={2.6} className="text-emerald-600" />
          ) : (
            <span className="text-ink-300">—</span>
          )
      }))
    });
  }

  // Egy sorhoz kiszámoljuk, mely hirdetés(ek) a „legjobbak" (zöld kiemelés).
  const bestIdsFor = (row: Row): Set<string> => {
    const out = new Set<string>();
    if (!row.best) return out;
    const dir = row.dir ?? "min";
    const groups = row.modeScoped
      ? Array.from(new Set(items.map((l) => l.mode)))
      : ["__all__"];
    for (const g of groups) {
      const pool = row.modeScoped ? items.filter((l) => l.mode === g) : items;
      const vals = pool
        .map((l) => ({ id: l.id, v: row.best!(l) }))
        .filter((x): x is { id: string; v: number } => x.v != null);
      if (vals.length < 2) continue; // ha csak egy értékelhető van, nincs „legjobb"
      const extreme = dir === "min" ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v));
      vals.forEach((x) => x.v === extreme && out.add(x.id));
    }
    return out;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageHeading icon="sliders" className="mb-0">
            {tr("compare_title", lang)}
          </PageHeading>
          {items.length > 0 && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
              {mixedModes ? tr("value_mixed_note", lang) : tr("cmp_best_hint", lang)}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-900"
            >
              <Icon name="plus" size={15} strokeWidth={2.4} /> {tr("cmp_add_more", lang)}
            </Link>
            <button
              onClick={() => items.forEach((l) => compare.toggle(l.id))}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
            >
              <Icon name="close" size={15} strokeWidth={2.4} /> {tr("clear_all", lang)}
            </button>
          </div>
        )}
      </div>

      {!compare.ready ? null : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center shadow-soft">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-400">
            <Icon name="sliders" size={26} />
          </span>
          <p className="mt-4 font-semibold text-ink-800">{tr("empty_compare", lang)}</p>
          <Link
            href="/search"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            {tr("search", lang)} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[580px] border-collapse text-sm">
            {/* Fejléc — hirdetés-kártyák */}
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-28 bg-white p-3 sm:w-40" />
                {items.map((l) => (
                  <th key={l.id} className="border-l border-ink-100 p-3 align-top">
                    <div className="relative">
                      {isBestValue(l) && !mixedModes && (
                        <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">
                          <Icon name="check" size={11} strokeWidth={2.8} /> {tr("best_value", lang)}
                        </span>
                      )}
                      <Link href={`/listing/${l.id}`} className="block">
                        <Photo src={l.images[0]} alt={loc(l.title, lang)} className="mb-2 h-28 w-full rounded-xl" />
                      </Link>
                      <span className="inline-block rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-600">
                        {modeLabels[l.mode][lang]}
                      </span>
                      <Link href={`/listing/${l.id}`}>
                        <span className="mt-1 line-clamp-2 block text-left text-[13px] font-semibold text-ink-800 hover:text-brand-700">
                          {loc(l.title, lang)}
                        </span>
                      </Link>
                      <div className="mt-1 text-left text-xl font-black tracking-tight text-ink-900">
                        {formatPrice(l.price, lang)}
                        {l.mode === "rent" && (
                          <span className="text-xs font-semibold text-ink-400">{tr("per_month", lang)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => compare.toggle(l.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:underline"
                      >
                        <Icon name="close" size={12} strokeWidth={2.4} /> {tr("remove", lang)}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <React.Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={items.length + 1}
                      className="sticky left-0 bg-ink-50/70 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-500"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map((r, ri) => {
                    const bestIds = bestIdsFor(r);
                    return (
                      <tr key={section.title + ri} className="border-t border-ink-100">
                        <td className="sticky left-0 z-10 bg-white p-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                          {r.label}
                        </td>
                        {items.map((l) => {
                          const best = bestIds.has(l.id);
                          return (
                            <td
                              key={l.id}
                              className={`border-l border-ink-100 p-3 font-medium ${
                                best ? "bg-emerald-50 text-emerald-800" : "text-ink-700"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {best && <Icon name="check" size={13} strokeWidth={2.8} className="text-emerald-600" />}
                                {r.render(l)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function YesNo({ v, lang }: { v: boolean; lang: Parameters<typeof tr>[1] }) {
  return v ? (
    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
      <Icon name="check" size={14} strokeWidth={2.6} /> {tr("yes", lang)}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-400">
      <Icon name="close" size={13} strokeWidth={2.4} /> {tr("no", lang)}
    </span>
  );
}
