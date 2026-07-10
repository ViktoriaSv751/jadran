/**
 * "Okos" kinyerő: először a valódi Claude-alapú Supabase edge functiont hívja
 * (ai-extract), és ha az nem elérhető (nincs ANTHROPIC_API_KEY, hálózati hiba,
 * nincs bejelentkezés), visszaesik a helyi heurisztikára. A visszatérési alak
 * megegyezik a helyi extractFromText-ével, így a hívó nem lát különbséget.
 */
import { supabase } from "../supabase";
import { extractFromText, type ExtractResult } from "./ai-extract";

export async function extractSmart(text: string): Promise<ExtractResult & { source: "ai" | "local" }> {
  const local = () => ({ ...extractFromText(text), source: "local" as const });

  if (!supabase) return local();

  try {
    const { data, error } = await supabase.functions.invoke("ai-extract", {
      body: { text }
    });
    if (error || !data || !data.fields) return local();
    // Ha az AI semmit nem talált, a heurisztika még kipótolhatja.
    const aiDetected: string[] = data.detected ?? [];
    if (aiDetected.length === 0) return local();
    return {
      fields: data.fields,
      detected: aiDetected as ExtractResult["detected"],
      confidence: data.confidence ?? 0,
      notes: data.notes ?? ["ai"],
      source: "ai"
    };
  } catch {
    return local();
  }
}
