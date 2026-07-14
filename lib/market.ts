/**
 * Piaci intelligencia — tiszta számítások a hirdetésállomány felett.
 *
 * Ez a Proopify differenciátora: mivel az eladó ÉS kiadó hirdetések egy
 * adatbázisban élnek, bérleti komparábilisekből hozamot tudunk becsülni
 * minden eladó ingatlanra — ezt a globális portálok többsége nem tudja.
 * Minden függvény pure: a betöltött Listing[] tömbön dolgozik.
 */
import type { Listing } from "./types";

/** Átlagos havi bérleti díj €/m² egy városban (kevés adatnál országos átlag). */
export function cityRentPerM2(city: string, all: Listing[]): number {
  const pick = (pool: Listing[]) =>
    pool.filter((l) => l.mode === "rent" && l.status === "active" && l.area > 0);
  let comps = pick(all.filter((l) => l.city === city));
  if (comps.length < 2) comps = pick(all); // kevés helyi adat → szélesebb bázis
  if (!comps.length) return 0;
  return comps.reduce((a, l) => a + l.price / l.area, 0) / comps.length;
}

/** Becsült havi bérleti díj egy (eladó) ingatlanra a bérleti komparábilisekből. */
export function estimateMonthlyRent(l: Listing, all: Listing[]): number {
  if (l.area <= 0) return 0;
  const perM2 = cityRentPerM2(l.city, all);
  return Math.round(perM2 * l.area);
}

/** Bruttó éves hozam % (12 × becsült bérleti díj / vételár). Csak lakhatóra. */
export function grossYield(l: Listing, all: Listing[]): number | null {
  if (l.mode !== "sale" || l.price <= 0) return null;
  if (l.type === "land" || l.type === "agricultural" || l.type === "industrial") return null;
  const rent = estimateMonthlyRent(l, all);
  if (!rent) return null;
  return Math.round(((12 * rent) / l.price) * 1000) / 10; // 1 tizedes
}

/* ----------------------------- Bérbeadási hozam-becslő ----------------------------- */

/** Tengerparti / turisztikai települések — itt erős a rövid-távú (Airbnb) piac. */
const COASTAL_TOWNS = new Set([
  "Budva", "Kotor", "Tivat", "Herceg Novi", "Bar", "Ulcinj", "Sveti Stefan",
  "Petrovac", "Bečići", "Sutomore", "Dobrota", "Perast", "Risan", "Igalo",
  "Bijela", "Rafailovići", "Rafailović", "Pržno", "Przno", "Kumbor", "Đenovići"
]);

/** Ingatlantípus-szorzó a rövid-távú kiadásban (nagyobb/prémium → jobb hozam). */
const STR_TYPE_FACTOR: Record<string, number> = {
  villa: 1.18,
  house: 1.1,
  new: 1.06,
  apartment: 1.0,
  hospitality: 1.2,
  commercial: 0.8,
  office: 0.7
};

export interface RentalEstimate {
  city: string;
  coastal: boolean;
  area: number;
  /** Hosszú táv: egy bérlőnek, havi (€). */
  longTermMonthly: number;
  longTermAnnual: number;
  /** Rövid táv (Airbnb): átlagos éjszakai díj (€). */
  nightly: number;
  nightlyPeak: number; // főszezon (nyár)
  nightlyOff: number; // holtszezon
  occupancyPct: number; // becsült éves kihasználtság
  strMonthlyGross: number; // Airbnb havi bruttó (átlag)
  strAnnualGross: number; // Airbnb éves bruttó
  /** Mennyivel hoz többet az Airbnb az egész éves hosszú-távúhoz képest (%). */
  strVsLtrPct: number;
  /** Volt-e valódi bérleti komparábilis, vagy alapértelmezett kulcsszámmal becsültünk. */
  estimated: boolean;
}

/**
 * Bérbeadási hozam-becslő egy adott városra + típusra + alapterületre.
 *
 * A hosszú-távú havi díjat a helyi bérleti komparábilisekből (€/m²) számoljuk;
 * ha nincs elég helyi adat, tengerparti/szárazföldi alapértékből. A rövid-távú
 * (Airbnb) számokat ebből vezetjük le egy napi-díj szorzóval + becsült szezonális
 * kihasználtsággal — Montenegró parti piacára hangolva. Minden szám BECSLÉS.
 */
export function rentalEstimate(
  city: string,
  area: number,
  type: string,
  all: Listing[]
): RentalEstimate {
  const coastal = COASTAL_TOWNS.has(city);
  const a = Math.max(0, area);

  // €/m²/hó hosszú-távú bérleti kulcs — helyi komparábilis, vagy alapérték.
  let perM2 = cityRentPerM2(city, all);
  if (!perM2 || perM2 <= 0) perM2 = coastal ? 11 : 6.5;

  const typeFactor = STR_TYPE_FACTOR[type] ?? 0.9;

  const longTermMonthly = Math.round(perM2 * a);
  const longTermAnnual = longTermMonthly * 12;

  // Rövid-táv: a napi díj a hosszú-távú napi (havi/30) többszöröse. Parti
  // turisztikai piacon lényegesen magasabb; a típus is módosít.
  const strDailyMultiplier = (coastal ? 3.2 : 1.9) * typeFactor;
  const nightly = Math.round((longTermMonthly / 30) * strDailyMultiplier);
  const nightlyPeak = Math.round(nightly * 1.7);
  const nightlyOff = Math.round(nightly * 0.55);

  const occupancyPct = coastal ? 62 : 47;
  const strMonthlyGross = Math.round((nightly * 30 * occupancyPct) / 100);
  const strAnnualGross = strMonthlyGross * 12;

  const strVsLtrPct = longTermAnnual > 0 ? Math.round((strAnnualGross / longTermAnnual - 1) * 100) : 0;

  return {
    city,
    coastal,
    area: a,
    longTermMonthly,
    longTermAnnual,
    nightly,
    nightlyPeak,
    nightlyOff,
    occupancyPct,
    strMonthlyGross,
    strAnnualGross,
    strVsLtrPct,
    estimated: true
  };
}

export interface DealScoreBreakdown {
  score: number; // 0-100
  vsCityAvgPct: number; // €/m² eltérés a városátlagtól (negatív = olcsóbb)
  priceDropped: boolean;
  verified: boolean;
}

/** Ár/m² városátlag (eladó, nem telek). */
export function cityAvgPpm2(city: string, all: Listing[]): number {
  const inCity = all.filter(
    (l) => l.city === city && l.mode === "sale" && l.status === "active" && l.type !== "land" && l.area > 0
  );
  if (!inCity.length) return 0;
  return inCity.reduce((a, l) => a + l.price / l.area, 0) / inCity.length;
}

/**
 * Deal Score 0–100: mennyire jó vétel a hirdetés a piaci kontextusában.
 * Összetevők: ár/m² a városátlaghoz (±30), árcsökkentés (+10),
 * hitelesítés (+10/+5), állapot (+5), frissesség (+5). Bázis: 50.
 */
export function dealScore(l: Listing, all: Listing[]): DealScoreBreakdown | null {
  if (l.mode !== "sale" || l.area <= 0) return null;
  const avg = cityAvgPpm2(l.city, all);
  if (!avg) return null;
  const ppm2 = l.price / l.area;
  const diffPct = ((ppm2 - avg) / avg) * 100;

  let score = 50;
  // Olcsóbb a városátlagnál → pont; drágább → levonás. ±30 pontra vágva.
  score += Math.max(-30, Math.min(30, -diffPct * 1.2));

  const dropped =
    l.priceHistory.length >= 2 &&
    l.priceHistory[l.priceHistory.length - 1].price < l.priceHistory[0].price;
  if (dropped) score += 10;

  if (l.verification === "full") score += 10;
  else if (l.verification === "deed") score += 5;

  if (l.condition === "new" || l.condition === "renovated") score += 5;

  const ageDays = (Date.now() - +new Date(l.createdAt)) / 86400000;
  if (ageDays < 30) score += 5;

  return {
    score: Math.max(5, Math.min(98, Math.round(score))),
    vsCityAvgPct: Math.round(diffPct),
    priceDropped: dropped,
    verified: l.verification !== "none"
  };
}

export interface PriceDrop {
  listing: Listing;
  from: number;
  to: number;
  dropPct: number;
}

/** Árcsökkentett hirdetések, a legnagyobb vágással elöl. */
export function priceDrops(all: Listing[]): PriceDrop[] {
  const out: PriceDrop[] = [];
  for (const l of all) {
    if (l.status !== "active" || l.priceHistory.length < 2) continue;
    const from = l.priceHistory[0].price;
    const to = l.priceHistory[l.priceHistory.length - 1].price;
    if (to < from) {
      out.push({ listing: l, from, to, dropPct: Math.round(((from - to) / from) * 100) });
    }
  }
  return out.sort((a, b) => b.dropPct - a.dropPct);
}

export interface CityMarketStats {
  city: string;
  saleCount: number;
  rentCount: number;
  avgPpm2: number;
  avgRentPerM2: number;
  avgYield: number | null;
  byType: { type: string; count: number }[];
}

/** Összefoglaló piaci statisztika egy városra. */
export function cityMarketStats(city: string, all: Listing[]): CityMarketStats {
  const active = all.filter((l) => l.status === "active" && l.city === city);
  const sale = active.filter((l) => l.mode === "sale");
  const rent = active.filter((l) => l.mode === "rent");

  const yields = sale
    .map((l) => grossYield(l, all))
    .filter((y): y is number => y != null);

  const typeCounts = new Map<string, number>();
  for (const l of active) typeCounts.set(l.type, (typeCounts.get(l.type) ?? 0) + 1);

  return {
    city,
    saleCount: sale.length,
    rentCount: rent.length,
    avgPpm2: Math.round(cityAvgPpm2(city, all)),
    avgRentPerM2: Math.round(cityRentPerM2(city, all) * 10) / 10,
    avgYield: yields.length
      ? Math.round((yields.reduce((a, y) => a + y, 0) / yields.length) * 10) / 10
      : null,
    byType: Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  };
}
