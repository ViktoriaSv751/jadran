import type { Lang } from "./types";

/**
 * Pénznem-réteg. A rendszer KANONIKUS pénzneme az EUR — minden ár, m²-ár,
 * piaci és hitel-számítás EUR-ban tárolódik és számol. A felhasználó választhat
 * MEGJELENÍTÉSI pénznemet; ez csak a kijelzést váltja át (a belső számítás EUR
 * marad), így minden konzisztens és hibamentes.
 */

export type CurrencyCode = "EUR" | "USD" | "TRY" | "RSD" | "ALL" | "IDR" | "HUF" | "THB" | "AED";

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
  { code: "IDR", flag: "🇮🇩", label: "Rupiah", rate: 17000, decimals: 0 },
  { code: "HUF", flag: "🇭🇺", label: "Magyar forint", rate: 395, decimals: 0 },
  { code: "THB", flag: "🇹🇭", label: "Thai baht", rate: 38, decimals: 0 },
  // Az AED a dollárhoz van rögzítve (1 USD = 3,6725 AED) — innen az EUR-keresztárfolyam.
  { code: "AED", flag: "🇦🇪", label: "UAE dirham", rate: 3.97, decimals: 0 }
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
    case "it":
      return "it-IT";
    case "th":
      return "th-TH";
    default:
      return "en-GB";
  }
}

/** EUR összeg átváltása a cél-pénznembe. `rate` felülírja a statikus árfolyamot
 *  (élő feed). */
export function convertFromEur(eur: number, code: CurrencyCode, rate?: number): number {
  const r = rate ?? (CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE.EUR).rate;
  return eur * r;
}

/* --------------------------- Élő árfolyam-feed --------------------------- */

const FX_CACHE_KEY = "jadran_fx_live";
const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12 óra

/**
 * Élő EUR-alapú árfolyamok lekérése egy INGYENES, kulcs nélküli forrásból
 * (open.er-api.com). localStorage-cache 12 órára. Hiba esetén null → a hívó a
 * statikus (indikatív) árfolyamokra esik vissza. Sosem dob.
 */
export async function fetchLiveRates(): Promise<Partial<Record<CurrencyCode, number>> | null> {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(FX_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { at: number; rates: Record<string, number> };
        if (cached.at && Date.now() - cached.at < FX_TTL_MS) return pickRates(cached.rates);
      }
    }
    const res = await fetch("https://open.er-api.com/v6/latest/EUR");
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (!data.rates) return null;
    try {
      localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ at: Date.now(), rates: data.rates }));
    } catch {
      /* tele a tár — nem baj */
    }
    return pickRates(data.rates);
  } catch {
    return null;
  }
}

function pickRates(all: Record<string, number>): Partial<Record<CurrencyCode, number>> {
  const out: Partial<Record<CurrencyCode, number>> = {};
  for (const c of CURRENCIES) {
    const r = all[c.code];
    // Csak ÉSSZERŰ árfolyamot fogadunk el: pozitív, véges, és a statikus tartalék
    // 0,3×–3× sávjában — így egy hibás/elavult feed nem torzítja az összes árat.
    if (typeof r === "number" && Number.isFinite(r) && r > 0 && r >= c.rate * 0.3 && r <= c.rate * 3) {
      out[c.code] = r;
    }
  }
  return out;
}

/**
 * EUR összeg formázása a MEGJELENÍTÉSI pénznemben, a felület nyelvének
 * megfelelő tagolással. Ez a rendszer egyetlen ár-formázó belépési pontja.
 * A `rate` (ha van) az élő árfolyam; egyébként a statikus indikatív érték.
 */
export function formatMoney(eur: number, code: CurrencyCode, lang: Lang = "en", rate?: number): string {
  const info = CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE.EUR;
  const value = convertFromEur(eur, code, rate);
  return new Intl.NumberFormat(localeFor(lang), {
    style: "currency",
    currency: info.code,
    maximumFractionDigits: info.decimals,
    // Nagy nem-EUR értékeknél (TRY/RSD/IDR) tömör jelölés, hogy sose lógjon ki.
    notation: value >= 10_000_000 ? "compact" : "standard",
    maximumSignificantDigits: value >= 10_000_000 ? 4 : undefined
  }).format(value);
}
