import type { Metadata } from "next";
import { ARTICLES } from "@/lib/articles";
import { breadcrumbJsonLd, SITE_ID } from "@/lib/seo";
import { SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";
import KnowledgeHub from "@/components/tudastar/KnowledgeHub";

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

export default function TudastarPage() {
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
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Főoldal", url: SITE_URL },
            { name: "Tudástár", url: `${SITE_URL}/tudastar` }
          ])
        ]}
      />
      {/* A látható tartalom kliens-oldali, mert a nyelvválasztó is az. A magyar
          változat a szerver-renderben benne van, így a keresőrobotok JS
          futtatása nélkül is látják. */}
      <KnowledgeHub />
    </>
  );
}
