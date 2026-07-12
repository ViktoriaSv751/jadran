"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang, useListings } from "@/lib/store";
import { tr, typeLabels, loc } from "@/lib/i18n";
import { formatPrice, formatNumber } from "@/lib/format";
import { cityTrend } from "@/lib/data";
import { cityMarketStats, priceDrops } from "@/lib/market";
import Chart from "@/components/Chart";
import Icon from "@/components/ui/Icon";
import Photo from "@/components/Photo";
import PageHeading from "@/components/ui/PageHeading";

/**
 * Piactér — városonkénti piaci intelligencia: €/m² trend, kínálat,
 * átlaghozam és árcsökkentés-követő. Ez a "jobb mint AirDNA" oldal.
 */
export default function MarketClient() {
  const { lang } = useLang();
  const { items } = useListings();

  const citiesWithData = useMemo(
    () => Array.from(new Set(items.filter((l) => l.status === "active").map((l) => l.city))).sort(),
    [items]
  );
  const [city, setCity] = useState<string>("");
  const activeCity = city || citiesWithData[0] || "";

  const stats = useMemo(() => cityMarketStats(activeCity, items), [activeCity, items]);
  const trend = useMemo(() => cityTrend(activeCity, items), [activeCity, items]);
  const drops = useMemo(() => priceDrops(items).slice(0, 6), [items]);

  const kpi = (label: string, value: string, accent = false) => (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className={`text-2xl font-black tracking-tight ${accent ? "text-emerald-600" : "text-ink-900"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  );

  const maxType = Math.max(1, ...stats.byType.map((t) => t.count));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeading icon="trendUp" className="mb-2">{tr("market_title", lang)}</PageHeading>
      <p className="max-w-2xl text-ink-500">{tr("market_sub", lang)}</p>

      {/* Városválasztó */}
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {citiesWithData.map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              c === activeCity
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-ink-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* KPI-k */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpi(tr("avg_ppm2", lang), stats.avgPpm2 ? `${formatNumber(stats.avgPpm2, lang)} €` : "–")}
        {kpi(tr("supply_sale", lang), String(stats.saleCount))}
        {kpi(tr("supply_rent", lang), String(stats.rentCount))}
        {kpi(
          tr("avg_yield", lang),
          stats.avgYield != null ? `${stats.avgYield.toFixed(1).replace(".", ",")}%` : "–",
          true
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* €/m² trend */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-ink-900">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            {tr("market_trend", lang)} · {activeCity}
          </h2>
          <div className="mt-4">
            <Chart data={trend} format={(v) => `${formatNumber(v, lang)} €`} height={190} />
          </div>
        </section>

        {/* Kínálat típusonként */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-ink-900">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            {tr("supply_by_type", lang)} · {activeCity}
          </h2>
          <div className="mt-4 space-y-2.5">
            {stats.byType.length === 0 && <p className="text-sm text-ink-400">–</p>}
            {stats.byType.map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-ink-600">
                  {typeLabels[t.type]?.[lang] ?? t.type}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-ink-900"
                    style={{ width: `${(t.count / maxType) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm font-bold text-ink-900">{t.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Árcsökkentés-követő */}
      <section className="mt-6">
        <h2 className="display text-xl text-ink-900 sm:text-2xl">{tr("price_drops_title", lang)}</h2>
        <p className="mt-1 text-sm text-ink-500">{tr("price_drops_sub", lang)}</p>
        {drops.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">{tr("no_results", lang)}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drops.map(({ listing: l, from, to, dropPct }) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="group flex gap-3 rounded-2xl border border-ink-100 bg-white p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Photo src={l.images[0]} alt={loc(l.title, lang)} className="h-20 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 py-0.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Icon name="trendUp" size={11} className="rotate-180" /> −{dropPct}%
                  </span>
                  <div className="mt-1 truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                    {loc(l.title, lang)}
                  </div>
                  <div className="text-xs text-ink-400">
                    <span className="line-through">{formatPrice(from, lang)}</span>{" "}
                    <span className="font-bold text-ink-900">{formatPrice(to, lang)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
