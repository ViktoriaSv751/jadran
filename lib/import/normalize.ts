/**
 * Field normalization for the feed importer.
 *
 * External feeds (agency XML, portal CSV, etc.) describe property type /
 * condition / view / mode with free text in Montenegrin, Serbian, English,
 * Hungarian or Russian. These helpers map that messy input onto our strict
 * enums, and resolve a place name to coordinates so the map keeps working.
 *
 * Everything here is pure (no I/O, no DOM) so it is trivially testable.
 */
import type { Amenity, Condition, ListingMode, PropertyType, ViewType } from "../types";
import { montenegroPlaces } from "../data";

/** Lowercase + strip diacritics so "Nikšić" === "niksic". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Generic "match any synonym" resolver. Returns the enum key or `null`. */
function resolve<T extends string>(input: string, table: Record<T, string[]>, fallback: T | null): T | null {
  const f = fold(input);
  if (!f) return fallback;
  for (const key of Object.keys(table) as T[]) {
    if (key === f) return key; // exact enum value passthrough
    for (const syn of table[key]) {
      const fs = fold(syn);
      if (f === fs || f.includes(fs)) return key;
    }
  }
  return fallback;
}

const TYPE_SYNONYMS: Record<PropertyType, string[]> = {
  apartment: ["stan", "apartman", "apartment", "flat", "kvartira", "lakas", "lakás", "квартира"],
  house: ["kuca", "kuća", "house", "haz", "ház", "dom", "casa", "дом"],
  villa: ["vila", "villa", "вилла"],
  land: ["zemljiste", "zemljište", "plac", "parcela", "land", "plot", "telek", "участок"],
  commercial: ["poslovni", "lokal", "commercial", "shop", "store", "uzlet", "üzlet", "üzlethelyiség", "retail"],
  new: ["novogradnja", "new build", "new-build", "newbuild", "novi", "ujepitesu", "újépítésű", "új építésű", "new development"],
  office: ["kancelarija", "ured", "office", "iroda", "офис"],
  hospitality: ["ugostiteljski", "hotel", "restoran", "restaurant", "hospitality", "vendeglatas", "vendéglátás", "guesthouse"],
  institution: ["ustanova", "institution", "intezmeny", "intézmény"],
  garage: ["garaza", "garaža", "garage", "garazs", "garázs", "гараж", "parking"],
  industrial: ["industrijski", "hala", "industrial", "ipari", "warehouse", "skladiste", "skladište"],
  agricultural: ["poljoprivredno", "agricultural", "farm", "imanje", "mezogazdasagi", "mezőgazdasági"]
};

const CONDITION_SYNONYMS: Record<Condition, string[]> = {
  new: ["novo", "novogradnja", "new", "uj", "új", "brand new"],
  renovated: ["renovirano", "renovated", "felujitott", "felújított", "refurbished", "adaptirano"],
  good: ["dobro", "dobro stanje", "good", "jo", "jó", "jo allapot", "useljivo"],
  needs_work: ["za renoviranje", "needs work", "renovation", "felujitando", "felújítandó", "fixer", "staro"]
};

const VIEW_SYNONYMS: Record<ViewType, string[]> = {
  sea: ["more", "sea", "tenger", "primorje", "seaview", "pogled na more", "море"],
  mountain: ["planina", "mountain", "hegy", "горы", "brdo"],
  city: ["grad", "city", "varos", "város", "urban", "город"]
};

const MODE_SYNONYMS: Record<ListingMode, string[]> = {
  sale: ["prodaja", "sale", "for sale", "buy", "elado", "eladó", "vasarlas", "vásárlás", "kupovina", "продажа", "prodaje"],
  rent: ["izdavanje", "iznajmljivanje", "najam", "rent", "for rent", "kiado", "kiadó", "berles", "bérlés", "lease", "аренда", "izdaje"]
};

/**
 * Amenities are multi-valued: a feed cell is usually a comma/semicolon/pipe
 * separated list ("wifi, klima, bazen"). We split it, fold each token, and
 * collect every matched enum key (deduped, order-preserving).
 */
const AMENITY_SYNONYMS: Record<Amenity, string[]> = {
  wifi: ["wifi", "wi-fi", "internet", "wlan"],
  ac: ["klima", "klíma", "ac", "a/c", "air conditioning", "aircon", "legkondi", "légkondi", "kondicioner", "кондиционер"],
  parking: ["parking", "parkolo", "parkoló", "parkiranje", "parkomesto", "parkolas", "parkolás"],
  pool: ["bazen", "pool", "swimming pool", "medence", "бассейн"],
  garden: ["vrt", "garden", "kert", "basta", "bašta", "сад"],
  elevator: ["lift", "elevator", "felvono", "felvonó", "лифт"],
  balcony: ["balkon", "balcony", "terasa", "terrace", "erkely", "erkély", "loggia", "балкон"],
  seaview: ["seaview", "sea view", "pogled na more", "tengerre nezo", "tengerre néző", "vidikovac"],
  furnished: ["namjesteno", "namješteno", "furnished", "butorozott", "bútorozott", "opremljeno"],
  security: ["security", "obezbedjenje", "obezbeđenje", "video nadzor", "biztonsag", "biztonság", "alarm", "охрана"],
  garage: ["garaza", "garaža", "garage", "garazs", "garázs", "гараж"],
  storage: ["ostava", "storage", "spajz", "tarolo", "tároló", "kladiste", "skladiste", "podrum", "pince"],
  heating: ["grijanje", "grejanje", "heating", "futes", "fűtés", "central heating", "отопление"]
};

/** Split a free-text amenity cell into recognized Amenity keys. */
export function normalizeAmenities(raw: string): Amenity[] {
  if (!raw) return [];
  const tokens = String(raw).split(/[,;|/]+/);
  const out: Amenity[] = [];
  for (const tok of tokens) {
    const key = resolve<Amenity>(tok, AMENITY_SYNONYMS, null);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

/* --- "scan" variants: detect an enum ANYWHERE in free text, else null. --- *
 * Unlike the normalize* helpers (which default to a value), these return null
 * when no synonym is present — used by the AI text extractor so an undetected
 * field stays untouched instead of being forced to a default. */
export const scanType = (text: string): PropertyType | null => resolve(text, TYPE_SYNONYMS, null);
export const scanMode = (text: string): ListingMode | null => resolve(text, MODE_SYNONYMS, null);
export const scanView = (text: string): ViewType | null => resolve(text, VIEW_SYNONYMS, null);
export const scanCondition = (text: string): Condition | null => resolve(text, CONDITION_SYNONYMS, null);

/** Collect every amenity whose synonym appears as a substring of the text. */
export function scanAmenities(text: string): Amenity[] {
  const f = fold(text);
  const out: Amenity[] = [];
  for (const key of Object.keys(AMENITY_SYNONYMS) as Amenity[]) {
    for (const syn of AMENITY_SYNONYMS[key]) {
      if (f.includes(fold(syn))) {
        if (!out.includes(key)) out.push(key);
        break;
      }
    }
  }
  return out;
}

export const normalizeType = (v: string): PropertyType => resolve(v, TYPE_SYNONYMS, "apartment")!;
export const normalizeCondition = (v: string): Condition => resolve(v, CONDITION_SYNONYMS, "good")!;
export const normalizeView = (v: string): ViewType => resolve(v, VIEW_SYNONYMS, "city")!;
export const normalizeMode = (v: string): ListingMode => resolve(v, MODE_SYNONYMS, "sale")!;

/** True if the raw type string was actually recognized (for warnings). */
export const isKnownType = (v: string): boolean => resolve(v, TYPE_SYNONYMS, null) !== null;

/* ----------------------------- geocoding ----------------------------- */

/**
 * Coordinates for the main Montenegrin places. Used when a feed omits lat/lng.
 * Coastal towns + the capital cover the vast majority of real-world listings.
 */
export const PLACE_COORDS: Record<string, { lat: number; lng: number }> = {
  podgorica: { lat: 42.4304, lng: 19.2594 },
  budva: { lat: 42.2864, lng: 18.84 },
  becici: { lat: 42.2783, lng: 18.8386 },
  "sveti stefan": { lat: 42.2569, lng: 18.8917 },
  petrovac: { lat: 42.2058, lng: 18.9447 },
  tivat: { lat: 42.4347, lng: 18.6963 },
  kotor: { lat: 42.4247, lng: 18.7712 },
  dobrota: { lat: 42.442, lng: 18.764 },
  perast: { lat: 42.4861, lng: 18.6986 },
  risan: { lat: 42.5142, lng: 18.6964 },
  "herceg novi": { lat: 42.4531, lng: 18.5375 },
  igalo: { lat: 42.4569, lng: 18.51 },
  bijela: { lat: 42.4575, lng: 18.605 },
  bar: { lat: 42.0931, lng: 19.1003 },
  sutomore: { lat: 42.1411, lng: 19.0481 },
  ulcinj: { lat: 41.9294, lng: 19.2247 },
  cetinje: { lat: 42.3911, lng: 18.9116 },
  niksic: { lat: 42.7731, lng: 18.9447 },
  "bijelo polje": { lat: 43.0386, lng: 19.7464 },
  berane: { lat: 42.8428, lng: 19.8714 },
  kolasin: { lat: 42.8222, lng: 19.5219 },
  zabljak: { lat: 43.1547, lng: 19.1228 },
  pljevlja: { lat: 43.3567, lng: 19.3586 },
  rozaje: { lat: 42.8403, lng: 20.1664 },
  danilovgrad: { lat: 42.5542, lng: 19.1086 },
  tuzi: { lat: 42.3661, lng: 19.3314 },
  virpazar: { lat: 42.2419, lng: 19.0911 }
};

/** Country centroid fallback when a place can't be resolved at all. */
const MNE_CENTROID = { lat: 42.7087, lng: 19.3744 };

/**
 * Resolve a free-text place to {lat,lng}. Tries the city first, then the
 * district, then the country centroid. `resolved` is false on centroid
 * fallback so the caller can surface a warning.
 */
export function geocode(city: string, district = ""): { lat: number; lng: number; resolved: boolean } {
  for (const candidate of [city, district]) {
    const hit = PLACE_COORDS[fold(candidate)];
    if (hit) return { ...hit, resolved: true };
  }
  return { ...MNE_CENTROID, resolved: false };
}

/** Canonicalize a place name against our gazetteer (diacritics-insensitive). */
export function canonicalPlace(input: string): { name: string; recognized: boolean } {
  const f = fold(input);
  const match = montenegroPlaces.find((p) => fold(p) === f);
  return match ? { name: match, recognized: true } : { name: input.trim(), recognized: false };
}

/* ----------------------------- scalar coercion ----------------------------- */

/** Parse "€ 245.000", "245,000", "1 250 000" etc. into a number. */
export function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  // Strip thousands separators; treat the last separator as decimal only if 1-2 trailing digits.
  const normalized = cleaned.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const TRUTHY = new Set(["1", "true", "yes", "da", "igen", "ano", "y", "t", "on", "✓"]);
const FALSY = new Set(["0", "false", "no", "ne", "nem", "n", "f", "off", ""]);

export function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const f = fold(String(v ?? ""));
  if (TRUTHY.has(f)) return true;
  if (FALSY.has(f)) return false;
  return false;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
