"use client";

import Link from "next/link";
import { useAuth, useLang, useListingsByOwner, useFavorites, useUnreadCount } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber, formatCompact } from "@/lib/format";
import Icon, { type IconName } from "@/components/ui/Icon";
import LogoutButton from "@/components/auth/LogoutButton";
import AvatarUpload from "@/components/profile/AvatarUpload";

export default function ProfileClient() {
  const { lang } = useLang();
  const { user } = useAuth();
  const listings = useListingsByOwner(user?.id);
  const favorites = useFavorites();
  const unread = useUnreadCount(user?.id);
  if (!user) return null;

  // A hirdetés-statisztikát iroda és bármely, már hirdetést feladott magánszemély
  // is látja (mindenki eladhat); a tiszta böngésző a kedvenc/üzenet statokat kapja.
  const isSeller = user.role === "agency" || listings.length > 0;
  const active = listings.filter((l) => l.status === "active").length;
  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);
  const roleLabel =
    user.role === "agency" ? tr("role_agency", lang) : tr("role_private", lang);

  // Szerepkör-tudatos statisztika. A `year: true` a tagsági évhez tartozik —
  // azt nem tagoljuk ezres elválasztóval (2026, nem „2 026").
  const stats: { label: string; value: number; year?: boolean }[] = isSeller
    ? [
        { label: tr("active_listings", lang), value: active },
        { label: tr("views_label", lang), value: totalViews },
        { label: tr("member_since", lang), value: new Date(user.joinedAt).getFullYear(), year: true }
      ]
    : [
        { label: tr("favorites", lang), value: favorites.ids.length },
        { label: tr("messages", lang), value: unread },
        { label: tr("member_since", lang), value: new Date(user.joinedAt).getFullYear(), year: true }
      ];

  // Bárki (magánszemély és iroda is) kereshet ÉS eladhat — a hirdetés-kezelés
  // ezért mindig látszik.
  const menu: { href: string; label: string; icon: IconName; badge?: number }[] = [
    { href: "/listings", label: tr("my_listings", lang), icon: "building" as IconName },
    { href: "/listings/new", label: tr("new_listing", lang), icon: "plus" as IconName },
    { href: "/favorites", label: tr("favorites", lang), icon: "heart", badge: favorites.ids.length },
    { href: "/messages", label: tr("messages", lang), icon: "message", badge: unread },
    { href: "/compare", label: tr("compare", lang), icon: "compare" },
    { href: "/settings", label: tr("settings", lang), icon: "sliders" }
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* Fejléc-kártya borító-gradienssel */}
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <div className="h-24 bg-[linear-gradient(115deg,#070708_0%,#0d0d10_50%,#3a4a00_78%,#c8ff00_100%)] sm:h-28" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-col items-center gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:gap-5">
            <AvatarUpload size={88} />
            <div className="min-w-0 flex-1 text-center sm:pb-1 sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-black tracking-tight text-ink-900">{user.name}</h1>
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
              <StatCard key={s.label} label={s.label} value={s.value} year={s.year} lang={lang} />
            ))}
          </div>
        </div>
      </div>

      {/* Kiemelt akció — bárki feladhat hirdetést (magasabb kártya) */}
      <Link
        href="/listings/new"
        className="mt-5 flex items-center gap-4 rounded-2xl bg-ink-950 p-6 text-white shadow-card transition hover:bg-ink-900"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-ink-800 bg-[#c8ff00] text-ink-950">
          <Icon name="plus" size={26} strokeWidth={2.8} />
        </span>
        <div className="flex-1">
          <div className="text-lg font-bold">{tr("post_first_listing", lang)}</div>
          <div className="text-sm text-white/70">{tr("post_listing_sub", lang)}</div>
        </div>
        <Icon name="arrowRight" size={22} />
      </Link>

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

/**
 * Statisztika-kártya, ahol a szám mérete a hosszához igazodik — így egy
 * több-milliós megtekintés-szám sem lóg ki soha a blokkból.
 */
function StatCard({
  label,
  value,
  year,
  lang
}: {
  label: string;
  value: number;
  year?: boolean;
  lang: Parameters<typeof formatNumber>[1];
}) {
  // Év: tagolás nélkül. Egyébként nagy értéknél rövidített (1,2 M) forma, hogy
  // sose lógjon ki — plusz a betűméret is a hosszhoz igazodik (dupla biztosíték).
  const display = year ? String(value) : formatCompact(value, lang);
  const len = display.length;
  const sizeClass =
    len <= 4 ? "text-2xl" : len <= 6 ? "text-xl" : len <= 8 ? "text-lg" : "text-base";
  return (
    <div className="rounded-2xl bg-ink-50 p-4 text-center">
      <div
        className={`${sizeClass} font-black leading-none tracking-tight text-ink-900 [font-variant-numeric:tabular-nums]`}
      >
        {display}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}
