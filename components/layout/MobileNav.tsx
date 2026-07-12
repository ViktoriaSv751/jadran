"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang, useFavorites, useAuth, useUnreadCount } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { openAuth } from "@/lib/ui";
import Icon, { type IconName } from "@/components/ui/Icon";

type Item = {
  href: string;
  label: string;
  icon: IconName;
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
    { href: "/search", label: tr("search", lang), icon: "search" },
    {
      href: "/favorites",
      label: tr("favorites", lang),
      icon: "heart",
      badge: user && favorites.ready ? favorites.ids.length : 0,
      requiresAuth: true
    }
  ];
  const right: Item[] = [
    { href: "/messages", label: tr("messages", lang), icon: "message", badge: unread, requiresAuth: true },
    { href: "/profile", label: tr("profile", lang), icon: "user", requiresAuth: true }
  ];

  const Tab = ({ it }: { it: Item }) => {
    const active = pathname === it.href;
    const guard = it.requiresAuth && !user;
    const cls = "group relative flex flex-1 flex-col items-center justify-center gap-1 py-2";
    const inner = (
      <>
        <span className="relative">
          {/* Fekete körvonalas korong — aktívan feketén kitöltve */}
          <span
            className={`grid h-10 w-10 place-items-center rounded-full border-2 border-ink-900 transition-colors ${
              active ? "bg-ink-900 text-white" : "bg-white text-ink-900 group-hover:bg-ink-50"
            }`}
          >
            <Icon name={it.icon} size={19} strokeWidth={2} />
          </span>
          {it.badge ? (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
              {it.badge > 9 ? "9+" : it.badge}
            </span>
          ) : null}
        </span>
        <span
          className={`text-[10px] font-semibold transition-colors ${
            active ? "text-ink-900" : "text-ink-400"
          }`}
        >
          {it.label}
        </span>
      </>
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

  // Az ingatlan-adatlapon ÉS a hirdetésfeltöltő varázslóban nincs alsó menüsor
  // (tiszta, fókuszált nézet) — így a varázsló saját „Tovább/Mégse" sávja mindig
  // látható marad, nem takarja el a menü.
  if (/^\/listing\//.test(pathname) || pathname === "/listings/new") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        <Tab it={left[0]} />
        <Tab it={left[1]} />

        {/* Kiemelt középső akció — új hirdetés, fehér gyűrűvel */}
        <div className="flex w-16 shrink-0 items-center justify-center">
          <button
            onClick={addListing}
            aria-label={tr("new_listing", lang)}
            className="-mt-5 grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink-950 bg-[#c8ff00] text-ink-950 shadow-[0_8px_20px_-6px_rgba(160,200,0,0.7)] ring-4 ring-white transition-transform active:scale-95"
          >
            <Icon name="plus" size={26} strokeWidth={2.8} />
          </button>
        </div>

        <Tab it={right[0]} />
        <Tab it={right[1]} />
      </div>
    </nav>
  );
}
