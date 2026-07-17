import type { Lang } from "./types";

/**
 * Pénznem-réteg. A rendszer KANONIKUS pénzneme az EUR — minden ár, m²-ár,
 * piaci és hitel-számítás EUR-ban tárolódik és számol. A felhasználó választhat
 * MEGJELENÍTÉSI pénznemet; ez csak a kijelzést váltja át (a belső számítás EUR
 * marad), így minden konzisztens és hibamentes.
 */

export type CurrencyCode = "EUR" | "USD" | "TRY" | "RSD" | "ALL" | "IDR";

export interface CurrencyInfo {
  code: CurrencyCode;
  flag: string;
  label: string;
  /** 1 EUR = rate egység az adott pénznemből. Tájékoztató (indikatív) árfolyam;
   *  éles környezetben napi feedhez köthető (lásd db `payments.currency`). */
  rate: number;
  /** Az `Intl.NumberFormat` maximumFractionDigits kijelzéshez. */
  decimals: 0;
}

// Indikatív árfolyamok (2026). Kizárólag kijelzéshez — a tárolt érték EUR.
export const CURRENCIES: CurrencyInfo[] = [
  { code: "EUR", flag: "🇪🇺", label: "Euro", rate: 1, decimals: 0 },
  { code: "USD", flag: "🇺🇸", label: "US dollar", rate: 1.08, decimals: 0 },
  { code: "TRY", flag: "🇹🇷", label: "Türk lirası", rate: 38, decimals: 0 },
  { code: "RSD", flag: "🇷🇸", label: "Srpski dinar", rate: 117, decimals: 0 },
  { code: "ALL", flag: "🇦🇱", label: "Lek shqiptar", rate: 100, decimals: 0 },
  { code: "IDR", flag: "🇮🇩", label: "Rupiah", rate: 17000, decimals: 0 }
];

export const CURRENCY_BY_CODE: Record<CurrencyCode, CurrencyInfo> = CURRENCIES.reduce(
  (acc, c) => ((acc[c.code] = c), acc),
  {} as Record<CurrencyCode, CurrencyInfo>
);

export const isCurrencyCode = (v: unknown): v is CurrencyCode =>
  typeof v === "string" && v in CURRENCY_BY_CODE;

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

/** EUR összeg átváltása a cél-pénznembe (kerekítve). */
export function convertFromEur(eur: number, code: CurrencyCode): number {
  const info = CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE.EUR;
  return eur * info.rate;
}

/**
 * EUR összeg formázása a MEGJELENÍTÉSI pénznemben, a felület nyelvének
 * megfelelő tagolással. Ez a rendszer egyetlen ár-formázó belépési pontja.
 */
export function formatMoney(eur: number, code: CurrencyCode, lang: Lang = "en"): string {
  const info = CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE.EUR;
  const value = convertFromEur(eur, code);
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: info.code,
    maximumFractionDigits: info.decimals,
    // Nagy nem-EUR értékeknél (TRY/RSD/IDR) tömör jelölés, hogy sose lógjon ki.
    notation: value >= 10_000_000 ? "compact" : "standard",
    maximumSignificantDigits: value >= 10_000_000 ? 4 : undefined
  }).format(value);
}
