"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import { isFeatured } from "@/lib/mappers";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { toast } from "@/lib/ui";

const PLANS = [
  { id: "feature_7d", price: "9 €", labelKey: "promote_7d" as const },
  { id: "feature_30d", price: "29 €", labelKey: "promote_30d" as const }
];

export default function PromoteButton({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isFeatured(listing)) {
    const days = Math.max(
      1,
      Math.ceil((new Date(listing.featuredUntil!).getTime() - Date.now()) / 86400000)
    );
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
        <Icon name="star" size={12} strokeWidth={2.4} />
        {tr("featured_badge", lang)} · {days} {tr("days_short", lang)}
      </span>
    );
  }

  async function promote(plan: string) {
    if (!supabase) {
      toast(tr("promote_soon", lang));
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: { listingId: listing.id, plan }
    });
    setBusy(false);
    setOpen(false);
    if (error || !data?.url) {
      toast(tr("promote_soon", lang));
      return;
    }
    window.location.href = data.url as string;
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" loading={busy} onClick={() => setOpen((o) => !o)}>
        <Icon name="star" size={14} strokeWidth={2.2} className="mr-1" />
        {tr("promote_cta", lang)}
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-ink-100 bg-white p-1.5 shadow-card">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => promote(p.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
            >
              <span className="font-medium text-ink-800">{tr(p.labelKey, lang)}</span>
              <span className="font-bold text-ink-900">{p.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
