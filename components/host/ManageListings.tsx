"use client";

import Link from "next/link";
import { useAuth, useLang, useListingsByOwner } from "@/lib/store";
import { tr, typeLabels, modeLabels, loc } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import * as db from "@/lib/db";
import { toast } from "@/lib/ui";
import Photo from "@/components/Photo";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import PageHeading from "@/components/ui/PageHeading";
import PromoteButton from "@/components/host/PromoteButton";

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
      <PageHeading
        icon="building"
        className="mb-6"
        right={
          <Link href="/listings/new">
            <Button>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="plus" size={16} strokeWidth={2.2} /> {tr("new_listing", lang)}
              </span>
            </Button>
          </Link>
        }
      >
        {tr("manage_listings", lang)}
      </PageHeading>

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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <div key={l.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
              {/* Teljes kép — mint a keresés-listanézet kártyáján */}
              <Link href={`/listing/${l.id}`} className="relative block">
                <Photo src={l.images[0]} alt={loc(l.title, lang)} className="aspect-[4/3] w-full" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-soft ${
                    l.status === "active" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {l.status === "active" ? tr("status_active", lang) : tr("status_paused", lang)}
                </span>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Icon name="eye" size={12} /> {l.views}
                </span>
              </Link>

              <div className="p-4">
                <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-600">
                  {modeLabels[l.mode][lang]} · {typeLabels[l.type][lang]}
                </span>
                <Link href={`/listing/${l.id}`}>
                  <h3 className="mt-2 line-clamp-1 font-bold tracking-tight text-ink-900 hover:text-brand-700">
                    {loc(l.title, lang)}
                  </h3>
                </Link>
                <div className="mt-1 text-xl font-black tracking-tight text-ink-900">
                  {formatPrice(l.price, lang)}
                  {l.mode === "rent" && <span className="text-xs font-semibold text-ink-400">{tr("per_month", lang)}</span>}
                </div>

                {/* Kezelő-gombok */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <Link href={`/listings/new?id=${l.id}`} className="flex-1">
                    <Button size="sm" variant="outline" full>
                      <Icon name="sliders" size={14} className="mr-1" /> {tr("edit_btn", lang)}
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => togglePause(l.id, l.status)}>
                    {l.status === "active" ? tr("pause_listing", lang) : tr("activate_listing", lang)}
                  </Button>
                  <PromoteButton listing={l} />
                  <Button size="sm" variant="danger" onClick={() => remove(l.id)} aria-label={tr("delete_btn", lang)}>
                    <Icon name="close" size={15} strokeWidth={2.4} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
