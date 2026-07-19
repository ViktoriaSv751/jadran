import type { Metadata } from "next";
import { supabaseServer, SITE_URL } from "@/lib/supabase-server";
import { rowToListing } from "@/lib/mappers";
import { COUNTRY_SEO, breadcrumbJsonLd, ORG_ID } from "@/lib/seo";
import type { Listing } from "@/lib/types";
import ListingPageClient from "@/components/listing/ListingPageClient";
import JsonLd from "@/components/JsonLd";

/**
 * Szerver-komponens wrapper: SSR metaadatot (generateMetadata) és strukturált
 * adatot állít elő a hirdetésből, majd a kliens tartalmat rendereli.
 */

async function getListing(id: string): Promise<Listing | null> {
  if (!supabaseServer) return null;
  const { data } = await supabaseServer.from("listings").select("*").eq("id", id).maybeSingle();
  return data ? rowToListing(data) : null;
}

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const l = await getListing(params.id);
  if (!l) return { title: "Proopify" };

  const countryHu = COUNTRY_SEO[l.country]?.nameHu ?? "";
  const title = `${l.title.hu} — ${l.city}${countryHu ? `, ${countryHu}` : ""}`;
  const description = l.description.hu.slice(0, 160);
  const url = `${SITE_URL}/listing/${l.id}`;
  const image = l.images[0]?.startsWith("http") ? l.images[0] : `${SITE_URL}${l.images[0] ?? ""}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Proopify`,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined }
  };
}

/** Hirdetés → schema.org. A RealEstateListing az ingatlanhirdetés kanonikus típusa. */
function listingJsonLd(l: Listing) {
  const url = `${SITE_URL}/listing/${l.id}`;
  const seo = COUNTRY_SEO[l.country];
  const images = l.images.map((i) => (i.startsWith("http") ? i : `${SITE_URL}${i}`));

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    url,
    name: l.title.hu,
    description: l.description.hu,
    inLanguage: "hu",
    ...(images.length ? { image: images } : {}),
    ...(l.createdAt ? { datePosted: l.createdAt } : {}),
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: l.price,
      // A tárolás mindig EUR-ban történik (lib/geo.ts), a megjelenítés váltható.
      priceCurrency: "EUR",
      availability: l.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      businessFunction:
        l.mode === "sale" ? "https://schema.org/Sell" : "https://schema.org/LeaseOut",
      url
    },
    about: {
      "@type": l.mode === "sale" ? "SingleFamilyResidence" : "Accommodation",
      name: l.title.hu,
      ...(l.area > 0
        ? { floorSize: { "@type": "QuantitativeValue", value: l.area, unitCode: "MTK" } }
        : {}),
      ...(l.rooms ? { numberOfRooms: l.rooms } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: l.city,
        addressCountry: l.country
      },
      ...(l.lat && l.lng
        ? { geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng } }
        : {})
    },
    ...(seo ? { areaServed: { "@type": "Country", name: seo.name } } : {})
  };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const l = await getListing(params.id);

  return (
    <>
      {l && (
        <JsonLd
          data={[
            listingJsonLd(l),
            breadcrumbJsonLd([
              { name: "Főoldal", url: SITE_URL },
              { name: COUNTRY_SEO[l.country]?.nameHu ?? l.country, url: `${SITE_URL}/l/${l.country}` },
              { name: l.title.hu, url: `${SITE_URL}/listing/${l.id}` }
            ])
          ]}
        />
      )}
      <ListingPageClient id={params.id} />
    </>
  );
}
