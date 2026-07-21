import type { CountryCode, PropertyType } from "./types";
import { COUNTRIES, COUNTRY_BY_CODE, cityFromSlug, citySlug } from "./geo";

/**
 * Facet-landing rendszer (programmatic SEO, „specificitás").
 *
 * A videó tanulsága: minél specifikusabb a (mit + hol) kombináció, annál jobban
 * rangsorol. Ezért az /l/[country]/[facet] második szegmense HÁROMFÉLE dedikált
 * oldalt tud kiszolgálni, mind shallow, kulcsszó-fókuszú URL-en:
 *   - VÁROS:   /l/ME/budva        → „Eladó ingatlan – Budva"
 *   - TÍPUS:   /l/ME/villa         → „Eladó villa – Montenegró"
 *   - SZÁNDÉK: /l/GR/golden-visa   → „Golden Visa ingatlan – Görögország"
 *
 * A slugok (villa, golden-visa, …) garantáltan NEM ütköznek a város-slugokkal,
 * ezért egyetlen dinamikus szegmens is elég — nem kell mélyebb útvonal.
 */

/** Azok az ingatlantípusok, amelyek önálló landing-oldalt kapnak. */
export const TYPE_FACETS: PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "land",
  "commercial",
  "new"
];

/** Ingatlantípus → stabil URL-slug (nyelvfüggetlen token). */
const TYPE_TO_SLUG: Record<string, string> = {
  apartment: "apartment",
  house: "house",
  villa: "villa",
  land: "land",
  commercial: "commercial",
  new: "new-build"
};
const SLUG_TO_TYPE: Record<string, PropertyType> = Object.entries(TYPE_TO_SLUG).reduce(
  (acc, [t, s]) => ((acc[s] = t as PropertyType), acc),
  {} as Record<string, PropertyType>
);

export const typeFacetSlug = (t: PropertyType): string => TYPE_TO_SLUG[t] ?? t;

/** A Golden Visa / állampolgársági szándék-oldal slugja. */
export const INTENT_SLUG = "golden-visa";

export type Facet =
  | { kind: "city"; city: string }
  | { kind: "type"; type: PropertyType }
  | { kind: "intent" };

/**
 * Egy (ország, szegmens) feloldása facetté. Ismeretlen szegmens → null (404).
 * A sorrend számít: város → típus → szándék.
 */
export function resolveFacet(country: CountryCode, segment: string): Facet | null {
  const city = cityFromSlug(country, segment);
  if (city) return { kind: "city", city };

  const type = SLUG_TO_TYPE[segment];
  if (type) return { kind: "type", type };

  if (segment === INTENT_SLUG && COUNTRY_BY_CODE[country]?.goldenVisa) {
    return { kind: "intent" };
  }
  return null;
}

/**
 * Minden (ország, facet-slug) pár a generateStaticParams-hoz:
 * városok + típusok + (ahol van program) a golden-visa szándék-oldal.
 */
export const COUNTRY_FACET_PARAMS: { country: CountryCode; facet: string }[] = COUNTRIES.flatMap(
  (c) => {
    const cities = c.cities.map((city) => ({ country: c.code, facet: citySlug(city) }));
    const types = TYPE_FACETS.map((t) => ({ country: c.code, facet: typeFacetSlug(t) }));
    const intent = c.goldenVisa ? [{ country: c.code, facet: INTENT_SLUG }] : [];
    return [...cities, ...types, ...intent];
  }
);
