"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { HU_BLOG, loadBlogContent, type BlogContent } from "./content";

export interface UseBlogContent {
  content: BlogContent;
  lang: Lang;
  /** Igaz, ha a tartalom a KIVÁLASZTOTT nyelven van (nem fallback). */
  exact: boolean;
}

/**
 * A SEO-blog tartalma a felhasználó nyelvén. Kiinduló állapot mindig a magyar
 * (szerver-render), majd a kliens lecseréli a választott nyelvre.
 * Visszaesés: kiválasztott nyelv → angol → magyar.
 */
export function useBlogContent(): UseBlogContent {
  const { lang } = useLang();
  const [content, setContent] = useState<BlogContent>(HU_BLOG);
  const [exact, setExact] = useState(lang === "hu");

  useEffect(() => {
    let cancelled = false;

    if (lang === "hu") {
      setContent(HU_BLOG);
      setExact(true);
      return;
    }

    (async () => {
      const own = await loadBlogContent(lang);
      if (cancelled) return;
      if (own) {
        setContent(own);
        setExact(true);
        return;
      }
      const en = await loadBlogContent("en");
      if (cancelled) return;
      setContent(en ?? HU_BLOG);
      setExact(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { content, lang, exact };
}
