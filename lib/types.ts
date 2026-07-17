export type Lang =
  | "hu" // magyar
  | "me" // montenegrói (crnogorski)
  | "sr" // szerb
  | "bs" // bosnyák
  | "hr" // horvát
  | "en" // angol
  | "ru" // orosz
  | "uk" // ukrán
  | "sq" // albán
  | "el" // görög
  | "tr" // török
  | "es" // spanyol
  | "it" // olasz
  | "th"; // thai

export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "land"
  | "commercial"
  | "new"
  | "office"
  | "hospitality"
  | "institution"
  | "garage"
  | "industrial"
  | "agricultural";

export type Condition = "new" | "renovated" | "good" | "needs_work";

export type ViewType = "sea" | "mountain" | "city";

export type VerificationLevel = "none" | "basic" | "deed" | "full";

/** Sale vs. long-term rental — the platform supports both (like ingatlan.com). */
export type ListingMode = "sale" | "rent";

export type ListingStatus = "active" | "paused";

/** Account roles. A "private" (magánszemély) kereshet ÉS eladhat is; a
 *  korábbi buyer/seller ennek felel meg (a felületen mind Magánszemély). */
export type UserRole = "private" | "agency";

/**
 * Amenities = physical features of the property (valid for both sale & rent).
 * Behavioural rules that only make sense for a rental (pets, smoking, max
 * occupants) live on the rent-specific fields below — NOT here. A "pets
 * allowed" flag on a property that is *for sale* is meaningless, so it was
 * intentionally removed from this list.
 */
export type Amenity =
  | "wifi"
  | "ac"
  | "parking"
  | "pool"
  | "garden"
  | "elevator"
  | "balcony"
  | "seaview"
  | "furnished"
  | "security"
  | "garage"
  | "storage"
  | "heating";

/** Támogatott országok (globális piac). Részletes taxonómia: lib/geo.ts. */
export type CountryCode = "ME" | "HR" | "AL" | "RS" | "TR" | "ID" | "HU" | "TH" | "IT";

export interface LocalizedText {
  hu: string;
  me: string;
  en: string;
  ru: string;
}

export interface PriceHistoryPoint {
  date: string; // ISO
  price: number;
}

export interface Listing {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  type: PropertyType;
  mode: ListingMode; // sale | rent
  status: ListingStatus; // active | paused
  price: number; // EUR (total for sale, monthly for rent)
  area: number; // m²
  rooms: number;
  floor: number | null;
  year: number;
  condition: Condition;
  view: ViewType;
  country: CountryCode; // ország (globális piac) — lásd lib/geo.ts
  city: string;
  district: string;
  distanceToSea: number; // meters
  lat: number;
  lng: number;
  verification: VerificationLevel;
  images: string[];
  amenities: Amenity[];
  ownerId: string; // -> Profile.id
  agency: string; // display name (denormalized for convenience)
  furnished: boolean;
  energy: string;
  createdAt: string; // ISO
  views: number; // listing view counter
  priceHistory: PriceHistoryPoint[];

  /* --- Context-aware extras --- *
   * These are optional and only relevant for one mode. The UI shows the
   * sale set when mode === "sale" and the rent set when mode === "rent". */

  // RENT-only
  deposit?: number; // kaució (EUR)
  minTermMonths?: number; // minimális bérleti idő (hónap)
  availableFrom?: string; // költözhető-tól (ISO date)
  utilitiesIncluded?: boolean; // rezsi a bérleti díjban van-e
  petsAllowed?: boolean; // kisállat hozható (csak bérlésnél értelmes)

  // SALE-only
  plotArea?: number; // telekméret m² (ház / villa / telek)
  monthlyCommonCost?: number; // közös költség (EUR / hó, társasházi lakás)
  heatingType?: string; // fűtés típusa (kulcs a heatingLabels-ből)

  /** Kiemelés vége (ISO). Ha a jövőben van, a hirdetés kiemelt. */
  featuredUntil?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  agencyName: string | null; // for agencies
  bio: string;
  phone: string;
  location: string;
  verified: boolean; // identity / agency verified
  responseTime: string; // e.g. "egy órán belül"
  joinedAt: string; // ISO
  isAdmin?: boolean; // platform-moderátor (jelentések kezelése)
}

/** Hirdetés-bejelentés (moderáláshoz). */
export interface ListingReport {
  id: string;
  listingId: string;
  reporterId: string | null;
  reason: string;
  note: string | null;
  status: string; // "open" | "resolved"
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string; // the inquirer
  sellerId: string; // the listing owner
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readBy: string[]; // user ids who have read it
}

export interface Review {
  id: string;
  targetUserId: string; // the seller/agency being reviewed
  authorId: string;
  authorName: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  label: string;
  query: string; // serialized filter query string
  createdAt: string;
}
