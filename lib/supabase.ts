import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Igaz, ha a Supabase környezeti változók be vannak állítva. Ha nincsenek,
 * a db.ts localStorage-módra esik vissza (a demo így backend nélkül is fut).
 */
export const hasSupabase = Boolean(url && anon);

/** Böngésző-oldali Supabase kliens (perzisztens session, auto-refresh). */
export const supabase = hasSupabase
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
