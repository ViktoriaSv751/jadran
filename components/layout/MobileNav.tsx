"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang, useFavorites, useAuth, useUnreadCount } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { openAuth } from "@/lib/ui";
import Icon from "@/components/ui/Icon";

type Item = {
  href: string;
  label: string;
  img: string; // 3D sticker icon in public/nav
  badge?: number;
  requiresAuth?: boolean;
};

export default function MobileNav() {
  const { lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const favorites = useFavorites();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);

  const left: Item[] = [
    { href: "/search", label: tr("search", lang), img: "/nav/search.png" },
    {
      href: "/favorites",
      label: tr("favorites", lang),
      img: "/nav/heart.png",
      badge: favorites.ready ? favorites.ids.length : 0
    }
  ];
  const right: Item[] = [
    { href: "/messages", label: tr("messages", lang), img: "/nav/mail.png", badge: unread, requiresAuth: true },
    { href: "/profile", label: tr("profile", lang), img: "/nav/user.png", requiresAuth: true }
  ];

  const Tab = ({ it }: { it: Item }) => {
    const active = pathname === it.href;
    const guard = it.requiresAuth && !user;
    const cls = "group relative flex flex-1 flex-col items-center justify-center py-2";
    const inner = (
      <span
        className={`relative grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300 ${
          active
            ? "scale-105 bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_8px_22px_-6px_rgba(225,29,72,0.75)] ring-1 ring-white/30"
            : "bg-white/0 group-hover:bg-white/10"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={it.img}
          alt={it.label}
          className={`h-8 w-8 object-contain transition-all duration-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${
            active ? "scale-110" : "group-hover:scale-105"
          }`}
        />
        {it.badge ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-black text-white ring-2 ring-ink-950">
            {it.badge > 9 ? "9+" : it.badge}
          </span>
        ) : null}
      </span>
    );
    return guard ? (
      <button onClick={() => openAuth("login")} aria-label={it.label} className={cls}>
        {inner}
      </button>
    ) : (
      <Link href={it.href} aria-label={it.label} className={cls}>
        {inner}
      </Link>
    );
  };

  const addListing = () => {
    if (!user) return openAuth("login", () => router.push("/listings/new"));
    router.push("/listings/new");
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] lg:hidden">
      <div className="relative mx-auto max-w-md overflow-visible rounded-[1.85rem] bg-gradient-to-b from-ink-900 to-ink-950 shadow-[0_18px_44px_-12px_rgba(7,7,8,0.65)] ring-1 ring-white/10 backdrop-blur-xl">
        {/* Ambient brand glow inside the bar */}
        <span className="pointer-events-none absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-brand-500/25 blur-2xl" />
        <span className="pointer-events-none absolute -right-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-brand-400/20 blur-2xl" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative flex items-stretch justify-around px-2">
          <Tab it={left[0]} />
          <Tab it={left[1]} />

          {/* Raised center action — create a new listing */}
          <div className="flex w-16 shrink-0 items-start justify-center">
            <button
              onClick={addListing}
              aria-label={tr("new_listing", lang)}
              className="group relative -mt-7 grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-white shadow-[0_12px_30px_-6px_rgba(225,29,72,0.85)] ring-4 ring-ink-950 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <span className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-gradient-to-b from-white/35 to-transparent opacity-70" />
              <Icon name="plus" size={30} strokeWidth={2.6} className="relative drop-shadow" />
            </button>
          </div>

          <Tab it={right[0]} />
          <Tab it={right[1]} />
        </div>
      </div>
    </nav>
  );
}
