import type { Lang } from "./types";

function localeFor(lang: Lang): string {
  switch (lang) {
    case "ru":
      return "ru-RU";
    case "me":
      return "sr-Latn";
    case "hu":
      return "hu-HU";
    default:
      return "en-GB";
  }
}

export function formatPrice(value: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: 0 }).format(value);
}

/** Rövidített szám (pl. 1,2 M / 12,3 E) — nagy értékekhez, hogy sose lógjon ki
 *  a blokkból (Instagram-stílus). 10 000 alatt normál, tagolt szám. */
export function formatCompact(value: number, lang: Lang = "en"): string {
  if (Math.abs(value) < 10000) return formatNumber(value, lang);
  return new Intl.NumberFormat(localeFor(lang), {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function distanceLabel(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

export function pricePerM2(price: number, area: number): number {
  if (!area) return 0;
  return Math.round(price / area);
}
