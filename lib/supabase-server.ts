import { createClient } from "@supabase/supabase-js";

/**
 * Szerver-oldali Supabase kliens (nincs session, csak publikus olvasás).
 * A SSR metaadatokhoz (generateMetadata) és a sitemaphoz használjuk.
 * Null, ha nincsenek env változók.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseServer =
  url && anon
    ? createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
