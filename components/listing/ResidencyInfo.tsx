"use client";

import { useLang } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import { RESIDENCY } from "@/lib/legal";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import type { CountryCode } from "@/lib/types";
import Icon from "@/components/ui/Icon";

/**
 * Letelepedés / állampolgárság a hirdetés országa + ára alapján. A vételár EUR
 * (kanonikus); ha meghaladja az ország állampolgársági küszöbét, kiemelt zöld
 * jelvényt kap. Tájékoztató jellegű.
 */
export default function ResidencyInfo({
  country,
  priceEur
}: {
  country: CountryCode;
  priceEur: number;
}) {
  const { lang } = useLang();
  const info = RESIDENCY[country];
  if (!info) return null;

  const country_ = COUNTRY_BY_CODE[country];
  const eligible = info.citizenshipEur != null && priceEur >= info.citizenshipEur;

  return (
    <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name="globe" size={16} />
        </span>
        {tr("residency_title", lang)}
        {country_ && <span className="text-ink-400">· {tr(country_.nameKey, lang)}</span>}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-ink-600">{loc(info.residenceNote, lang)}</p>

      {info.citizenshipNote && (
        eligible ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
            <div>
              <div className="text-sm font-bold text-emerald-700">{tr("citizenship_eligible", lang)}</div>
              <p className="mt-0.5 text-xs text-emerald-700/80">{loc(info.citizenshipNote, lang)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-500">
            <Icon name="globe" size={14} className="mt-0.5 shrink-0 text-ink-400" />
            {loc(info.citizenshipNote, lang)}
          </p>
        )
      )}
    </section>
  );
}
