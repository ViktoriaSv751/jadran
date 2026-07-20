"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { HU_CONTENT, loadContent, type TudastarContent } from "./content";

export interface UseTudastarContent {
  content: TudastarContent;
  lang: Lang;
  /** Igaz, ha a tartalom a KIVÁLASZTOTT nyelven van (nem fallback). */
  exact: boolean;
}

/**
 * A tudástár tartalma a felhasználó nyelvén.
 *
 * A kiinduló állapot MINDIG a magyar: ez renderelődik szerver-oldalon, tehát a
 * hidratálás előtt sincs üres oldal, és a keresőrobotok is látnak szöveget.
 * Ha a látogató más nyelvet választott, a megfelelő nyelvi csomag külön
 * letöltődik, és lecseréli a tartalmat.
 *
 * Visszaesési sorrend: kiválasztott nyelv → angol → magyar. Az angol azért van
 * a magyar előtt, mert egy görög vagy thai látogatónak az angol lényegesen
 * használhatóbb, mint a magyar.
 */
export function useTudastarContent(): UseTudastarContent {
  const { lang } = useLang();
  const [content, setContent] = useState<TudastarContent>(HU_CONTENT);
  const [exact, setExact] = useState(lang === "hu");

  useEffect(() => {
    let cancelled = false;

    if (lang === "hu") {
      setContent(HU_CONTENT);
      setExact(true);
      return;
    }

    (async () => {
      const own = await loadContent(lang);
      if (cancelled) return;
      if (own) {
        setContent(own);
        setExact(true);
        return;
      }
      // Nincs (még) fordítás ezen a nyelven — angol, ha van, különben magyar.
      const en = await loadContent("en");
      if (cancelled) return;
      setContent(en ?? HU_CONTENT);
      setExact(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { content, lang, exact };
}
