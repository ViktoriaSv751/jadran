"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { monthlyPayment, MORTGAGE_DEFAULTS } from "@/lib/montenegro";

/**
 * Interaktív hiteltörlesztés-kalkulátor a hirdetés árához. Önerő, kamat és
 * futamidő állítható; a havi törlesztőt annuitásos képlettel számolja.
 */
export default function MortgageCalculator({ price }: { price: number }) {
  const { lang } = useLang();
  const [downPct, setDownPct] = useState<number>(MORTGAGE_DEFAULTS.downPct);
  const [rate, setRate] = useState<number>(MORTGAGE_DEFAULTS.ratePct);
  const [years, setYears] = useState<number>(MORTGAGE_DEFAULTS.years);

  const down = Math.round((price * downPct) / 100);
  const loan = Math.max(0, price - down);
  const monthly = monthlyPayment(loan, rate, years);

  const slider = (
    label: string,
    value: string,
    min: number,
    max: number,
    step: number,
    v: number,
    set: (n: number) => void
  ) => (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-600">{label}</span>
        <span className="font-semibold text-ink-900">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-1.5 w-full accent-brand-500"
      />
    </div>
  );

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h3 className="font-bold text-ink-900">{tr("mortgage_title", lang)}</h3>
      <p className="mt-0.5 text-xs text-ink-400">{tr("mortgage_sub", lang)}</p>

      <div className="mt-4 space-y-3">
        {slider(tr("down_payment", lang), `${downPct}% · ${formatPrice(down, lang)}`, 0, 80, 5, downPct, setDownPct)}
        {slider(tr("interest_rate", lang), `${rate.toFixed(1)}%`, 2, 12, 0.1, rate, setRate)}
        {slider(tr("loan_term", lang), `${years} ${tr("years_short", lang)}`, 5, 30, 1, years, setYears)}
      </div>

      <div className="mt-4 rounded-xl bg-ink-900 px-4 py-3 text-white">
        <div className="text-xs text-white/60">{tr("monthly_payment", lang)}</div>
        <div className="text-2xl font-black tracking-tight">
          {formatPrice(monthly, lang)}
          <span className="text-sm font-semibold text-white/60">{tr("per_month", lang)}</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-400">
        <span>{tr("loan_amount", lang)}</span>
        <span className="font-medium text-ink-600">{formatPrice(loan, lang)}</span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-ink-400">{tr("mortgage_disclaimer", lang)}</p>
    </div>
  );
}
