"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLang, useListing, useAuth } from "@/lib/store";
import { tr } from "@/lib/i18n";
import * as db from "@/lib/db";
import ListingDetail from "@/components/ListingDetail";
import Icon from "@/components/ui/Icon";

export default function ListingPageClient({ id }: { id: string }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const { listing, ready } = useListing(id);

  // Megtekintés-számlálás DEDUP-pal: (1) a SAJÁT hirdetés megtekintése nem
  // számít; (2) egy böngésző-munkameneten belül egy hirdetés csak EGYSZER
  // számít (újratöltés nem húzza fel a számot).
  useEffect(() => {
    if (!listing) return;
    if (user && user.id === listing.ownerId) return;
    const key = "jadran_viewed_session";
    let seen: string[] = [];
    try {
      seen = JSON.parse(sessionStorage.getItem(key) || "[]");
    } catch {
      seen = [];
    }
    if (seen.includes(listing.id)) return;
    db.incrementViews(listing.id);
    try {
      sessionStorage.setItem(key, JSON.stringify([...seen, listing.id]));
    } catch {
      /* private mode — ignore */
    }
  }, [listing, user]);

  if (ready && !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-ink-800">404</p>
        <Link
          href="/search"
          className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
        >
          {tr("back_to_search", lang)} <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">
        {tr("loading", lang)}
      </div>
    );
  }

  return <ListingDetail listing={listing} />;
}
