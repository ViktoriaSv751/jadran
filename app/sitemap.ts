import type { MetadataRoute } from "next";
import { supabaseServer, SITE_URL } from "@/lib/supabase-server";
import { COUNTRY_CODES, COUNTRY_BY_CODE, citySlug, isCountryCode } from "@/lib/geo";
import { ARTICLES } from "@/lib/articles";
import { getPublishedPosts } from "@/lib/blog";
import { TYPE_FACETS, typeFacetSlug, INTENT_SLUG } from "@/lib/facets";

/** Dinamikus sitemap: statikus oldalak + ország-landingek + minden aktív hirdetés. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Csak PUBLIKUS oldalak (a /favorites felhasználó-specifikus és a robots is
  // tiltja — ezért kimarad a sitemapből).
  const staticRoutes = ["", "/search", "/market", "/guide", "/pricing", "/tudastar", "/blog", "/celpontok", "/kalkulatorok"].map((p) => ({
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

  // CMS-ből publikált blogcikkek (a tulajdonos által írt tartalom).
  const posts = await getPublishedPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  let listingRoutes: MetadataRoute.Sitemap = [];
  let cityRoutes: MetadataRoute.Sitemap = [];
  if (supabaseServer) {
    const { data } = await supabaseServer
      .from("listings")
      .select("id, created_at, country, city, type")
      .eq("status", "active");
    const rows = data ?? [];

    listingRoutes = rows.map((l) => ({
      url: `${SITE_URL}/listing/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));

    // Facet-oldalak — CSAK a valós kínálatúak (a vékony, üres oldalak
    // `noindex`-esek és nem kerülnek a sitemapbe).
    const seen = new Set<string>();
    const add = (url: string, priority: number) => {
      if (seen.has(url)) return;
      seen.add(url);
      cityRoutes.push({ url, changeFrequency: "daily" as const, priority });
    };
    for (const l of rows) {
      const code = String(l.country);
      if (!isCountryCode(code)) continue;
      // Város-oldal (van hozzá hirdetés).
      if (l.city) add(`${SITE_URL}/l/${code}/${citySlug(String(l.city))}`, 0.75);
      // Típus-oldal (a facetelt típusokra, ahol van hirdetés).
      const t = String(l.type);
      if ((TYPE_FACETS as string[]).includes(t)) {
        add(`${SITE_URL}/l/${code}/${typeFacetSlug(t as (typeof TYPE_FACETS)[number])}`, 0.7);
      }
    }
    // Szándék-oldalak (Golden Visa) — minden programos országhoz, függetlenül
    // az aktuális kínálattól (önálló tartalmi értékük van).
    for (const code of COUNTRY_CODES) {
      if (COUNTRY_BY_CODE[code].goldenVisa) {
        add(`${SITE_URL}/l/${code}/${INTENT_SLUG}`, 0.85);
      }
    }
  }

  return [...staticRoutes, ...countryRoutes, ...cityRoutes, ...articleRoutes, ...blogRoutes, ...listingRoutes];
}
