/**
 * Piaci intelligencia — tiszta számítások a hirdetésállomány felett.
 *
 * Ez a Proopify differenciátora: mivel az eladó ÉS kiadó hirdetések egy
 * adatbázisban élnek, bérleti komparábilisekből hozamot tudunk becsülni
 * minden eladó ingatlanra — ezt a globális portálok többsége nem tudja.
 * Minden függvény pure: a betöltött Listing[] tömbön dolgozik.
 */
import type { Listing } from "./types";

/** Hány helyi (adott városbeli) bérleti komparábilis van a becsléshez. */
export function cityRentCompCount(city: string, all: Listing[]): number {
  return all.filter((l) => l.city === city && l.mode === "rent" && l.status === "active" && l.area > 0).length;
}

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

/**
 * Településtípusok — a montenegrói bérleti/Airbnb piac három jól elkülönülő
 * sávja. A „prime" parti gócok (Budva/Kotor/Tivat öble) éjszakai díja és
 * kihasználtsága lényegesen magasabb, mint a másodlagos parti vagy a szárazföldi
 * településeké. A sávok tapasztalati montenegrói piaci értékekre vannak hangolva.
 */
const PRIME_COASTAL = new Set([
  "Budva", "Kotor", "Tivat", "Sveti Stefan", "Bečići", "Dobrota", "Perast",
  "Pržno", "Przno", "Rafailovići", "Rafailović", "Porto Montenegro"
]);
const SECONDARY_COASTAL = new Set([
  "Herceg Novi", "Bar", "Ulcinj", "Petrovac", "Sutomore", "Risan", "Igalo",
  "Bijela", "Kumbor", "Đenovići"
]);
type TownTier = "prime" | "coastal" | "inland";
function townTier(city: string): TownTier {
  if (PRIME_COASTAL.has(city)) return "prime";
  if (SECONDARY_COASTAL.has(city)) return "coastal";
  return "inland";
}

// Hosszú-távú bérleti alapkulcs (€/m²/hó), ha kevés a helyi komparábilis.
const LTR_FALLBACK_PER_M2: Record<TownTier, number> = { prime: 10, coastal: 8, inland: 5.5 };
// Rövid-táv (Airbnb) átlagos éves éjszakai díj €/„effektív m²".
const STR_NIGHTLY_PER_M2: Record<TownTier, number> = { prime: 1.5, coastal: 1.1, inland: 0.6 };
// Becsült éves effektív kihasználtság településtípusonként (%).
const STR_OCCUPANCY: Record<TownTier, number> = { prime: 60, coastal: 52, inland: 40 };
// Airbnb üzemeltetési költséghányad: takarítás + menedzsment + platform-díj +
// rezsi + apró javítások. A bruttóból ennyit visznek el → marad a nettó.
const STR_COST_RATIO = 0.28;

/** Rövid-távú típus-szorzó (nagyobb/prémium egység jobb éjszakai díjat hoz). */
const STR_TYPE_FACTOR: Record<string, number> = {
  villa: 1.22, house: 1.1, new: 1.05, apartment: 1.0, hospitality: 1.2, commercial: 0.8, office: 0.7
};

export type EstimateConfidence = "high" | "medium" | "low";

export interface RentalEstimate {
  city: string;
  coastal: boolean;
  area: number;
  /** Hosszú táv: egy bérlőnek, havi / éves (€). */
  longTermMonthly: number;
  longTermAnnual: number;
  /** Rövid táv (Airbnb): átlagos / főszezoni / holtszezoni éjszakai díj (€). */
  nightly: number;
  nightlyPeak: number;
  nightlyOff: number;
  occupancyPct: number; // becsült éves kihasználtság
  strMonthlyGross: number; // Airbnb havi BRUTTÓ (átlag)
  strAnnualGross: number; // Airbnb éves BRUTTÓ
  strMonthlyNet: number; // Airbnb havi NETTÓ (üzemeltetési költségek után)
  strAnnualNet: number; // Airbnb éves NETTÓ
  costRatioPct: number; // az üzemeltetési költséghányad (%)
  /** Mennyivel hoz többet az Airbnb NETTÓ éves a hosszú-távúhoz képest (%). */
  strVsLtrPct: number;
  estimated: boolean;
  /** Hány helyi bérleti komparábilison alapul a becslés (0 = fix fallback). */
  localComps: number;
  /** A becslés megbízhatósága a rendelkezésre álló helyi adat alapján. */
  confidence: EstimateConfidence;
}

/**
 * Bérbeadási hozam-becslő — Montenegró bérleti/Airbnb piacára hangolva.
 *
 * Hosszú táv: ha van elég helyi bérleti komparábilis (≥3), azok €/m² átlagából;
 * kevés adatnál a településtípus reális alapkulcsából. Rövid táv (Airbnb): reális
 * települési éjszakai díjból (mérethez csökkenő hozammal + típus-szorzóval),
 * szezonális bontással, becsült kihasználtsággal, és üzemeltetési költségek utáni
 * NETTÓ bevétellel. A `confidence` jelzi, mennyi helyi adaton alapul. BECSLÉS.
 */
export function rentalEstimate(
  city: string,
  area: number,
  type: string,
  all: Listing[]
): RentalEstimate {
  const tier = townTier(city);
  const coastal = tier !== "inland";
  const a = Math.max(0, area);
  const localComps = cityRentCompCount(city, all);

  // --- Hosszú táv: elég helyi adatnál komparábilis, egyébként reális fallback. ---
  const comps = cityRentPerM2(city, all);
  const perM2 = localComps >= 3 && comps > 0 ? comps : LTR_FALLBACK_PER_M2[tier];
  const longTermMonthly = Math.round(perM2 * a);
  const longTermAnnual = longTermMonthly * 12;

  // --- Rövid táv (Airbnb): reális éjszakai díj. Az éjszakai díj NEM lineáris a
  //     mérettel (egy 100 m²-es lakás nem 2× egy 50 m²-esé) → csökkenő hozam. ---
  const effArea = a <= 30 ? a : 30 + (a - 30) * 0.55;
  const typeFactor = STR_TYPE_FACTOR[type] ?? 0.9;
  const nightly = Math.round(STR_NIGHTLY_PER_M2[tier] * effArea * typeFactor);
  const nightlyPeak = Math.round(nightly * 1.85); // nyári főszezon
  const nightlyOff = Math.round(nightly * 0.5); // téli holtszezon

  const occupancyPct = STR_OCCUPANCY[tier];
  const strAnnualGross = Math.round(nightly * 365 * (occupancyPct / 100));
  const strMonthlyGross = Math.round(strAnnualGross / 12);
  const strAnnualNet = Math.round(strAnnualGross * (1 - STR_COST_RATIO));
  const strMonthlyNet = Math.round(strAnnualNet / 12);

  // Airbnb NETTÓ vs. hosszú-távú (a hosszú-táv az tulajdonosnak közel nettó).
  const strVsLtrPct = longTermAnnual > 0 ? Math.round((strAnnualNet / longTermAnnual - 1) * 100) : 0;

  const confidence: EstimateConfidence = localComps >= 5 ? "high" : localComps >= 2 ? "medium" : "low";

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
    strMonthlyNet,
    strAnnualNet,
    costRatioPct: Math.round(STR_COST_RATIO * 100),
    strVsLtrPct,
    estimated: true,
    localComps,
    confidence
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
