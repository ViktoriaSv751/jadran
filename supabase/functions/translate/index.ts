// Supabase Edge Function — "translate"
// Élő fordítás (Airbnb-minta): szöveget fordít a célnyelvre valódi Claude-hívással.
// Auto-detektálja a forrásnyelvet. ANTHROPIC_API_KEY nélkül 501 → a kliens az
// eredeti szöveget mutatja. verify_jwt = true (csak bejelentkezett hívhatja).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const MODEL = "claude-haiku-4-5-20251001";

const LANG_NAMES: Record<string, string> = {
  hu: "Hungarian", me: "Montenegrin", sr: "Serbian", bs: "Bosnian", hr: "Croatian",
  en: "English", es: "Spanish", ru: "Russian", uk: "Ukrainian", sq: "Albanian",
  el: "Greek", tr: "Turkish"
};

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
  let target = "en";
  try {
    const body = await req.json();
    text = String(body.text ?? "").slice(0, 4000);
    target = String(body.target ?? "en");
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  if (!text.trim()) {
    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const targetName = LANG_NAMES[target] ?? "English";
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
      system: `You are a translation engine for a real-estate messaging app. Auto-detect the source language and translate the user's text into ${targetName}. Output ONLY the translation — no quotes, no notes, no explanations. Keep it natural and preserve tone. If the text is already in ${targetName}, return it unchanged.`,
      messages: [{ role: "user", content: text }]
    })
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "anthropic_error", text }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const data = await resp.json();
  const translated = (data?.content?.[0]?.text ?? text).trim();
  return new Response(JSON.stringify({ text: translated, target }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
