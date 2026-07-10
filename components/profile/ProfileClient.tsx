"use client";

import Link from "next/link";
import { useAuth, useLang, useListingsByOwner } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";

export default function ProfileClient() {
  const { lang } = useLang();
  const { user, logout } = useAuth();
  const listings = useListingsByOwner(user?.id);
  if (!user) return null;

  const active = listings.filter((l) => l.status === "active").length;
  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);

  const stats = [
    { label: tr("active_listings", lang), value: active },
    { label: tr("views_label", lang), value: totalViews },
    { label: tr("member_since", lang), value: new Date(user.joinedAt).getFullYear() }
  ];

  const menu: { href: string; label: string; icon: IconName }[] = [
    { href: "/listings", label: tr("my_listings", lang), icon: "home" },
    { href: "/listings/new", label: tr("new_listing", lang), icon: "plus" },
    { href: "/messages", label: tr("messages", lang), icon: "message" },
    { href: "/favorites", label: tr("favorites", lang), icon: "heart" },
    { href: "/settings", label: tr("settings", lang), icon: "sliders" }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar name={user.name} src={user.avatar} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-black tracking-tight text-ink-900">{user.name}</h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-xs font-semibold text-white">
                  <Icon name="check" size={12} strokeWidth={2.5} /> {tr("verified_badge", lang)}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-500">{user.email}</p>
            <p className="mt-1 text-sm font-medium text-ink-600">
              {user.role === "agency"
                ? tr("role_agency", lang)
                : user.role === "seller"
                  ? tr("role_seller", lang)
                  : tr("role_buyer", lang)}
              {user.location ? ` · ${user.location}` : ""}
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline">{tr("edit_profile", lang)}</Button>
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-ink-50 p-4 text-center">
              <div className="text-2xl font-extrabold text-ink-900">{s.value}</div>
              <div className="mt-0.5 text-xs text-ink-500">{s.label}</div>
            </div>
          ))}
        </div>

        {user.bio && <p className="mt-5 text-sm leading-relaxed text-ink-600">{user.bio}</p>}
      </div>

      {/* Become host / new listing banner */}
      <Link
        href="/listings/new"
        className="mt-5 flex items-center gap-4 rounded-2xl bg-ink-950 p-5 text-white shadow-card transition hover:bg-ink-900"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
          <Icon name="home" size={24} />
        </span>
        <div className="flex-1">
          <div className="font-bold">{tr("become_host", lang)}</div>
          <div className="text-sm text-white/80">{tr("create_first_listing", lang)}</div>
        </div>
        <Icon name="arrowRight" size={22} />
      </Link>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 text-sm font-semibold text-ink-800 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-700">
              <Icon name={m.icon} size={18} />
            </span>
            {m.label}
          </Link>
        ))}
      </div>

      <button
        onClick={logout}
        className="mt-5 w-full rounded-2xl border border-ink-200 py-3 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
      >
        {tr("logout", lang)}
      </button>
    </div>
  );
}
