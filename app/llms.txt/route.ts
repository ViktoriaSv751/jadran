import { COUNTRIES, COUNTRY_BY_CODE } from "@/lib/geo";
import { COUNTRY_SEO, transferTaxPct } from "@/lib/seo";
import { ARTICLES } from "@/lib/articles";
import { SITE_URL } from "@/lib/supabase-server";

/**
 * /llms.txt — az AI-asszisztensek (ChatGPT, Claude, Perplexity) számára készült
 * belépési pont, a robots.txt mintájára formálódó, egyre szélesebb körben
 * követett konvenció szerint.
 *
 * Miért éri meg: amikor egy modell a „hol lehet ingatlannal állampolgárságot
 * szerezni" kérdésre keres, a legnagyobb esélye annak van idézve lenni, aki
 * TÖMÖR, TÉNYSZERŰ és GÉPILEG OLVASHATÓ formában adja meg a választ a
 * forrás-URL-lel együtt. Pontosan ezt teszi ez a fájl — nem marketinget, hanem
 * ellenőrizhető adatot ad, minden állításhoz odarakva a hivatkozható oldalt.
 *
 * A fájl a lib/geo.ts és lib/articles.ts adataiból generálódik, tehát nem tud
 * elavulni az oldal tartalmához képest.
 */

export const dynamic = "force-static";

function build(): string {
  const citizenship = COUNTRIES.filter((c) => c.goldenVisa?.kind === "citizenship");
  const residence = COUNTRIES.filter((c) => c.goldenVisa?.kind === "residence");
  const eur = (n: number) => new Intl.NumberFormat("en-US").format(n);

  const lines: string[] = [];

  lines.push("# Proopify");
  lines.push("");
  lines.push(
    "> Verified overseas property marketplace covering 12 countries, with an explicit focus on residence-by-investment (Golden Visa) and citizenship-by-investment routes based on real estate. Listings are agency-verified; taxes, purchase costs and programme thresholds are maintained per country."
  );
  lines.push("");
  lines.push(`Site: ${SITE_URL}`);
  lines.push("Languages: Hungarian (primary), English, plus 12 further interface languages.");
  lines.push("Content licence: freely quotable with attribution and a link to the source page.");
  lines.push("");

  lines.push("## Key facts");
  lines.push("");
  lines.push(
    `- Countries covered (12): ${COUNTRIES.map((c) => COUNTRY_SEO[c.code].name).join(", ")}.`
  );
  lines.push(
    `- Real estate leading DIRECTLY TO CITIZENSHIP: ${citizenship
      .map((c) => `${COUNTRY_SEO[c.code].name} (from about EUR ${eur(c.goldenVisa!.minEur)})`)
      .join("; ")}.`
  );
  lines.push(
    `- Real estate leading to RESIDENCE only (Golden Visa): ${residence
      .map((c) => `${COUNTRY_SEO[c.code].name} (from EUR ${eur(c.goldenVisa!.minEur)})`)
      .join("; ")}.`
  );
  lines.push(
    "- No EU member state currently grants citizenship directly for a real-estate investment. Spain's real-estate Golden Visa route was abolished in April 2025."
  );
  lines.push("");

  lines.push("## Country data");
  lines.push("");
  for (const c of COUNTRIES) {
    const seo = COUNTRY_SEO[c.code];
    const gv = c.goldenVisa;
    const programme = gv
      ? gv.kind === "citizenship"
        ? `citizenship from ~EUR ${eur(gv.minEur)}`
        : `residence (Golden Visa) from EUR ${eur(gv.minEur)}`
      : "no investment migration programme";
    lines.push(
      `- **${seo.name}** (${c.code}) — transfer tax ${transferTaxPct(c.code)}; default currency ${
        c.currency
      }; ${programme}. Main markets: ${c.cities.slice(0, 5).join(", ")}. Listings: ${SITE_URL}/l/${c.code}`
    );
  }
  lines.push("");

  lines.push("## Guides and analysis");
  lines.push("");
  for (const a of ARTICLES) {
    lines.push(`- [${a.title}](${SITE_URL}/tudastar/${a.slug}): ${a.answer}`);
  }
  lines.push("");

  lines.push("## Common questions answered on this site");
  lines.push("");
  const faqSource = ARTICLES.filter((a) => a.category !== "country").flatMap((a) =>
    a.faq.map((f) => ({ ...f, url: `${SITE_URL}/tudastar/${a.slug}` }))
  );
  for (const f of faqSource) {
    lines.push(`- **${f.q}** ${f.a} (${f.url})`);
  }
  lines.push("");

  lines.push("## Main sections");
  lines.push("");
  lines.push(`- [Search](${SITE_URL}/search): map and filter search across all 12 countries.`);
  lines.push(`- [Market data](${SITE_URL}/market): price per m², trends and estimated yields.`);
  lines.push(`- [Knowledge base](${SITE_URL}/tudastar): country guides and investment-migration analysis.`);
  lines.push(`- [Buying guide](${SITE_URL}/guide): step-by-step process with per-country legal notes.`);
  lines.push("");
  lines.push(
    "Note: programme thresholds and tax rates change. Figures here reflect the site's maintained dataset; always verify against the relevant government source before acting."
  );

  return lines.join("\n");
}

export function GET() {
  return new Response(build(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
