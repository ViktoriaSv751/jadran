"use client";

import Link from "next/link";
import { useAuth, useLang, useProfile, useListingsByOwner } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { openAuth } from "@/lib/ui";
import * as db from "@/lib/db";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import ListingCard from "@/components/ListingCard";
import Reviews from "./Reviews";

export default function PublicProfile({ id }: { id: string }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const profile = useProfile(id);
  const listings = useListingsByOwner(id).filter((l) => l.status === "active");

  if (profile === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">{tr("loading", lang)}</div>;
  }
  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-ink-800">404</p>
      </div>
    );
  }

  const message = () => {
    const run = () => {
      const me = db.getCurrentUser();
      if (!me || me.id === profile.id) return;
      // Anchor a conversation to the seller's most recent listing if any.
      const anchor = listings[0];
      if (!anchor) return;
      const conv = db.getOrCreateConversation(anchor.id, me.id, profile.id);
      router.push(`/messages?c=${conv.id}`);
    };
    if (!user) return openAuth("login", run);
    run();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar name={profile.name} src={profile.avatar} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-black tracking-tight text-ink-900">{profile.name}</h1>
              {profile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-xs font-semibold text-white">
                  <Icon name="check" size={12} strokeWidth={2.5} /> {tr("verified_badge", lang)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm font-medium text-ink-600">
              {profile.role === "agency" ? tr("role_agency", lang) : tr("role_private", lang)}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
            <p className="mt-1 text-sm text-ink-400">
              {tr("response_time", lang)}: {profile.responseTime} · {listings.length} {tr("active_listings", lang)}
            </p>
            {profile.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{profile.bio}</p>}
          </div>
          {user?.id !== profile.id && listings.length > 0 && (
            <Button onClick={message}>{tr("contact_seller", lang)}</Button>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-ink-900">{tr("my_listings", lang)}</h2>
      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500">
          {tr("no_listings_yet", lang)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}

      <Reviews targetUserId={profile.id} />
    </div>
  );
}
