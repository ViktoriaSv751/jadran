"use client";

import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon, { type IconName } from "@/components/ui/Icon";

// Egységes vonalikon minden típushoz — a korábbi 3D matricák helyett,
// hogy a teljes felület egyetlen, profi vizuális nyelvet beszéljen.
const cats: { type: string; labelKey: string; icon: IconName }[] = [
  { type: "", labelKey: "cat_all", icon: "compass" },
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

export default function CategoryTabs({
  value,
  onChange
}: {
  value: string;
  onChange: (type: string) => void;
}) {
  const { lang } = useLang();
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
      {cats.map((c) => {
        const active = value === c.type;
        return (
          <button
            key={c.type || "all"}
            onClick={() => onChange(c.type)}
            className={`group flex shrink-0 flex-col items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              active
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-400 hover:border-ink-200 hover:text-ink-700"
            }`}
          >
            <Icon name={c.icon} size={22} strokeWidth={active ? 2 : 1.7} />
            <span className="whitespace-nowrap">{tr(c.labelKey, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}
