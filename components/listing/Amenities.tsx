"use client";

import { useState } from "react";
import type { Amenity } from "@/lib/types";
import { useLang } from "@/lib/store";
import { tr, amenityLabels } from "@/lib/i18n";

export default function Amenities({ amenities }: { amenities: Amenity[] }) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  if (amenities.length === 0) return null;

  const shown = expanded ? amenities : amenities.slice(0, 8);

  return (
    <section className="mt-7">
      <h2 className="text-lg font-bold text-ink-900">{tr("what_offered", lang)}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((a) => {
          const meta = amenityLabels[a];
          if (!meta) return null;
          return (
            <div key={a} className="flex items-center gap-2.5 text-sm text-ink-700">
              <span className="text-lg">{meta.icon}</span>
              {meta[lang]}
            </div>
          );
        })}
      </div>
      {amenities.length > 8 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 rounded-xl border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
        >
          {expanded ? tr("show_less", lang) : tr("show_more", lang)}
        </button>
      )}
    </section>
  );
}
