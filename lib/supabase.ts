import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Igaz, ha a Supabase környezeti változók be vannak állítva. Ha nincsenek,
 * a db.ts localStorage-módra esik vissza (a demo így backend nélkül is fut).
 */
export const hasSupabase = Boolean(url && anon);

/**
 * „Maradjak bejelentkezve" tároló. Ha a felhasználó BEPIPÁLTA (alapértelmezés),
 * a session a localStorage-ba kerül (túléli a böngésző-bezárást). Ha NEM, a
 * sessionStorage-ba (a tab bezárásakor kijelentkezik) — közös eszközön ez
 * adatvédelmi előny. A `px_remember` flag-et a belépés állítja (lib/db.ts).
 */
const rememberAwareStorage = {
  getItem: (k: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(k) ?? window.sessionStorage.getItem(k);
  },
  setItem: (k: string, v: string): void => {
    if (typeof window === "undefined") return;
    const remember = window.localStorage.getItem("px_remember") !== "0";
    // A duplikáció elkerülésére a másik tárolóból töröljük.
    (remember ? window.sessionStorage : window.localStorage).removeItem(k);
    (remember ? window.localStorage : window.sessionStorage).setItem(k, v);
  },
  removeItem: (k: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(k);
    window.sessionStorage.removeItem(k);
  }
};

/** Böngésző-oldali Supabase kliens (session-perzisztencia a remember-flag szerint). */
export const supabase = hasSupabase
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? rememberAwareStorage : undefined
      }
    })
  : null;
