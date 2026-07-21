import { supabaseServer } from "./supabase-server";

/**
 * Tulajdonosi blog (Tudástár CMS).
 *
 * A tulajdonos a /owner konzolból ír cikket — kód nélkül. Ezek a `blog_posts`
 * táblában élnek, a meglévő (kódban lévő) SEO-cikkektől függetlenül. A publikus
 * olvasás szerver-oldalon (supabaseServer) történik, hogy a keresők JS nélkül is
 * lássák; az írás a konzolban a hitelesített kliens-klienssel, owner-RLS mögött.
 */

export interface BlogSection {
  /** Opcionális szekció-cím (H2). */
  h?: string;
  /** Bekezdések. */
  p: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: BlogSection[];
  cover: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/** URL-barát slug generálása címből (ékezet nélkül). */
export function blogSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToPost(r: any): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    body: Array.isArray(r.body) ? r.body : [],
    cover: r.cover ?? null,
    published: !!r.published,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/** Publikált cikkek, legújabb elöl (szerver-oldali, publikus). */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  if (!supabaseServer) return [];
  const { data } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToPost);
}

/** Egy publikált cikk slug alapján (szerver-oldali). */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!supabaseServer) return null;
  const { data } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? rowToPost(data) : null;
}
