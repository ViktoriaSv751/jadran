"use client";

import Link from "next/link";
import { useLang, useCompare, useListings } from "@/lib/store";
import { tr, typeLabels, conditionLabels, viewLabels, modeLabels } from "@/lib/i18n";
import { formatPrice, formatNumber, pricePerM2, distanceLabel } from "@/lib/format";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";

export default function ComparePage() {
  const { lang } = useLang();
  const compare = useCompare();
  const { items: all } = useListings();
  const items = all.filter((l) => compare.has(l.id));

  // --- price-value ranking --------------------------------------------------
  // The "value" of a listing is its specific price (€/m²): lower is better.
  // We rank *within each mode* (sale-vs-sale, rent-vs-rent) because a monthly
  // rent and a purchase price aren't comparable. The lowest €/m² in a mode is
  // the "best value"; everyone else is shown as a % premium over that best.
  const ppm2 = (l: (typeof items)[number]) => pricePerM2(l.price, l.area);
  const bestByMode = new Map<string, number>();
  for (const l of items) {
    const v = ppm2(l);
    if (v > 0 && (!bestByMode.has(l.mode) || v < (bestByMode.get(l.mode) as number))) {
      bestByMode.set(l.mode, v);
    }
  }
  const isBestValue = (l: (typeof items)[number]) => ppm2(l) > 0 && ppm2(l) === bestByMode.get(l.mode);
  const premiumPct = (l: (typeof items)[number]) => {
    const best = bestByMode.get(l.mode);
    if (!best || ppm2(l) <= 0) return null;
    return Math.round((ppm2(l) / best - 1) * 100);
  };
  const mixedModes = new Set(items.map((l) => l.mode)).size > 1;

  const rows: { label: string; render: (id: (typeof items)[number]) => React.ReactNode }[] = [
    { label: tr("type", lang), render: (l) => typeLabels[l.type][lang] },
    { label: tr("price", lang), render: (l) => <span className="font-bold text-ink-900">{formatPrice(l.price, lang)}</span> },
    { label: `€${tr("per_m2", lang)}`, render: (l) => `${formatNumber(pricePerM2(l.price, l.area), lang)} €` },
    {
      label: tr("value_ratio", lang),
      render: (l) => {
        if (ppm2(l) <= 0) return "—";
        if (isBestValue(l)) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700">
              <Icon name="check" size={13} strokeWidth={2.6} /> {tr("best_value", lang)}
            </span>
          );
        }
        const pct = premiumPct(l);
        return pct == null ? "—" : (
          <span className="text-xs font-semibold text-ink-500">
            +{pct}% <span className="font-normal text-ink-400">{tr("vs_best", lang)}</span>
          </span>
        );
      }
    },
    { label: tr("city", lang), render: (l) => `${l.city} · ${l.district}` },
    { label: tr("area", lang), render: (l) => `${formatNumber(l.area, lang)} m²` },
    { label: tr("rooms", lang), render: (l) => (l.rooms > 0 ? l.rooms : "—") },
    { label: tr("view", lang), render: (l) => viewLabels[l.view][lang] },
    { label: tr("condition", lang), render: (l) => conditionLabels[l.condition][lang] },
    { label: tr("to_sea", lang), render: (l) => distanceLabel(l.distanceToSea) },
    { label: tr("energy", lang), render: (l) => l.energy }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-ink-900">{tr("compare_title", lang)}</h1>

      {!compare.ready ? null : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 shadow-soft">
          {tr("empty_compare", lang)}
          <div className="mt-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
            >
              {tr("search", lang)} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 max-w-2xl text-sm text-ink-500">
            {mixedModes ? tr("value_mixed_note", lang) : tr("value_best_note", lang)}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 border-b border-ink-100 p-3" />
                  {items.map((l) => (
                    <th key={l.id} className="border-b border-l border-ink-100 p-3 align-top">
                      <div className="relative">
                        {isBestValue(l) && (
                          <span className="absolute left-1 top-1 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">
                            <Icon name="check" size={11} strokeWidth={2.8} /> {tr("best_value", lang)}
                          </span>
                        )}
                        <Link href={`/listing/${l.id}`}>
                          <Photo src={l.images[0]} alt={l.title[lang]} className="mb-2 h-24 w-full rounded-lg object-cover" />
                          <span className="line-clamp-2 text-left font-medium text-ink-700">{l.title[lang]}</span>
                        </Link>
                      </div>
                      <div className="mt-1 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        {modeLabels[l.mode][lang]}
                      </div>
                      <button
                        onClick={() => compare.toggle(l.id)}
                        className="mt-1 text-xs font-medium text-rose-500 hover:underline"
                      >
                        {tr("remove", lang)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="odd:bg-ink-50/50">
                    <td className="p-3 text-xs font-semibold text-ink-500">{r.label}</td>
                    {items.map((l) => (
                      <td
                        key={l.id}
                        className={`border-l border-ink-100 p-3 text-ink-700 ${
                          r.label === tr("value_ratio", lang) && isBestValue(l) ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        {r.render(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
