import type { CurrencyCode } from "./currency";

/**
 * Országtaxonómia — a platform globális (Airbnb-szerű) rétege. A hirdetéseknek
 * van egy `country` mezője; minden felület (kereső, szűrő, főoldal, jog,
 * mellékköltség) ehhez igazodik. Az EUR marad a kanonikus tárolási pénznem;
 * a `currency` csak az adott piac ALAPÉRTELMEZETT megjelenítési pénzneme.
 */

export type CountryCode = "ME" | "HR" | "AL" | "RS" | "TR" | "ID";

export interface CountryInfo {
  code: CountryCode;
  flag: string;
  /** i18n kulcs az ország nevéhez (country_me, country_hr, …). */
  nameKey: string;
  /** Az adott piac alapértelmezett megjelenítési pénzneme (tárolás mindig EUR). */
  currency: CurrencyCode;
  /** Népszerű ingatlan-célvárosok (a szűrő + „népszerű helyek" chipek forrása). */
  cities: string[];
  /** Térkép-középpont [lat, lng] és zoom a keresőhöz. */
  center: [number, number];
  zoom: number;
  /** Vételi mellékköltség-kulcsok (átírási adó + közelítő járulékok). */
  costs: PurchaseCostRates;
}

export interface PurchaseCostRates {
  /** Ingatlanátírási / vagyonszerzési adó aránya (használt ingatlan). */
  transferTaxRate: number;
  notaryRate: number;
  notaryFixed: number;
  lawyerRate: number;
  agencyRate: number;
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: "ME",
    flag: "🇲🇪",
    nameKey: "country_me",
    currency: "EUR",
    cities: ["Budva", "Kotor", "Herceg Novi", "Tivat", "Bar", "Ulcinj", "Podgorica", "Cetinje", "Nikšić", "Sutomore"],
    center: [42.44, 18.77],
    zoom: 9,
    costs: { transferTaxRate: 0.03, notaryRate: 0.005, notaryFixed: 200, lawyerRate: 0.01, agencyRate: 0.03 }
  },
  {
    code: "HR",
    flag: "🇭🇷",
    nameKey: "country_hr",
    currency: "EUR",
    cities: ["Dubrovnik", "Split", "Zadar", "Rovinj", "Pula", "Opatija", "Hvar", "Makarska", "Šibenik", "Zagreb"],
    center: [44.2, 16.3],
    zoom: 7,
    costs: { transferTaxRate: 0.03, notaryRate: 0.004, notaryFixed: 150, lawyerRate: 0.01, agencyRate: 0.03 }
  },
  {
    code: "AL",
    flag: "🇦🇱",
    nameKey: "country_al",
    currency: "EUR",
    cities: ["Sarandë", "Vlorë", "Durrës", "Ksamil", "Himarë", "Shëngjin", "Tirana", "Golem"],
    center: [40.5, 19.6],
    zoom: 8,
    costs: { transferTaxRate: 0.0, notaryRate: 0.005, notaryFixed: 120, lawyerRate: 0.01, agencyRate: 0.03 }
  },
  {
    code: "RS",
    flag: "🇷🇸",
    nameKey: "country_rs",
    currency: "EUR",
    cities: ["Beograd", "Novi Sad", "Zlatibor", "Kopaonik", "Niš", "Subotica"],
    center: [44.1, 20.7],
    zoom: 7,
    costs: { transferTaxRate: 0.025, notaryRate: 0.005, notaryFixed: 150, lawyerRate: 0.01, agencyRate: 0.03 }
  },
  {
    code: "TR",
    flag: "🇹🇷",
    nameKey: "country_tr",
    currency: "TRY",
    cities: ["İstanbul", "Antalya", "Alanya", "Bodrum", "Fethiye", "İzmir", "Kuşadası", "Kalkan"],
    center: [38.4, 30.5],
    zoom: 6,
    costs: { transferTaxRate: 0.04, notaryRate: 0.005, notaryFixed: 250, lawyerRate: 0.012, agencyRate: 0.02 }
  },
  {
    code: "ID",
    flag: "🇮🇩",
    nameKey: "country_id",
    currency: "IDR",
    cities: ["Canggu", "Seminyak", "Ubud", "Uluwatu", "Sanur", "Nusa Dua", "Denpasar", "Jimbaran"],
    center: [-8.55, 115.15],
    zoom: 10,
    costs: { transferTaxRate: 0.05, notaryRate: 0.01, notaryFixed: 300, lawyerRate: 0.015, agencyRate: 0.05 }
  }
];

export const COUNTRY_BY_CODE: Record<CountryCode, CountryInfo> = COUNTRIES.reduce(
  (acc, c) => ((acc[c.code] = c), acc),
  {} as Record<CountryCode, CountryInfo>
);

export const COUNTRY_CODES: CountryCode[] = COUNTRIES.map((c) => c.code);

export const isCountryCode = (v: unknown): v is CountryCode =>
  typeof v === "string" && v in COUNTRY_BY_CODE;

/** Minden ismert város → ország kód. A hirdetés-hydratáláshoz és fallbackhez. */
const CITY_TO_COUNTRY: Record<string, CountryCode> = (() => {
  const m: Record<string, CountryCode> = {};
  for (const c of COUNTRIES) for (const city of c.cities) m[city.toLowerCase()] = c.code;
  return m;
})();

/** Egy város országa (kis/nagybetűtől független). Ismeretlen → undefined. */
export function countryOfCity(city: string | undefined | null): CountryCode | undefined {
  if (!city) return undefined;
  return CITY_TO_COUNTRY[city.trim().toLowerCase()];
}

/** Minden népszerű város egy listában (kereső autocomplete-hez). */
export const ALL_CITIES: string[] = COUNTRIES.flatMap((c) => c.cities);
