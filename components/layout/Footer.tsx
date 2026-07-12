"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function Footer() {
  const { lang } = useLang();
  const pathname = usePathname();
  // App-jellegű oldalakon mobilon nincs footer (csak asztalin); a hirdetés-
  // adatlapon szintén csak asztalin. A marketing-oldalakon (főoldal, útmutató,
  // piactér) mobilon is látszik.
  const appRoute = /^\/(search|favorites|listing|messages|compare|settings|listings)(\/|$)/.test(
    pathname
  );

  return (
    <footer
      className={`mt-8 border-t border-ink-100 bg-white pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0 ${
        appRoute ? "hidden lg:block" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <Logo size={28} />
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
