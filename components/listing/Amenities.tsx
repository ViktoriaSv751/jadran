"use client";

import { useState } from "react";
import type { Amenity } from "@/lib/types";
import { useLang } from "@/lib/store";
import { tr, amenityLabels } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

export default function Amenities({ amenities }: { amenities: Amenity[] }) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  if (amenities.length === 0) return null;

  const shown = expanded ? amenities : amenities.slice(0, 8);

  return (
    <section className="mt-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        <span className="h-5 w-1 rounded-full bg-brand-500" />
        {tr("what_offered", lang)}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((a) => {
          const meta = amenityLabels[a];
          if (!meta) return null;
          return (
            <div
              key={a}
              className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-card"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-50 text-xl">
                {meta.icon}
              </span>
              <span className="min-w-0 text-sm font-semibold text-ink-800">{meta[lang]}</span>
            </div>
          );
        })}
      </div>

      {amenities.length > 8 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-bold text-ink-800 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
        >
          {expanded ? tr("show_less", lang) : tr("show_more", lang)}
          <Icon
            name="chevronDown"
            size={15}
            strokeWidth={2.4}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </section>
  );
}
