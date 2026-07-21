/**
 * Fordítás-ellenőrző.
 *
 * A tudástár tartalma jogi és adózási tényeket közöl, ezért a fordításban a
 * SZÁMOKNAK egyezniük kell a magyar forrással. Ez a szkript minden nyelvi
 * fájlra ellenőrzi:
 *   1. a szerkezetet (ugyanazok a kulcsok, ugyanolyan hosszú tömbök),
 *   2. a számhalmazt (minden szám ugyanannyiszor szerepel, mint a forrásban).
 *
 * A számformátum eltérhet nyelvenként ("400 000" vs "400,000"), ezért a
 * összehasonlítás előtt normalizálunk: kiszedjük a szóközöket és vesszőket a
 * számjegyek közül.
 *
 * Futtatás:  node scripts/check-translations.mjs
 *
 * FELÜLVIZSGÁLT KIVÉTELEK: néhány nyelv számnév helyett SZÓT ír (olasz
 * „quinquennale" az „5 éves" helyett, thai „บ้านหนึ่งยูโร" az „1 eurós ház"
 * helyett), vagy épp kibont egy összevont alakot (a magyar „400 és 800 ezer
 * eurós" angolul „€400,000 / €800,000"). Ezeket egyenként átnéztük, tartalmi
 * eltérést nem okoznak, ezért az alábbi listán szerepelnek. MINDEN MÁS
 * eltérés hibának számít — ha új tétel jelenik meg itt, azt meg kell nézni,
 * mert adószám vagy jogi küszöb csúszhatott el.
 */

/** Felülvizsgált, tartalmilag ártalmatlan eltérések nyelvenként. */
const REVIEWED = {
  // „400 és 800 ezer eurós" → kibontva két teljes összegre. Ugyanaz az érték.
  en: ["400000", "800000", "400", "800"],
  th: ["400000", "800000", "400", "800", "1"],
  // „a felek felezik" → „reparten al 50 %". Ugyanaz a jelentés.
  es: ["50"],
  // „5 éves" → „quinquennale", „10 éves" → „decennale", „99 éves" → szóalak.
  it: ["5", "10", "99"],
  // Dubaj „10 éves Golden Visa" → görögül „δεκαετής" (szóalak), 4 helyen.
  el: ["10"]
};
import { readFileSync, readdirSync } from "node:fs";

const DIR = "lib/tudastar/content";
const src = JSON.parse(readFileSync(`${DIR}/hu.json`, "utf8"));

/** Számok kigyűjtése egy szövegből, formátumfüggetlenül. */
function numbers(text) {
  const canon = String(text)
    // ezres elválasztó (szóköz, nem törő szóköz, vessző, pont) számjegyek között
    .replace(/(?<=\d)[  .,](?=\d{3}\b)/g, "")
    // tizedes vessző → pont
    .replace(/(?<=\d),(?=\d)/g, ".");
  return (canon.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(parseFloat(n)));
}

function walk(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === "object") Object.values(node).forEach((n) => walk(n, out));
  return out;
}

const tally = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());

let failed = false;
const files = readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "hu.json");

for (const file of files.sort()) {
  const lang = file.replace(".json", "");
  const t = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  if (t.fallback || Object.keys(t.countries ?? {}).length === 0) {
    console.log(`  ${lang}: helyőrző (nincs fordítás) — kihagyva`);
    continue;
  }

  const problems = [];

  // 1. szerkezet
  for (const [code, sv] of Object.entries(src.countries)) {
    const tv = t.countries[code];
    if (!tv) { problems.push(`hiányzó ország: ${code}`); continue; }
    if (tv.highlights?.length !== sv.highlights.length)
      problems.push(`${code}.highlights ${tv.highlights?.length} != ${sv.highlights.length}`);
    if (tv.faq?.length !== sv.faq.length)
      problems.push(`${code}.faq ${tv.faq?.length} != ${sv.faq.length}`);
  }
  for (const [slug, sv] of Object.entries(src.articles)) {
    const tv = t.articles[slug];
    if (!tv) { problems.push(`hiányzó cikk: ${slug}`); continue; }
    if (tv.sections?.length !== sv.sections.length)
      problems.push(`${slug}.sections ${tv.sections?.length} != ${sv.sections.length}`);
    if (tv.faq?.length !== sv.faq.length)
      problems.push(`${slug}.faq ${tv.faq?.length} != ${sv.faq.length}`);
  }

  // 2. számhalmaz
  const srcNums = tally(walk(src).flatMap(numbers));
  const tgtNums = tally(walk(t).flatMap(numbers));
  const reviewed = new Set(REVIEWED[lang] ?? []);
  const drift = [];
  const known = [];
  for (const [n, c] of srcNums) {
    const got = tgtNums.get(n) ?? 0;
    if (got === c) continue;
    const line = `${n}: forrás ${c}× / fordítás ${got}×`;
    (reviewed.has(n) ? known : drift).push(line);
  }

  if (problems.length || drift.length) {
    failed = true;
    console.log(`\n  ${lang}: ${problems.length} szerkezeti, ${drift.length} szám-eltérés`);
    problems.slice(0, 6).forEach((p) => console.log(`    ! ${p}`));
    drift.slice(0, 8).forEach((d) => console.log(`    ~ ${d}`));
    if (drift.length > 8) console.log(`    ~ …és további ${drift.length - 8}`);
  } else if (known.length) {
    console.log(`  ${lang}: OK — ${known.length} felülvizsgált, ártalmatlan szóalak-eltérés`);
  } else {
    console.log(`  ${lang}: OK — szerkezet és minden szám egyezik`);
  }
}

process.exit(failed ? 1 : 0);
