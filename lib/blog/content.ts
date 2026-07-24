import type { Lang } from "@/lib/types";
import type { FaqItem } from "@/lib/seo";
import huContent from "./content/hu.json";

/**
 * A SEO-blog TARTALMÁNAK többnyelvűsítése — ugyanazzal a mintával, mint a
 * Tudástár. A magyar statikusan importált (szerver-render + végső fallback),
 * a többi nyelv külön JSON-chunkban, dinamikus importtal töltődik.
 */

export interface BlogSectionContent {
  h: string;
  p: string[];
  /** Opcionális illusztráló kép: nyelvfüggetlen src + fordított, kulcsszavas alt. */
  img?: { src: string; alt: string } | null;
}

export interface BlogPostContent {
  title: string;
  excerpt: string;
  /** Rövid, önálló válasz — a kiemelt találatnak és az AI-asszisztenseknek. */
  answer: string;
  sections: BlogSectionContent[];
  faq: FaqItem[];
}

export interface BlogContent {
  posts: Record<string, BlogPostContent>;
  /** Igaz, ha ez még csak helyőrző (nincs valódi fordítás ezen a nyelven). */
  fallback?: boolean;
}

const usable = (d: unknown): BlogContent | null => {
  const c = d as BlogContent;
  return c && !c.fallback && Object.keys(c.posts ?? {}).length > 0 ? c : null;
};

/** A magyar tartalom — szerver-oldali render és végső fallback. */
export const HU_BLOG = huContent as unknown as BlogContent;

/**
 * Egy nyelv blog-tartalmának betöltése. Ismeretlen vagy még le nem fordított
 * nyelvnél `null`, ilyenkor a hívó az angolra, majd a magyarra esik vissza.
 */
export async function loadBlogContent(lang: Lang): Promise<BlogContent | null> {
  try {
    switch (lang) {
      case "hu":
        return HU_BLOG;
      case "en":
        return usable((await import("./content/en.json")).default);
      case "me":
        return usable((await import("./content/me.json")).default);
      case "ru":
        return usable((await import("./content/ru.json")).default);
      case "sr":
        return usable((await import("./content/sr.json")).default);
      case "bs":
        return usable((await import("./content/bs.json")).default);
      case "hr":
        return usable((await import("./content/hr.json")).default);
      case "uk":
        return usable((await import("./content/uk.json")).default);
      case "sq":
        return usable((await import("./content/sq.json")).default);
      case "el":
        return usable((await import("./content/el.json")).default);
      case "tr":
        return usable((await import("./content/tr.json")).default);
      case "es":
        return usable((await import("./content/es.json")).default);
      case "it":
        return usable((await import("./content/it.json")).default);
      case "th":
        return usable((await import("./content/th.json")).default);
      default:
        return null;
    }
  } catch {
    return null;
  }
}
