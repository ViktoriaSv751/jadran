"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLang, useListing } from "@/lib/store";
import { tr } from "@/lib/i18n";
import * as db from "@/lib/db";
import ListingDetail from "@/components/ListingDetail";
import Icon from "@/components/ui/Icon";

export default function ListingPageClient({ id }: { id: string }) {
  const { lang } = useLang();
  const { listing, ready } = useListing(id);

  // Count a view once per mount (client-only).
  useEffect(() => {
    if (id) db.incrementViews(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
