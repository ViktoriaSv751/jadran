import { transferTaxFor } from "./geo";

/**
 * Montenegró-specifikus ingatlan-számítások és konstansok.
 * Egy helyen, hogy a vételi mellékköltség és a hiteltörlesztés minden
 * komponensben egységes legyen.
 */

/** Vételi mellékköltség kulcsok (Montenegró). */
export const MNE_COSTS = {
  /** Ingatlanátírási adó — a LEGALSÓ sáv kulcsa. 2024 óta progresszív, ezért a
   *  tényleges összeget a geo.ts `transferTaxFor()` függvénye adja. */
  transferTaxRate: 0.03,
  /** Közjegyző (közelítő), + fix illeték. */
  notaryRate: 0.005,
  notaryFixed: 200,
  /** Ügyvéd / jogi átvizsgálás (közelítő). */
  lawyerRate: 0.01,
  /** Ügynöki jutalék (jellemzően a vevő is fizethet, opcionális). */
  agencyRate: 0.03
} as const;

export interface PurchaseCosts {
  price: number;
  transferTax: number;
  notary: number;
  lawyer: number;
  agency: number;
  total: number;
}

/**
 * Vételi mellékköltségek bontása. Az ügynöki jutalék alapból KI van hagyva
 * az összesből (opcionális), hogy egyezzen a korábbi számítással.
 */
export function purchaseCosts(price: number, includeAgency = false): PurchaseCosts {
  // A montenegrói átírási adó 2024 óta PROGRESSZÍV (3/5/6%), ezért nem szorzunk
  // fix kulccsal — a sávos számítás a lib/geo.ts egyetlen igazságforrásából jön.
  const transferTax = transferTaxFor("ME", price);
  const notary = Math.round(price * MNE_COSTS.notaryRate) + MNE_COSTS.notaryFixed;
  const lawyer = Math.round(price * MNE_COSTS.lawyerRate);
  const agency = Math.round(price * MNE_COSTS.agencyRate);
  const total = price + transferTax + notary + lawyer + (includeAgency ? agency : 0);
  return { price, transferTax, notary, lawyer, agency, total };
}

/**
 * Havi annuitásos törlesztő. principal = felvett hitel (EUR),
 * annualRatePct = éves kamat %-ban, years = futamidő években.
 */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (n <= 0 || principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principal / n);
  const m = (principal * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(m);
}

/** Ésszerű alapértékek a montenegrói piachoz. */
export const MORTGAGE_DEFAULTS = {
  downPct: 30, // önerő %
  ratePct: 6, // éves kamat %
  years: 20 // futamidő
} as const;
