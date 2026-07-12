"use client";

import { useState } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

/**
 * Kijelentkezés gomb — MINDIG megerősítést kér (nem léptet ki azonnal).
 * Újrahasznosítható: a profil oldal és a fejléc-menü is ezt használja.
 */
export default function LogoutButton({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { lang } = useLang();
  const { logout } = useAuth();
  const [ask, setAsk] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setAsk(true)} className={className}>
        {children}
      </button>

      {ask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white" onClick={() => setAsk(false)} />
          <div className="animate-pop-in relative w-full max-w-sm rounded-3xl border-2 border-ink-950 bg-white p-6 text-center shadow-pop">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <Icon name="key" size={22} strokeWidth={2} />
            </span>
            <h3 className="mt-3 text-lg font-black tracking-tight text-ink-900">{tr("logout_confirm_title", lang)}</h3>
            <p className="mt-1 text-sm text-ink-500">{tr("logout_confirm_body", lang)}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setAsk(false)}
                className="flex-1 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                {tr("cancel", lang)}
              </button>
              <button
                onClick={() => {
                  setAsk(false);
                  void logout();
                }}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                {tr("logout", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
