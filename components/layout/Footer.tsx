"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  return (
    <footer className="mt-8 border-t border-ink-100 bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-ink-700 to-brand-500 text-xs font-black text-white">
            J
          </span>
          <span className="font-bold text-ink-900">JADRAN</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4">
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
