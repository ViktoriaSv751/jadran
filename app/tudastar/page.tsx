import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, CATEGORY_LABEL, type Article } from "@/lib/articles";
import { breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";

const TITLE = "Tudástár — külföldi ingatlanbefektetés, Golden Visa és állampolgárság";
const DESC =
  "Országkalauzok és szakmai cikkek külföldi ingatlanvásárlásról: hol lehet ingatlannal állampolgárságot szerezni, melyik Golden Visa működik még, mennyi a mellékköltség 12 országban.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: [
    "külföldi ingatlanbefektetés",
    "állampolgárság ingatlanbefektetéssel",
    "golden visa ingatlannal",
    "ingatlanvásárlás külföldön",
    "montenegrói ingatlanbefektetés"
  ],
  alternates: { canonical: `${SITE_URL}/tudastar` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/tudastar`, type: "website" }
};

const ORDER: Article["category"][] = ["citizenship", "golden-visa", "guide", "country"];

export default function TudastarPage() {
  const byCategory = ORDER.map((cat) => ({
    cat,
    items: ARTICLES.filter((a) => a.category === cat)
  })).filter((g) => g.items.length > 0);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: `${SITE_URL}/tudastar`,
    name: TITLE,
    description: DESC,
    isPartOf: { "@id": SITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ARTICLES.length,
      itemListElement: ARTICLES.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.title,
        url: `${SITE_URL}/tudastar/${a.slug}`
      }))
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Tudástár", url: `${SITE_URL}/tudastar` }
          ])
        ]}
      />

      <header className="text-center">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">Tudástár</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">{DESC}</p>
      </header>

      {byCategory.map(({ cat, items }) => (
        <section key={cat} className="mt-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
            {CATEGORY_LABEL[cat]}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((a) => (
              <Link
                key={a.slug}
                href={`/tudastar/${a.slug}`}
                className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition hover:border-ink-900"
              >
                <div className="text-2xl leading-none">{a.emoji}</div>
                <h3 className="mt-3 text-base font-bold leading-snug text-ink-900 group-hover:underline">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{a.description}</p>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  {a.readMinutes} perc olvasás
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
