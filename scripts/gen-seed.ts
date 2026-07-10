/**
 * A TS seed adatból (seedProfiles + seedListings) INSERT SQL-t generál a
 * supabase/seed.sql fájlba. A valódi derivált mezőket használja (amenities,
 * views, context extras), tehát pontosan azt tölti be, amit az app is mutatna.
 *
 * Futtatás:  npx tsx scripts/gen-seed.ts
 */
import { writeFileSync } from "node:fs";
import { seedProfiles, seedListings } from "../lib/data";

function q(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
}
function jsonb(v: unknown): string {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}
function textArr(a: string[]): string {
  if (!a.length) return `'{}'`;
  return `array[${a.map((x) => q(x)).join(",")}]::text[]`;
}
function amenityArr(a: string[]): string {
  if (!a.length) return `'{}'::amenity[]`;
  return `array[${a.map((x) => q(x)).join(",")}]::amenity[]`;
}

const lines: string[] = ["-- Generált seed — ne szerkeszd kézzel. Forrás: scripts/gen-seed.ts", "begin;"];

for (const p of seedProfiles) {
  lines.push(
    `insert into profiles (id,email,name,role,avatar,agency_name,bio,phone,location,verified,response_time,joined_at) values (` +
      [q(p.id), q(p.email), q(p.name), q(p.role), q(p.avatar), q(p.agencyName), q(p.bio),
       q(p.phone), q(p.location), q(p.verified), q(p.responseTime), q(p.joinedAt)].join(",") +
      `) on conflict (id) do nothing;`
  );
}

for (const l of seedListings) {
  lines.push(
    `insert into listings (id,title,description,type,mode,status,price,area,rooms,floor,year,condition,view,city,district,distance_to_sea,lat,lng,verification,images,amenities,owner_id,agency,furnished,energy,created_at,views,price_history,deposit,min_term_months,available_from,utilities_included,pets_allowed,plot_area,monthly_common_cost,heating_type) values (` +
      [
        q(l.id), jsonb(l.title), jsonb(l.description), q(l.type), q(l.mode), q(l.status),
        q(l.price), q(l.area), q(l.rooms), q(l.floor), q(l.year), q(l.condition), q(l.view),
        q(l.city), q(l.district), q(l.distanceToSea), q(l.lat), q(l.lng), q(l.verification),
        textArr(l.images), amenityArr(l.amenities), q(l.ownerId), q(l.agency), q(l.furnished),
        q(l.energy), q(l.createdAt), q(l.views), jsonb(l.priceHistory),
        q(l.deposit ?? null), q(l.minTermMonths ?? null), q(l.availableFrom ?? null),
        q(l.utilitiesIncluded ?? null), q(l.petsAllowed ?? null), q(l.plotArea ?? null),
        q(l.monthlyCommonCost ?? null), q(l.heatingType ?? null)
      ].join(",") +
      `) on conflict (id) do nothing;`
  );
}

lines.push("commit;");
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n") + "\n");
console.log(`Generated ${seedProfiles.length} profiles + ${seedListings.length} listings`);
