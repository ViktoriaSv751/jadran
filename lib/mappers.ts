/**
 * DB sor (snake_case, Postgres) <-> app típus (camelCase) leképezés.
 * Egy helyen, hogy a db.ts tiszta maradjon. A numeric mezőket Number()-rel
 * kényszerítjük, mert a PostgREST nagy pontosságnál stringként is adhatja.
 */
import type {
  Conversation,
  Listing,
  Message,
  Profile,
  Review,
  SavedSearch
} from "./types";

// Nem véges érték (null, NaN, ±Infinity) SOHA ne szivárogjon tovább: a NaN ár
// eltörné a rendezést és a formázást, a null koordináta a térképen 0,0-ra esne.
const num = (v: unknown): number => {
  const n = v == null ? 0 : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/* ----------------------------- listings ----------------------------- */

export function rowToListing(r: any): Listing {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    mode: r.mode,
    status: r.status,
    price: num(r.price),
    area: num(r.area),
    rooms: num(r.rooms),
    floor: r.floor == null ? null : Number(r.floor),
    year: Number(r.year ?? 0),
    condition: r.condition,
    view: r.view,
    country: r.country ?? "ME",
    city: r.city,
    district: r.district ?? "",
    distanceToSea: num(r.distance_to_sea),
    lat: num(r.lat),
    lng: num(r.lng),
    verification: r.verification,
    images: r.images ?? [],
    amenities: r.amenities ?? [],
    ownerId: r.owner_id,
    agency: r.agency ?? "",
    furnished: !!r.furnished,
    energy: r.energy ?? "",
    createdAt: r.created_at,
    views: num(r.views),
    priceHistory: r.price_history ?? [],
    deposit: numOrNull(r.deposit),
    minTermMonths: numOrNull(r.min_term_months),
    availableFrom: r.available_from ?? undefined,
    utilitiesIncluded: r.utilities_included ?? undefined,
    petsAllowed: r.pets_allowed ?? undefined,
    plotArea: numOrNull(r.plot_area),
    monthlyCommonCost: numOrNull(r.monthly_common_cost),
    heatingType: r.heating_type ?? undefined,
    featuredUntil: r.featured_until ?? null
  };
}

/** Igaz, ha a hirdetés kiemelése még érvényes (a jövőben jár le). */
export function isFeatured(l: { featuredUntil?: string | null }): boolean {
  return !!l.featuredUntil && new Date(l.featuredUntil).getTime() > Date.now();
}

/** App Listing -> DB sor (insert/update). Csak a megadott mezőket adja vissza. */
export function listingToRow(l: Partial<Listing>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) row[k] = v;
  };
  set("id", l.id);
  set("title", l.title);
  set("description", l.description);
  set("type", l.type);
  set("mode", l.mode);
  set("status", l.status);
  set("price", l.price);
  set("area", l.area);
  set("rooms", l.rooms);
  set("floor", l.floor);
  set("year", l.year);
  set("condition", l.condition);
  set("view", l.view);
  set("country", l.country);
  set("city", l.city);
  set("district", l.district);
  set("distance_to_sea", l.distanceToSea);
  set("lat", l.lat);
  set("lng", l.lng);
  set("verification", l.verification);
  set("images", l.images);
  set("amenities", l.amenities);
  set("owner_id", l.ownerId);
  set("agency", l.agency);
  set("furnished", l.furnished);
  set("energy", l.energy);
  set("created_at", l.createdAt);
  set("views", l.views);
  set("price_history", l.priceHistory);
  set("deposit", l.deposit);
  set("min_term_months", l.minTermMonths);
  set("available_from", l.availableFrom);
  set("utilities_included", l.utilitiesIncluded);
  set("pets_allowed", l.petsAllowed);
  set("plot_area", l.plotArea);
  set("monthly_common_cost", l.monthlyCommonCost);
  set("heating_type", l.heatingType);
  return row;
}

/* ----------------------------- profiles ----------------------------- */

export function rowToProfile(r: any): Profile {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    avatar: r.avatar ?? null,
    agencyName: r.agency_name ?? null,
    bio: r.bio ?? "",
    phone: r.phone ?? "",
    location: r.location ?? "",
    verified: !!r.verified,
    responseTime: r.response_time ?? "",
    joinedAt: r.joined_at,
    isAdmin: !!r.is_admin
  };
}

export function profileToRow(p: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) row[k] = v;
  };
  set("id", p.id);
  set("email", p.email);
  set("name", p.name);
  set("role", p.role);
  set("avatar", p.avatar);
  set("agency_name", p.agencyName);
  set("bio", p.bio);
  set("phone", p.phone);
  set("location", p.location);
  set("verified", p.verified);
  set("response_time", p.responseTime);
  set("joined_at", p.joinedAt);
  return row;
}

/* --------------------- conversations / messages --------------------- */

export function rowToConversation(r: any): Conversation {
  return {
    id: r.id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    sellerId: r.seller_id,
    createdAt: r.created_at,
    lastMessageAt: r.last_message_at
  };
}

export function rowToMessage(r: any): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    text: r.text,
    createdAt: r.created_at,
    readBy: r.read_by ?? []
  };
}

/* ----------------------------- reviews ------------------------------ */

export function rowToReview(r: any): Review {
  return {
    id: r.id,
    targetUserId: r.target_user_id,
    authorId: r.author_id,
    authorName: r.author_name,
    rating: Number(r.rating),
    text: r.text ?? "",
    createdAt: r.created_at
  };
}

/* -------------------------- saved searches -------------------------- */

export function rowToSavedSearch(r: any): SavedSearch {
  return {
    id: r.id,
    userId: r.user_id,
    label: r.label,
    query: r.query,
    createdAt: r.created_at
  };
}
