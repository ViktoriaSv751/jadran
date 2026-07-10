import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/supabase-server";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Privát/felhasználó-specifikus oldalak kizárása az indexelésből.
      disallow: ["/messages", "/settings", "/profile", "/favorites", "/compare"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
