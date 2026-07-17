"use client";

import type { Listing } from "@/lib/types";
import { useLang, useMoney, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { grossYield, dealScore, rentalEstimate } from "@/lib/market";
import Icon from "@/components/ui/Icon";

// Airbnb (rövid-táv) csak lakáson / házon / villán / új építésűn értelmes.
const STR_TYPES = new Set(["apartment", "house", "villa", "new"]);
// Hosszú-távú lakhatási bérleti becslés a nyers telekre nem értelmes.
const NO_LTR_TYPES = new Set(["land", "agricultural"]);

/**
 * Befektetői nézet / kiadhatósági kalkulátor — a Proopify ütőkártyája.
 * Eladó ingatlanon: Deal Score + becsült hosszú-távú bérleti díj (minden épület-
 * típusnál) + Airbnb rövid-távú becslés (napi/havi/éves + kihasználtság, csak
 * lakás/ház/villa/új). A bérleti komparábilisekből becsülve.
 */
export default function InvestorCard({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const money = useMoney();
  const { items } = useListings();

  if (listing.mode !== "sale") return null;

  const y = grossYield(listing, items);
  const ds = dealScore(listing, items);
  const str = listing.area > 0 ? rentalEstimate(listing.city, listing.area, listing.type, items) : null;

  const showLTR = str && !NO_LTR_TYPES.has(listing.type) && str.longTermMonthly > 0;
  const showSTR = str && STR_TYPES.has(listing.type) && str.nightly > 0;

  if (!ds && !showLTR && !showSTR) return null;

  const scoreColor =
    (ds?.score ?? 0) >= 70 ? "text-emerald-600" : (ds?.score ?? 0) >= 45 ? "text-amber-600" : "text-rose-600";
  const barColor =
    (ds?.score ?? 0) >= 70 ? "bg-emerald-500" : (ds?.score ?? 0) >= 45 ? "bg-amber-500" : "bg-rose-500";

  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-600">{label}</span>
      <span className={strong ? "font-black text-ink-900" : "font-semibold text-ink-900"}>{value}</span>
    </div>
  );

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

      {/* Hosszú-távú bérbeadás — minden épület-típusnál (befektetői becslés). */}
      {showLTR && str && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
            <Icon name="key" size={12} /> {tr("rent_calc_ltr", lang)}
          </div>
          <div className="mt-2 space-y-1.5">
            <Row
              label={tr("rent_calc_monthly_est", lang)}
              value={`${money(str.longTermMonthly)}${tr("per_month", lang)}`}
              strong
            />
            <Row
              label={tr("annual_label", lang)}
              value={`${money(str.longTermAnnual)}${tr("per_year", lang)}`}
            />
            {y != null && (
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink-600">{tr("gross_yield", lang)}</span>
                <span className="font-bold text-emerald-600">{y.toFixed(1).replace(".", ",")}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Airbnb (rövid-táv) — csak lakás/ház/villa/új: napi + havi + éves + kihasználtság. */}
      {showSTR && str && (
        <div className="mt-3 rounded-xl bg-[linear-gradient(135deg,#f7fbe9,#eef7d6)] p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
            <Icon name="sparkles" size={12} /> {tr("rent_calc_str", lang)}
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <span className="text-2xl font-black tracking-tight text-ink-900">
                {formatNumber(str.nightly, lang)} €
              </span>
              <span className="text-xs font-semibold text-ink-400"> / {tr("night", lang)}</span>
            </div>
            <div className="text-right text-[11px] text-ink-500">
              <div>{tr("rent_calc_peak", lang)}: <b className="text-ink-800">{formatNumber(str.nightlyPeak, lang)} €</b></div>
              <div>{tr("rent_calc_off", lang)}: <b className="text-ink-800">{formatNumber(str.nightlyOff, lang)} €</b></div>
            </div>
          </div>
          {/* Éves kihasználtság — kiemelt, mert ez az Airbnb-bevétel kulcstényezője. */}
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                {tr("rent_calc_occ_year", lang)}
              </div>
              <div className="text-[11px] text-ink-400">
                {tr("rent_calc_nights_year", lang).replace("{n}", String(Math.round((str.occupancyPct / 100) * 365)))}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-emerald-600">{str.occupancyPct}%</span>
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5 border-t border-ink-900/5 pt-2.5">
            <Row
              label={tr("rent_calc_str_monthly", lang)}
              value={`${money(str.strMonthlyGross)}${tr("per_month", lang)}`}
            />
            <Row
              label={tr("rent_calc_str_annual", lang)}
              value={`${money(str.strAnnualGross)}${tr("per_year", lang)}`}
            />
          </div>
          {/* NETTÓ — a tényleges, üzemeltetési költségek utáni bevétel. */}
          <div className="mt-2.5 space-y-1.5 border-t border-ink-900/10 pt-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-ink-700">{tr("rent_calc_net_monthly", lang)}</span>
              <span className="font-black text-emerald-700">
                {money(str.strMonthlyNet)}
                {tr("per_month", lang)}
              </span>
            </div>
            <Row
              label={tr("rent_calc_net_annual", lang)}
              value={`${money(str.strAnnualNet)}${tr("per_year", lang)}`}
            />
            <p className="text-[11px] leading-snug text-ink-400">
              {tr("rent_calc_costs_note", lang).replace("{pct}", String(str.costRatioPct))}
            </p>
          </div>
          {str.strVsLtrPct > 0 && (
            <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
              <Icon name="trendUp" size={13} strokeWidth={2.4} />
              {tr("rent_calc_vs_up", lang).replace("{pct}", String(str.strVsLtrPct))}
            </p>
          )}
        </div>
      )}

      {str && (showLTR || showSTR) && (
        <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
          <span className="text-[11px] font-semibold text-ink-500">{tr("rent_calc_confidence", lang)}:</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              str.confidence === "high"
                ? "bg-emerald-50 text-emerald-700"
                : str.confidence === "medium"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-ink-100 text-ink-600"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              str.confidence === "high" ? "bg-emerald-500" : str.confidence === "medium" ? "bg-amber-500" : "bg-ink-400"
            }`} />
            {tr(str.confidence === "high" ? "conf_high" : str.confidence === "medium" ? "conf_medium" : "conf_low", lang)}
          </span>
          <span className="text-[11px] text-ink-400">
            {str.localComps > 0
              ? `· ${str.localComps} ${tr("rent_calc_local_comps", lang)}`
              : `· ${tr("rent_calc_national", lang)}`}
          </span>
        </div>
      )}
      <p className="mt-3 text-[11px] leading-snug text-ink-400">{tr("investor_disclaimer", lang)}</p>
    </div>
  );
}
