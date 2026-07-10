"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useLang, useProfile } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

export default function SellerCard({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const seller = useProfile(listing.ownerId);
  if (!seller) return null;

  return (
    <section className="mt-7 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-ink-900">{tr("about_seller", lang)}</h2>
      <div className="mt-4 flex items-start gap-4">
        <Avatar name={seller.name} src={seller.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink-900">{seller.name}</span>
            {seller.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-xs font-semibold text-white">
                <Icon name="check" size={12} strokeWidth={2.5} /> {tr("verified_badge", lang)}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-sm text-ink-500">
            {seller.role === "agency" ? tr("role_agency", lang) : tr("role_seller", lang)}
            {seller.location ? ` · ${seller.location}` : ""}
          </div>
          {seller.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{seller.bio}</p>}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-600">
            <div>
              <dt className="inline text-ink-400">{tr("response_time", lang)}: </dt>
              <dd className="inline font-medium">{seller.responseTime}</dd>
            </div>
          </dl>
          <Link
            href={`/u/${seller.id}`}
            className="mt-3 inline-block rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
          >
            {tr("view_profile", lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}
