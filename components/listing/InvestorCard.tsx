"use client";

import type { Listing } from "@/lib/types";
import { useLang, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { estimateMonthlyRent, grossYield, dealScore, rentalEstimate } from "@/lib/market";
import { formatNumber } from "@/lib/format";
import Icon from "@/components/ui/Icon";

/**
 * Befektetői nézet — a Proopify ütőkártyája: bérleti komparábilisekből becsült
 * hozam + Deal Score. Csak eladó, lakható ingatlanon jelenik meg.
 */
export default function InvestorCard({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const { items } = useListings();

  if (listing.mode !== "sale") return null;
  const y = grossYield(listing, items);
  const ds = dealScore(listing, items);
  if (y == null && !ds) return null;

  const rent = estimateMonthlyRent(listing, items);
  // Airbnb (rövid-táv) becslés ERRE az ingatlanra — a hozam-motor a hirdetés arcán.
  const str = listing.area > 0 ? rentalEstimate(listing.city, listing.area, listing.type, items) : null;
  const scoreColor =
    (ds?.score ?? 0) >= 70 ? "text-emerald-600" : (ds?.score ?? 0) >= 45 ? "text-amber-600" : "text-rose-600";
  const barColor =
    (ds?.score ?? 0) >= 70 ? "bg-emerald-500" : (ds?.score ?? 0) >= 45 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h3 className="flex items-center gap-2 font-bold text-ink-900">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon name="trendUp" size={15} strokeWidth={2.2} />
        </span>
        {tr("investor_title", lang)}
      </h3>

      {ds && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-600">{tr("deal_score", lang)}</span>
            <span className={`text-2xl font-black tracking-tight ${scoreColor}`}>
              {ds.score}
              <span className="text-sm font-semibold text-ink-300">/100</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ds.score}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {ds.vsCityAvgPct <= 0
              ? tr("ds_below_avg", lang).replace("{p}", String(Math.abs(ds.vsCityAvgPct)))
              : tr("ds_above_avg", lang).replace("{p}", String(ds.vsCityAvgPct))}
            {ds.priceDropped ? ` · ${tr("ds_price_dropped", lang)}` : ""}
          </p>
        </div>
      )}

      {y != null && (
        <dl className="mt-4 space-y-2 border-t border-ink-100 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">{tr("est_rent", lang)}</dt>
            <dd className="font-semibold text-ink-900">
              {formatPrice(rent, lang)}
              {tr("per_month", lang)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">{tr("gross_yield", lang)}</dt>
            <dd className="font-bold text-emerald-600">{y.toFixed(1).replace(".", ",")}%</dd>
          </div>
        </dl>
      )}

      {/* Airbnb (rövid-táv) — a Proopify egyedi ütőkártyája: mennyit hozhat kiadva. */}
      {str && (
        <div className="mt-4 rounded-xl bg-ink-50 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
            <Icon name="key" size={12} /> {tr("rent_calc_str", lang)}
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <span className="text-xl font-black tracking-tight text-ink-900">{formatNumber(str.nightly, lang)} €</span>
              <span className="text-xs font-semibold text-ink-400"> / {tr("night", lang)}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-ink-900">{formatPrice(str.strMonthlyGross, lang)}{tr("per_month", lang)}</div>
              <div className="text-[11px] text-ink-400">{str.occupancyPct}% · {tr("rent_calc_str_monthly", lang)}</div>
            </div>
          </div>
          {str.strVsLtrPct > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
              <Icon name="trendUp" size={13} strokeWidth={2.4} />
              {tr("rent_calc_vs_up", lang).replace("{pct}", String(str.strVsLtrPct))}
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug text-ink-400">{tr("investor_disclaimer", lang)}</p>
    </div>
  );
}
