/**
 * Kiemelés-árak EGYETLEN forrása. A /pricing oldal, a PromoteButton és (érték
 * szerint tükrözve) a `stripe-checkout` edge function is INNEN dolgozik, hogy az
 * árak SOHA ne csúszhassanak szét (a felhasználónak ígért ár = a ténylegesen
 * számlázott ár).
 *
 * FONTOS: az edge function (Deno) nem tudja importálni ezt a fájlt, ezért ott a
 * `PLANS[...].amount` cent-értéket KÉZZEL kell szinkronban tartani az itteni
 * `cents` mezővel (feature_7d = 500, feature_30d = 1500).
 */
export interface BoostPlan {
  id: "feature_7d" | "feature_30d";
  days: number;
  /** Ár euróban (megjelenítéshez). */
  eur: number;
  /** Ár centben (Stripe unit_amount — az edge functionnel egyeznie kell). */
  cents: number;
  labelKey: "promote_7d" | "promote_30d";
}

export const BOOST_PLANS: BoostPlan[] = [
  { id: "feature_7d", days: 7, eur: 5, cents: 500, labelKey: "promote_7d" },
  { id: "feature_30d", days: 30, eur: 15, cents: 1500, labelKey: "promote_30d" }
];

/** Ár szövegesen, pl. „5 €". */
export const boostPriceLabel = (p: BoostPlan): string => `${p.eur} €`;
