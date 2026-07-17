"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang, useMoney, useListings } from "@/lib/store";
import { tr, typeLabels, loc } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { cityTrend, montenegroPlaces } from "@/lib/data";
import { cityMarketStats, priceDrops, rentalEstimate } from "@/lib/market";
import Chart from "@/components/Chart";
import Icon from "@/components/ui/Icon";
import Photo from "@/components/Photo";
import PageHeading from "@/components/ui/PageHeading";

/** A kalkulátorban felkínált ingatlantípusok (bérbe adható lakóingatlanok elöl). */
const CALC_TYPES = [
  "apartment", "house", "villa", "new", "commercial", "office", "hospitality"
] as const;

/**
 * Piactér — városonkénti piaci intelligencia: €/m² trend, kínálat,
 * átlaghozam és árcsökkentés-követő. Ez a "jobb mint AirDNA" oldal.
 */
export default function MarketClient() {
  const { lang } = useLang();
  const money = useMoney();
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

  // Kalkulátor-állapot: típus + alapterület (a város az activeCity).
  const [calcType, setCalcType] = useState<string>("apartment");
  const [calcArea, setCalcArea] = useState<number>(60);
  const est = useMemo(
    () => rentalEstimate(activeCity, calcArea, calcType, items),
    [activeCity, calcArea, calcType, items]
  );

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

      {/* Szabad városkereső — bármely montenegrói város beírható */}
      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          {tr("market_city_label", lang)}
        </label>
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <Icon name="mapPin" size={18} />
          </span>
          <input
            list="mne-places"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={tr("market_city_ph", lang)}
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-ink-900 shadow-soft outline-none transition focus:border-ink-900"
          />
          <datalist id="mne-places">
            {montenegroPlaces.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Gyorsválasztó chipek — csak az adattal rendelkező városokra */}
        {citiesWithData.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {tr("market_quick_cities", lang)}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
          </div>
        )}
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

      {/* Bérbeadási hozam-kalkulátor — a fő új érték */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <div className="flex flex-col gap-1 border-b border-ink-100 bg-ink-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
              <Icon name="wallet" size={20} className="text-brand-400" />
              {tr("rent_calc_title", lang)}
            </h2>
            <p className="mt-0.5 text-sm text-white/70">{tr("rent_calc_sub", lang)}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            <Icon name={est.coastal ? "waves" : "home"} size={13} />
            {tr(est.coastal ? "rent_calc_coastal" : "rent_calc_inland", lang)}
          </span>
        </div>

        <div className="p-5">
          {/* Bemenetek */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                {tr("market_city_label", lang)}
              </label>
              <input
                list="mne-places"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={tr("market_city_ph", lang)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-ink-900"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                {tr("rent_calc_type", lang)}
              </label>
              <select
                value={calcType}
                onChange={(e) => setCalcType(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-ink-900"
              >
                {CALC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {typeLabels[t]?.[lang] ?? t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                {tr("rent_calc_area", lang)}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={2000}
                step={5}
                value={calcArea}
                // Min. 10 m² a state-ben is (nem csak az attribútumban) — így nem
                // mutat értelmetlen 0 €-s becslést.
                onChange={(e) => setCalcArea(Math.min(2000, Math.max(10, Math.round(Number(e.target.value) || 10))))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-ink-900"
              />
            </div>
          </div>

          {/* Eredmény 3 blokkban */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {/* Hosszú táv */}
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-700">
                <Icon name="key" size={15} className="text-ink-500" />
                {tr("rent_calc_ltr", lang)}
              </div>
              <div className="mt-3 display text-3xl font-black tracking-tight text-ink-900">
                {money(est.longTermMonthly)}
                <span className="ml-1 text-sm font-semibold text-ink-400">/ {tr("mo", lang)}</span>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {tr("rent_calc_ltr_annual", lang)}:{" "}
                <span className="font-semibold text-ink-700">{money(est.longTermAnnual)}</span>
              </div>
            </div>

            {/* Rövid táv — Airbnb */}
            <div className="rounded-xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-700">
                <Icon name="sparkles" size={15} className="text-brand-500" />
                {tr("rent_calc_str", lang)}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
                <div>
                  <div className="display text-3xl font-black tracking-tight text-ink-900">
                    {money(est.nightly)}
                    <span className="ml-1 text-sm font-semibold text-ink-400">/ {tr("night", lang)}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-400">
                    {tr("rent_calc_peak", lang)} {money(est.nightlyPeak)} · {tr("rent_calc_off", lang)}{" "}
                    {money(est.nightlyOff)}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-ink-50 px-2 py-2">
                  <div className="text-sm font-black text-ink-900">{est.occupancyPct}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-400">{tr("rent_calc_occupancy", lang)}</div>
                </div>
                <div className="rounded-lg bg-ink-50 px-2 py-2">
                  <div className="text-sm font-black text-ink-900">{money(est.strMonthlyGross)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-400">{tr("rent_calc_str_monthly", lang)}</div>
                </div>
                <div className="rounded-lg bg-ink-50 px-2 py-2">
                  <div className="text-sm font-black text-ink-900">{money(est.strAnnualGross)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-400">{tr("rent_calc_str_annual", lang)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Összevetés — a "wow" sáv */}
          <div
            className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
              est.strVsLtrPct > 0
                ? "border-emerald-200 bg-emerald-50"
                : "border-ink-100 bg-ink-50/60"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                est.strVsLtrPct > 0 ? "bg-emerald-500 text-white" : "bg-ink-200 text-ink-600"
              }`}
            >
              <Icon name={est.strVsLtrPct > 0 ? "trendUp" : "check"} size={18} />
            </span>
            <p
              className={`text-sm font-semibold ${
                est.strVsLtrPct > 0 ? "text-emerald-800" : "text-ink-600"
              }`}
            >
              {est.strVsLtrPct > 0
                ? tr("rent_calc_vs_up", lang).replace("{pct}", String(est.strVsLtrPct))
                : tr("rent_calc_vs_neutral", lang)}
            </p>
          </div>

          {/* Megbízhatóság-jelző: hány valós helyi adaton alapul a becslés. */}
          <p className="mt-3 text-[11px] font-medium text-ink-500">
            {est.localComps >= 2
              ? tr("rent_calc_comps", lang).replace("{n}", String(est.localComps))
              : tr("rent_calc_fallback", lang)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{tr("rent_calc_disclaimer", lang)}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* €/m² trend */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-ink-900">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            {tr("market_trend", lang)}
            {activeCity ? ` · ${activeCity}` : ""}
          </h2>
          <div className="mt-4">
            <Chart data={trend} format={(v) => `${formatNumber(v, lang)} €`} height={190} />
          </div>
        </section>

        {/* Kínálat típusonként */}
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-ink-900">
            <span className="h-5 w-1 rounded-full bg-brand-500" />
            {tr("supply_by_type", lang)}
            {activeCity ? ` · ${activeCity}` : ""}
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
                    <span className="line-through">{money(from)}</span>{" "}
                    <span className="font-bold text-ink-900">{money(to)}</span>
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
