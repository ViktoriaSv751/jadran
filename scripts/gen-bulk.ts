/**
 * Tömeges DEMO-hirdetés generátor — országonként ~20 hirdetés, a meglévő
 * iroda-fiókok tulajdonában, determinisztikusan (seed = index). SQL-t ír a
 * supabase/bulk.sql-be; a sorokat batch-elve töltjük az éles DB-be.
 *
 * Futtatás:  npx tsx scripts/gen-bulk.ts
 */
import { writeFileSync } from "node:fs";
import { COUNTRIES } from "../lib/geo";
import type { CountryCode } from "../lib/types";

const PER_COUNTRY = 20;

// Ország → iroda(k) (id + megjelenített név) + ár-sáv EUR-ban.
const CFG: Record<CountryCode, { ags: [string, string][]; min: number; max: number }> = {
  ME: { ags: [["u-adriatic", "Adriatic Homes"], ["u-prime", "Montenegro Prime"], ["u-boka", "Boka Estates"], ["u-coastline", "Coastline Invest"], ["u-capital", "Capital Realty"]], min: 70000, max: 650000 },
  HR: { ags: [["u-jadran-hr", "Jadran Nekretnine"]], min: 140000, max: 950000 },
  AL: { ags: [["u-riviera-al", "Riviera Albania"]], min: 55000, max: 320000 },
  RS: { ags: [["u-belgrade-rs", "Beograd Estates"]], min: 75000, max: 420000 },
  TR: { ags: [["u-bosphorus-tr", "Bosphorus Property"]], min: 90000, max: 560000 },
  ID: { ags: [["u-bali-id", "Bali Villa Collective"]], min: 130000, max: 620000 },
  HU: { ags: [["u-budapest-hu", "Budapest Home"]], min: 95000, max: 580000 },
  TH: { ags: [["u-siam-th", "Siam Property"]], min: 95000, max: 520000 },
  IT: { ags: [["u-bellacasa-it", "Bella Casa Italia"]], min: 180000, max: 1400000 },
  GR: { ags: [["u-hellenic-gr", "Hellenic Estates"]], min: 120000, max: 820000 },
  ES: { ags: [["u-costa-es", "Costa Properties"]], min: 190000, max: 1250000 }
};

type L4 = { hu: string; me: string; en: string; ru: string };
type Type = "apartment" | "villa" | "house" | "new" | "land" | "commercial";

const TYPE_WORD: Record<Type, L4> = {
  apartment: { hu: "Lakás", me: "Stan", en: "Apartment", ru: "Квартира" },
  villa: { hu: "Villa", me: "Vila", en: "Villa", ru: "Вилла" },
  house: { hu: "Ház", me: "Kuća", en: "House", ru: "Дом" },
  new: { hu: "Új építésű lakás", me: "Novogradnja", en: "New-build apartment", ru: "Новостройка" },
  land: { hu: "Építési telek", me: "Građevinsko zemljište", en: "Building plot", ru: "Участок" },
  commercial: { hu: "Üzlethelyiség", me: "Poslovni prostor", en: "Commercial unit", ru: "Коммерческое помещение" }
};
const ADJ: L4[] = [
  { hu: "Napfényes", me: "Sunčan", en: "Bright", ru: "Светлая" },
  { hu: "Modern", me: "Moderan", en: "Modern", ru: "Современная" },
  { hu: "Felújított", me: "Renoviran", en: "Renovated", ru: "Отремонтированная" },
  { hu: "Tágas", me: "Prostran", en: "Spacious", ru: "Просторная" },
  { hu: "Exkluzív", me: "Ekskluzivan", en: "Exclusive", ru: "Эксклюзивная" }
];
const DESC: Record<Type, L4> = {
  apartment: { hu: "Jó elrendezésű lakás kiváló elhelyezkedéssel, közlekedéshez és szolgáltatásokhoz közel", me: "Stan dobrog rasporeda, blizu prevoza i sadržaja", en: "Well-laid-out apartment in a great location, close to transport and amenities", ru: "Удобная квартира в отличном месте, рядом транспорт и сервисы" },
  villa: { hu: "Villa privát medencével és kerttel, csendes, prémium környéken", me: "Vila s privatnim bazenom i vrtom, u mirnom kraju", en: "Villa with private pool and garden in a quiet, premium area", ru: "Вилла с частным бассейном и садом в тихом премиум-районе" },
  house: { hu: "Családi ház nagy kerttel, nyugodt utcában, jó infrastruktúrával", me: "Porodična kuća s velikim vrtom u mirnoj ulici", en: "Family house with a large garden on a quiet street with good infrastructure", ru: "Семейный дом с большим садом на тихой улице" },
  new: { hu: "Energiahatékony új építésű lakás garázzsal, azonnal beköltözhető", me: "Energetski efikasna novogradnja s garažom, useljivo odmah", en: "Energy-efficient new build with garage, ready to move in", ru: "Энергоэффективная новостройка с гаражом, готова к заселению" },
  land: { hu: "Építési telek engedéllyel, jó megközelítéssel és közművekkel", me: "Građevinsko zemljište s dozvolom i priključcima", en: "Building plot with permit, good access and utilities", ru: "Участок под застройку с разрешением и коммуникациями" },
  commercial: { hu: "Üzlethelyiség forgalmas helyen, kiváló bérbeadási potenciállal", me: "Poslovni prostor na frekventnoj lokaciji", en: "Commercial unit in a high-traffic location with strong rental potential", ru: "Коммерческое помещение в оживлённом месте" }
};

// Determinisztikus pszeudo-random 0..1 a seedből.
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const pick = <T,>(arr: T[], seed: number): T => arr[Math.floor(rnd(seed) * arr.length) % arr.length];
const between = (a: number, b: number, seed: number) => Math.round(a + rnd(seed) * (b - a));

const TYPES: Type[] = ["apartment", "apartment", "apartment", "new", "villa", "house", "commercial", "land"];
const VIEWS = ["sea", "mountain", "city"] as const;
const HEAT = ["gas", "electric", "heatpump", "central"];
const AMEN: Record<Type, string[]> = {
  apartment: ["balcony", "elevator", "ac", "heating", "wifi"],
  new: ["balcony", "elevator", "ac", "heating", "wifi", "security"],
  villa: ["pool", "garden", "parking", "garage", "ac", "heating", "wifi", "security"],
  house: ["garden", "parking", "wifi", "heating"],
  land: [],
  commercial: ["parking", "wifi"]
};

function esc(s: string): string {
  return s.replace(/'/g, "''");
}
function j(o: unknown): string {
  return `'${esc(JSON.stringify(o))}'::jsonb`;
}
function arr(a: string[], cast: string): string {
  return a.length ? `array[${a.map((x) => `'${esc(x)}'`).join(",")}]::${cast}` : `'{}'::${cast}`;
}

const rows: string[] = [];
const COLS =
  "id,title,description,type,mode,status,price,area,rooms,floor,year,condition,view,country,city,district,distance_to_sea,lat,lng,verification,images,amenities,owner_id,agency,furnished,energy,created_at,views,price_history";

for (const c of COUNTRIES) {
  const cfg = CFG[c.code];
  for (let i = 0; i < PER_COUNTRY; i++) {
    const s = c.code.charCodeAt(0) * 1000 + c.code.charCodeAt(1) * 7 + i * 31 + 3;
    const id = `bulk-${c.code.toLowerCase()}-${String(i + 1).padStart(2, "0")}`;
    const type = pick(TYPES, s);
    const city = pick(c.cities, s + 1);
    const [ownerId, agency] = pick(cfg.ags, s + 2);
    const isRent = type !== "land" && type !== "commercial" && rnd(s + 3) < 0.18;
    const mode = isRent ? "rent" : "sale";
    // Ár: eladásnál a sávban; bérlésnél havi (kb. az ár 0.4%-a).
    const salePrice = between(cfg.min, cfg.max, s + 4);
    const price = isRent ? Math.max(350, Math.round((salePrice * 0.004) / 50) * 50) : salePrice;
    const area = type === "land" ? between(300, 1200, s + 5) : type === "villa" ? between(160, 380, s + 6) : between(38, 160, s + 7);
    const rooms = type === "land" || type === "commercial" ? 0 : between(1, 5, s + 8);
    const floor = type === "villa" || type === "house" || type === "land" ? null : between(0, 12, s + 9);
    const year = type === "land" ? 0 : between(1975, 2025, s + 10);
    const view = pick([...VIEWS], s + 11);
    const dist = view === "sea" ? between(40, 1500, s + 12) : between(0, 40000, s + 12);
    const verification = pick(["none", "basic", "deed", "full"], s + 13);
    const furnished = mode === "rent" || rnd(s + 14) < 0.6;
    const energy = type === "land" ? "-" : pick(["A", "B", "C", "D"], s + 15);
    const lat = +(c.center[0] + (rnd(s + 16) - 0.5) * 1.2).toFixed(4);
    const lng = +(c.center[1] + (rnd(s + 17) - 0.5) * 1.6).toFixed(4);
    const adj = pick(ADJ, s + 18);
    const title: L4 = {
      hu: `${adj.hu} ${TYPE_WORD[type].hu.toLowerCase()} — ${city}`,
      me: `${adj.me} ${TYPE_WORD[type].me.toLowerCase()} — ${city}`,
      en: `${adj.en} ${TYPE_WORD[type].en.toLowerCase()} in ${city}`,
      ru: `${adj.ru} ${TYPE_WORD[type].ru.toLowerCase()} — ${city}`
    };
    const d = DESC[type];
    const description: L4 = {
      hu: `${d.hu}, ${city} (${c.code}).`,
      me: `${d.me}, ${city}.`,
      en: `${d.en}, ${city}.`,
      ru: `${d.ru}, ${city}.`
    };
    const amen = [...AMEN[type]];
    if (furnished) amen.unshift("furnished");
    if (view === "sea") amen.push("seaview");
    const imgN = type === "land" ? 3 : 5;
    const imgs = ["ext", "liv", "kit", "bed", "view", "bath"].slice(0, imgN).map((cat, k) => `/p/${cat}${(Math.floor(rnd(s + 20 + k) * (cat === "ext" ? 10 : cat === "liv" ? 7 : cat === "bath" ? 4 : 5)) + 1)}.jpg`);
    const created = `2026-0${between(1, 6, s + 30)}-${String(between(10, 27, s + 31)).padStart(2, "0")}`;
    const views = between(40, 480, s + 32);
    const vals = [
      `'${id}'`, j(title), j(description), `'${type}'`, `'${mode}'`, `'active'`,
      String(price), String(area), String(rooms), floor == null ? "null" : String(floor),
      String(year), `'good'`, `'${view}'`, `'${c.code}'`, `'${esc(city)}'`, `'${esc(city)}'`,
      String(dist), String(lat), String(lng), `'${verification}'`,
      arr(imgs, "text[]"), arr(Array.from(new Set(amen)), "amenity[]"), `'${ownerId}'`, `'${esc(agency)}'`,
      furnished ? "true" : "false", `'${energy}'`, `'${created}'`, String(views),
      j([{ date: created, price }])
    ];
    rows.push(`(${vals.join(",")})`);
  }
}

const sql = `insert into listings (${COLS}) values\n${rows.join(",\n")}\non conflict (id) do nothing;\n`;
writeFileSync(new URL("../supabase/bulk.sql", import.meta.url), sql);
console.log(`Generated ${rows.length} bulk listings across ${COUNTRIES.length} countries`);
