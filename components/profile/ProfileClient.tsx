"use client";

import Link from "next/link";
import { useAuth, useLang, useListingsByOwner, useFavorites, useUnreadCount } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import Icon, { type IconName } from "@/components/ui/Icon";
import LogoutButton from "@/components/auth/LogoutButton";

export default function ProfileClient() {
  const { lang } = useLang();
  const { user } = useAuth();
  const listings = useListingsByOwner(user?.id);
  const favorites = useFavorites();
  const unread = useUnreadCount(user?.id);
  if (!user) return null;

  const isSeller = user.role === "agency" || user.role === "seller";
  const active = listings.filter((l) => l.status === "active").length;
  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);
  const roleLabel =
    user.role === "agency" ? tr("role_agency", lang) : user.role === "seller" ? tr("role_seller", lang) : tr("role_buyer", lang);

  // Szerepkör-tudatos statisztika
  const stats = isSeller
    ? [
        { label: tr("active_listings", lang), value: active },
        { label: tr("views_label", lang), value: totalViews },
        { label: tr("member_since", lang), value: new Date(user.joinedAt).getFullYear() }
      ]
    : [
        { label: tr("favorites", lang), value: favorites.ids.length },
        { label: tr("messages", lang), value: unread },
        { label: tr("member_since", lang), value: new Date(user.joinedAt).getFullYear() }
      ];

  const menu: { href: string; label: string; icon: IconName; badge?: number }[] = [
    ...(isSeller
      ? [
          { href: "/listings", label: tr("my_listings", lang), icon: "building" as IconName },
          { href: "/listings/new", label: tr("new_listing", lang), icon: "plus" as IconName }
        ]
      : []),
    { href: "/favorites", label: tr("favorites", lang), icon: "heart", badge: favorites.ids.length },
    { href: "/messages", label: tr("messages", lang), icon: "message", badge: unread },
    { href: "/compare", label: tr("compare", lang), icon: "sliders" },
    { href: "/settings", label: tr("settings", lang), icon: "sliders" }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* Fejléc-kártya borító-gradienssel */}
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <div className="h-24 bg-gradient-to-r from-ink-900 via-ink-800 to-brand-700 sm:h-28" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-col items-center gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5">
            <span className="rounded-full ring-4 ring-white">
              <Avatar name={user.name} src={user.avatar} size={88} />
            </span>
            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="display text-2xl text-ink-900">{user.name}</h1>
                {user.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                    <Icon name="check" size={12} strokeWidth={2.6} /> {tr("verified_badge", lang)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm font-medium text-ink-600">
                {roleLabel}
                {user.location ? ` · ${user.location}` : ""}
              </p>
              <p className="text-xs text-ink-400">{user.email}</p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-ink-50"
            >
              <Icon name="user" size={15} /> {tr("edit_profile", lang)}
            </Link>
          </div>

          {user.bio && <p className="mt-4 text-center text-sm leading-relaxed text-ink-600 sm:text-left">{user.bio}</p>}

          <div className="mt-5 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-ink-50 p-4 text-center">
                <div className="text-2xl font-black tracking-tight text-ink-900">{s.value}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Szerepkör-tudatos kiemelt akció */}
      {isSeller ? (
        <Link
          href="/listings/new"
          className="mt-5 flex items-center gap-4 rounded-2xl bg-ink-950 p-5 text-white shadow-card transition hover:bg-ink-900"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#c8ff00] text-ink-950">
            <Icon name="plus" size={24} strokeWidth={2.6} />
          </span>
          <div className="flex-1">
            <div className="font-bold">{tr("new_listing", lang)}</div>
            <div className="text-sm text-white/80">{tr("create_first_listing", lang)}</div>
          </div>
          <Icon name="arrowRight" size={22} />
        </Link>
      ) : (
        <Link
          href="/search"
          className="mt-5 flex items-center gap-4 rounded-2xl bg-ink-950 p-5 text-white shadow-card transition hover:bg-ink-900"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#c8ff00] text-ink-950">
            <Icon name="search" size={24} strokeWidth={2.4} />
          </span>
          <div className="flex-1">
            <div className="font-bold">{tr("search", lang)}</div>
            <div className="text-sm text-white/80">{tr("brand_tagline", lang)}</div>
          </div>
          <Icon name="arrowRight" size={22} />
        </Link>
      )}

      {/* Menü lista */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        {menu.map((m, i) => (
          <Link
            key={m.href + i}
            href={m.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-ink-800 transition hover:bg-ink-50 ${
              i > 0 ? "border-t border-ink-100" : ""
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-700">
              <Icon name={m.icon} size={18} />
            </span>
            <span className="flex-1">{m.label}</span>
            {m.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                {m.badge}
              </span>
            ) : null}
            <Icon name="chevronRight" size={16} className="text-ink-300" />
          </Link>
        ))}
      </div>

      <LogoutButton className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 py-3.5 text-sm font-semibold text-ink-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
        <Icon name="key" size={16} /> {tr("logout", lang)}
      </LogoutButton>
    </div>
  );
}
