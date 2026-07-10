// Supabase Edge Function — "ai-extract"
// Szabad szövegből (FB-poszt, e-mail, WhatsApp) strukturált hirdetésmezőket
// nyer ki valódi Claude-hívással. Ugyanazt a mezőformátumot adja vissza, mint
// a kliensoldali heurisztika (lib/import/ai-extract.ts), így a varázsló
// változtatás nélkül fel tudja használni. Ha nincs ANTHROPIC_API_KEY beállítva,
// 501-et ad, és a kliens visszaesik a helyi heurisztikára.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `Ingatlanhirdetés-kinyerő vagy egy montenegrói ingatlanoldalhoz.
Kapsz egy szabad szöveget (magyar, montenegrói/szerb, angol vagy orosz nyelven),
és VISSZAADSZ egy JSON objektumot a hirdetés mezőivel. CSAK azokat a mezőket add
vissza, amikben biztos vagy — a bizonytalanokat HAGYD KI. Semmi magyarázat, csak JSON.

Mezők és megengedett értékek:
- mode: "sale" | "rent"
- type: "apartment"|"house"|"villa"|"land"|"commercial"|"new"|"office"|"hospitality"|"institution"|"garage"|"industrial"|"agricultural"
- title: rövid, vonzó cím (a szöveg fő nyelvén)
- description: 1-3 mondatos leírás
- city, district: montenegrói helységnév
- area, rooms, floor, year, distanceToSea, price, deposit, minTermMonths: SZÁMOK stringként (mértékegység nélkül)
- condition: "new"|"renovated"|"good"|"needs_work"
- view: "sea"|"mountain"|"city"
- furnished, petsAllowed, utilitiesIncluded: true/false
- amenities: tömb ezekből: "wifi","ac","parking","pool","garden","elevator","balcony","seaview","furnished","security","garage","storage","heating"

Az ár EUR-ban értendő. Ha havi bérleti díj, akkor mode="rent".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "no_api_key" }), {
      status: 501,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  let text = "";
  try {
    const body = await req.json();
    text = String(body.text ?? "").slice(0, 8000);
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  if (!text.trim()) {
    return new Response(JSON.stringify({ fields: {}, detected: [], confidence: 0, notes: [] }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Nyerd ki a mezőket ebből a szövegből, és adj vissza CSAK egy JSON objektumot:\n\n${text}`
        }
      ]
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return new Response(JSON.stringify({ error: "anthropic_error", detail: errText.slice(0, 500) }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const data = await resp.json();
  const raw: string = data?.content?.[0]?.text ?? "{}";
  // A modell néha ```json ... ``` blokkban ad választ — kiszedjük a JSON-t.
  const match = raw.match(/\{[\s\S]*\}/);
  let fields: Record<string, unknown> = {};
  try {
    fields = match ? JSON.parse(match[0]) : {};
  } catch {
    fields = {};
  }

  const detected = Object.keys(fields).filter(
    (k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== ""
  );
  const important = ["type", "city", "area", "price", "mode"];
  const confidence =
    important.filter((k) => detected.includes(k)).length / important.length;

  return new Response(
    JSON.stringify({ fields, detected, confidence, notes: ["ai"] }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
});
