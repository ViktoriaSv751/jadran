import type { CurrencyCode } from "./currency";
import type { CountryCode } from "./types";
export type { CountryCode };

/**
 * Országtaxonómia — a platform globális (Airbnb-szerű) rétege. A hirdetéseknek
 * van egy `country` mezője; minden felület (kereső, szűrő, főoldal, jog,
 * mellékköltség) ehhez igazodik. Az EUR marad a kanonikus tárolási pénznem;
 * a `currency` csak az adott piac ALAPÉRTELMEZETT megjelenítési pénzneme.
 */

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
  /** Golden Visa / letelepedési program ingatlanbefektetés alapján (ha van).
   *  `minEur`: a program küszöbe EUR-ban; `kind`: tartózkodás vagy állampolgárság. */
  goldenVisa?: { minEur: number; kind: "residence" | "citizenship" };
}

/** Egy sáv a progresszív átírási adóban. */
export interface TransferTaxBand {
  /** A sáv felső határa EUR-ban; `null` = a legfelső, nyitott sáv. */
  upTo: number | null;
  /** A sáv határa fölötti részre eső kulcs. */
  rate: number;
  /** A sáv aljáig felhalmozott fix adóösszeg EUR-ban. */
  base: number;
  /** A sáv alsó határa EUR-ban. */
  from: number;
}

export interface PurchaseCostRates {
  /** Ingatlanátírási / vagyonszerzési adó aránya (használt ingatlan).
   *  Progresszív adónál (lásd `transferTaxBands`) ez a LEGALSÓ sáv kulcsa —
   *  a tényleges összeget mindig a `transferTaxFor()` számolja. */
  transferTaxRate: number;
  /** Progresszív (sávos) átírási adó. Ha hiányzik, a `transferTaxRate` lineáris. */
  transferTaxBands?: TransferTaxBand[];
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
    costs: {
      // 2024. január 1. óta PROGRESSZÍV, nem fix 3%: 150 000 €-ig 3%;
      // 150 000–500 000 € között 4 500 € + az 150 000 € feletti rész 5%-a;
      // 500 000 € felett 22 000 € + az 500 000 € feletti rész 6%-a.
      transferTaxRate: 0.03,
      transferTaxBands: [
        { from: 0, upTo: 150000, rate: 0.03, base: 0 },
        { from: 150000, upTo: 500000, rate: 0.05, base: 4500 },
        { from: 500000, upTo: null, rate: 0.06, base: 22000 }
      ],
      notaryRate: 0.005,
      notaryFixed: 200,
      lawyerRate: 0.01,
      agencyRate: 0.03
    }
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
    costs: { transferTaxRate: 0.04, notaryRate: 0.005, notaryFixed: 250, lawyerRate: 0.012, agencyRate: 0.02 },
    goldenVisa: { minEur: 370000, kind: "citizenship" }
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
  },
  {
    code: "HU",
    flag: "🇭🇺",
    nameKey: "country_hu",
    currency: "HUF",
    cities: ["Budapest", "Debrecen", "Szeged", "Siófok", "Balatonfüred", "Hévíz", "Pécs", "Győr", "Sopron", "Eger"],
    center: [47.1, 19.5],
    zoom: 7,
    costs: { transferTaxRate: 0.04, notaryRate: 0.005, notaryFixed: 150, lawyerRate: 0.01, agencyRate: 0.03 }
    // A vendégbefektetői programban KÖZVETLEN lakásvásárlás NEM jogosít: csak
    // ingatlanalap befektetési jegye (250 000 €) vagy felsőoktatási adomány
    // (1 000 000 €). A tervezett közvetlen ingatlan-opciót 2025 januárjában
    // törölték — ezért itt nincs `goldenVisa` mező.
  },
  {
    code: "TH",
    flag: "🇹🇭",
    nameKey: "country_th",
    currency: "THB",
    cities: ["Bangkok", "Phuket", "Pattaya", "Chiang Mai", "Koh Samui", "Krabi", "Hua Hin", "Koh Phangan"],
    center: [13.5, 100.6],
    zoom: 6,
    costs: { transferTaxRate: 0.02, notaryRate: 0.005, notaryFixed: 200, lawyerRate: 0.015, agencyRate: 0.03 }
  },
  {
    code: "IT",
    flag: "🇮🇹",
    nameKey: "country_it",
    currency: "EUR",
    cities: ["Roma", "Milano", "Firenze", "Venezia", "Como", "Napoli", "Olbia", "Palermo", "Torino", "Amalfi"],
    center: [42.5, 12.5],
    zoom: 6,
    costs: { transferTaxRate: 0.09, notaryRate: 0.01, notaryFixed: 300, lawyerRate: 0.01, agencyRate: 0.03 }
  },
  {
    code: "GR",
    flag: "🇬🇷",
    nameKey: "country_gr",
    currency: "EUR",
    cities: ["Athína", "Thessaloniki", "Mykonos", "Santorini", "Chania", "Rhodes", "Corfu", "Glyfada", "Kavala", "Paros"],
    center: [38.5, 23.8],
    zoom: 6,
    costs: { transferTaxRate: 0.03, notaryRate: 0.012, notaryFixed: 300, lawyerRate: 0.012, agencyRate: 0.02 },
    // Sávos küszöb (5100/2024): 800 000 € Attika, Thesszaloniki, Mükonosz,
    // Szantorini és a 3 100 főnél népesebb szigetek; 400 000 € máshol; 250 000 €
    // KIZÁRÓLAG nem lakáscélú épület lakássá alakításánál vagy műemlék-felújításnál.
    // Az általános padlót tároljuk, hogy ne jelezzünk jogosultságot ott, ahol nincs.
    goldenVisa: { minEur: 400000, kind: "residence" }
  },
  {
    code: "ES",
    flag: "🇪🇸",
    nameKey: "country_es_name",
    currency: "EUR",
    cities: ["Madrid", "Barcelona", "Valencia", "Málaga", "Marbella", "Alicante", "Palma", "Sevilla", "Ibiza", "Tenerife"],
    center: [40.0, -3.7],
    zoom: 6,
    costs: { transferTaxRate: 0.08, notaryRate: 0.01, notaryFixed: 300, lawyerRate: 0.01, agencyRate: 0.03 }
    // Az ingatlanalapú spanyol Golden Visát 2025 áprilisában megszüntették —
    // ezért NINCS `goldenVisa` mezője. Ne kerüljön vissza aktív programként.
  },
  {
    code: "KN",
    flag: "🇰🇳",
    nameKey: "country_kn",
    currency: "USD",
    cities: ["Basseterre", "Frigate Bay", "Christophe Harbour", "Charlestown", "Oualie Beach", "Dieppe Bay", "Sandy Point", "Cades Bay"],
    center: [17.3, -62.73],
    zoom: 11,
    costs: { transferTaxRate: 0.1, notaryRate: 0.01, notaryFixed: 500, lawyerRate: 0.015, agencyRate: 0.05 },
    // A világ legrégebbi (1984) állampolgárság-befektetési programja: jóváhagyott
    // ingatlan ~325 000 USD-tól → ÁLLAMPOLGÁRSÁG (nem csak tartózkodás).
    goldenVisa: { minEur: 300000, kind: "citizenship" }
  }
];

/** Golden Visa országok (ingatlanbefektetéssel letelepedés/állampolgárság). */
export const GOLDEN_VISA_COUNTRIES: CountryInfo[] = COUNTRIES.filter((c) => c.goldenVisa);

/** Igaz, ha az adott országban van Golden Visa program (bármely ár). */
export const hasGoldenVisa = (country: CountryCode): boolean => !!COUNTRY_BY_CODE[country]?.goldenVisa;

/** Igaz, ha egy KONKRÉT hirdetés (ország + EUR ár) eléri a Golden Visa küszöböt. */
export function qualifiesGoldenVisa(country: CountryCode, priceEur: number): boolean {
  const gv = COUNTRY_BY_CODE[country]?.goldenVisa;
  return !!gv && priceEur >= gv.minEur;
}

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

/**
 * Az átírási adó ÖSSZEGE egy adott vételárra (EUR).
 *
 * Montenegró 2024 óta progresszív sávos adót alkalmaz, ezért a „vételár ×
 * kulcs" képlet ott érdemi hibát ad: egy 600 000 €-s ingatlannál a régi, fix 3%
 * 18 000 €-t mutatna a valós 28 000 € helyett. Minden kalkulátor ezt hívja.
 */
export function transferTaxFor(country: CountryCode, priceEur: number): number {
  const costs = COUNTRY_BY_CODE[country]?.costs;
  if (!costs) return 0;
  const bands = costs.transferTaxBands;
  if (!bands || bands.length === 0) return Math.round(priceEur * costs.transferTaxRate);

  // A megfelelő sáv: az utolsó olyan, amelynek az alsó határát elérte az ár.
  let band = bands[0];
  for (const b of bands) if (priceEur > b.from) band = b;
  return Math.round(band.base + (priceEur - band.from) * band.rate);
}

/** Igaz, ha az adott ország átírási adója sávos (a felületnek jelezni kell). */
export const hasProgressiveTransferTax = (country: CountryCode): boolean =>
  (COUNTRY_BY_CODE[country]?.costs.transferTaxBands?.length ?? 0) > 0;
