/**
 * Adatréteg — Supabase-háttérrel, local-first cache-sel.
 *
 * A hívói felület SZINKRON marad (a getterek egy memóriabeli cache-ből
 * olvasnak), így egyetlen komponenst sem kellett átírni. A cache-t a Supabase
 * tölti fel induláskor (hydrate) és a bejelentkezés után; az írások optimistán
 * a cache-be kerülnek + a háttérben a Supabase-be mennek (emit -> a store
 * újraszámol). Ha nincs Supabase env, a cache a beépített seedből indul
 * (backend nélküli demo).
 *
 * Az auth (login/register/logout/updateProfile) ASZINKRON — valódi Supabase
 * Auth. A favorites/compare eszköz-lokális (localStorage).
 */
import type {
  Conversation,
  Listing,
  Message,
  Profile,
  Review,
  SavedSearch,
  UserRole
} from "./types";
import { seedListings, seedProfiles } from "./data";
import { supabase, hasSupabase } from "./supabase";
import {
  listingToRow,
  profileToRow,
  rowToConversation,
  rowToListing,
  rowToMessage,
  rowToProfile,
  rowToReview,
  rowToSavedSearch
} from "./mappers";

const isBrowser = typeof window !== "undefined";

/* ----------------------------- cache ----------------------------- */

interface Cache {
  listings: Listing[];
  profiles: Profile[];
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  savedSearches: SavedSearch[];
  favorites: string[]; // kedvenc listing id-k (bejelentkezve a DB-ből, egyébként localStorage)
  currentUser: Profile | null;
  hydrated: boolean;
}

const cache: Cache = {
  listings: seedListings,
  profiles: seedProfiles,
  conversations: [],
  messages: [],
  reviews: [],
  savedSearches: [],
  favorites: [],
  currentUser: null,
  hydrated: false
};

/* --------------------------- reactivity --------------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l());
}

/* --------------------------- localStorage (favorites/compare) --------------------------- */

function readLS<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T): void {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

/* --------------------------- ids --------------------------- */

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

/* --------------------------- hydration --------------------------- */

let hydrateStarted = false;

/** Publikus adatok betöltése (hirdetések, profilok, értékelések). */
async function hydratePublic(): Promise<void> {
  if (!supabase) return;
  const [ls, ps, rs] = await Promise.all([
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
    supabase.from("reviews").select("*")
  ]);
  if (ls.data) cache.listings = ls.data.map(rowToListing);
  if (ps.data) cache.profiles = ps.data.map(rowToProfile);
  if (rs.data) cache.reviews = rs.data.map(rowToReview);
  cache.hydrated = true;
  emit();
}

/** Bejelentkezett user saját adatai (beszélgetések, üzenetek, mentett keresések). */
async function hydrateUser(): Promise<void> {
  if (!supabase || !cache.currentUser) return;
  const uidp = cache.currentUser.id;
  const [cs, ss] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${uidp},seller_id.eq.${uidp}`)
      .order("last_message_at", { ascending: false }),
    supabase.from("saved_searches").select("*").eq("user_id", uidp)
  ]);
  if (cs.data) {
    cache.conversations = cs.data.map(rowToConversation);
    const ids = cache.conversations.map((c) => c.id);
    if (ids.length) {
      const ms = await supabase.from("messages").select("*").in("conversation_id", ids);
      if (ms.data) cache.messages = ms.data.map(rowToMessage);
    } else {
      cache.messages = [];
    }
  }
  if (ss.data) cache.savedSearches = ss.data.map(rowToSavedSearch);
  await hydrateFavorites();
  // A bejelentkezett tulaj a saját (akár szüneteltetett) hirdetéseit is látja.
  const ls = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (ls.data) cache.listings = ls.data.map(rowToListing);
  emit();
}

/**
 * A beszélgetések + üzenetek újratöltése a DB-ből (az üzenetek oldal frissen
 * tartásához — így a session közben beérkező üzenetek/új beszélgetések is
 * megjelennek, valós idejű előfizetés nélkül is). Csak a saját optimista
 * (még be nem szinkronizált) üzeneteket megtartja, hogy ne "villanjanak" el.
 */
export async function refreshConversations(): Promise<void> {
  if (!supabase || !cache.currentUser) return;
  const uidp = cache.currentUser.id;
  const cs = await supabase
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${uidp},seller_id.eq.${uidp}`)
    .order("last_message_at", { ascending: false });
  if (!cs.data) return;
  cache.conversations = cs.data.map(rowToConversation);
  const ids = cache.conversations.map((c) => c.id);
  if (!ids.length) {
    cache.messages = [];
    emit();
    return;
  }
  const ms = await supabase.from("messages").select("*").in("conversation_id", ids);
  if (ms.data) {
    const fromDb = ms.data.map(rowToMessage);
    const dbIds = new Set(fromDb.map((m) => m.id));
    const prevById = new Map(cache.messages.map((m) => [m.id, m]));
    // A DB-ből jövő üzeneteknél EGYESÍTJÜK a readBy-t a helyi állapottal — így egy
    // épp megnyitott (helyileg olvasottnak jelölt) beszélgetés nem „ugrik vissza"
    // olvasatlanra, ha a szerver-oldali frissítés még nem futott le (Messenger-szerű).
    const merged = fromDb.map((m) => {
      const prev = prevById.get(m.id);
      if (!prev) return m;
      const readBy = Array.from(new Set([...m.readBy, ...prev.readBy]));
      return readBy.length === m.readBy.length ? m : { ...m, readBy };
    });
    // A cache-ben lévő, DB-ben még nem szereplő (épp küldött) üzeneteket megtartjuk.
    const pendingLocal = cache.messages.filter((m) => !dbIds.has(m.id) && ids.includes(m.conversationId));
    cache.messages = [...merged, ...pendingLocal];
  }
  emit();
}

async function loadSessionUser(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const authId = data.user?.id;
  if (!authId) {
    cache.currentUser = null;
    return;
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authId)
    .maybeSingle();
  cache.currentUser = prof ? rowToProfile(prof) : null;
  emit();
  await hydrateUser();
}

/** Egyszeri inicializálás böngészőben: session + publikus adatok betöltése. */
function ensureHydrated(): void {
  if (hydrateStarted || !isBrowser) return;
  hydrateStarted = true;
  if (!hasSupabase || !supabase) {
    cache.hydrated = true;
    return;
  }
  void hydratePublic();
  void loadSessionUser();
  supabase.auth.onAuthStateChange((_e, session) => {
    if (!session) {
      cache.currentUser = null;
      cache.conversations = [];
      cache.messages = [];
      cache.savedSearches = [];
      emit();
    }
  });
}

/** Kompatibilitási no-op (korábban a localStorage seedelést végezte). */
export function ensureSeeded(): void {
  ensureHydrated();
}

/* ----------------------------- listings ----------------------------- */

export function getListings(): Listing[] {
  ensureHydrated();
  return cache.listings;
}

export function getListingById(id: string): Listing | undefined {
  return cache.listings.find((l) => l.id === id);
}

export function getListingsByOwner(ownerId: string): Listing[] {
  return cache.listings.filter((l) => l.ownerId === ownerId);
}

export function createListing(
  data: Omit<Listing, "id" | "createdAt" | "views" | "priceHistory">
): Listing {
  const listing: Listing = {
    ...data,
    id: uid("lst"),
    createdAt: today(),
    views: 0,
    priceHistory: [{ date: today(), price: data.price }]
  };
  cache.listings = [listing, ...cache.listings];
  emit();
  if (supabase) {
    void supabase
      .from("listings")
      .insert(listingToRow(listing))
      .then(({ error }) => error && console.error("createListing", error.message));
  }
  return listing;
}

export function updateListing(id: string, patch: Partial<Listing>): void {
  let rowPatch: Partial<Listing> | null = null;
  cache.listings = cache.listings.map((l) => {
    if (l.id !== id) return l;
    const merged = { ...l, ...patch };
    if (patch.price !== undefined && patch.price !== l.price) {
      merged.priceHistory = [...l.priceHistory, { date: today(), price: patch.price }];
    }
    rowPatch = { ...patch, priceHistory: merged.priceHistory };
    return merged;
  });
  emit();
  if (supabase && rowPatch) {
    void supabase
      .from("listings")
      .update(listingToRow(rowPatch))
      .eq("id", id)
      .then(({ error }) => error && console.error("updateListing", error.message));
  }
}

export function deleteListing(id: string): void {
  cache.listings = cache.listings.filter((l) => l.id !== id);
  emit();
  if (supabase) {
    void supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .then(({ error }) => error && console.error("deleteListing", error.message));
  }
}

export function incrementViews(id: string): void {
  let next = 0;
  cache.listings = cache.listings.map((l) => {
    if (l.id !== id) return l;
    next = l.views + 1;
    return { ...l, views: next };
  });
  emit();
  if (supabase) {
    void supabase
      .from("listings")
      .update({ views: next })
      .eq("id", id)
      .then(({ error }) => error && console.error("incrementViews", error.message));
  }
}

/**
 * Tömeges upsert — a feed-importer használja (lib/import). Id alapján dedupel:
 * meglévőt patchel (ár-történetet megőrzi/kiegészíti), újat előre szúr.
 */
export function upsertListings(incoming: Listing[]): { added: number; updated: number } {
  const order: string[] = cache.listings.map((l) => l.id);
  const byId = new Map(cache.listings.map((l) => [l.id, l]));
  let added = 0;
  let updated = 0;
  const t = today();

  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (prev) {
      const merged: Listing = { ...prev, ...next };
      merged.priceHistory =
        next.price !== prev.price
          ? [...prev.priceHistory, { date: t, price: next.price }]
          : prev.priceHistory;
      byId.set(next.id, merged);
      updated++;
    } else {
      byId.set(next.id, next);
      order.unshift(next.id);
      added++;
    }
  }

  cache.listings = order.map((id) => byId.get(id)!);
  emit();
  if (supabase) {
    void supabase
      .from("listings")
      .upsert(incoming.map((l) => listingToRow(l)))
      .then(({ error }) => error && console.error("upsertListings", error.message));
  }
  return { added, updated };
}

/**
 * Ügynökség/eladó profil megkeresése név alapján, vagy könnyű profil
 * létrehozása az importált hirdetésekhez. Visszaadja a profil id-t.
 */
export function ensureAgencyProfile(name: string): string {
  const clean = name.trim() || "Importált forrás";
  const existing = cache.profiles.find((p) => p.name.toLowerCase() === clean.toLowerCase());
  if (existing) return existing.id;

  const slug =
    clean.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "") || "forras";
  const profile: Profile = {
    id: uid("u-imp"),
    email: `${slug}@import.jadran.me`,
    name: clean,
    role: "agency",
    avatar: null,
    agencyName: clean,
    bio: "Importált adatforrás (külső feed).",
    phone: "",
    location: "Montenegró",
    verified: false,
    responseTime: "néhány órán belül",
    joinedAt: today()
  };
  cache.profiles = [...cache.profiles, profile];
  emit();
  if (supabase) {
    void supabase
      .from("profiles")
      .insert(profileToRow(profile))
      .then(({ error }) => error && console.error("ensureAgencyProfile", error.message));
  }
  return profile.id;
}

/* ----------------------------- profiles ----------------------------- */

export function getProfiles(): Profile[] {
  ensureHydrated();
  return cache.profiles;
}

export function getProfile(id: string): Profile | undefined {
  return cache.profiles.find((p) => p.id === id);
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<void> {
  cache.profiles = cache.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
  if (cache.currentUser?.id === id) cache.currentUser = { ...cache.currentUser, ...patch };
  emit();
  if (supabase) {
    const { error } = await supabase.from("profiles").update(profileToRow(patch)).eq("id", id);
    if (error) console.error("updateProfile", error.message);
  }
}

/* ----------------------------- auth ----------------------------- */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  agencyName?: string;
}

type AuthResult = { ok: true; user: Profile } | { ok: false; error: string };

export function getSessionUserId(): string | null {
  return cache.currentUser?.id ?? null;
}

export function getCurrentUser(): Profile | null {
  ensureHydrated();
  return cache.currentUser;
}

async function fetchProfileByAuthId(authId: string): Promise<Profile | null> {
  if (!supabase) return null;
  // A trigger létrehozhatja a profilt, de ritkán késhet — pár próbálkozás.
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authId)
      .maybeSingle();
    if (data) return rowToProfile(data);
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

/** Egykattintásos demo-belépés — előre beállított demo fiókok. */
export const DEMO_ACCOUNTS = {
  buyer: { email: "demo@jadran.me", password: "demo1234" },
  seller: { email: "jelena.k@example.com", password: "demo1234" },
  agency: { email: "hello@adriatichomes.me", password: "demo1234" }
} as const;

export function loginDemo(role: "buyer" | "seller" | "agency"): Promise<AuthResult> {
  const acc = DEMO_ACCOUNTS[role];
  return login(acc.email, acc.password);
}

/** Google / Apple OAuth belépés (a szolgáltatót a Supabase Auth-ban kell engedélyezni). */
export async function loginOAuth(
  provider: "google" | "apple"
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "no_backend" };
  const redirectTo = isBrowser ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) return { ok: false, error: error.message };
  return { ok: true }; // sikeres esetben átirányít, a lap újratölt
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "no_backend" };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error || !data.user) return { ok: false, error: "bad_password" };
  const profile = await fetchProfileByAuthId(data.user.id);
  if (!profile) return { ok: false, error: "no_user" };
  cache.currentUser = profile;
  emit();
  await hydrateUser();
  return { ok: true, user: profile };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "no_backend" };
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        agency_name: input.role === "agency" ? input.agencyName?.trim() || input.name.trim() : null
      }
    }
  });
  if (error) {
    return { ok: false, error: error.message.includes("registered") ? "exists" : error.message };
  }
  // Ha nincs e-mail megerősítés, rögtön van session; egyébként belépünk.
  if (!data.session) {
    const signIn = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (signIn.error) return { ok: false, error: "confirm_email" };
  }
  const authId = data.user?.id;
  const profile = authId ? await fetchProfileByAuthId(authId) : null;
  if (!profile) return { ok: false, error: "no_user" };
  cache.currentUser = profile;
  emit();
  await hydrateUser();
  return { ok: true, user: profile };
}

export async function logout(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  cache.currentUser = null;
  cache.conversations = [];
  cache.messages = [];
  cache.savedSearches = [];
  cache.favorites = [];
  favInit = false; // következő olvasásnál újra a localStorage-ból
  emit();
}

/* ----------------------------- favorites / compare (eszköz-lokális) ----------------------------- */

const K_FAV = "jadran_favorites";
const K_CMP = "jadran_compare";

let favInit = false;

export function getFavorites(): string[] {
  // Első hívásnál a localStorage-ból töltjük (bejelentkezéskor felülírja a DB).
  if (!favInit) {
    favInit = true;
    cache.favorites = readLS<string[]>(K_FAV, []);
  }
  return cache.favorites;
}

export function toggleFavorite(id: string): void {
  const cur = getFavorites();
  const wasFav = cur.includes(id);
  const next = wasFav ? cur.filter((x) => x !== id) : [...cur, id];
  cache.favorites = next;
  emit(); // optimista: a szív azonnal frissül
  const uidp = cache.currentUser?.id;
  if (supabase && uidp) {
    // BEJELENTKEZVE: a kedvenc a FIÓKHOZ kötött (Supabase). NEM írjuk a
    // localStorage-ba — különben egy másik fiók a saját eszközén „örökölné" a
    // kedvenceket (fiókok közti adatszivárgás).
    if (wasFav) {
      void supabase.from("favorites").delete().eq("user_id", uidp).eq("listing_id", id);
    } else {
      void supabase.from("favorites").insert({ user_id: uidp, listing_id: id });
    }
  } else {
    // KIJELENTKEZVE: eszköz-lokális (anonim) kedvencek.
    writeLS(K_FAV, next);
  }
}

/** Bejelentkezéskor: a DB-kedvencek betöltése + a helyi (anonim) kedvencek átvitele. */
async function hydrateFavorites(): Promise<void> {
  if (!supabase || !cache.currentUser) return;
  const uidp = cache.currentUser.id;
  const localFavs = readLS<string[]>(K_FAV, []);
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", uidp);
  const dbFavs = (data ?? []).map((r: { listing_id: string }) => r.listing_id);
  // Az anonim kedvenceket feltöltjük a fiókhoz, ha még nincsenek benne.
  const toUpload = localFavs.filter((id) => !dbFavs.includes(id));
  if (toUpload.length) {
    await supabase.from("favorites").insert(toUpload.map((id) => ({ user_id: uidp, listing_id: id })));
  }
  cache.favorites = Array.from(new Set([...dbFavs, ...localFavs]));
  favInit = true;
  // A helyi (anonim) listát ürítjük: mostantól a FIÓK a forrás. Így egy másik
  // fiók belépésekor nem „öröklődnek" át az előző kedvencei ezen az eszközön.
  writeLS(K_FAV, []);
  emit();
}

export function getCompare(): string[] {
  return readLS<string[]>(K_CMP, []);
}

export function toggleCompare(id: string, max = 4): void {
  const cur = getCompare();
  if (cur.includes(id)) {
    writeLS(K_CMP, cur.filter((x) => x !== id));
  } else if (cur.length < max) {
    writeLS(K_CMP, [...cur, id]);
  }
}

/* ----------------------------- conversations / messages ----------------------------- */

export function getConversations(): Conversation[] {
  return cache.conversations;
}

export function getConversationsForUser(userId: string): Conversation[] {
  return cache.conversations
    .filter((c) => c.buyerId === userId || c.sellerId === userId)
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function getMessages(): Message[] {
  return cache.messages;
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return cache.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

/** Meglévő vevő↔hirdetés beszélgetés megkeresése vagy létrehozása. */
export function getOrCreateConversation(
  listingId: string,
  buyerId: string,
  sellerId: string
): Conversation {
  const existing = cache.conversations.find(
    (c) => c.listingId === listingId && c.buyerId === buyerId && c.sellerId === sellerId
  );
  if (existing) return existing;
  const now = nowIso();
  const conv: Conversation = {
    id: uid("conv"),
    listingId,
    buyerId,
    sellerId,
    createdAt: now,
    lastMessageAt: now
  };
  cache.conversations = [...cache.conversations, conv];
  emit();
  if (supabase) {
    // Elmentjük a beszúrás promise-át, hogy az azonnal küldött első üzenet
    // MEGVÁRHASSA — különben a message-insert az RLS-ellenőrzéskor még nem
    // találná a beszélgetést (versenyhelyzet → elveszne az érdeklődő üzenet).
    const p = supabase
      .from("conversations")
      .insert({
        id: conv.id,
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        created_at: now,
        last_message_at: now
      })
      .then(({ error }) => {
        if (error) console.error("getOrCreateConversation", error.message);
      });
    convInsertPromises.set(conv.id, p);
  }
  return conv;
}

/** Beszélgetésenként a folyamatban lévő beszúrás promise-a (üzenet-sorrendhez). */
const convInsertPromises = new Map<string, PromiseLike<unknown>>();

export function sendMessage(conversationId: string, senderId: string, text: string): Message {
  const now = nowIso();
  const msg: Message = {
    id: uid("msg"),
    conversationId,
    senderId,
    text: text.trim(),
    createdAt: now,
    readBy: [senderId]
  };
  cache.messages = [...cache.messages, msg];
  cache.conversations = cache.conversations.map((c) =>
    c.id === conversationId ? { ...c, lastMessageAt: now } : c
  );
  emit();
  if (supabase) {
    const sb = supabase;
    void (async () => {
      // Megvárjuk, hogy az (esetleg most létrehozott) beszélgetés a DB-ben
      // legyen, mielőtt beszúrjuk az üzenetet — így az RLS check átmegy.
      const pending = convInsertPromises.get(conversationId);
      if (pending) await pending;
      const { error } = await sb.from("messages").insert({
        id: msg.id,
        conversation_id: conversationId,
        sender_id: senderId,
        text: msg.text,
        created_at: now,
        read_by: [senderId]
      });
      if (error) console.error("sendMessage", error.message);
      await sb.from("conversations").update({ last_message_at: now }).eq("id", conversationId);
    })();
  }
  return msg;
}

export function markConversationRead(conversationId: string, userId: string): void {
  const changedIds: string[] = [];
  cache.messages = cache.messages.map((m) => {
    if (m.conversationId === conversationId && !m.readBy.includes(userId)) {
      changedIds.push(m.id);
      return { ...m, readBy: [...m.readBy, userId] };
    }
    return m;
  });
  if (!changedIds.length) return;
  emit();
  if (supabase) {
    for (const m of cache.messages) {
      if (changedIds.includes(m.id)) {
        void supabase.from("messages").update({ read_by: m.readBy }).eq("id", m.id);
      }
    }
  }
}

export function unreadCount(userId: string): number {
  const myConvIds = new Set(getConversationsForUser(userId).map((c) => c.id));
  return cache.messages.filter(
    (m) => myConvIds.has(m.conversationId) && m.senderId !== userId && !m.readBy.includes(userId)
  ).length;
}

/* ----------------------------- reviews ----------------------------- */

export function getReviews(): Review[] {
  return cache.reviews;
}

export function getReviewsForUser(targetUserId: string): Review[] {
  return cache.reviews
    .filter((r) => r.targetUserId === targetUserId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function addReview(data: Omit<Review, "id" | "createdAt">): Review {
  const review: Review = { ...data, id: uid("rev"), createdAt: nowIso() };
  cache.reviews = [...cache.reviews, review];
  emit();
  if (supabase) {
    void supabase
      .from("reviews")
      .insert({
        id: review.id,
        target_user_id: review.targetUserId,
        author_id: review.authorId,
        author_name: review.authorName,
        rating: review.rating,
        text: review.text,
        created_at: review.createdAt
      })
      .then(({ error }) => error && console.error("addReview", error.message));
  }
  return review;
}

/* ----------------------------- saved searches ----------------------------- */

export function getSavedSearches(userId: string): SavedSearch[] {
  return cache.savedSearches.filter((s) => s.userId === userId);
}

export function addSavedSearch(userId: string, label: string, query: string): SavedSearch {
  const search: SavedSearch = {
    id: uid("ss"),
    userId,
    label,
    query,
    createdAt: nowIso()
  };
  cache.savedSearches = [...cache.savedSearches, search];
  emit();
  if (supabase) {
    void supabase
      .from("saved_searches")
      .insert({
        id: search.id,
        user_id: userId,
        label,
        query,
        created_at: search.createdAt
      })
      .then(({ error }) => error && console.error("addSavedSearch", error.message));
  }
  return search;
}

export function removeSavedSearch(id: string): void {
  cache.savedSearches = cache.savedSearches.filter((s) => s.id !== id);
  emit();
  if (supabase) {
    void supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .then(({ error }) => error && console.error("removeSavedSearch", error.message));
  }
}
