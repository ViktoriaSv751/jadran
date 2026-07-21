import type { Lang } from "@/lib/types";
import type { FaqItem } from "@/lib/seo";
import huContent from "./content/hu.json";

/**
 * A tudástár TARTALMÁNAK többnyelvűsítése.
 *
 * Miért külön fájlokban és miért dinamikus importtal?
 * A tudástár szövege nyelvenként kb. 7 600 szó. Ha mind a 14 nyelvet
 * beleforgatnánk a kliens csomagba, az ~700 KB fölösleges letöltés lenne minden
 * látogatónak. Ehelyett nyelvenként külön JSON van, és a böngésző CSAK a
 * kiválasztott nyelvet tölti le, külön chunkban.
 *
 * A magyar az EGYETLEN statikusan importált nyelv: ez renderelődik szerver-
 * oldalon (tehát ezt látják a keresőrobotok JS futtatása nélkül is), és ez az
 * azonnal elérhető kiinduló állapot. Ha a látogató más nyelvet választott, a
 * kliens lecseréli rá.
 *
 * FONTOS: a `switch` szándékosan felsorolja a nyelveket egyesével. A webpack
 * csak így tudja előre látni a lehetséges chunkokat — egy sablonos
 * `import(\`./content/\${lang}.json\`)` törékenyebb és nehezebben debuggolható.
 */

export interface CountryContent {
  /** Az ország neve az adott nyelven (a kulcs neve történeti okból nameHu). */
  nameHu: string;
  intro: string;
  highlights: string[];
  faq: FaqItem[];
}

export interface ArticleContentSection {
  h: string;
  p: string[];
  table: { head: string[]; rows: string[][] } | null;
  /** Opcionális illusztráló kép. A `src` nyelvfüggetlen (public/ útvonal), az
   *  `alt` nyelvenként lefordított, kulcsszavas — ez utóbbi számít az SEO-ban. */
  img?: { src: string; alt: string } | null;
}

export interface ArticleContent {
  title: string;
  description: string;
  answer: string;
  sections: ArticleContentSection[];
  faq: FaqItem[];
}

export interface TudastarContent {
  countries: Record<string, CountryContent>;
  articles: Record<string, ArticleContent>;
  /** Igaz, ha ez még csak helyőrző (nincs valódi fordítás ezen a nyelven).
   *  Ilyenkor a `loadContent` `null`-t ad, és a hívó angolra esik vissza —
   *  így soha nem mutatunk angol szöveget úgy, mintha lefordított volna. */
  fallback?: boolean;
}

/** Helyőrző fájl? Akkor nincs valódi fordítás. */
const usable = (d: unknown): TudastarContent | null => {
  const c = d as TudastarContent;
  return c && !c.fallback && Object.keys(c.countries ?? {}).length > 0 ? c : null;
};

/** A magyar tartalom — szerver-oldali render és végső fallback. */
export const HU_CONTENT = huContent as unknown as TudastarContent;

/**
 * Egy nyelv tartalmának betöltése. Ismeretlen vagy még le nem fordított
 * nyelvnél `null`, ilyenkor a hívó az angolra, majd a magyarra esik vissza.
 */
export async function loadContent(lang: Lang): Promise<TudastarContent | null> {
  try {
    switch (lang) {
      case "hu":
        return HU_CONTENT;
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
    // Hiányzó vagy sérült nyelvi fájl nem törheti el az oldalt — a hívó
    // ilyenkor a magyar tartalmat rendereli tovább.
    return null;
  }
}
