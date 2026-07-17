"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import { FOREIGN_BUYER } from "@/lib/legal";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import type { CountryCode } from "@/lib/types";
import Icon from "@/components/ui/Icon";

/**
 * ORSZÁGONKÉNTI, összecsukható tájékoztató külföldi vevőknek.
 * TÁJÉKOZTATÓ JELLEGŰ — nem jogi tanácsadás. A tartalom a `lib/legal.ts`-ből
 * jön, a felület nyelvére feloldva (`loc`).
 */
export default function ForeignBuyerInfo({ country }: { country: CountryCode }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  const info = FOREIGN_BUYER[country] ?? FOREIGN_BUYER.ME;
  const countryInfo = COUNTRY_BY_CODE[country];

  return (
    <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
            {countryInfo ? <span className="text-base leading-none">{countryInfo.flag}</span> : <Icon name="globe" size={16} />}
          </span>
          {tr("foreign_title", lang)}
          {countryInfo && <span className="text-ink-400">· {tr(countryInfo.nameKey, lang)}</span>}
        </span>
        <Icon name={open ? "minus" : "plus"} size={18} className="shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink-500">{loc(info.intro, lang)}</p>
          <ul className="space-y-2">
            {info.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-700">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{loc(p, lang)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-ink-400">{tr("foreign_disclaimer", lang)}</p>
        </div>
      )}
    </section>
  );
}
