"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/** Lokalizált, márkázott hibahatár „újratöltés" gombbal. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLang();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <Icon name="bolt" size={30} strokeWidth={2} />
      </span>
      <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-900">{tr("err_page_title", lang)}</h1>
      <p className="mt-2 text-sm text-ink-500">{tr("err_page_body", lang)}</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
      >
        <Icon name="compass" size={15} /> {tr("err_retry", lang)}
      </button>
    </div>
  );
}
