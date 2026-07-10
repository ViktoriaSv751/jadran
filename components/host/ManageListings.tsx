"use client";

import Link from "next/link";
import { useAuth, useLang, useListingsByOwner } from "@/lib/store";
import { tr, typeLabels, modeLabels } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import * as db from "@/lib/db";
import { toast } from "@/lib/ui";
import Photo from "@/components/Photo";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

export default function ManageListings() {
  const { lang } = useLang();
  const { user } = useAuth();
  const listings = useListingsByOwner(user?.id);
  if (!user) return null;

  const togglePause = (id: string, status: string) =>
    db.updateListing(id, { status: status === "active" ? "paused" : "active" });

  const remove = (id: string) => {
    if (window.confirm(tr("confirm_delete", lang))) {
      db.deleteListing(id);
      toast(tr("listing_deleted_toast", lang));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">{tr("manage_listings", lang)}</h1>
        <Link href="/listings/new">
          <Button>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="plus" size={16} strokeWidth={2.2} /> {tr("new_listing", lang)}
            </span>
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
            <Icon name="home" size={28} />
          </div>
          <p className="font-semibold text-ink-800">{tr("no_listings_yet", lang)}</p>
          <Link
            href="/listings/new"
            className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
          >
            {tr("create_first_listing", lang)} <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft sm:flex-row sm:items-center"
            >
              <Link href={`/listing/${l.id}`} className="shrink-0">
                <Photo src={l.images[0]} alt={l.title[lang]} className="h-24 w-full rounded-xl sm:w-36" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      l.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {l.status === "active" ? tr("status_active", lang) : tr("status_paused", lang)}
                  </span>
                  <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                    {modeLabels[l.mode][lang]} · {typeLabels[l.type][lang]}
                  </span>
                </div>
                <Link href={`/listing/${l.id}`}>
                  <h3 className="mt-1 line-clamp-1 font-semibold text-ink-900 hover:text-brand-700">{l.title[lang]}</h3>
                </Link>
                <div className="mt-0.5 text-sm text-ink-500">
                  {formatPrice(l.price, lang)}
                  {l.mode === "rent" && tr("per_month", lang)} · {l.views} {tr("views_label", lang)}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={`/listings/new?id=${l.id}`}>
                  <Button size="sm" variant="outline">
                    {tr("edit_btn", lang)}
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => togglePause(l.id, l.status)}>
                  {l.status === "active" ? tr("pause_listing", lang) : tr("activate_listing", lang)}
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(l.id)}>
                  {tr("delete_btn", lang)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
