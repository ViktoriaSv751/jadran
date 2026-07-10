"use client";

import React from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { openAuth } from "@/lib/ui";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

/** Gates a page behind authentication, showing a friendly prompt otherwise. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { lang } = useLang();

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">{tr("loading", lang)}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
          <Icon name="shield" size={28} />
        </div>
        <p className="text-base font-semibold text-ink-800">{tr("login_to_contact", lang)}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => openAuth("login")}>{tr("login", lang)}</Button>
          <Button variant="outline" onClick={() => openAuth("register")}>
            {tr("register", lang)}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
