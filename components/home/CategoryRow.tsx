"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Icon from "@/components/ui/Icon";

// Each category is a playful 3D icon on a light tile — bold, friendly and
// instantly scannable. The icon is `object-contain` so the sticker art is
// never cropped, with the label sitting below in confident dark type.
const cats: { type: string; labelKey: string; img: string }[] = [
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

const PREVIEW = 6;

export default function CategoryRow() {
  const { lang } = useLang();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? cats : cats.slice(0, PREVIEW);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {visible.map((c) => (
          <button
            key={c.type}
            onClick={() => router.push(`/search?type=${c.type}`)}
            className="group flex flex-col items-center rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-ink-50 p-3 text-center shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            <span className="relative aspect-square w-full overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.img}
                alt={tr(c.labelKey, lang)}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain transition duration-500 group-hover:scale-110"
              />
            </span>
            <span className="mt-2 text-sm font-bold leading-tight text-ink-900 sm:text-base">
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
