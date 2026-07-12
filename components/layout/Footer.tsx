"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";

/**
 * Lábléc — MINDEN oldalon látszik. Mobilon csak a logó + PROOPIFY név
 * (középen); a navigációs linkek csak asztali nézetben. Nincs felső
 * elválasztó vonal. Az alsó padding gondoskodik róla, hogy a fix alsó
 * menüsor ne vágja le a tartalmat mobilon.
 */
export default function Footer() {
  const { lang } = useLang();
  return (
    <footer className="mt-8 bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-sm text-ink-500 lg:flex-row lg:justify-between">
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
          <Link href="/listings/new" className="hover:text-ink-900">
            {tr("become_host", lang)}
          </Link>
          <Link href="/favorites" className="hover:text-ink-900">
            {tr("favorites", lang)}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
