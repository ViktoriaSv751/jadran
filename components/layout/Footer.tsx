"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/geo";

/**
 * Lábléc — MINDEN oldalon látszik. Mobilon csak a logó + PROOPIFY név
 * (középen); a navigációs linkek csak asztali nézetben. Nincs felső
 * elválasztó vonal. Az alsó padding gondoskodik róla, hogy a fix alsó
 * menüsor ne vágja le a tartalmat mobilon.
 */
export default function Footer() {
  const { lang } = useLang();
  const pathname = usePathname();
  // Fókuszált, „app-szerű" oldalak — ott nincs lábléc (a hirdetésfeltöltő és az
  // üzenetek teljes-magasságú chat-nézete).
  if (pathname === "/listings/new" || pathname === "/messages") return null;

  return (
    <footer className="mt-2 bg-white pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 text-sm text-ink-500 lg:flex-row lg:justify-between">
        <Logo size={28} />
        <nav className="hidden flex-wrap justify-center gap-4 lg:flex">
          <Link href="/search" className="hover:text-ink-900">
            {tr("search", lang)}
          </Link>
          <Link href="/market" className="hover:text-ink-900">
            {tr("market_nav", lang)}
          </Link>
          <Link href="/guide" className="hover:text-ink-900">
            {tr("guide", lang)}
          </Link>
          <Link href="/tudastar" className="hover:text-ink-900">
            {tr("knowledge_base", lang)}
          </Link>
          <Link href="/celpontok" className="hover:text-ink-900">
            {tr("destinations_nav", lang)}
          </Link>
          <Link href="/kalkulatorok" className="hover:text-ink-900">
            {tr("calc_page_title", lang)}
          </Link>
          <Link href="/listings/new" className="hover:text-ink-900">
            {tr("become_host", lang)}
          </Link>
          <Link href="/favorites" className="hover:text-ink-900">
            {tr("favorites", lang)}
          </Link>
        </nav>
      </div>

      {/* Ország-katalógus — a logó/név alatt, a lábléc legalján.
          Kettős haszna van: a látogató egy kattintással eljut bármelyik piacra,
          a keresők pedig MINDEN oldalról belső hivatkozást látnak a 12
          ország-landingre (ugyanezt csinálja az Airbnb és a Booking is).
          Ezért látható minden méretben, nem `hidden lg:flex`. */}
      <div className="mx-auto max-w-7xl border-t border-ink-100 px-4 py-6">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {tr("browse_by_country", lang)}
        </span>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-500">
          {COUNTRIES.map((c) => (
            <Link key={c.code} href={`/l/${c.code}`} className="hover:text-ink-900">
              <span className="mr-1">{c.flag}</span>
              {tr(c.nameKey, lang)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
