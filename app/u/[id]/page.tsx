import type { Metadata } from "next";
import { supabaseServer, SITE_URL } from "@/lib/supabase-server";
import JsonLd from "@/components/JsonLd";
import PublicProfile from "@/components/profile/PublicProfile";

/**
 * Szerver-wrapper a nyilvános profilhoz: a UI kliens-oldali (PublicProfile), de
 * itt SSR metaadatot és — ami a videó „Review schema" tanulsága — AggregateRating
 * + Review strukturált adatot állítunk elő az értékelésekből. A Google AI a
 * véleményeket kifejezetten idézi, ezért ez gyors, magas hozamú kiegészítés.
 */

async function getProfile(id: string) {
  if (!supabaseServer) return null;
  const { data } = await supabaseServer.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}

async function getReviews(id: string) {
  if (!supabaseServer) return [];
  const { data } = await supabaseServer
    .from("reviews")
    .select("author_name, rating, text, created_at")
    .eq("target_user_id", id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const p = await getProfile(params.id);
  if (!p) return { title: "Proopify" };
  const name = p.agency_name || p.name || "Proopify";
  const title = p.role === "agency" ? `${name} — ingatlaniroda` : name;
  const description = p.bio || `${name} a Proopify verifikált hirdetői között.`;
  return {
    title,
    description: String(description).slice(0, 160),
    alternates: { canonical: `${SITE_URL}/u/${params.id}` }
  };
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const p = await getProfile(params.id);
  const reviews = p ? await getReviews(params.id) : [];

  let schema: object | null = null;
  if (p) {
    const name = p.agency_name || p.name;
    const ratings = reviews.map((r) => Number(r.rating)).filter((n) => n > 0);
    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) / 10
        : 0;
    schema = {
      "@context": "https://schema.org",
      "@type": p.role === "agency" ? "RealEstateAgent" : "Person",
      "@id": `${SITE_URL}/u/${params.id}`,
      name,
      ...(p.avatar ? { image: p.avatar } : {}),
      ...(p.location ? { address: { "@type": "PostalAddress", addressLocality: p.location } } : {}),
      ...(p.phone ? { telephone: p.phone } : {}),
      ...(ratings.length > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avg,
              reviewCount: ratings.length,
              bestRating: 5,
              worstRating: 1
            },
            review: reviews.slice(0, 5).map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.author_name || "—" },
              reviewRating: {
                "@type": "Rating",
                ratingValue: Number(r.rating),
                bestRating: 5,
                worstRating: 1
              },
              ...(r.text ? { reviewBody: String(r.text) } : {}),
              ...(r.created_at ? { datePublished: r.created_at } : {})
            }))
          }
        : {})
    };
  }

  return (
    <>
      {schema && <JsonLd data={schema} />}
      <PublicProfile id={params.id} />
    </>
  );
}
