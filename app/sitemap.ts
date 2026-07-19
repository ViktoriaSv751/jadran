import type { MetadataRoute } from "next";
import { supabaseServer, SITE_URL } from "@/lib/supabase-server";
import { COUNTRY_CODES } from "@/lib/geo";
import { ARTICLES } from "@/lib/articles";

/** Dinamikus sitemap: statikus oldalak + ország-landingek + minden aktív hirdetés. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Csak PUBLIKUS oldalak (a /favorites felhasználó-specifikus és a robots is
  // tiltja — ezért kimarad a sitemapből).
  const staticRoutes = ["", "/search", "/market", "/guide", "/pricing", "/tudastar"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7
  }));

  // Ország-landing oldalak (SEO).
  const countryRoutes = COUNTRY_CODES.map((c) => ({
    url: `${SITE_URL}/l/${c}`,
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  // Tudástár-cikkek. Ezek a leginkább „linkelhető" oldalaink — az információs
  // keresésekre (állampolgárság, Golden Visa, mellékköltségek) ezek rangsorolnak,
  // ezért kapnak magas prioritást.
  const articleRoutes = ARTICLES.map((a) => ({
    url: `${SITE_URL}/tudastar/${a.slug}`,
    lastModified: new Date(a.updated),
    changeFrequency: "monthly" as const,
    priority: a.category === "country" ? 0.8 : 0.9
  }));

  let listingRoutes: MetadataRoute.Sitemap = [];
  if (supabaseServer) {
    const { data } = await supabaseServer
      .from("listings")
      .select("id, created_at")
      .eq("status", "active");
    listingRoutes = (data ?? []).map((l) => ({
      url: `${SITE_URL}/listing/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));
  }

  return [...staticRoutes, ...countryRoutes, ...articleRoutes, ...listingRoutes];
}
