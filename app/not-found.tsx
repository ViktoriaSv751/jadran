"use client";

import Link from "next/link";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/** Lokalizált, márkázott 404-oldal. */
export default function NotFound() {
  const { lang } = useLang();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
        <Icon name="compass" size={30} strokeWidth={2} />
      </span>
      <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-900">{tr("nf_title", lang)}</h1>
      <p className="mt-2 text-sm text-ink-500">{tr("nf_body", lang)}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {tr("nf_home", lang)}
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-900"
        >
          <Icon name="search" size={15} /> {tr("search", lang)}
        </Link>
      </div>
    </div>
  );
}
