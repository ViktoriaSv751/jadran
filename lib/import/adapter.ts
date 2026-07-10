/**
 * Generic feed → Listing adapter.
 *
 * The importer is deliberately format-agnostic: every supported feed (agency
 * XML, portal CSV, partner JSON) is first flattened into a list of
 * `RawRecord`s — plain string/number maps keyed by the feed's own column
 * names. A `FieldMap` then says which of OUR fields each source column feeds.
 * `mapRecord` does the heavy lifting: coercion, enum normalization, geocoding,
 * and per-record validation, returning a fully-formed `Listing` (or `null`
 * plus the reasons it was rejected).
 *
 * Nothing here touches localStorage or the network — it is pure and testable.
 * Persistence lives in ./index (`importIntoDb`).
 */
import type { Listing, LocalizedText } from "../types";
import {
  canonicalPlace,
  clamp,
  geocode,
  normalizeAmenities,
  normalizeCondition,
  normalizeMode,
  normalizeType,
  normalizeView,
  toBool,
  toNumber
} from "./normalize";

/** A single feed row, already flattened to primitive cells. */
export type RawRecord = Record<string, string | number | null | undefined>;

/**
 * Maps OUR field → the source column name(s) that feed it. The first column
 * that yields a non-empty value wins, so you can list fallbacks in priority
 * order (e.g. `price: ["price_eur", "price", "cena"]`).
 */
export interface FieldMap {
  externalId?: string | string[];
  title?: string | string[];
  description?: string | string[];
  type?: string | string[];
  mode?: string | string[];
  price?: string | string[];
  area?: string | string[];
  rooms?: string | string[];
  floor?: string | string[];
  year?: string | string[];
  condition?: string | string[];
  view?: string | string[];
  city?: string | string[];
  district?: string | string[];
  distanceToSea?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
  images?: string | string[];
  amenities?: string | string[];
  furnished?: string | string[];
  energy?: string | string[];
  // rent extras
  deposit?: string | string[];
  minTermMonths?: string | string[];
  utilitiesIncluded?: string | string[];
  petsAllowed?: string | string[];
  // sale extras
  plotArea?: string | string[];
  monthlyCommonCost?: string | string[];
}

export interface MapOptions {
  /** Short stable source slug, becomes part of the listing id (e.g. "demo"). */
  source: string;
  /** Display name for the importing agency/profile. */
  agencyName: string;
  /** Owner profile id — resolved by the caller (./index). */
  ownerId: string;
}

export interface MapResult {
  listing: Listing | null;
  externalId: string;
  errors: string[];
  warnings: string[];
}

/* ------------------------------- helpers ------------------------------- */

function pick(raw: RawRecord, key: string | string[] | undefined): string {
  if (!key) return "";
  const keys = Array.isArray(key) ? key : [key];
  for (const k of keys) {
    const v = raw[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** URL-safe slug for ids. */
export function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "x"
  );
}

/** Mirror a single source string into all four UI locales. */
function localized(s: string): LocalizedText {
  return { hu: s, me: s, en: s, ru: s };
}

/** Deterministic placeholder image so imported cards still render. */
function placeholderImages(seed: string): string[] {
  const s = slug(seed);
  return [0, 1, 2].map((i) => `https://picsum.photos/seed/${s}-${i}/1200/800`);
}

/* --------------------------- the core mapper --------------------------- */

export function mapRecord(raw: RawRecord, fieldMap: FieldMap, opts: MapOptions): MapResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawExternalId = pick(raw, fieldMap.externalId);
  const titleText = pick(raw, fieldMap.title);
  const externalId = rawExternalId || (titleText ? slug(titleText) : "");

  // --- required: price ---
  const price = toNumber(pick(raw, fieldMap.price));
  if (price == null || price <= 0) errors.push("missing or invalid price");

  // --- required: a usable title ---
  if (!titleText) errors.push("missing title");

  // --- location / geocoding ---
  const cityRaw = pick(raw, fieldMap.city);
  const districtRaw = pick(raw, fieldMap.district);
  const place = canonicalPlace(cityRaw);
  if (cityRaw && !place.recognized) warnings.push(`unrecognized city "${cityRaw}"`);

  let lat = toNumber(pick(raw, fieldMap.lat));
  let lng = toNumber(pick(raw, fieldMap.lng));
  if (lat == null || lng == null) {
    const g = geocode(cityRaw, districtRaw);
    lat = g.lat;
    lng = g.lng;
    if (!g.resolved) warnings.push("no coordinates and city not in gazetteer — using country centroid");
  }

  if (!externalId) errors.push("no external id and no title to derive one");

  if (errors.length) {
    return { listing: null, externalId: externalId || "(unknown)", errors, warnings };
  }

  const typeRaw = pick(raw, fieldMap.type);
  const modeRaw = pick(raw, fieldMap.mode);
  const descText = pick(raw, fieldMap.description) || titleText;

  const imagesRaw = pick(raw, fieldMap.images);
  const images = imagesRaw
    ? imagesRaw
        .split(/[,;|\s]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//i.test(u))
    : [];
  if (images.length === 0) {
    images.push(...placeholderImages(externalId));
    warnings.push("no images in feed — using placeholders");
  }

  const mode = normalizeMode(modeRaw);
  const furnished = toBool(pick(raw, fieldMap.furnished));
  const amenities = normalizeAmenities(pick(raw, fieldMap.amenities));

  const yearNum = toNumber(pick(raw, fieldMap.year));
  const currentYear = new Date().getFullYear();

  const listing: Listing = {
    id: `imp-${opts.source}-${slug(externalId)}`,
    title: localized(titleText),
    description: localized(descText),
    type: normalizeType(typeRaw),
    mode,
    status: "active",
    price: Math.round(price!),
    area: clamp(toNumber(pick(raw, fieldMap.area)) ?? 0, 0, 100000),
    rooms: clamp(Math.round(toNumber(pick(raw, fieldMap.rooms)) ?? 1), 0, 50),
    floor: toNumber(pick(raw, fieldMap.floor)),
    year: yearNum != null ? clamp(Math.round(yearNum), 1800, currentYear + 5) : currentYear,
    condition: normalizeCondition(pick(raw, fieldMap.condition)),
    view: normalizeView(pick(raw, fieldMap.view)),
    city: place.recognized ? place.name : cityRaw || "Montenegró",
    district: districtRaw,
    distanceToSea: clamp(toNumber(pick(raw, fieldMap.distanceToSea)) ?? 0, 0, 100000),
    lat: lat!,
    lng: lng!,
    verification: "none",
    images,
    amenities,
    ownerId: opts.ownerId,
    agency: opts.agencyName,
    furnished,
    energy: pick(raw, fieldMap.energy) || "—",
    createdAt: new Date().toISOString(),
    views: 0,
    priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: Math.round(price!) }]
  };

  // --- mode-specific extras ---
  if (mode === "rent") {
    const deposit = toNumber(pick(raw, fieldMap.deposit));
    if (deposit != null) listing.deposit = Math.round(deposit);
    const term = toNumber(pick(raw, fieldMap.minTermMonths));
    if (term != null) listing.minTermMonths = clamp(Math.round(term), 1, 120);
    const util = pick(raw, fieldMap.utilitiesIncluded);
    if (util) listing.utilitiesIncluded = toBool(util);
    const pets = pick(raw, fieldMap.petsAllowed);
    if (pets) listing.petsAllowed = toBool(pets);
  } else {
    const plot = toNumber(pick(raw, fieldMap.plotArea));
    if (plot != null) listing.plotArea = Math.round(plot);
    const common = toNumber(pick(raw, fieldMap.monthlyCommonCost));
    if (common != null) listing.monthlyCommonCost = Math.round(common);
  }

  return { listing, externalId, errors, warnings };
}

/* ----------------------------- CSV parsing ----------------------------- */

/**
 * Minimal but correct RFC-4180-ish CSV parser: handles quoted fields,
 * embedded commas/newlines, and "" escaped quotes. Returns RawRecords keyed
 * by the header row. Delimiter is auto-detected between comma and semicolon.
 */
export function parseCSV(text: string): RawRecord[] {
  const src = text.replace(/^﻿/, ""); // strip BOM
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else if (c === "\r") {
      // swallow; \n handles the row break
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")).map((r) => {
    const rec: RawRecord = {};
    header.forEach((h, idx) => {
      rec[h] = (r[idx] ?? "").trim();
    });
    return rec;
  });
}

function detectDelimiter(src: string): string {
  const firstLine = src.slice(0, src.indexOf("\n") >= 0 ? src.indexOf("\n") : src.length);
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  return semis > commas ? ";" : ",";
}

/* ----------------------------- JSON parsing ---------------------------- */

/**
 * Accepts either a top-level array of objects, or an object wrapping the array
 * under a common key (listings/items/data/results/properties).
 */
export function recordsFromJSON(text: string): RawRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  const arr = extractArray(parsed);
  return arr.map((x) => flatten(x));
}

function extractArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    for (const key of ["listings", "items", "data", "results", "properties", "ads"]) {
      const v = (parsed as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

/** Flatten one level of nesting so `{ loc: { city } }` becomes `loc.city`. */
function flatten(obj: unknown, prefix = ""): RawRecord {
  const out: RawRecord = {};
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v == null) {
      out[key] = "";
    } else if (Array.isArray(v)) {
      out[key] = v.map((x) => (x == null ? "" : String(x))).join(",");
    } else if (typeof v === "object") {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v as string | number;
    }
  }
  return out;
}

/* ------------------------------ XML parsing ---------------------------- */

/**
 * Parse a feed XML into RawRecords. The `itemTag` is the repeating element
 * (e.g. "property", "listing", "ad"). Each direct child element becomes a
 * column; element attributes are exposed as `tag@attr`. Uses the browser
 * DOMParser when available, otherwise a small regex fallback so the function
 * still works in non-DOM (test) environments.
 */
export function recordsFromXml(text: string, itemTag = "listing"): RawRecord[] {
  if (typeof DOMParser !== "undefined") {
    return xmlViaDom(text, itemTag);
  }
  return xmlViaRegex(text, itemTag);
}

function xmlViaDom(text: string, itemTag: string): RawRecord[] {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  const items = Array.from(doc.getElementsByTagName(itemTag));
  return items.map((item) => {
    const rec: RawRecord = {};
    Array.from(item.attributes).forEach((a) => (rec[`@${a.name}`] = a.value));
    Array.from(item.children).forEach((child) => {
      const tag = child.tagName;
      const text2 = (child.textContent ?? "").trim();
      // Concatenate repeated tags (e.g. multiple <image>) with commas.
      rec[tag] = rec[tag] != null && rec[tag] !== "" ? `${rec[tag]},${text2}` : text2;
      Array.from(child.attributes).forEach((a) => (rec[`${tag}@${a.name}`] = a.value));
    });
    return rec;
  });
}

function xmlViaRegex(text: string, itemTag: string): RawRecord[] {
  const itemRe = new RegExp(`<${itemTag}\\b[^>]*>([\\s\\S]*?)</${itemTag}>`, "gi");
  const records: RawRecord[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(text))) {
    const body = m[1];
    const rec: RawRecord = {};
    const childRe = /<([a-zA-Z0-9_:-]+)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let c: RegExpExecArray | null;
    while ((c = childRe.exec(body))) {
      const tag = c[1];
      const val = decodeEntities(c[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
      rec[tag] = rec[tag] != null && rec[tag] !== "" ? `${rec[tag]},${val}` : val;
    }
    records.push(rec);
  }
  return records;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
