"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/store";
import { LANGS, tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/**
 * Nyelvváltó — globe gomb, ami egy Airbnb-szerű nyelvválasztó modált nyit.
 * A 12 támogatott nyelv rácsban, anyanyelvi névvel + zászlóval.
 *
 * A modált `createPortal`-lal a <body>-ba rendereljük: a fejléc `backdrop-blur`
 * (backdrop-filter) tulajdonsága ugyanis saját „containing block"-ot hoz létre,
 * ami elrontaná a `position: fixed` pozícionálását (elcsúszott / használhatatlan
 * felugró ablak mobilon és asztalon is). A portál kiviszi a fejlécből.
 */
export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const current = LANGS.find((l) => l.code === lang);

  useEffect(() => setMounted(true), []);

  // Görgés-zár, amíg a modál nyitva van.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="animate-pop-in relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink-100 bg-white shadow-pop sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <Icon name="globe" size={18} /> {tr("choose_language", lang)}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label={tr("close", lang)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100"
          >
            <Icon name="close" size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                lang === l.code
                  ? "border-ink-900 bg-ink-900/[0.03] ring-2 ring-ink-900/10"
                  : "border-ink-200 hover:border-ink-400 hover:bg-ink-50"
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-900">{l.label}</span>
              </span>
              {lang === l.code && <Icon name="check" size={16} className="ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={tr("language", lang)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-800 transition hover:border-ink-400 ${
          compact ? "px-2.5 py-2" : "px-3 py-2"
        }`}
      >
        <Icon name="globe" size={16} strokeWidth={2} />
        {!compact && <span>{current?.flag}</span>}
      </button>

      {open && mounted && createPortal(modal, document.body)}
    </>
  );
}
