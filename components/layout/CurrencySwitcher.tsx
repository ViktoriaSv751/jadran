"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrency, useLang } from "@/lib/store";
import { CURRENCIES } from "@/lib/currency";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/**
 * Pénznem-váltó — a fejlécben, a nyelvváltó mellett. A KANONIKUS ár EUR;
 * ez csak a MEGJELENÍTÉSI pénznemet váltja (minden ár azonnal frissül a
 * `useMoney` hookon keresztül). Egyszerű, kattintásra záródó lenyíló.
 */
export default function CurrencySwitcher() {
  const { lang } = useLang();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={tr("currency", lang)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-2 text-sm font-bold text-ink-800 transition hover:border-ink-400"
      >
        {currency}
        <Icon name="chevronDown" size={14} strokeWidth={2.4} className="text-ink-400" />
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-white py-2 shadow-pop">
          <div className="px-4 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {tr("choose_currency", lang)}
          </div>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition hover:bg-ink-50 ${
                currency === c.code ? "font-bold text-ink-900" : "text-ink-600"
              }`}
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="w-9 font-mono text-xs font-bold text-ink-500">{c.code}</span>
              <span className="min-w-0 flex-1 truncate">{c.label}</span>
              {currency === c.code && <Icon name="check" size={15} className="ml-auto text-emerald-500" />}
            </button>
          ))}
          <p className="mt-1 border-t border-ink-100 px-4 pb-1 pt-2 text-[10px] leading-snug text-ink-400">
            {tr("currency_note", lang)}
          </p>
        </div>
      )}
    </div>
  );
}
