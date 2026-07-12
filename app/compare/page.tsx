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

  const ppm2 = (l: (typeof items)[number]) => pricePerM2(l.price, l.area);
  const bestByMode = new Map<string, number>();
  for (const l of items) {
    const v = ppm2(l);
    if (v > 0 && (!bestByMode.has(l.mode) || v < (bestByMode.get(l.mode) as number))) bestByMode.set(l.mode, v);
  }
  const isBestValue = (l: (typeof items)[number]) => ppm2(l) > 0 && ppm2(l) === bestByMode.get(l.mode);
  const premiumPct = (l: (typeof items)[number]) => {
    const best = bestByMode.get(l.mode);
    if (!best || ppm2(l) <= 0) return null;
    return Math.round((ppm2(l) / best - 1) * 100);
  };
  const mixedModes = new Set(items.map((l) => l.mode)).size > 1;

  const rows: { label: string; render: (id: (typeof items)[number]) => React.ReactNode }[] = [
    { label: `€${tr("per_m2", lang)}`, render: (l) => `${formatNumber(pricePerM2(l.price, l.area), lang)} €` },
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
    },
    { label: tr("type", lang), render: (l) => typeLabels[l.type][lang] },
    { label: tr("city", lang), render: (l) => `${l.city} · ${l.district}` },
    { label: tr("area", lang), render: (l) => `${formatNumber(l.area, lang)} m²` },
    { label: tr("rooms", lang), render: (l) => (l.rooms > 0 ? l.rooms : "—") },
    { label: tr("view", lang), render: (l) => viewLabels[l.view][lang] },
    { label: tr("condition", lang), render: (l) => conditionLabels[l.condition][lang] },
    { label: tr("to_sea", lang), render: (l) => distanceLabel(l.distanceToSea) },
    { label: tr("energy", lang), render: (l) => l.energy }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">{tr("compare_title", lang)}</h1>
        {items.length > 0 && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
            {mixedModes ? tr("value_mixed_note", lang) : tr("value_best_note", lang)}
          </p>
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
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-28 bg-white p-3 sm:w-36" />
                {items.map((l) => (
                  <th key={l.id} className="border-l border-ink-100 p-3 align-top">
                    <div className="relative">
                      {isBestValue(l) && (
                        <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">
                          <Icon name="check" size={11} strokeWidth={2.8} /> {tr("best_value", lang)}
                        </span>
                      )}
                      <Link href={`/listing/${l.id}`} className="block">
                        <Photo src={l.images[0]} alt={l.title[lang]} className="mb-2 h-28 w-full rounded-xl" />
                      </Link>
                      <span className="inline-block rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-600">
                        {modeLabels[l.mode][lang]}
                      </span>
                      <Link href={`/listing/${l.id}`}>
                        <span className="mt-1 line-clamp-2 block text-left text-[13px] font-semibold text-ink-800 hover:text-brand-700">
                          {l.title[lang]}
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
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-ink-100">
                  <td className="sticky left-0 z-10 bg-white p-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {r.label}
                  </td>
                  {items.map((l) => (
                    <td
                      key={l.id}
                      className={`border-l border-ink-100 p-3 font-medium text-ink-700 ${
                        isBestValue(l) ? "bg-emerald-50/40" : ""
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
      )}
    </div>
  );
}
