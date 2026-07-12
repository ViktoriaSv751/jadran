import type { Metadata } from "next";
import { supabaseServer, SITE_URL } from "@/lib/supabase-server";
import { rowToListing } from "@/lib/mappers";
import ListingPageClient from "@/components/listing/ListingPageClient";

/**
 * Szerver-komponens wrapper: SSR metaadatot (generateMetadata) állít elő a
 * hirdetésből (SEO + megosztható OG-kép), majd a kliens tartalmat rendereli.
 */
export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  if (!supabaseServer) return { title: "PROOPIFY" };
  const { data } = await supabaseServer.from("listings").select("*").eq("id", params.id).maybeSingle();
  if (!data) return { title: "PROOPIFY — Ingatlan Montenegróban" };
  const l = rowToListing(data);
  const title = `${l.title.hu} — ${l.city}`;
  const ogTitle = `${title} | PROOPIFY`;
  const description = l.description.hu.slice(0, 160);
  const url = `${SITE_URL}/listing/${l.id}`;
  const image = l.images[0]?.startsWith("http") ? l.images[0] : `${SITE_URL}${l.images[0] ?? ""}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined }
  };
}

export default function ListingPage({ params }: { params: { id: string } }) {
  return <ListingPageClient id={params.id} />;
}
