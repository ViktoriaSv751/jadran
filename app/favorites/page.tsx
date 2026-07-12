"use client";

import Link from "next/link";
import { useLang, useFavorites, useListings } from "@/lib/store";
import { tr } from "@/lib/i18n";
import ListingCard from "@/components/ListingCard";
import RequireAuth from "@/components/auth/RequireAuth";
import PageHeading from "@/components/ui/PageHeading";
import Icon from "@/components/ui/Icon";

export default function FavoritesPage() {
  return (
    <RequireAuth message="login_to_save">
      <FavoritesInner />
    </RequireAuth>
  );
}

function FavoritesInner() {
  const { lang } = useLang();
  const favorites = useFavorites();
  const { items: all } = useListings();
  const items = all.filter((l) => favorites.has(l.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeading icon="heartFilled">{tr("favorites", lang)}</PageHeading>
      {!favorites.ready ? null : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500 shadow-soft">
          {tr("no_favorites", lang)}
          <div className="mt-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
            >
              {tr("search", lang)} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
