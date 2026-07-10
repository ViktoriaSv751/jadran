/**
 * "Varázs-feltöltés" — free-text listing extractor.
 *
 * Paste a Facebook post / e-mail / WhatsApp message (in Montenegrin, Serbian,
 * English, Hungarian or Russian) and this turns it into prefilled form fields
 * for the listing wizard. It is a *local heuristic* extractor — no network, no
 * API keys, no Facebook App Review needed — so it ships and runs entirely in
 * the browser. The same surface (`extractFromText`) can later be backed by a
 * real LLM call without changing any caller: swap the body, keep the result
 * shape.
 *
 * Design: every detected field is OPTIONAL. Whatever we can't find we simply
 * omit, so the caller merges only confident values onto the existing form and
 * never clobbers good data with a guess.
 */
import type { Amenity, Condition, ListingMode, PropertyType, ViewType } from "../types";
import { cities, montenegroPlaces } from "../data";
import { fold, scanAmenities, scanCondition, scanMode, scanType, scanView, toNumber } from "./normalize";

/** Field values in the exact shape the wizard's FormState expects. */
export interface ExtractedFields {
  mode?: ListingMode;
  type?: PropertyType;
  title?: string;
  description?: string;
  city?: string;
  district?: string;
  area?: string;
  rooms?: string;
  floor?: string;
  year?: string;
  condition?: Condition;
  view?: ViewType;
  distanceToSea?: string;
  furnished?: boolean;
  amenities?: Amenity[];
  price?: string;
  deposit?: string;
  minTermMonths?: string;
  petsAllowed?: boolean;
  utilitiesIncluded?: boolean;
  images?: string; // newline-joined URLs found in the text
}

export interface ExtractResult {
  fields: ExtractedFields;
  /** Keys of `fields` that were confidently detected (for UI highlighting). */
  detected: (keyof ExtractedFields)[];
  /** Rough 0..1 completeness score over the "important" fields. */
  confidence: number;
  /** Human-readable notes / assumptions, localized-agnostic (caller may show). */
  notes: string[];
}

/* --------------------------- regex utilities --------------------------- */

const RENT_HINT =
  /\b(\/\s?(ho|hó|month|mo|mjesec|mesec|mes)|per month|havi|mjesecno|mjesečno|mesecno|monthly|najam|izdavanje|kiad[oó]|rent|аренда)\b/i;

const NUM = String.raw`\d[\d.,\s]*`;

/** First capture group → number via toNumber, or null. */
function firstNum(text: string, re: RegExp): number | null {
  const m = text.match(re);
  return m ? toNumber(m[1]) : null;
}

/** Condition from accent-folded text, most-specific keyword first. */
function detectCondition(folded: string): Condition | null {
  if (/\b(felujitando|za renoviranje|needs work|renovation|fixer|staro|dotrajalo)\b/.test(folded)) return "needs_work";
  if (/\b(felujitott|renovirano|renovated|refurbished|adaptirano|obnovljeno)\b/.test(folded)) return "renovated";
  if (/\b(novogradnja|new build|newbuild|brand new|ujepitesu|new development)\b/.test(folded)) return "new";
  if (/\b(dobro stanje|dobro|good condition|good|useljivo|jo allapot|jo)\b/.test(folded)) return "good";
  return null;
}

/* ----------------------------- the extractor ---------------------------- */

export function extractFromText(input: string): ExtractResult {
  const text = (input ?? "").trim();
  const fields: ExtractedFields = {};
  const notes: string[] = [];
  if (!text) return { fields, detected: [], confidence: 0, notes };

  // A bare social-media link can't be read here: Facebook/Instagram post
  // content sits behind a login wall and their ToS forbids scraping. Reading a
  // post programmatically requires the official Graph API + a connected Page +
  // App Review (see the Facebook integration plan). So if the user pasted only
  // a link, bail out with a specific note instead of producing junk fields.
  const SOCIAL_RE = /(facebook\.com|fb\.com|fb\.watch|fb\.me|instagram\.com|t\.me|tiktok\.com)/i;
  const withoutUrls = text.replace(/https?:\/\/\S+/gi, "").trim();
  if (SOCIAL_RE.test(text) && withoutUrls.length < 15) {
    return { fields, detected: [], confidence: 0, notes: ["social-link-only"] };
  }

  const folded = fold(text);

  /* --- price + mode ---------------------------------------------------- */
  // Look for a currency-tagged amount first (most reliable signal).
  const priceMatch =
    text.match(new RegExp(String.raw`(?:€|eur|euro)\s*(${NUM})`, "i")) ||
    text.match(new RegExp(String.raw`(${NUM})\s*(?:€|eur|euro)`, "i")) ||
    text.match(new RegExp(String.raw`(?:cijena|cena|ar|ár|price|цена|cost)\s*[:\-]?\s*(${NUM})`, "i"));
  const price = priceMatch ? toNumber(priceMatch[1]) : null;
  if (price != null && price > 0) {
    fields.price = String(Math.round(price));
  }

  // Mode: explicit keyword wins; otherwise infer from a "per month" hint or a
  // suspiciously low price (typical long-term rent < €5,000/mo).
  const modeKw = scanMode(text);
  if (modeKw) {
    fields.mode = modeKw;
  } else if (RENT_HINT.test(text) || (price != null && price > 0 && price < 5000)) {
    fields.mode = "rent";
    notes.push("mode guessed as rent");
  }

  /* --- type / condition / view ---------------------------------------- */
  const type = scanType(text);
  if (type) fields.type = type;
  // Condition: word-boundary match on folded (accent-free) text. Done locally
  // rather than via scanCondition() because short synonyms like "új" would
  // otherwise match *inside* words (e.g. "fel-ÚJ-ított" = renovated).
  const condition = detectCondition(folded) ?? scanCondition(text);
  if (condition) fields.condition = condition;
  const view = scanView(text);
  if (view) fields.view = view;

  /* --- area (m²) ------------------------------------------------------- */
  const area = firstNum(
    text,
    new RegExp(String.raw`(${NUM})\s*(?:m2|m²|nm|m\^2|kvadrata|kv\.?m|négyzetm|negyzetm|sqm|кв\.?м)`, "i")
  );
  if (area != null && area > 0) fields.area = String(Math.round(area));

  /* --- rooms ----------------------------------------------------------- */
  // Run on folded (accent-free) text so "szobás", "háló" etc. match cleanly.
  let rooms = firstNum(
    folded,
    new RegExp(String.raw`(${NUM})\s*(?:szobas|szoba|soba|sob[ii]|rooms?|bedrooms?|haloszob|halo|spava[cc])`, "i")
  );
  if (rooms == null) {
    // Serbo-Croatian/Montenegrin shorthand: garsonjera=1, dvosoban=2, trosoban=3…
    if (/\b(garsonjer|studio|stúdió|studi[oó])\b/i.test(text)) rooms = 1;
    else if (/\b(jednosoban|egyszoba)\b/i.test(text)) rooms = 1;
    else if (/\b(dvosoban|két ?szoba|ketszoba)\b/i.test(text)) rooms = 2;
    else if (/\b(trosoban|három ?szoba|haromszoba)\b/i.test(text)) rooms = 3;
    else if (/\b(četverosoban|cetverosoban|négy ?szoba)\b/i.test(text)) rooms = 4;
  }
  if (rooms != null && rooms > 0) fields.rooms = String(Math.round(rooms));

  /* --- floor ----------------------------------------------------------- */
  const floor = firstNum(
    text,
    new RegExp(String.raw`(${NUM})\.?\s*(?:emelet|sprat|kat|floor|этаж)`, "i")
  );
  if (floor != null) fields.floor = String(Math.round(floor));

  /* --- year built ------------------------------------------------------ */
  // Prefer a year next to a "built" keyword; else any standalone 19xx/20xx.
  const yearCtx = text.match(
    /(?:épült|epult|izgrad\w*|sagrad\w*|godina (?:izgradnje|gradnje)|built|year|год\w*)\D{0,12}((?:19|20)\d{2})/i
  );
  const yearAny = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  const yr = yearCtx ? Number(yearCtx[1]) : yearAny ? Number(yearAny[1]) : null;
  if (yr && yr >= 1900 && yr <= new Date().getFullYear() + 3) fields.year = String(yr);

  /* --- distance to sea ------------------------------------------------- */
  const seaDist = firstNum(
    text,
    new RegExp(String.raw`(${NUM})\s*m\s*(?:od mora|do mora|to (?:the )?sea|from (?:the )?sea|tengertől|tengertol|a tengertől)`, "i")
  );
  if (seaDist != null) fields.distanceToSea = String(Math.round(seaDist));

  /* --- city (gazetteer scan) ------------------------------------------ */
  // Try the app's official city list first (so the wizard <select> matches),
  // then the wider gazetteer.
  const cityHit =
    cities.find((c) => folded.includes(fold(c))) ||
    montenegroPlaces.find((p) => folded.includes(fold(p)));
  if (cityHit) fields.city = cityHit;

  /* --- amenities + furnished ------------------------------------------ */
  const amenities = scanAmenities(text);
  if (amenities.length) fields.amenities = amenities;
  if (amenities.includes("furnished") || /\b(furnished|namjesteno|namještено|namješteno|bútorozott|butorozott|meblirano)\b/i.test(text)) {
    fields.furnished = true;
  }

  /* --- rent extras ----------------------------------------------------- */
  const deposit = firstNum(
    text,
    new RegExp(String.raw`(?:depozit|kauci[oó]|deposit|zalog|депозит)\s*[:\-]?\s*(?:€|eur)?\s*(${NUM})`, "i")
  );
  if (deposit != null) fields.deposit = String(Math.round(deposit));

  const term = firstNum(
    text,
    new RegExp(String.raw`(${NUM})\s*(?:hónap|honap|mjesec\w*|mesec\w*|months?|месяц\w*)\b`, "i")
  );
  if (term != null && term > 0 && term <= 120) fields.minTermMonths = String(Math.round(term));

  if (/\b(kisállat|kisallat|pet[\s-]?friendly|pets? allowed|ljubimci dozvoljeni|dozvoljeni ljubimci|можно с животными)\b/i.test(text)) {
    fields.petsAllowed = true;
  }
  if (/\b(rezsi.{0,12}(benne|tartalmaz)|utilities included|režije uključene|rezije ukljucene|включая коммунальные)\b/i.test(text)) {
    fields.utilitiesIncluded = true;
  }

  /* --- image URLs ------------------------------------------------------ */
  const urls = (text.match(/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)/gi) || []).map((u) => u.trim());
  if (urls.length) fields.images = Array.from(new Set(urls)).join("\n");

  /* --- title + description -------------------------------------------- */
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) {
    const firstLine = lines[0];
    // A good title is short; if the first line is a paragraph, take its first sentence.
    fields.title = (firstLine.length <= 80 ? firstLine : firstLine.split(/[.!?]/)[0]).slice(0, 90).trim();
  }
  fields.description = text;

  /* --- scoring --------------------------------------------------------- */
  const important: (keyof ExtractedFields)[] = ["price", "type", "area", "rooms", "city", "mode"];
  const detected = (Object.keys(fields) as (keyof ExtractedFields)[]).filter(
    (k) => fields[k] !== undefined && fields[k] !== "" && !(Array.isArray(fields[k]) && (fields[k] as unknown[]).length === 0)
  );
  const hitImportant = important.filter((k) => detected.includes(k)).length;
  const confidence = Math.round((hitImportant / important.length) * 100) / 100;

  return { fields, detected, confidence, notes };
}
