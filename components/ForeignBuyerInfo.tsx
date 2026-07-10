"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/**
 * Rövid, összecsukható tájékoztató külföldi vevőknek a montenegrói
 * ingatlanvásárlásról. Tájékoztató jellegű — nem jogi tanácsadás.
 */
export default function ForeignBuyerInfo() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  const points = [
    tr("foreign_p1", lang),
    tr("foreign_p2", lang),
    tr("foreign_p3", lang),
    tr("foreign_p4", lang)
  ];

  return (
    <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="globe" size={16} />
          </span>
          {tr("foreign_title", lang)}
        </span>
        <Icon name={open ? "minus" : "plus"} size={18} className="text-ink-400" />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-ink-500">{tr("foreign_intro", lang)}</p>
          <ul className="space-y-2">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-700">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-ink-400">{tr("foreign_disclaimer", lang)}</p>
        </div>
      )}
    </section>
  );
}
