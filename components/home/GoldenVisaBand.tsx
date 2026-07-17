"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { GOLDEN_VISA_COUNTRIES } from "@/lib/geo";
import Icon from "@/components/ui/Icon";

/**
 * Golden Visa kiemelt sáv (egyedi differenciátor): ingatlanbefektetéssel
 * letelepedés/állampolgárság. Országonként mutatja a küszöböt és a típust,
 * és a Golden Visa-szűrt keresőbe visz.
 */
export default function GoldenVisaBand() {
  const { lang } = useLang();
  if (GOLDEN_VISA_COUNTRIES.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="overflow-hidden rounded-3xl border-2 border-ink-950 bg-[linear-gradient(120deg,#070708_0%,#0d0d10_42%,#2f3d00_74%,#c8ff00_100%)] p-6 text-white sm:p-8">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl">🛂</div>
          <div>
            <h2 className="display text-2xl text-white sm:text-3xl">{tr("golden_visa_title", lang)}</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/80">{tr("golden_visa_sub", lang)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {GOLDEN_VISA_COUNTRIES.map((c) => (
            <Link
              key={c.code}
              href={`/search?country=${c.code}&goldenVisa=1`}
              className="group rounded-2xl bg-white/10 p-4 text-center backdrop-blur transition hover:bg-white/20"
            >
              <div className="text-3xl leading-none">{c.flag}</div>
              <div className="mt-1.5 text-sm font-bold text-white">{tr(c.nameKey, lang)}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-[#c8ff00]">
                {tr(c.goldenVisa!.kind === "citizenship" ? "gv_kind_citizenship" : "gv_kind_residence", lang)}
              </div>
              <div className="mt-1 text-[11px] text-white/70">
                {tr("golden_visa_from", lang)} {formatNumber(c.goldenVisa!.minEur, lang)} €
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/search?goldenVisa=1"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-black text-ink-950 transition hover:brightness-95"
        >
          {tr("golden_visa_eligible", lang)} <Icon name="arrowRight" size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
