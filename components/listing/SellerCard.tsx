"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useLang, useProfile } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

export default function SellerCard({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const seller = useProfile(listing.ownerId);
  if (!seller) return null;

  // Determinisztikus URL (SSR és kliens ugyanazt rendereli — nincs hydration-hiba).
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/listing/${listing.id}`;

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
            {seller.role === "agency" ? tr("role_agency", lang) : tr("role_private", lang)}
            {seller.location ? ` · ${seller.location}` : ""}
          </div>
          {seller.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{seller.bio}</p>}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-600">
            <div>
              <dt className="inline text-ink-400">{tr("response_time", lang)}: </dt>
              <dd className="inline font-medium">{seller.responseTime}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/u/${seller.id}`}
              className="inline-block rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
            >
              {tr("view_profile", lang)}
            </Link>
            {/* WhatsApp / Viber — a montenegrói piacon ezek a fő csatornák */}
            {seller.phone && (
              <>
                <a
                  href={`https://wa.me/${seller.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                    `${loc(listing.title, lang)} — ${shareUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Icon name="message" size={15} strokeWidth={2.2} /> WhatsApp
                </a>
                <a
                  href={`viber://chat?number=%2B${seller.phone.replace(/[^\d]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7360F2] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Icon name="message" size={15} strokeWidth={2.2} /> Viber
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
