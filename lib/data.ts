import type { Listing, Profile, Amenity, ListingMode, CountryCode } from "./types";
import { countryOfCity } from "./geo";

// Real, locally-hosted property photos (public/p). We compose a believable
// gallery per listing — exterior first, then living / kitchen / bedroom /
// view / bath — picked deterministically from each category pool so a given
// listing always shows the same coherent set.
const PHOTO_POOL = { ext: 10, liv: 7, kit: 5, bed: 5, view: 5, bath: 4 } as const;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickPhoto(cat: keyof typeof PHOTO_POOL, salt: number): string {
  // A hash-eltolás (h >> …) negatív is lehet — a dupla modulo garantálja az 1..pool indexet.
  const pool = PHOTO_POOL[cat];
  const idx = ((salt % pool) + pool) % pool;
  return `/p/${cat}${idx + 1}.jpg`;
}

function imgs(id: string, n = 5): string[] {
  const h = hashStr(id);
  const ordered: (keyof typeof PHOTO_POOL)[] = ["ext", "liv", "kit", "bed", "view", "bath"];
  const gallery = ordered.map((cat, i) => pickPhoto(cat, (h >> (i * 3)) + i * 7));
  return gallery.slice(0, n);
}

/* ------------------------------------------------------------------ *
 * Seed profiles (agencies + individual sellers + a demo buyer)
 * ------------------------------------------------------------------ */

export const seedProfiles: Profile[] = [
  {
    id: "u-adriatic",
    email: "hello@adriatichomes.me",
    name: "Adriatic Homes",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-adriatic/200/200",
    agencyName: "Adriatic Homes",
    bio: "Parti ingatlanok Budva és Herceg Novi térségében, 2009 óta.",
    phone: "+382 67 100 100",
    location: "Budva, Montenegró",
    verified: true,
    responseTime: "egy órán belül",
    joinedAt: "2024-02-10"
  },
  {
    id: "u-prime",
    email: "office@montenegroprime.me",
    name: "Montenegro Prime",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-prime/200/200",
    agencyName: "Montenegro Prime",
    bio: "Prémium és luxusingatlanok a Boka-öbölben és Tivatban.",
    phone: "+382 67 200 200",
    location: "Tivat, Montenegró",
    verified: true,
    responseTime: "néhány órán belül",
    joinedAt: "2023-09-01"
  },
  {
    id: "u-boka",
    email: "info@bokaestates.me",
    name: "Boka Estates",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-boka/200/200",
    agencyName: "Boka Estates",
    bio: "Kotor és a Boka-öböl autentikus kőházai és telkei.",
    phone: "+382 67 300 300",
    location: "Kotor, Montenegró",
    verified: true,
    responseTime: "egy napon belül",
    joinedAt: "2024-05-20"
  },
  {
    id: "u-coastline",
    email: "sales@coastlineinvest.me",
    name: "Coastline Invest",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-coastline/200/200",
    agencyName: "Coastline Invest",
    bio: "Új építésű projektek és befektetési ingatlanok Bar és környékén.",
    phone: "+382 67 400 400",
    location: "Bar, Montenegró",
    verified: true,
    responseTime: "egy órán belül",
    joinedAt: "2023-11-15"
  },
  {
    id: "u-capital",
    email: "office@capitalrealty.me",
    name: "Capital Realty",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-capital/200/200",
    agencyName: "Capital Realty",
    bio: "Városi lakások és üzlethelyiségek Podgoricában.",
    phone: "+382 67 500 500",
    location: "Podgorica, Montenegró",
    verified: true,
    responseTime: "egy napon belül",
    joinedAt: "2024-01-05"
  },
  {
    id: "u-jadran-hr",
    email: "info@jadrannekretnine.hr",
    name: "Jadran Nekretnine",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-jadranhr/200/200",
    agencyName: "Jadran Nekretnine",
    bio: "Tengerparti ingatlanok a horvát Adrián — Split, Dubrovnik, Isztria.",
    phone: "+385 21 100 100",
    location: "Split, Horvátország",
    verified: true,
    responseTime: "egy órán belül",
    joinedAt: "2023-06-14"
  },
  {
    id: "u-riviera-al",
    email: "office@rivieraalbania.al",
    name: "Riviera Albania",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-rivieraal/200/200",
    agencyName: "Riviera Albania",
    bio: "Az albán riviéra új építésű és tengerparti ingatlanjai — Sarandë, Vlorë, Ksamil.",
    phone: "+355 69 100 1000",
    location: "Sarandë, Albánia",
    verified: true,
    responseTime: "néhány órán belül",
    joinedAt: "2024-04-02"
  },
  {
    id: "u-belgrade-rs",
    email: "office@beogradestates.rs",
    name: "Beograd Estates",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-belgraders/200/200",
    agencyName: "Beograd Estates",
    bio: "Városi lakások és befektetési ingatlanok Belgrádban, Újvidéken és a hegyi üdülőkben.",
    phone: "+381 11 100 100",
    location: "Beograd, Szerbia",
    verified: true,
    responseTime: "egy napon belül",
    joinedAt: "2023-10-08"
  },
  {
    id: "u-bosphorus-tr",
    email: "info@bosphorusproperty.com.tr",
    name: "Bosphorus Property",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-bosphorustr/200/200",
    agencyName: "Bosphorus Property",
    bio: "Isztambuli és földközi-tengeri (Antalya, Bodrum) ingatlanok — állampolgársági program is.",
    phone: "+90 212 100 1000",
    location: "İstanbul, Törökország",
    verified: true,
    responseTime: "egy órán belül",
    joinedAt: "2023-05-19"
  },
  {
    id: "u-bali-id",
    email: "hello@balivillacollective.com",
    name: "Bali Villa Collective",
    role: "agency",
    avatar: "https://picsum.photos/seed/jadran-ag-baliid/200/200",
    agencyName: "Bali Villa Collective",
    bio: "Leasehold és freehold villák Baliban — Canggu, Seminyak, Ubud, Uluwatu.",
    phone: "+62 361 100 100",
    location: "Canggu, Bali (Indonézia)",
    verified: true,
    responseTime: "néhány órán belül",
    joinedAt: "2024-03-21"
  },
  {
    id: "u-marko",
    email: "marko.petrovic@example.com",
    name: "Marko Petrović",
    role: "private",
    avatar: "https://picsum.photos/seed/jadran-marko/200/200",
    agencyName: null,
    bio: "Magánszemélyként adom el a családi házunkat Igalóban.",
    phone: "+382 69 123 456",
    location: "Herceg Novi, Montenegró",
    verified: false,
    responseTime: "néhány órán belül",
    joinedAt: "2026-03-12"
  },
  {
    id: "u-jelena",
    email: "jelena.k@example.com",
    name: "Jelena Kovačević",
    role: "private",
    avatar: "https://picsum.photos/seed/jadran-jelena/200/200",
    agencyName: null,
    bio: "Stúdiómat és egy kiadó apartmant kínálom a tengerparton.",
    phone: "+382 69 654 321",
    location: "Budva, Montenegró",
    verified: true,
    responseTime: "egy órán belül",
    joinedAt: "2026-02-01"
  }
];

const AGENCY_TO_ID: Record<string, string> = {
  "Adriatic Homes": "u-adriatic",
  "Montenegro Prime": "u-prime",
  "Boka Estates": "u-boka",
  "Coastline Invest": "u-coastline",
  "Capital Realty": "u-capital",
  "Jadran Nekretnine": "u-jadran-hr",
  "Riviera Albania": "u-riviera-al",
  "Beograd Estates": "u-belgrade-rs",
  "Bosphorus Property": "u-bosphorus-tr",
  "Bali Villa Collective": "u-bali-id"
};

/* ------------------------------------------------------------------ *
 * Raw seed listings (the new fields are derived below)
 * ------------------------------------------------------------------ */

type RawListing = Omit<Listing, "mode" | "status" | "amenities" | "ownerId" | "views" | "country"> & {
  mode?: ListingMode;
  ownerId?: string;
  /** Opcionális a nyersben — ha hiányzik, a városból származtatjuk (fallback ME). */
  country?: CountryCode;
};

const raw: RawListing[] = [
  {
    id: "bud-101",
    title: {
      hu: "Modern kétszobás lakás tengerre néző kilátással",
      me: "Moderan dvosoban stan sa pogledom na more",
      en: "Modern two-bedroom apartment with sea view",
      ru: "Современная двухкомнатная квартира с видом на море"
    },
    description: {
      hu: "Világos lakás Budva központjában, 150 m-re a strandtól. Teljesen bútorozott, terasszal az óvárosra.",
      me: "Svetao stan u centru Budve, 150 m od plaže. Potpuno namešten, terasa sa pogledom na Stari grad.",
      en: "Bright apartment in central Budva, 150 m from the beach. Fully furnished, terrace overlooking the Old Town.",
      ru: "Светлая квартира в центре Будвы, 150 м от пляжа. Полностью меблирована, терраса с видом на Старый город."
    },
    type: "apartment",
    price: 245000,
    area: 68,
    rooms: 2,
    floor: 4,
    year: 2019,
    condition: "renovated",
    view: "sea",
    city: "Budva",
    district: "Centar",
    distanceToSea: 150,
    lat: 42.2864,
    lng: 18.84,
    verification: "full",
    images: imgs("bud-101"),
    agency: "Adriatic Homes",
    furnished: true,
    energy: "B",
    createdAt: "2026-05-12",
    priceHistory: [
      { date: "2026-02-01", price: 259000 },
      { date: "2026-04-10", price: 250000 },
      { date: "2026-05-12", price: 245000 }
    ]
  },
  {
    id: "tiv-201",
    title: {
      hu: "Luxusvilla a Porto Montenegro közelében",
      me: "Luksuzna vila u blizini Porto Montenegro",
      en: "Luxury villa near Porto Montenegro",
      ru: "Роскошная вилла рядом с Порто Монтенегро"
    },
    description: {
      hu: "Villa medencével és privát kerttel, 5 percre a Porto Montenegro kikötőtől.",
      me: "Vila sa bazenom i privatnim vrtom, 5 minuta od marine Porto Montenegro.",
      en: "Villa with pool and private garden, 5 minutes from Porto Montenegro marina.",
      ru: "Вилла с бассейном и частным садом, в 5 минутах от марины Порто Монтенегро."
    },
    type: "villa",
    price: 1250000,
    area: 320,
    rooms: 5,
    floor: null,
    year: 2021,
    condition: "new",
    view: "sea",
    city: "Tivat",
    district: "Seljanovo",
    distanceToSea: 400,
    lat: 42.4347,
    lng: 18.6963,
    verification: "full",
    images: imgs("tiv-201"),
    agency: "Montenegro Prime",
    furnished: true,
    energy: "A",
    createdAt: "2026-05-20",
    priceHistory: [{ date: "2026-05-20", price: 1250000 }]
  },
  {
    id: "kot-301",
    title: {
      hu: "Kőház a kotori óvárosban",
      me: "Kamena kuća u Starom gradu Kotor",
      en: "Stone house in Kotor Old Town",
      ru: "Каменный дом в Старом городе Котора"
    },
    description: {
      hu: "Autentikus kőház a városfalon belül, az eredeti részleteket megőrizve felújítva.",
      me: "Autentična kamena kuća unutar zidina, renovirana uz očuvanje originalnih detalja.",
      en: "Authentic stone house within the walls, renovated while preserving original details.",
      ru: "Аутентичный каменный дом в стенах, отреставрирован с сохранением оригинальных деталей."
    },
    type: "house",
    price: 480000,
    area: 140,
    rooms: 3,
    floor: null,
    year: 1780,
    condition: "renovated",
    view: "mountain",
    city: "Kotor",
    district: "Stari grad",
    distanceToSea: 250,
    lat: 42.4247,
    lng: 18.7712,
    verification: "deed",
    images: imgs("kot-301"),
    agency: "Boka Estates",
    furnished: false,
    energy: "C",
    createdAt: "2026-04-28",
    priceHistory: [
      { date: "2026-03-01", price: 495000 },
      { date: "2026-04-28", price: 480000 }
    ]
  },
  {
    id: "hn-401",
    title: {
      hu: "Teraszos lakás Herceg Noviban",
      me: "Stan sa terasom u Herceg Novom",
      en: "Apartment with terrace in Herceg Novi",
      ru: "Квартира с террасой в Герцег-Нови"
    },
    description: {
      hu: "Egyszobás lakás nagy terasszal és öbölre néző kilátással, a sétány közelében.",
      me: "Jednosoban stan sa velikom terasom i pogledom na zaliv, blizu šetališta.",
      en: "One-bedroom apartment with a large terrace and bay view, near the promenade.",
      ru: "Однокомнатная квартира с большой террасой и видом на залив, рядом с набережной."
    },
    type: "apartment",
    price: 138000,
    area: 45,
    rooms: 1,
    floor: 2,
    year: 2016,
    condition: "good",
    view: "sea",
    city: "Herceg Novi",
    district: "Savina",
    distanceToSea: 200,
    lat: 42.4531,
    lng: 18.5375,
    verification: "deed",
    images: imgs("hn-401"),
    agency: "Adriatic Homes",
    furnished: true,
    energy: "C",
    createdAt: "2026-05-25",
    priceHistory: [{ date: "2026-05-25", price: 138000 }]
  },
  {
    id: "bar-501",
    title: {
      hu: "Új építésű lakás a tenger közelében, Barban",
      me: "Novogradnja blizu mora u Baru",
      en: "New-build near the sea in Bar",
      ru: "Новостройка у моря в Баре"
    },
    description: {
      hu: "Lakás új komplexumban, garázzsal és közös medencével, azonnal beköltözhető.",
      me: "Stan u novom kompleksu sa garažom i zajedničkim bazenom, useljiv odmah.",
      en: "Apartment in a new complex with garage and shared pool, ready to move in.",
      ru: "Квартира в новом комплексе с гаражом и общим бассейном, готова к заселению."
    },
    type: "new",
    price: 165000,
    area: 58,
    rooms: 2,
    floor: 3,
    year: 2025,
    condition: "new",
    view: "city",
    city: "Bar",
    district: "Topolica",
    distanceToSea: 350,
    lat: 42.0931,
    lng: 19.1003,
    verification: "basic",
    images: imgs("bar-501"),
    agency: "Coastline Invest",
    furnished: false,
    energy: "A",
    createdAt: "2026-05-18",
    priceHistory: [{ date: "2026-05-18", price: 165000 }]
  },
  {
    id: "pg-601",
    title: {
      hu: "Tágas lakás Podgorica központjában",
      me: "Prostran stan u centru Podgorice",
      en: "Spacious apartment in central Podgorica",
      ru: "Просторная квартира в центре Подгорицы"
    },
    description: {
      hu: "Háromszobás lakás csendes utcában, iskolák és üzletek közelében.",
      me: "Trosoban stan u mirnoj ulici, blizu škola i prodavnica.",
      en: "Three-bedroom apartment on a quiet street, near schools and shops.",
      ru: "Трёхкомнатная квартира на тихой улице, рядом школы и магазины."
    },
    type: "apartment",
    price: 132000,
    area: 82,
    rooms: 3,
    floor: 5,
    year: 2012,
    condition: "good",
    view: "city",
    city: "Podgorica",
    district: "Preko Morače",
    distanceToSea: 40000,
    lat: 42.441,
    lng: 19.2627,
    verification: "deed",
    images: imgs("pg-601"),
    agency: "Capital Realty",
    furnished: false,
    energy: "D",
    createdAt: "2026-05-02",
    priceHistory: [
      { date: "2026-03-15", price: 139000 },
      { date: "2026-05-02", price: 132000 }
    ]
  },
  {
    id: "bud-102",
    title: {
      hu: "Penthouse tetőterasszal, Bečići",
      me: "Penthouse sa krovnom terasom, Bečići",
      en: "Penthouse with rooftop terrace, Bečići",
      ru: "Пентхаус с террасой на крыше, Бечичи"
    },
    description: {
      hu: "Luxus penthouse a Bečići strand felett, panorámás tengeri kilátással.",
      me: "Luksuzni penthouse iznad plaže Bečići, panoramski pogled na more.",
      en: "Luxury penthouse above Bečići beach, panoramic sea view.",
      ru: "Роскошный пентхаус над пляжем Бечичи, панорамный вид на море."
    },
    type: "apartment",
    price: 690000,
    area: 145,
    rooms: 4,
    floor: 8,
    year: 2022,
    condition: "new",
    view: "sea",
    city: "Budva",
    district: "Bečići",
    distanceToSea: 120,
    lat: 42.2778,
    lng: 18.8639,
    verification: "full",
    images: imgs("bud-102"),
    agency: "Montenegro Prime",
    furnished: true,
    energy: "A",
    createdAt: "2026-05-28",
    priceHistory: [{ date: "2026-05-28", price: 690000 }]
  },
  {
    id: "tiv-202",
    title: {
      hu: "Építési telek kilátással, Luštica",
      me: "Građevinsko zemljište sa pogledom, Lustica",
      en: "Building plot with view, Luštica",
      ru: "Участок под застройку с видом, Луштица"
    },
    description: {
      hu: "800 m²-es telek építési engedéllyel, nyitott tengeri kilátással.",
      me: "Zemljište 800 m² sa urbanističkom dozvolom, otvoren pogled na more.",
      en: "800 m² plot with building permit, open sea view.",
      ru: "Участок 800 м² с разрешением на строительство, открытый вид на море."
    },
    type: "land",
    price: 220000,
    area: 800,
    rooms: 0,
    floor: null,
    year: 0,
    condition: "good",
    view: "sea",
    city: "Tivat",
    district: "Luštica",
    distanceToSea: 900,
    lat: 42.3925,
    lng: 18.66,
    verification: "deed",
    images: imgs("tiv-202", 3),
    agency: "Boka Estates",
    furnished: false,
    energy: "-",
    createdAt: "2026-04-15",
    priceHistory: [{ date: "2026-04-15", price: 220000 }]
  },
  {
    id: "kot-302",
    title: {
      hu: "Üzlethelyiség Dobrotában",
      me: "Poslovni prostor u Dobroti",
      en: "Commercial space in Dobrota",
      ru: "Коммерческое помещение в Доброте"
    },
    description: {
      hu: "Földszinti üzlethelyiség forgalmas, tengerparti helyen.",
      me: "Lokal u prizemlju na frekventnoj lokaciji uz obalu.",
      en: "Ground-floor unit in a high-traffic seafront location.",
      ru: "Помещение на первом этаже в оживлённом месте у моря."
    },
    type: "commercial",
    price: 310000,
    area: 95,
    rooms: 0,
    floor: 0,
    year: 2010,
    condition: "good",
    view: "sea",
    city: "Kotor",
    district: "Dobrota",
    distanceToSea: 60,
    lat: 42.442,
    lng: 18.764,
    verification: "basic",
    images: imgs("kot-302", 4),
    agency: "Boka Estates",
    furnished: false,
    energy: "C",
    createdAt: "2026-05-08",
    priceHistory: [{ date: "2026-05-08", price: 310000 }]
  },
  {
    id: "hn-402",
    title: {
      hu: "Családi ház kerttel, Igalo",
      me: "Kuća sa vrtom, Igalo",
      en: "House with garden, Igalo",
      ru: "Дом с садом, Игало"
    },
    description: {
      hu: "Családi ház három hálószobával és nagy kerttel, az Igalo Intézet közelében.",
      me: "Porodična kuća sa tri spavaće sobe i velikim vrtom, blizu Instituta Igalo.",
      en: "Family house with three bedrooms and a large garden, near the Igalo Institute.",
      ru: "Семейный дом с тремя спальнями и большим садом, рядом с институтом Игало."
    },
    type: "house",
    price: 295000,
    area: 180,
    rooms: 4,
    floor: null,
    year: 2008,
    condition: "good",
    view: "mountain",
    city: "Herceg Novi",
    district: "Igalo",
    distanceToSea: 600,
    lat: 42.4569,
    lng: 18.51,
    verification: "none",
    images: imgs("hn-402"),
    agency: "Marko Petrović",
    ownerId: "u-marko",
    furnished: false,
    energy: "D",
    createdAt: "2026-05-22",
    priceHistory: [{ date: "2026-05-22", price: 295000 }]
  },
  {
    id: "bud-103",
    title: {
      hu: "Stúdió Budva óvárosának szívében",
      me: "Studio u srcu Starog grada Budve",
      en: "Studio in the heart of Budva Old Town",
      ru: "Студия в сердце Старого города Будвы"
    },
    description: {
      hu: "Kompakt stúdió, ideális turisztikai kiadásra, közvetlenül a strand mellett.",
      me: "Kompaktan studio idealan za izdavanje turistima, odmah do plaže.",
      en: "Compact studio ideal for tourist rental, right by the beach.",
      ru: "Компактная студия, идеальна для сдачи туристам, прямо у пляжа."
    },
    type: "apartment",
    price: 99000,
    area: 28,
    rooms: 1,
    floor: 1,
    year: 2005,
    condition: "renovated",
    view: "city",
    city: "Budva",
    district: "Stari grad",
    distanceToSea: 80,
    lat: 42.2783,
    lng: 18.8386,
    verification: "deed",
    images: imgs("bud-103", 4),
    agency: "Jelena Kovačević",
    ownerId: "u-jelena",
    furnished: true,
    energy: "C",
    createdAt: "2026-05-29",
    priceHistory: [{ date: "2026-05-29", price: 99000 }]
  },
  {
    id: "bar-502",
    title: {
      hu: "Villa medencével, Šušanj",
      me: "Vila sa bazenom, Šušanj",
      en: "Villa with pool, Šušanj",
      ru: "Вилла с бассейном, Шушань"
    },
    description: {
      hu: "Modern villa 200 m-re a strandtól, medencével és kétállásos garázzsal.",
      me: "Moderna vila na 200 m od plaže, sa bazenom i garažom za dva auta.",
      en: "Modern villa 200 m from the beach, with pool and two-car garage.",
      ru: "Современная вилла в 200 м от пляжа, с бассейном и гаражом на две машины."
    },
    type: "villa",
    price: 540000,
    area: 240,
    rooms: 5,
    floor: null,
    year: 2020,
    condition: "new",
    view: "sea",
    city: "Bar",
    district: "Šušanj",
    distanceToSea: 200,
    lat: 42.118,
    lng: 19.108,
    verification: "full",
    images: imgs("bar-502"),
    agency: "Coastline Invest",
    furnished: true,
    energy: "A",
    createdAt: "2026-05-15",
    priceHistory: [
      { date: "2026-04-01", price: 560000 },
      { date: "2026-05-15", price: 540000 }
    ]
  },
  /* ---------------- Rentals (mode: rent, price = monthly) ---------------- */
  {
    id: "rent-bud-701",
    title: {
      hu: "Kiadó tengerparti apartman, Budva",
      me: "Apartman za izdavanje uz more, Budva",
      en: "Seafront apartment for rent, Budva",
      ru: "Аренда апартаментов у моря, Будва"
    },
    description: {
      hu: "Bútorozott kétszobás apartman hosszú távra, tengerre néző erkéllyel, a sétány mellett.",
      me: "Namešten dvosoban apartman za dugoročni najam, balkon s pogledom na more, uz šetalište.",
      en: "Furnished two-bedroom apartment for long-term rent, sea-view balcony, by the promenade.",
      ru: "Меблированная двухкомнатная квартира в долгосрочную аренду, балкон с видом на море."
    },
    type: "apartment",
    mode: "rent",
    price: 850,
    area: 62,
    rooms: 2,
    floor: 3,
    year: 2018,
    condition: "renovated",
    view: "sea",
    city: "Budva",
    district: "Centar",
    distanceToSea: 120,
    lat: 42.2858,
    lng: 18.842,
    verification: "deed",
    images: imgs("rent-bud-701"),
    agency: "Jelena Kovačević",
    ownerId: "u-jelena",
    furnished: true,
    energy: "B",
    createdAt: "2026-05-27",
    priceHistory: [{ date: "2026-05-27", price: 850 }]
  },
  {
    id: "rent-tiv-702",
    title: {
      hu: "Modern stúdió kiadó, Tivat",
      me: "Moderan studio za izdavanje, Tivat",
      en: "Modern studio for rent, Tivat",
      ru: "Современная студия в аренду, Тиват"
    },
    description: {
      hu: "Új építésű stúdió a Porto Montenegro közelében, légkondival és garázzsal.",
      me: "Novi studio blizu Porto Montenegro, sa klimom i garažom.",
      en: "New-build studio near Porto Montenegro, with A/C and garage.",
      ru: "Студия в новостройке рядом с Порто Монтенегро, кондиционер и гараж."
    },
    type: "apartment",
    mode: "rent",
    price: 600,
    area: 34,
    rooms: 1,
    floor: 2,
    year: 2023,
    condition: "new",
    view: "city",
    city: "Tivat",
    district: "Centar",
    distanceToSea: 300,
    lat: 42.4361,
    lng: 18.6962,
    verification: "basic",
    images: imgs("rent-tiv-702", 4),
    agency: "Montenegro Prime",
    furnished: true,
    energy: "A",
    createdAt: "2026-05-19",
    priceHistory: [{ date: "2026-05-19", price: 600 }]
  },
  {
    id: "rent-hn-703",
    title: {
      hu: "Kiadó ház kerttel, Herceg Novi",
      me: "Kuća sa vrtom za izdavanje, Herceg Novi",
      en: "House with garden for rent, Herceg Novi",
      ru: "Дом с садом в аренду, Герцег-Нови"
    },
    description: {
      hu: "Háromszobás ház hosszú távra, nagy kerttel és terasszal, csendes környéken.",
      me: "Trosobna kuća za dugoročni najam, veliki vrt i terasa, mirna lokacija.",
      en: "Three-bedroom house for long-term rent, large garden and terrace, quiet area.",
      ru: "Трёхкомнатный дом в долгосрочную аренду, большой сад и терраса."
    },
    type: "house",
    mode: "rent",
    price: 1100,
    area: 150,
    rooms: 3,
    floor: null,
    year: 2014,
    condition: "good",
    view: "mountain",
    city: "Herceg Novi",
    district: "Topla",
    distanceToSea: 700,
    lat: 42.4521,
    lng: 18.531,
    verification: "deed",
    images: imgs("rent-hn-703"),
    agency: "Adriatic Homes",
    furnished: true,
    energy: "C",
    createdAt: "2026-05-10",
    priceHistory: [{ date: "2026-05-10", price: 1100 }]
  },
  {
    id: "rent-pg-704",
    title: {
      hu: "Kiadó lakás a központban, Podgorica",
      me: "Stan za izdavanje u centru, Podgorica",
      en: "Central apartment for rent, Podgorica",
      ru: "Аренда квартиры в центре, Подгорица"
    },
    description: {
      hu: "Kétszobás, bútorozott lakás a városközpontban, irodák és egyetem közelében.",
      me: "Dvosoban namešten stan u centru grada, blizu kancelarija i univerziteta.",
      en: "Two-bedroom furnished apartment downtown, near offices and the university.",
      ru: "Двухкомнатная меблированная квартира в центре, рядом офисы и университет."
    },
    type: "apartment",
    mode: "rent",
    price: 520,
    area: 70,
    rooms: 2,
    floor: 4,
    year: 2011,
    condition: "good",
    view: "city",
    city: "Podgorica",
    district: "Centar",
    distanceToSea: 41000,
    lat: 42.4404,
    lng: 19.2594,
    verification: "basic",
    images: imgs("rent-pg-704", 4),
    agency: "Capital Realty",
    furnished: true,
    energy: "C",
    createdAt: "2026-05-21",
    priceHistory: [{ date: "2026-05-21", price: 520 }]
  },

  /* ===================== HORVÁTORSZÁG (HR) ===================== */
  {
    id: "dbv-101",
    title: {
      hu: "Tengerre néző apartman Dubrovnik óvárosa felett",
      me: "Apartman s pogledom na more iznad starog grada Dubrovnika",
      en: "Sea-view apartment above Dubrovnik Old Town",
      ru: "Апартаменты с видом на море над Старым городом Дубровника"
    },
    description: {
      hu: "Felújított kétszobás apartman panorámás terasszal az Adriára, sétatávolságra a történelmi óvárostól.",
      me: "Renovirani dvosobni apartman s panoramskom terasom, na pješačkoj udaljenosti od starog grada.",
      en: "Renovated two-bedroom apartment with a panoramic terrace, walking distance to the historic core.",
      ru: "Отремонтированные апартаменты с панорамной террасой, в пешей доступности от старого города."
    },
    type: "apartment",
    price: 395000,
    area: 74,
    rooms: 2,
    floor: 3,
    year: 2016,
    condition: "renovated",
    view: "sea",
    city: "Dubrovnik",
    district: "Ploče",
    distanceToSea: 250,
    lat: 42.6407,
    lng: 18.1153,
    verification: "full",
    images: imgs("dbv-101"),
    agency: "Jadran Nekretnine",
    furnished: true,
    energy: "B",
    createdAt: "2026-06-02",
    priceHistory: [{ date: "2026-06-02", price: 395000 }]
  },
  {
    id: "spl-102",
    title: {
      hu: "Új építésű lakás Split tengerparti negyedében",
      me: "Novogradnja u priobalnom dijelu Splita",
      en: "New-build apartment in a coastal Split district",
      ru: "Новостройка в прибрежном районе Сплита"
    },
    description: {
      hu: "Energiahatékony új építésű lakás garázzsal és közös medencével, 300 m-re a strandtól.",
      me: "Energetski efikasna novogradnja s garažom i zajedničkim bazenom, 300 m od plaže.",
      en: "Energy-efficient new build with garage and shared pool, 300 m from the beach.",
      ru: "Энергоэффективная новостройка с гаражом и общим бассейном, 300 м до пляжа."
    },
    type: "new",
    price: 312000,
    area: 63,
    rooms: 2,
    floor: 2,
    year: 2024,
    condition: "new",
    view: "sea",
    city: "Split",
    district: "Žnjan",
    distanceToSea: 300,
    lat: 43.5006,
    lng: 16.4788,
    verification: "deed",
    images: imgs("spl-102"),
    agency: "Jadran Nekretnine",
    furnished: false,
    energy: "A",
    createdAt: "2026-06-10",
    priceHistory: [{ date: "2026-06-10", price: 312000 }]
  },
  {
    id: "rov-103",
    title: {
      hu: "Isztriai kővilla medencével Rovinj mellett",
      me: "Istarska kamena vila s bazenom kraj Rovinja",
      en: "Istrian stone villa with pool near Rovinj",
      ru: "Истрийская каменная вилла с бассейном рядом с Ровинем"
    },
    description: {
      hu: "Gondosan felújított kővilla nagy kerttel, medencével és nyugodt, zöldövezeti környezettel.",
      me: "Pažljivo obnovljena kamena vila s velikim vrtom, bazenom i mirnim zelenim okruženjem.",
      en: "Carefully restored stone villa with a large garden, pool and quiet green surroundings.",
      ru: "Тщательно отреставрированная каменная вилла с большим садом, бассейном и тихим зелёным окружением."
    },
    type: "villa",
    price: 690000,
    area: 210,
    rooms: 4,
    floor: null,
    year: 2011,
    condition: "renovated",
    view: "city",
    city: "Rovinj",
    district: "Monfiorenzo",
    distanceToSea: 1200,
    lat: 45.0731,
    lng: 13.6549,
    verification: "full",
    images: imgs("rov-103"),
    agency: "Jadran Nekretnine",
    furnished: true,
    energy: "B",
    createdAt: "2026-05-28",
    priceHistory: [{ date: "2026-05-28", price: 690000 }]
  },

  /* ===================== ALBÁNIA (AL) ===================== */
  {
    id: "sar-201",
    title: {
      hu: "Tengerparti apartman az albán riviérán, Sarandëban",
      me: "Apartman uz more na albanskoj rivijeri, Saranda",
      en: "Seafront apartment on the Albanian Riviera, Sarandë",
      ru: "Апартаменты у моря на Албанской Ривьере, Саранда"
    },
    description: {
      hu: "Első vonalbeli apartman tágas erkéllyel és közvetlen tengeri kilátással, Korfu szigetére nézve.",
      me: "Apartman u prvom redu do mora s prostranim balkonom i pogledom na Krf.",
      en: "Front-line apartment with a spacious balcony and open sea views towards Corfu.",
      ru: "Апартаменты в первой линии с просторным балконом и видом на море в сторону Корфу."
    },
    type: "apartment",
    price: 158000,
    area: 66,
    rooms: 2,
    floor: 5,
    year: 2022,
    condition: "new",
    view: "sea",
    city: "Sarandë",
    district: "Kodra",
    distanceToSea: 80,
    lat: 39.8756,
    lng: 20.0053,
    verification: "deed",
    images: imgs("sar-201"),
    agency: "Riviera Albania",
    furnished: true,
    energy: "B",
    createdAt: "2026-06-05",
    priceHistory: [{ date: "2026-06-05", price: 158000 }]
  },
  {
    id: "ksm-202",
    title: {
      hu: "Új építésű stúdió Ksamilban, a strandok mellett",
      me: "Novi studio u Ksamilu, kraj plaža",
      en: "New-build studio in Ksamil, next to the beaches",
      ru: "Студия в новостройке в Ксамиле, рядом с пляжами"
    },
    description: {
      hu: "Kompakt, teljesen felszerelt stúdió erős rövidtávú kiadási potenciállal, a Ksamil-szigetek közelében.",
      me: "Kompaktan, potpuno opremljen studio s jakim potencijalom za kratkoročni najam, blizu Ksamilskih ostrva.",
      en: "Compact, fully equipped studio with strong short-let potential, near the Ksamil islands.",
      ru: "Компактная, полностью оборудованная студия с высоким потенциалом посуточной аренды, рядом с островами Ксамиля."
    },
    type: "apartment",
    price: 92000,
    area: 34,
    rooms: 1,
    floor: 2,
    year: 2023,
    condition: "new",
    view: "sea",
    city: "Ksamil",
    district: "Ksamil Qendër",
    distanceToSea: 150,
    lat: 39.7660,
    lng: 20.0016,
    verification: "basic",
    images: imgs("ksm-202", 4),
    agency: "Riviera Albania",
    furnished: true,
    energy: "A",
    createdAt: "2026-06-12",
    priceHistory: [{ date: "2026-06-12", price: 92000 }]
  },
  {
    id: "vlo-203",
    title: {
      hu: "Panorámás apartman Vlorë új sétányán",
      me: "Apartman s pogledom na novoj rivi u Vlori",
      en: "Panoramic apartment on Vlorë's new promenade",
      ru: "Панорамные апартаменты на новой набережной Влёры"
    },
    description: {
      hu: "Modern lakás a Lungomare sétányon, közös medencével és fitneszteremmel, egész évben élhető környezetben.",
      me: "Moderan stan na Lungomare šetalištu, sa zajedničkim bazenom i teretanom.",
      en: "Modern apartment on the Lungomare promenade with shared pool and gym.",
      ru: "Современная квартира на набережной Лунгомаре с общим бассейном и спортзалом."
    },
    type: "apartment",
    price: 121000,
    area: 58,
    rooms: 2,
    floor: 6,
    year: 2021,
    condition: "new",
    view: "sea",
    city: "Vlorë",
    district: "Lungomare",
    distanceToSea: 200,
    lat: 40.4560,
    lng: 19.4880,
    verification: "deed",
    images: imgs("vlo-203"),
    agency: "Riviera Albania",
    furnished: true,
    energy: "B",
    createdAt: "2026-05-30",
    priceHistory: [{ date: "2026-05-30", price: 121000 }]
  },

  /* ===================== SZERBIA (RS) ===================== */
  {
    id: "beg-301",
    title: {
      hu: "Design lakás Belgrád vízparti negyedében",
      me: "Dizajnerski stan u beogradskom priobalnom kvartu",
      en: "Design apartment in Belgrade's waterfront district",
      ru: "Дизайнерская квартира в набережном районе Белграда"
    },
    description: {
      hu: "Igényes kétszobás lakás a Belgrád Waterfront fejlesztésben, folyóra néző kilátással és mélygarázzsal.",
      me: "Kvalitetan dvosoban stan u Beogradu na vodi, s pogledom na reku i garažom.",
      en: "High-spec two-bedroom in the Belgrade Waterfront, with river views and underground parking.",
      ru: "Качественная двухкомнатная квартира в Belgrade Waterfront с видом на реку и подземным паркингом."
    },
    type: "apartment",
    price: 268000,
    area: 71,
    rooms: 2,
    floor: 9,
    year: 2020,
    condition: "new",
    view: "city",
    city: "Beograd",
    district: "Savski venac",
    distanceToSea: 0,
    lat: 44.8020,
    lng: 20.4490,
    verification: "full",
    images: imgs("beg-301"),
    agency: "Beograd Estates",
    furnished: true,
    energy: "A",
    createdAt: "2026-06-01",
    priceHistory: [{ date: "2026-06-01", price: 268000 }]
  },
  {
    id: "zla-302",
    title: {
      hu: "Hegyi apartman Zlatiboron, sípálya közelében",
      me: "Planinski apartman na Zlatiboru, blizu staza",
      en: "Mountain apartment in Zlatibor, near the slopes",
      ru: "Горные апартаменты на Златиборе, рядом со склонами"
    },
    description: {
      hu: "Népszerű egész éves üdülőhely; jól kiadható apartman a központhoz és a Gold Gondola állomáshoz közel.",
      me: "Popularno celogodišnje odmaralište; apartman za izdavanje blizu centra i Gold Gondole.",
      en: "Popular year-round resort; a rentable apartment near the centre and the Gold Gondola.",
      ru: "Популярный круглогодичный курорт; сдаваемые апартаменты рядом с центром и Gold Gondola."
    },
    type: "apartment",
    price: 96000,
    area: 42,
    rooms: 1,
    floor: 1,
    year: 2019,
    condition: "good",
    view: "mountain",
    city: "Zlatibor",
    district: "Centar",
    distanceToSea: 0,
    lat: 43.7294,
    lng: 19.7000,
    verification: "deed",
    images: imgs("zla-302", 4),
    agency: "Beograd Estates",
    furnished: true,
    energy: "C",
    createdAt: "2026-05-25",
    priceHistory: [{ date: "2026-05-25", price: 96000 }]
  },

  /* ===================== TÖRÖKORSZÁG (TR) ===================== */
  {
    id: "ist-401",
    title: {
      hu: "Modern lakás Isztambulban, tenger közeli projektben",
      me: "Moderan stan u Istanbulu, u projektu blizu mora",
      en: "Modern apartment in Istanbul, in a sea-side project",
      ru: "Современная квартира в Стамбуле, в проекте у моря"
    },
    description: {
      hu: "Zárt lakóparki lakás medencével és biztonsági szolgálattal, az európai oldalon — állampolgársági programra alkalmas.",
      me: "Stan u zatvorenom kompleksu s bazenom i obezbeđenjem, na evropskoj strani.",
      en: "Gated-complex apartment with pool and security on the European side — citizenship-eligible.",
      ru: "Квартира в закрытом комплексе с бассейном и охраной на европейской стороне — подходит для гражданства."
    },
    type: "apartment",
    price: 205000,
    area: 88,
    rooms: 3,
    floor: 7,
    year: 2022,
    condition: "new",
    view: "city",
    city: "İstanbul",
    district: "Beylikdüzü",
    distanceToSea: 700,
    lat: 41.0035,
    lng: 28.6360,
    verification: "deed",
    images: imgs("ist-401"),
    agency: "Bosphorus Property",
    furnished: false,
    energy: "B",
    createdAt: "2026-06-08",
    priceHistory: [{ date: "2026-06-08", price: 205000 }]
  },
  {
    id: "ant-402",
    title: {
      hu: "Villa medencével Antalyában, tengerre néző kilátással",
      me: "Vila s bazenom u Antaliji, s pogledom na more",
      en: "Villa with pool in Antalya, sea views",
      ru: "Вилла с бассейном в Анталье, вид на море"
    },
    description: {
      hu: "Különálló villa privát medencével és kerttel, közel a strandokhoz és a golfpályákhoz Belekben.",
      me: "Samostalna vila s privatnim bazenom i vrtom, blizu plaža i golf terena u Beleku.",
      en: "Detached villa with private pool and garden, close to the beaches and golf courses in Belek.",
      ru: "Отдельная вилла с частным бассейном и садом, рядом с пляжами и полями для гольфа в Белеке."
    },
    type: "villa",
    price: 430000,
    area: 240,
    rooms: 4,
    floor: null,
    year: 2023,
    condition: "new",
    view: "sea",
    city: "Antalya",
    district: "Belek",
    distanceToSea: 900,
    lat: 36.8630,
    lng: 31.0560,
    verification: "full",
    images: imgs("ant-402"),
    agency: "Bosphorus Property",
    furnished: true,
    energy: "A",
    createdAt: "2026-06-11",
    priceHistory: [{ date: "2026-06-11", price: 430000 }]
  },
  {
    id: "bod-403",
    title: {
      hu: "Kiadó design apartman Bodrumban, szezonális bérlés",
      me: "Dizajnerski apartman za najam u Bodrumu",
      en: "Design apartment for rent in Bodrum",
      ru: "Дизайнерские апартаменты в аренду в Бодруме"
    },
    description: {
      hu: "Havi díjas, teljesen berendezett apartman a marina közelében, medencével — hosszabb tartózkodásra ideális.",
      me: "Mesečni najam, potpuno opremljen apartman blizu marine, s bazenom.",
      en: "Monthly, fully furnished apartment near the marina with a pool — ideal for longer stays.",
      ru: "Помесячная, полностью меблированная квартира рядом с мариной, с бассейном."
    },
    type: "apartment",
    mode: "rent",
    price: 1400,
    area: 70,
    rooms: 2,
    floor: 1,
    year: 2021,
    condition: "renovated",
    view: "sea",
    city: "Bodrum",
    district: "Yalıkavak",
    distanceToSea: 300,
    lat: 37.1090,
    lng: 27.2900,
    verification: "basic",
    images: imgs("bod-403", 4),
    agency: "Bosphorus Property",
    furnished: true,
    energy: "B",
    createdAt: "2026-06-14",
    priceHistory: [{ date: "2026-06-14", price: 1400 }]
  },

  /* ===================== BALI, INDONÉZIA (ID) ===================== */
  {
    id: "cng-501",
    title: {
      hu: "Leasehold villa Cangguban, trópusi kerttel",
      me: "Leasehold vila u Cangguu, s tropskim vrtom",
      en: "Leasehold villa in Canggu with tropical garden",
      ru: "Вилла в лизхолд в Чангу с тропическим садом"
    },
    description: {
      hu: "Modern háromszobás villa privát medencével, a divatos Canggu szörf- és kávézónegyedében — magas kiadási hozam.",
      me: "Moderna trosobna vila s privatnim bazenom, u popularnom surf i kafe kvartu Canggua.",
      en: "Modern three-bedroom villa with private pool in Canggu's trendy surf-and-café district — strong rental yield.",
      ru: "Современная вилла с тремя спальнями и частным бассейном в модном сёрф-районе Чангу — высокая доходность."
    },
    type: "villa",
    price: 285000,
    area: 180,
    rooms: 3,
    floor: null,
    year: 2022,
    condition: "new",
    view: "city",
    city: "Canggu",
    district: "Berawa",
    distanceToSea: 800,
    lat: -8.6560,
    lng: 115.1380,
    verification: "deed",
    images: imgs("cng-501"),
    agency: "Bali Villa Collective",
    furnished: true,
    energy: "A",
    createdAt: "2026-06-03",
    priceHistory: [{ date: "2026-06-03", price: 285000 }]
  },
  {
    id: "smk-502",
    title: {
      hu: "Kiadó villa Seminyakban, havi bérlés medencével",
      me: "Vila za najam u Seminyaku, mesečni najam s bazenom",
      en: "Villa for rent in Seminyak, monthly with pool",
      ru: "Вилла в аренду в Семиньяке, помесячно с бассейном"
    },
    description: {
      hu: "Teljesen felszerelt kétszobás villa privát medencével, sétatávolságra az éttermektől és a strandtól.",
      me: "Potpuno opremljena dvosobna vila s privatnim bazenom, na pješačkoj udaljenosti od plaže.",
      en: "Fully equipped two-bedroom villa with private pool, walking distance to restaurants and the beach.",
      ru: "Полностью оборудованная вилла с двумя спальнями и частным бассейном, в пешей доступности от пляжа."
    },
    type: "villa",
    mode: "rent",
    price: 1650,
    area: 130,
    rooms: 2,
    floor: null,
    year: 2020,
    condition: "good",
    view: "city",
    city: "Seminyak",
    district: "Oberoi",
    distanceToSea: 600,
    lat: -8.6870,
    lng: 115.1560,
    verification: "basic",
    images: imgs("smk-502"),
    agency: "Bali Villa Collective",
    furnished: true,
    energy: "B",
    createdAt: "2026-06-15",
    priceHistory: [{ date: "2026-06-15", price: 1650 }]
  },
  {
    id: "ubd-503",
    title: {
      hu: "Dzsungelre néző villa Ubudban, jóga-öböl közelében",
      me: "Vila s pogledom na džunglu u Ubudu",
      en: "Jungle-view villa in Ubud, near the yoga scene",
      ru: "Вилла с видом на джунгли в Убуде, рядом с йога-центрами"
    },
    description: {
      hu: "Nyugodt, természetközeli villa rizsföldre néző kilátással és úszómedencével, Bali kulturális szívében.",
      me: "Mirna vila blizu prirode s pogledom na pirinčana polja i bazenom, u kulturnom srcu Balija.",
      en: "Peaceful nature-close villa overlooking rice fields with a pool, in Bali's cultural heart.",
      ru: "Спокойная вилла на природе с видом на рисовые поля и бассейном, в культурном сердце Бали."
    },
    type: "villa",
    price: 240000,
    area: 165,
    rooms: 3,
    floor: null,
    year: 2021,
    condition: "new",
    view: "mountain",
    city: "Ubud",
    district: "Penestanan",
    distanceToSea: 0,
    lat: -8.5069,
    lng: 115.2510,
    verification: "deed",
    images: imgs("ubd-503"),
    agency: "Bali Villa Collective",
    furnished: true,
    energy: "A",
    createdAt: "2026-06-06",
    priceHistory: [{ date: "2026-06-06", price: 240000 }]
  }
];

/* ------------------------------------------------------------------ *
 * Derive amenities + fill defaults
 * ------------------------------------------------------------------ */

function amenitiesFor(l: RawListing): Amenity[] {
  const a = new Set<Amenity>();
  if (l.furnished) a.add("furnished");
  if (l.view === "sea") a.add("seaview");
  if (l.type === "villa") {
    a.add("pool");
    a.add("garden");
    a.add("parking");
    a.add("garage");
  }
  if (l.type === "house") {
    a.add("garden");
    a.add("parking");
  }
  if (l.type === "apartment" || l.type === "new") {
    a.add("balcony");
    if ((l.floor ?? 0) >= 2) a.add("elevator");
  }
  if (l.energy === "A" || l.energy === "B") {
    a.add("ac");
    a.add("heating");
  }
  if (l.type !== "land" && l.type !== "commercial") a.add("wifi");
  if (l.type === "new" || l.type === "villa") a.add("security");
  return Array.from(a);
}

// Deterministic pseudo view-count so the UI has data without randomness churn.
function viewsFor(id: string): number {
  const seed = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return 40 + (seed % 460);
}

function seedNum(id: string, salt = 0): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), salt);
}

// Context-aware extras derived deterministically from the raw listing so the
// sale vs. rent UIs have meaningful, non-random data to display & filter on.
function contextExtras(l: RawListing): Partial<Listing> {
  const s = seedNum(l.id);
  if ((l.mode ?? "sale") === "rent") {
    const term = [1, 3, 6, 12][s % 4];
    return {
      deposit: Math.round(l.price * (1 + (s % 2))), // 1–2 months
      minTermMonths: term,
      utilitiesIncluded: s % 3 === 0,
      petsAllowed: s % 2 === 0,
      availableFrom: s % 4 === 0 ? "2026-05-31" : "2026-07-01"
    };
  }
  const HEAT = ["gas", "electric", "heatpump", "central"];
  const extras: Partial<Listing> = { heatingType: HEAT[s % HEAT.length] };
  if (l.type === "house" || l.type === "villa" || l.type === "land") {
    extras.plotArea = Math.round(l.area * (2 + (s % 4)) + 120);
  }
  if (l.type === "apartment" || l.type === "new") {
    extras.monthlyCommonCost = 40 + (s % 12) * 10;
  }
  return extras;
}

export const seedListings: Listing[] = raw.map((l) => ({
  ...l,
  country: l.country ?? countryOfCity(l.city) ?? "ME",
  mode: l.mode ?? "sale",
  status: "active",
  amenities: amenitiesFor(l),
  ownerId: l.ownerId ?? AGENCY_TO_ID[l.agency] ?? "u-adriatic",
  views: viewsFor(l.id),
  ...contextExtras(l)
}));

/* ------------------------------------------------------------------ *
 * Pure helpers (operate on a passed-in array, default to seed)
 * ------------------------------------------------------------------ */

// Cities that currently have listings — used for the compact "quick" chips.
export const cities = Array.from(new Set(seedListings.map((l) => l.city))).sort();

/**
 * Comprehensive gazetteer of Montenegrin places: all 25 municipalities plus the
 * coastal towns, villages and notable settlements buyers actually search for.
 * Powers the location autocomplete so the system "recognises" anywhere in
 * Montenegro, not just the handful of cities that happen to have a listing.
 */
export const montenegroPlaces: string[] = Array.from(
  new Set<string>([
    // --- Mind a 25 község / nagyobb város ---
    "Podgorica", "Nikšić", "Pljevlja", "Bijelo Polje", "Cetinje", "Bar", "Herceg Novi",
    "Berane", "Budva", "Ulcinj", "Tivat", "Rožaje", "Kotor", "Danilovgrad", "Mojkovac",
    "Kolašin", "Plav", "Žabljak", "Andrijevica", "Plužine", "Šavnik", "Gusinje",
    "Petnjica", "Tuzi", "Golubovci", "Zeta",
    // --- Podgorica városrészek / kvartok ---
    "Stara Varoš", "Nova Varoš", "Preko Morače", "Blok V", "Blok VI", "Blok IX",
    "City Kvart", "Zabjelo", "Zagorič", "Konik", "Momišići", "Masline", "Dajbabe",
    "Tološi", "Donja Gorica", "Gornja Gorica", "Ljubović", "Drač", "Pobrežje",
    "Stari Aerodrom", "Murtovina", "Kruševac", "Vrela Ribnička", "Botun", "Cijevna",
    // --- Boka Kotorska (öböl) ---
    "Dobrota", "Muo", "Prčanj", "Stoliv", "Perast", "Risan", "Morinj", "Kostanjica",
    "Kamenari", "Lepetane", "Donja Lastva", "Gornja Lastva", "Krašići", "Rose",
    "Žanjice", "Luštica", "Radovići", "Bjelila", "Gošići", "Đuraševići", "Škaljari",
    "Dub", "Orahovac", "Ljuta", "Krimovica", "Nalježići", "Bogdašići", "Gornji Stoliv",
    // --- Herceg Novi riviéra ---
    "Igalo", "Topla", "Savina", "Meljine", "Zelenika", "Kumbor", "Đenovići", "Baošići",
    "Bijela", "Njivice", "Sutorina", "Kruševice", "Podi", "Sasovići", "Kameno", "Mojdež",
    // --- Budva riviéra ---
    "Bečići", "Rafailovići", "Sveti Stefan", "Miločer", "Pržno", "Petrovac", "Buljarica",
    "Bigova", "Jaz", "Maini", "Lapčići", "Bulevar", "Dubovica", "Kamenovo", "Przno",
    "Reževići", "Katun Reževići", "Sveti Stefan", "Blizikuće", "Kuljače", "Markovići",
    "Podkošljun", "Babin Do", "Đurići", "Tudorovići",
    // --- Tivat ---
    "Seljanovo", "Gradiošnica", "Mrčevac", "Donja Lastva", "Krtoli", "Kalimanj",
    "Porto Montenegro", "Lepetani",
    // --- Bar & Ulcinj riviéra ---
    "Sutomore", "Čanj", "Spič", "Šušanj", "Stari Bar", "Dobra Voda", "Utjeha", "Bušat",
    "Velika Plaža", "Ada Bojana", "Valdanos", "Vladimir", "Topolica", "Ilino", "Bjeliši",
    "Zeleni Pojas", "Polje", "Pečurice", "Kunje", "Mala Plaža", "Pinješ", "Đerane",
    "Štoj", "Zoganje", "Krute",
    // --- Skadar-tó & hinterland ---
    "Virpazar", "Rijeka Crnojevića", "Murići", "Krnjice", "Godinje", "Karuč", "Dodoši",
    "Ostros", "Ckla", "Seoca",
    // --- Nikšić & környéke ---
    "Ozrinići", "Zagrad", "Kličevo", "Straševina", "Rubeža", "Vidrovan", "Trebjesa",
    // --- Cetinje & Lovćen ---
    "Njeguši", "Bajice", "Rijeka Crnojevića", "Dobrsko Selo", "Ivanova Korita",
    // --- Északi / hegyvidék ---
    "Kolašin 1450", "Bjelasica", "Durmitor", "Pošćenje", "Šavnik", "Boan", "Bukovica",
    "Tara", "Đurđevića Tara", "Pošćenski Kraj", "Vraneštica", "Njegovuđa", "Petnjica",
    "Rudo Polje", "Lipovo",
    // --- Egyéb keresett települések ---
    "Spuž", "Mareza", "Farmaci", "Lekići", "Ubli", "Sukuruć", "Grbalj", "Lastva Grbaljska",
    "Šušanj", "Prijevor", "Kavač", "Radanovići", "Glavati", "Dražin Vrt"
  ])
).sort((a, b) => a.localeCompare(b));

export function similarListings(listing: Listing, all: Listing[], n = 3): Listing[] {
  // A TÍPUS-egyezést erősebben súlyozzuk (egy telek ne legyen „hasonló" egy
  // lakáshoz), és a MÉRETET is figyelembe vesszük — nem csak az árat, hogy nagyon
  // eltérő méretű ingatlanok ne kerüljenek egymás mellé.
  const areaClose = (l: Listing) =>
    listing.area > 0 && l.area > 0 && Math.abs(l.area - listing.area) < Math.max(listing.area, l.area) * 0.4;
  return all
    .filter((l) => l.id !== listing.id && l.mode === listing.mode && l.status === "active")
    .map((l) => ({
      l,
      score:
        (l.type === listing.type ? 4 : 0) +
        (l.city === listing.city ? 3 : 0) +
        (Math.abs(l.price - listing.price) < listing.price * 0.35 ? 2 : 0) +
        (areaClose(l) ? 2 : 0)
    }))
    // Csak érdemi egyezést mutatunk (legalább a típus VAGY a város stimmel).
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.l);
}

// Average €/m² per city for sale listings, used for price-transparency comparisons.
export function cityAvgPricePerM2(city: string, all: Listing[]): number {
  const inCity = all.filter(
    (l) => l.city === city && l.mode === "sale" && l.type !== "land" && l.area > 0
  );
  if (inCity.length === 0) return 0;
  const sum = inCity.reduce((acc, l) => acc + l.price / l.area, 0);
  return Math.round(sum / inCity.length);
}

export interface TrendPoint {
  label: string;
  value: number;
}

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "Maj"];

// Deterministic synthetic 12-month €/m² trend per city, anchored to its current
// average and ending at it, with a gentle upward drift and small wiggle.
export function cityTrend(city: string, all: Listing[]): TrendPoint[] {
  const end = cityAvgPricePerM2(city, all) || 2000;
  const start = Math.round(end * 0.86);
  const seed = city.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return MONTHS.map((label, i) => {
    const base = start + ((end - start) * i) / (MONTHS.length - 1);
    const wiggle = Math.sin((seed + i) * 1.3) * (end * 0.012);
    return { label, value: Math.round(base + wiggle) };
  });
}
