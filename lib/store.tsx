"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Conversation, Lang, Listing, Message, Profile, Review } from "./types";
import { seedListings, seedProfiles } from "./data";
import { LANGS } from "./i18n";
import * as db from "./db";

/* ============================ Language ============================ */

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({ lang: "hu", setLang: () => {} });

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hu");

  useEffect(() => {
    const stored = localStorage.getItem("jadran_lang") as Lang | null;
    // Mind a 12 támogatott nyelvet vissza kell állítani (nem csak a régi 4-et),
    // különben a nyelvváltás nem marad meg újratöltés után.
    if (stored && (LANGS as readonly { code: string }[]).some((l) => l.code === stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("jadran_lang", l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangCtx {
  return useContext(LangContext);
}

/* ============================ Auth ============================ */

interface AuthCtx {
  user: Profile | null;
  ready: boolean;
  login: (email: string, password: string) => ReturnType<typeof db.login>;
  register: (input: db.RegisterInput) => ReturnType<typeof db.register>;
  logout: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setUser(db.getCurrentUser());
    sync();
    setReady(true);
    return db.subscribe(sync);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await db.login(email, password);
    if (res.ok) setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (input: db.RegisterInput) => {
    const res = await db.register(input);
    if (res.ok) setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await db.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      if (!user) return;
      void db.updateProfile(user.id, patch);
      setUser(db.getProfile(user.id) ?? null);
    },
    [user]
  );

  const value = useMemo<AuthCtx>(
    () => ({ user, ready, login, register, logout, updateProfile }),
    [user, ready, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ============================ Reactive data hooks ============================ */

/** Generic subscription helper: starts at `initial` (SSR-safe), then live. */
function useLive<T>(
  compute: () => T,
  initial: T,
  deps: React.DependencyList = []
): { value: T; ready: boolean } {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  // compute is recreated each render; we only run it inside the subscription.
  const ref = React.useRef(compute);
  ref.current = compute;
  useEffect(() => {
    const update = () => {
      setValue(ref.current());
      setReady(true);
    };
    update();
    return db.subscribe(update);
    // Re-run (and recompute immediately) whenever the caller's inputs change —
    // e.g. once auth resolves and `userId` flips from undefined to a real id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { value, ready };
}

export function useListings(): { items: Listing[]; ready: boolean } {
  const { value, ready } = useLive(() => db.getListings(), seedListings);
  return { items: value, ready };
}

export function useListing(id: string): { listing: Listing | undefined; ready: boolean } {
  const { items, ready } = useListings();
  const listing = useMemo(() => items.find((l) => l.id === id), [items, id]);
  return { listing, ready };
}

export function useProfiles(): { profiles: Profile[]; ready: boolean } {
  const { value, ready } = useLive(() => db.getProfiles(), seedProfiles);
  return { profiles: value, ready };
}

export function useProfile(id: string | undefined): Profile | undefined {
  const { profiles } = useProfiles();
  return useMemo(() => (id ? profiles.find((p) => p.id === id) : undefined), [profiles, id]);
}

export function useListingsByOwner(ownerId: string | undefined): Listing[] {
  const { items } = useListings();
  return useMemo(() => (ownerId ? items.filter((l) => l.ownerId === ownerId) : []), [items, ownerId]);
}

/* ---------------- Favorites ---------------- */

export function useFavorites() {
  const { value: ids, ready } = useLive(() => db.getFavorites(), [] as string[]);
  return {
    ids,
    ready,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => db.toggleFavorite(id)
  };
}

/* ---------------- Compare ---------------- */

export function useCompare() {
  const { value: ids, ready } = useLive(() => db.getCompare(), [] as string[]);
  return {
    ids,
    ready,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => db.toggleCompare(id)
  };
}

/* ---------------- Messaging ---------------- */

export function useConversations(userId: string | undefined): { conversations: Conversation[]; ready: boolean } {
  const { value, ready } = useLive(
    () => (userId ? db.getConversationsForUser(userId) : []),
    [] as Conversation[],
    [userId]
  );
  return { conversations: value, ready };
}

export function useMessages(conversationId: string | undefined): Message[] {
  const { value } = useLive(
    () => (conversationId ? db.getMessagesForConversation(conversationId) : []),
    [] as Message[],
    [conversationId]
  );
  return value;
}

export function useUnreadCount(userId: string | undefined): number {
  const { value } = useLive(() => (userId ? db.unreadCount(userId) : 0), 0, [userId]);
  return value;
}

/* ---------------- Reviews ---------------- */

export function useReviews(targetUserId: string | undefined): Review[] {
  const { value } = useLive(
    () => (targetUserId ? db.getReviewsForUser(targetUserId) : []),
    [] as Review[],
    [targetUserId]
  );
  return value;
}
