"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon, { type IconName } from "@/components/ui/Icon";

// Letisztult kategória-csempék: egységes vonalikon halvány korongon, alatta
// magabiztos felirat — a korábbi 3D matricák helyett egyetlen vizuális nyelv.
const cats: { type: string; labelKey: string; icon: IconName }[] = [
  { type: "apartment", labelKey: "cat_apartment", icon: "building" },
  { type: "house", labelKey: "cat_house", icon: "home" },
  { type: "villa", labelKey: "cat_villa", icon: "villa" },
  { type: "new", labelKey: "cat_new", icon: "sparkles" },
  { type: "land", labelKey: "cat_land", icon: "plot" },
  { type: "commercial", labelKey: "cat_commercial", icon: "store" },
  { type: "office", labelKey: "cat_office", icon: "briefcase" },
  { type: "hospitality", labelKey: "cat_hospitality", icon: "bed" },
  { type: "institution", labelKey: "cat_institution", icon: "landmark" },
  { type: "garage", labelKey: "cat_garage", icon: "warehouse" },
  { type: "industrial", labelKey: "cat_industrial", icon: "factory" },
  { type: "agricultural", labelKey: "cat_agricultural", icon: "sprout" }
];

const PREVIEW = 6;

export default function CategoryRow() {
  const { lang } = useLang();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? cats : cats.slice(0, PREVIEW);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {visible.map((c) => (
          <button
            key={c.type}
            onClick={() => router.push(`/search?type=${c.type}`)}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white px-3 py-5 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-50 text-ink-700 transition group-hover:bg-ink-900 group-hover:text-white">
              <Icon name={c.icon} size={24} strokeWidth={1.7} />
            </span>
            <span className="text-sm font-semibold leading-tight text-ink-900">
              {tr(c.labelKey, lang)}
            </span>
          </button>
        ))}
      </div>

      {cats.length > PREVIEW && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-2.5 text-sm font-bold text-ink-800 shadow-soft transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
          >
            {expanded ? tr("show_less", lang) : tr("show_more", lang)}
            <Icon
              name="chevronDown"
              size={16}
              strokeWidth={2.4}
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
