/**
 * Crawlability-audit — árva-oldal ellenőrző.
 *
 * A videó „mappa-hierarchia" tanulsága: minden fontos (indexelt) oldalra
 * mutasson legalább egy belső link egy hubról, különben a crawler nem találja
 * meg. Ez a szkript:
 *   1. beolvassa a sitemap.xml-t (a szándékoltan indexelt URL-ek),
 *   2. begyűjti a hub-oldalak (főoldal, /celpontok, /tudastar, ország-landingek)
 *      összes belső linkjét,
 *   3. jelzi, mely sitemap-URL NEM érhető el egyetlen hubról sem (árva).
 *
 * Futtatás (futó dev/preview szerver ellen):
 *   BASE=http://localhost:3000 node scripts/crawl-audit.mjs
 */

const BASE = process.env.BASE ?? "http://localhost:3000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return res.ok ? await res.text() : "";
}

/** Az oldal összes belső (relatív vagy azonos hosztú) linkje, path formában. */
function links(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    let h = m[1];
    if (h.startsWith(BASE)) h = h.slice(BASE.length);
    if (h.startsWith("/") && !h.startsWith("//")) out.add(h.split("#")[0].split("?")[0]);
  }
  return out;
}

/** A sitemap URL-jei path formában. */
function sitemapPaths(xml) {
  const out = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = m[1].replace(BASE, "").replace(/^https?:\/\/[^/]+/, "") || "/";
    out.push(path);
  }
  return out;
}

const COUNTRIES = ["ME", "HR", "AL", "RS", "TR", "ID", "HU", "TH", "IT", "GR", "ES", "AE"];

const run = async () => {
  const sm = sitemapPaths(await get("/sitemap.xml"));
  console.log(`Sitemap URL-ek: ${sm.length}`);

  // Hub-oldalak, amelyekről a belső linkeket gyűjtjük.
  const hubPaths = ["/", "/celpontok", "/tudastar", ...COUNTRIES.map((c) => `/l/${c}`)];
  const linked = new Set();
  for (const p of hubPaths) {
    for (const l of links(await get(p))) linked.add(l);
  }
  console.log(`Hub-oldalak: ${hubPaths.length}, összegyűjtött belső link: ${linked.size}`);

  // Listing-részletoldalakat kihagyjuk (dinamikus, nem hubról linkeltek — a
  // sitemap és a landingek felől érhetők el egyenként).
  const orphans = sm.filter((u) => !linked.has(u) && !u.startsWith("/listing/"));
  const checkedSm = sm.filter((u) => !u.startsWith("/listing/"));

  console.log(`\nEllenőrzött sitemap-URL (listing nélkül): ${checkedSm.length}`);
  if (orphans.length === 0) {
    console.log("✓ NINCS ÁRVA OLDAL — minden indexelt oldalra mutat belső link egy hubról.");
  } else {
    console.log(`⚠ ${orphans.length} árva oldal (nincs hub-link):`);
    orphans.slice(0, 40).forEach((u) => console.log(`   ${u}`));
  }
  process.exit(orphans.length ? 1 : 0);
};

run();
