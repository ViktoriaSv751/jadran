import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/supabase-server";

/** Privát / felhasználó-specifikus felületek — ezeket nem indexeljük. */
const PRIVATE = ["/messages", "/settings", "/profile", "/favorites", "/compare", "/admin", "/owner"];

/**
 * robots.txt
 *
 * FONTOS: az AI-keresők (ChatGPT, Claude, Perplexity, Gemini) crawlereit
 * KIFEJEZETTEN beengedjük. Sok oldal tiltja őket — mi épp azt akarjuk, hogy egy
 * „montenegrói ingatlanbefektetés” vagy „golden visa ingatlannal” kérdésnél
 * minket tudjanak idézni forrásként.
 */
export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    "GPTBot", // OpenAI / ChatGPT
    "OAI-SearchBot", // ChatGPT Search
    "ChatGPT-User",
    "ClaudeBot", // Anthropic / Claude
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended", // Gemini / AI Overviews
    "Applebot-Extended",
    "CCBot" // Common Crawl — sok modell ebből tanul
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...aiBots.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE }))
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
