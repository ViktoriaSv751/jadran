"use client";

import { useEffect } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { useLogoutConfirm, closeLogoutConfirm, toast } from "@/lib/ui";
import Icon from "@/components/ui/Icon";

/**
 * App-szintű kijelentkezés-megerősítő. A layout gyökerében ül, így NEM része a
 * fejléc-menünek (ami minden kattintásra bezárul + `backdrop-blur` miatt saját
 * containing block-ot ad). Ezért a kijelentkezés mindig megbízhatóan működik.
 */
export default function LogoutConfirmHost() {
  const open = useLogoutConfirm();
  const { lang } = useLang();
  const { logout } = useAuth();

  // Amíg nyitva van: a mögöttes oldal NE legyen görgethető (fix, stabil).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const confirm = async () => {
    closeLogoutConfirm();
    await logout();
    toast(tr("logout_done", lang), "success");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 100% fehér, fix háttér — a mögöttes oldal egyáltalán nem látszik. */}
      <div className="absolute inset-0 bg-white" onClick={closeLogoutConfirm} />
      <div className="animate-pop-in relative w-full max-w-sm rounded-3xl border-2 border-ink-950 bg-white p-6 text-center shadow-pop">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <Icon name="key" size={22} strokeWidth={2} />
        </span>
        <h3 className="mt-3 text-lg font-black tracking-tight text-ink-900">{tr("logout_confirm_title", lang)}</h3>
        <p className="mt-1 text-sm text-ink-500">{tr("logout_confirm_body", lang)}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={closeLogoutConfirm}
            className="flex-1 rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            {tr("cancel", lang)}
          </button>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            {tr("logout", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
