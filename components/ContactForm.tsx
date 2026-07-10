"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function ContactForm({ agency }: { agency: string }) {
  const { lang } = useLang();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        {tr("sent", lang)}
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-3"
    >
      <div className="text-sm font-medium text-ink-500">{agency}</div>
      <input className={input} placeholder={tr("contact_name", lang)} required />
      <input className={input} type="email" placeholder={tr("contact_email", lang)} required />
      <textarea className={input} rows={3} placeholder={tr("contact_msg", lang)} />
      <button className="w-full rounded-xl bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-800">
        {tr("send", lang)}
      </button>
    </form>
  );
}
