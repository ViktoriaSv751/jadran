"use client";

import { supabase } from "./supabase";
import type { Lang } from "./types";

/**
 * Élő fordítás (Airbnb-minta) a translate edge functionön keresztül.
 * Memóriabeli + localStorage cache, hogy ugyanazt a szöveget ne fordítsuk
 * kétszer. Ha nincs ANTHROPIC_API_KEY (501) vagy hiba van, az EREDETI szöveget
 * adja vissza — így soha nem törik el semmi.
 */
const mem = new Map<string, string>();

function key(text: string, target: Lang): string {
  return `${target}:${text}`;
}

// v2 prefix: a korábbi verzió (px_tr:) tévesen az eredeti szöveget is cache-elte
// hibánál — az új prefix egyszer s mindenkorra kiüríti a „mérgezett" bejegyzéseket.
function fromLS(k: string): string | null {
  try {
    return localStorage.getItem(`px_tr2:${k}`);
  } catch {
    return null;
  }
}
function toLS(k: string, v: string): void {
  try {
    localStorage.setItem(`px_tr2:${k}`, v);
  } catch {
    /* tele a tár — nem baj */
  }
}

export async function translateText(text: string, target: Lang): Promise<string> {
  const t = text.trim();
  if (!t) return text;
  const k = key(t, target);
  if (mem.has(k)) return mem.get(k)!;
  const cached = fromLS(k);
  if (cached != null) {
    mem.set(k, cached);
    return cached;
  }
  if (!supabase) return text;
  try {
    const { data, error } = await supabase.functions.invoke("translate", {
      body: { text: t, target }
    });
    // CSAK a ténylegesen lefordított kimenetet cache-eljük. Hibánál (501/hálózat)
    // az EREDETIT adjuk vissza, de NEM tartósítjuk — különben egy átmeneti hiba
    // után a szöveg soha többé nem fordulna le ezen az eszközön.
    if (!error && data?.text) {
      const out = data.text as string;
      mem.set(k, out);
      toLS(k, out);
      return out;
    }
    return text;
  } catch {
    return text;
  }
}
