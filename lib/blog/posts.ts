/**
 * SEO-blog — 20 kód-alapú, TÖBBNYELVŰ cikk.
 *
 * Miért kódban és nem DB-ben: a tulajdonosi CMS (blog_posts tábla) egynyelvű,
 * és szerver-oldalon renderel. Ezek a nagy elérésű SEO-cikkek viszont MINDEN
 * felület-nyelven megjelennek — pontosan úgy, mint a Tudástár: a magyar a
 * szerver-render (a keresők JS nélkül is látják), a többi nyelvet a kliens
 * cseréli le. A nyelvfüggetlen metaadat (slug, borítókép, dátum, kulcsszavak)
 * itt él; a fordítható szöveg a lib/blog/content/{lang}.json fájlokban.
 *
 * A tulajdonosi (DB) cikkek ettől függetlenül tovább működnek — a /blog lista
 * összefésüli, a /blog/[slug] pedig előbb ITT keres, és ha nincs, a DB-ből tölt.
 */

export type BlogCategory = "country" | "guide" | "finance" | "trends";

export interface BlogPostMeta {
  slug: string;
  /** Nyelvfüggetlen borítókép (public/ útvonal). */
  cover: string;
  category: BlogCategory;
  /** ISO dátum — a BlogPosting datePublished/Modified mezője. */
  date: string;
  readMinutes: number;
  /** Elsődleges (magyar) kulcsszavak a meta-taghez. */
  keywords: string[];
}

const D = "2026-07-20";

export const BLOG_POSTS: BlogPostMeta[] = [
  { slug: "montenegro-ingatlanvasarlas-2026", cover: "/p/view1.jpg", category: "country", date: D, readMinutes: 9,
    keywords: ["montenegrói ingatlanvásárlás", "montenegró ingatlan 2026", "ingatlan Budva Kotor", "montenegró tengerparti ingatlan ár"] },
  { slug: "bali-ingatlanbefektetes-kulfoldikent", cover: "/p/view2.jpg", category: "country", date: D, readMinutes: 10,
    keywords: ["bali ingatlanbefektetés", "bali ingatlan külföldiként", "leasehold Bali", "Hak Pakai"] },
  { slug: "dubai-ingatlan-hozam-2026", cover: "/p/ext1.jpg", category: "country", date: D, readMinutes: 10,
    keywords: ["dubai ingatlanbefektetés", "dubai ingatlan hozam", "adómentes bérleti jövedelem Dubai", "dubai ingatlan 2026"] },
  { slug: "torok-allampolgarsag-ingatlan-lepesrol-lepesre", cover: "/p/ext2.jpg", category: "country", date: D, readMinutes: 11,
    keywords: ["török állampolgárság ingatlannal", "citizenship by investment Törökország", "400000 USD ingatlan", "tapu"] },
  { slug: "alban-riviera-tengerparti-ingatlan", cover: "/p/view3.jpg", category: "country", date: D, readMinutes: 9,
    keywords: ["albán riviéra ingatlan", "olcsó tengerparti ingatlan Albánia", "Ksamil Sarandë ingatlan", "albánia ingatlanvásárlás"] },
  { slug: "gorog-golden-visa-2026-teljes-kalauz", cover: "/p/ext3.jpg", category: "country", date: D, readMinutes: 11,
    keywords: ["görög golden visa 2026", "görögország ingatlan letelepedés", "golden visa küszöb Görögország", "athén ingatlan"] },
  { slug: "horvatorszag-ingatlan-dalmacia-kalauz", cover: "/p/view4.jpg", category: "country", date: D, readMinutes: 9,
    keywords: ["horvátország ingatlanvásárlás", "dalmácia ingatlan", "horvát tengerparti ingatlan", "EU ingatlan Horvátország"] },
  { slug: "thaifold-condo-vasarlas-kulfoldinek", cover: "/p/view5.jpg", category: "country", date: D, readMinutes: 9,
    keywords: ["thaiföld ingatlanvásárlás", "condo vásárlás Thaiföld", "külföldi ingatlan Thaiföld", "phuket ingatlan"] },
  { slug: "belgrad-szerbia-ingatlanbefektetes", cover: "/p/ext4.jpg", category: "country", date: D, readMinutes: 8,
    keywords: ["szerbia ingatlanbefektetés", "belgrád ingatlan", "városi bérleti hozam Szerbia", "szerb ingatlan ár"] },
  { slug: "kulfoldi-ingatlan-finanszirozasa-hitel", cover: "/p/ext5.jpg", category: "finance", date: D, readMinutes: 10,
    keywords: ["külföldi ingatlan finanszírozás", "külföldi ingatlanhitel", "LTV külföldi vevő", "jelzáloghitel külföldön"] },
  { slug: "airbnb-rovid-tavu-kiadas-szabalyozasa", cover: "/p/liv1.jpg", category: "guide", date: D, readMinutes: 10,
    keywords: ["airbnb szabályozás országonként", "rövid távú kiadás engedély", "short-let szabályok", "turisztikai bérbeadás külföld"] },
  { slug: "off-plan-ingatlan-vasarlas-kockazatok", cover: "/p/ext6.jpg", category: "guide", date: D, readMinutes: 9,
    keywords: ["off-plan ingatlan vásárlás", "épülő ingatlan kockázat", "escrow off-plan", "fejlesztői garancia"] },
  { slug: "ingatlan-due-diligence-checklista-kulfold", cover: "/p/liv2.jpg", category: "guide", date: D, readMinutes: 10,
    keywords: ["ingatlan due diligence", "jogi átvilágítás külföldön", "tulajdoni lap ellenőrzés", "ingatlanvásárlás checklista"] },
  { slug: "devizakockazat-ingatlanbefektetes-kezelese", cover: "/p/ext7.jpg", category: "finance", date: D, readMinutes: 9,
    keywords: ["devizakockázat ingatlan", "árfolyamkockázat ingatlanbefektetés", "devizaváltás spórolás", "EUR HUF ingatlan"] },
  { slug: "nyugdij-kulfoldon-ingatlannal", cover: "/p/view1.jpg", category: "guide", date: D, readMinutes: 9,
    keywords: ["nyugdíj külföldön ingatlannal", "hol éri meg nyugdíjas ingatlan", "tengerparti nyugdíj otthon", "külföldi letelepedés nyugdíj"] },
  { slug: "digitalis-nomad-ingatlanvasarlas", cover: "/p/liv3.jpg", category: "guide", date: D, readMinutes: 9,
    keywords: ["digitális nomád ingatlan", "digitális nomád vízum ingatlan", "hol vegyen ingatlant nomád", "távmunka külföldi ingatlan"] },
  { slug: "tengerparti-vs-varosi-ingatlan-befektetes", cover: "/p/ext8.jpg", category: "guide", date: D, readMinutes: 9,
    keywords: ["tengerparti vs városi ingatlan", "melyik jobb befektetés ingatlan", "szezonális vs egész éves bérlet", "ingatlan hozam összehasonlítás"] },
  { slug: "kulfoldi-ingatlan-oroklodese-ado", cover: "/p/liv4.jpg", category: "finance", date: D, readMinutes: 9,
    keywords: ["külföldi ingatlan öröklés", "ingatlan öröklési adó külföld", "vagyontervezés külföldi ingatlan", "öröklés spanyolország ingatlan"] },
  { slug: "uj-epitesu-vs-hasznalt-ingatlan-kulfold", cover: "/p/ext9.jpg", category: "guide", date: D, readMinutes: 9,
    keywords: ["új építésű vs használt ingatlan", "off-plan vagy kész ingatlan", "áfa új ingatlan külföld", "ingatlan állapot vásárlás"] },
  { slug: "balkan-mediterran-ingatlanpiac-trendek-2026", cover: "/p/ext10.jpg", category: "trends", date: D, readMinutes: 10,
    keywords: ["ingatlanpiaci trendek 2026", "balkán ingatlanpiac", "mediterrán ingatlan trend", "hol vegyen ingatlant 2026"] }
];

export const BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);
export const BLOG_POST_BY_SLUG: Record<string, BlogPostMeta> = Object.fromEntries(
  BLOG_POSTS.map((p) => [p.slug, p])
);

/** A megadott poszthoz kapcsolódó (azonos kategóriájú, majd tetszőleges) cikkek. */
export function relatedPosts(slug: string, n = 3): BlogPostMeta[] {
  const self = BLOG_POST_BY_SLUG[slug];
  if (!self) return [];
  const sameCat = BLOG_POSTS.filter((p) => p.slug !== slug && p.category === self.category);
  const rest = BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== self.category);
  return [...sameCat, ...rest].slice(0, n);
}
