/**
 * A tiny synthetic feed used to demo & smoke-test the importer end to end.
 *
 * It is intentionally "messy" — Montenegrin/Serbian column values, mixed
 * number formatting, a missing-coordinate row, a free-text amenity list — so
 * it exercises normalization, geocoding fallback and validation. This is NOT
 * scraped data: every row is hand-written sample content with placeholder
 * images, safe to ship in the repo.
 */
import type { ImportConfig } from "./index";

/** Semicolon-delimited CSV with a Serbian/Montenegrin header. */
export const SAMPLE_CSV = `ref;naziv;opis;tip;ponuda;cijena;povrsina;sobe;sprat;godina;stanje;pogled;grad;kvart;more_m;lat;lng;slike;sadrzaj;namjesteno;energetski;depozit;min_mjeseci;rezije;ljubimci
A-101;Svijetli stan u centru;Renoviran dvosoban stan, 5 min od mora.;stan;prodaja;€ 189.000;58;2;3;2008;renovirano;more;Budva;Centar;350;42.2864;18.8400;;wifi, klima, lift, balkon;da;C;;;;
A-102;Kuća sa bazenom;Porodična kuća sa vrtom i bazenom.;kuca;prodaja;425000;220;5;;2016;dobro;planina;Tivat;Donja Lastva;1800;;;https://picsum.photos/seed/villa-1/1200/800;parking, bazen, vrt, garaza;ne;B;;;;
R-201;Apartman za najam uz more;Komforan stan, dugoročni najam.;apartman;izdavanje;750;46;2;1;2019;dobro;more;Kotor;Dobrota;120;42.4420;18.7640;;klima, wifi, namjesteno;da;C;1500;12;da;da
R-202;Studio Herceg Novi;Mali studio, idealno za jednu osobu.;stan;najam;390;28;1;4;2012;dobro;grad;Herceg Novi;;600;;;;wifi, lift;da;D;780;6;ne;ne
X-301;Plac sa pogledom;Građevinski plac, nepoznata lokacija.;zemljiste;prodaja;95000;1200;;;;;;Neka Nepoznata Varos;;;;;;ne;;;;;`;

/**
 * Field map: OUR field → the source column(s) above. Demonstrates fallbacks
 * (e.g. several possible price columns). Keys not present in a feed are simply
 * omitted and fall back to sensible defaults during mapping.
 */
export const SAMPLE_FIELD_MAP: ImportConfig["fieldMap"] = {
  externalId: "ref",
  title: "naziv",
  description: "opis",
  type: "tip",
  mode: "ponuda",
  price: ["cijena", "cena"],
  area: "povrsina",
  rooms: "sobe",
  floor: "sprat",
  year: "godina",
  condition: "stanje",
  view: "pogled",
  city: "grad",
  district: "kvart",
  distanceToSea: "more_m",
  lat: "lat",
  lng: "lng",
  images: "slike",
  amenities: "sadrzaj",
  furnished: "namjesteno",
  energy: "energetski",
  deposit: "depozit",
  minTermMonths: "min_mjeseci",
  utilitiesIncluded: "rezije",
  petsAllowed: "ljubimci"
};

export const SAMPLE_CONFIG: ImportConfig = {
  source: "demo",
  agencyName: "JADRAN Demo Feed",
  format: "csv",
  fieldMap: SAMPLE_FIELD_MAP
};
