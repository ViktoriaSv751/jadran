"use client";

import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

// "all" keeps a line icon; every concrete type shows its playful 3D sticker so
// the search type selector matches the home "browse by type" tiles.
const cats: { type: string; labelKey: string; img?: string }[] = [
  { type: "", labelKey: "cat_all" },
  { type: "apartment", labelKey: "cat_apartment", img: "/cat/apartment.png" },
  { type: "house", labelKey: "cat_house", img: "/cat/house.png" },
  { type: "villa", labelKey: "cat_villa", img: "/cat/villa.png" },
  { type: "new", labelKey: "cat_new", img: "/cat/new.png" },
  { type: "land", labelKey: "cat_land", img: "/cat/land.png" },
  { type: "commercial", labelKey: "cat_commercial", img: "/cat/commercial.png" },
  { type: "office", labelKey: "cat_office", img: "/cat/office.png" },
  { type: "hospitality", labelKey: "cat_hospitality", img: "/cat/hospitality.png" },
  { type: "institution", labelKey: "cat_institution", img: "/cat/institution.png" },
  { type: "garage", labelKey: "cat_garage", img: "/cat/garage.png" },
  { type: "industrial", labelKey: "cat_industrial", img: "/cat/industrial.png" },
  { type: "agricultural", labelKey: "cat_agricultural", img: "/cat/agricultural.png" }
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
            className={`group flex shrink-0 flex-col items-center gap-1 border-b-2 px-4 py-2 text-xs font-semibold transition ${
              active
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-400 hover:border-ink-200 hover:text-ink-700"
            }`}
          >
            <span className="grid h-10 w-10 place-items-center">
              {c.img ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={c.img}
                  alt={tr(c.labelKey, lang)}
                  loading="lazy"
                  className={`h-10 w-10 object-contain transition ${
                    active ? "scale-100 opacity-100" : "scale-90 opacity-60 grayscale group-hover:scale-100 group-hover:opacity-100 group-hover:grayscale-0"
                  }`}
                />
              ) : (
                <Icon name="compass" size={24} strokeWidth={active ? 2 : 1.8} />
              )}
            </span>
            <span className="whitespace-nowrap">{tr(c.labelKey, lang)}</span>
          </button>
        );
      })}
    </div>
  );
}
