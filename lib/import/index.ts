/**
 * Public entry point for the legal feed importer.
 *
 * Two layers:
 *   - `importListings`  — pure: text feed + field map → validated Listings +
 *                         a human-readable report. No I/O. Easy to unit-test.
 *   - `importIntoDb`    — side-effecting: resolves/creates the agency profile,
 *                         then upserts the listings into localStorage (dedupe
 *                         by id, price-history on change). Browser-only.
 *
 * Only feeds the operator is legally entitled to use should be passed here
 * (partner APIs, agency exports, open-data dumps). The importer makes no
 * network calls of its own — you hand it the text you already fetched.
 */
import type { Listing } from "../types";
import {
  type FieldMap,
  type RawRecord,
  mapRecord,
  parseCSV,
  recordsFromJSON,
  recordsFromXml
} from "./adapter";

export type FeedFormat = "csv" | "json" | "xml";

export interface ImportConfig {
  /** Stable short slug for the source (used in listing ids). */
  source: string;
  /** Display name for the agency/profile that owns imported listings. */
  agencyName: string;
  format: FeedFormat;
  fieldMap: FieldMap;
  /** For XML feeds: the repeating element name. Defaults to "listing". */
  xmlItemTag?: string;
}

export interface RecordIssue {
  externalId: string;
  errors: string[];
  warnings: string[];
}

export interface ImportReport {
  source: string;
  totalRecords: number;
  valid: number;
  rejected: number;
  warningCount: number;
  listings: Listing[];
  issues: RecordIssue[];
}

function rawRecordsFor(text: string, config: ImportConfig): RawRecord[] {
  switch (config.format) {
    case "csv":
      return parseCSV(text);
    case "json":
      return recordsFromJSON(text);
    case "xml":
      return recordsFromXml(text, config.xmlItemTag);
    default:
      return [];
  }
}

/**
 * Pure import: parse + map + validate. Returns the listings ready to persist
 * plus a report. `ownerId` is a placeholder here ("imported") because the
 * pure layer can't touch the profile store; `importIntoDb` rewrites it.
 */
export function importListings(text: string, config: ImportConfig, ownerId = "imported"): ImportReport {
  const records = rawRecordsFor(text, config);
  const listings: Listing[] = [];
  const issues: RecordIssue[] = [];
  let warningCount = 0;

  const seen = new Set<string>();

  for (const raw of records) {
    const result = mapRecord(raw, config.fieldMap, {
      source: config.source,
      agencyName: config.agencyName,
      ownerId
    });
    if (result.warnings.length || result.errors.length) {
      issues.push({ externalId: result.externalId, errors: result.errors, warnings: result.warnings });
    }
    warningCount += result.warnings.length;

    if (result.listing) {
      if (seen.has(result.listing.id)) {
        // Last-one-wins within a single feed; flag the collision.
        issues.push({ externalId: result.externalId, errors: [], warnings: ["duplicate id within feed — overwriting"] });
        const idx = listings.findIndex((l) => l.id === result.listing!.id);
        if (idx >= 0) listings[idx] = result.listing;
      } else {
        seen.add(result.listing.id);
        listings.push(result.listing);
      }
    }
  }

  return {
    source: config.source,
    totalRecords: records.length,
    valid: listings.length,
    rejected: records.length - listings.length,
    warningCount,
    listings,
    issues
  };
}

export interface ImportDbResult extends ImportReport {
  added: number;
  updated: number;
  ownerId: string;
}

/**
 * Full import into localStorage. Resolves (or creates) the agency profile,
 * re-stamps each listing's ownerId, then upserts. Returns the report plus
 * added/updated counts. Must run in the browser (touches localStorage).
 */
export function importIntoDb(text: string, config: ImportConfig): ImportDbResult {
  // Lazy require keeps this module importable in non-DOM contexts (tests).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const db = require("../db") as typeof import("../db");
  const ownerId = db.ensureAgencyProfile(config.agencyName);

  const report = importListings(text, config, ownerId);
  const stamped = report.listings.map((l) => ({ ...l, ownerId }));
  const { added, updated } = db.upsertListings(stamped);

  return { ...report, listings: stamped, added, updated, ownerId };
}
