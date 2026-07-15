"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/store";
import { LANGS, tr, isNativeLang } from "@/lib/i18n";
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

  // Görgés-zár, amíg a modál nyitva van — a HTML és a BODY elemet is lezárjuk,
  // így a mögöttes (fehér) oldal egyáltalán nem görgethető.
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* 100% fehér, fix háttér — a mögöttes oldal nem látszik és nem görgethető. */}
      <div className="absolute inset-0 bg-white" onClick={() => setOpen(false)} />
      {/* A panel MAGASSÁGA korlátozott (max-h), a fejléc fix, a nyelvrács pedig
          a maradék helyen GÖRGETHETŐ. A `min-h-0` elengedhetetlen: enélkül a
          flex-gyerek (a rács) tartalom-magasságúra nő és túlnyúlik/levágódik. */}
      <div className="animate-pop-in relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink-100 bg-white shadow-pop sm:max-h-[80vh] sm:max-w-xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-4">
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
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 overflow-y-auto overscroll-contain p-4 sm:grid-cols-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex min-h-[3.75rem] items-center gap-2.5 rounded-2xl border p-4 text-left transition ${
                lang === l.code
                  ? "border-ink-900 bg-ink-900/[0.03] ring-2 ring-ink-900/10"
                  : "border-ink-200 hover:border-ink-400 hover:bg-ink-50"
              }`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-900">{l.label}</span>
                {!isNativeLang(l.code) && (
                  <span className="mt-0.5 inline-block rounded bg-ink-100 px-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                    {tr("lang_auto_badge", lang)}
                  </span>
                )}
              </span>
              {lang === l.code && <Icon name="check" size={16} className="ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>
        <p className="shrink-0 border-t border-ink-100 px-5 py-3 text-[11px] leading-snug text-ink-400">
          {tr("lang_content_note", lang)}
        </p>
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
