"use client";

import Link from "next/link";
import Logo from "./Logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang, useAuth, useUnreadCount, useCompare } from "@/lib/store";
import { LANGS, tr } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { openAuth } from "@/lib/ui";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

export default function Header() {
  const { lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const unread = useUnreadCount(user?.id);
  const pathname = usePathname();
  const router = useRouter();

  // Hide the global header on the search page — that page has its own search bar.
  const onSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={34} wordmark={false} />
          <span className="hidden text-xl font-black tracking-tight text-ink-900 sm:block">PROOPIFY</span>
        </Link>

        {/* Center search pill — jumps to the search page */}
        {!onSearch && (
          <button
            onClick={() => router.push("/search")}
            className="group mx-auto hidden items-center gap-3 rounded-full border border-ink-200 bg-white py-2 pl-5 pr-2 text-sm shadow-soft transition hover:shadow-card md:flex"
          >
            <span className="font-semibold text-ink-800">{tr("mode_sale", lang)}</span>
            <span className="h-4 w-px bg-ink-200" />
            <span className="font-semibold text-ink-800">{tr("rent_tab", lang)}</span>
            <span className="h-4 w-px bg-ink-200" />
            <span className="text-ink-400">{tr("where_q", lang)}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white transition group-hover:bg-brand-600">
              <Icon name="search" size={16} strokeWidth={2.2} />
            </span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/market"
            className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 lg:block"
          >
            {tr("market_nav", lang)}
          </Link>
          <Link
            href="/listings/new"
            className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 lg:block"
          >
            {tr("become_host", lang)}
          </Link>

          <LangSwitcher lang={lang} setLang={setLang} />

          <AccountMenu
            user={user}
            unread={unread}
            lang={lang}
            onLogout={() => {
              logout();
            }}
          />
        </div>
      </div>
    </header>
  );
}

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="hidden items-center gap-0.5 rounded-full border border-ink-100 bg-white p-0.5 sm:flex">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          aria-label={l.label}
          className={`rounded-full px-1.5 py-1 text-sm transition ${
            lang === l.code ? "bg-ink-100" : "opacity-60 hover:opacity-100"
          }`}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}

function AccountMenu({
  user,
  unread,
  lang,
  onLogout
}: {
  user: ReturnType<typeof useAuth>["user"];
  unread: number;
  lang: Lang;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const compare = useCompare();
  const compareCount = compare.ready ? compare.ids.length : 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pl-3 pr-1.5 shadow-soft transition hover:shadow-card"
      >
        <Icon name="menu" size={18} className="text-ink-600" />
        {user ? (
          <Avatar name={user.name} src={user.avatar} size={28} />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-900 text-white">
            <Icon name="user" size={16} />
          </span>
        )}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white py-2 shadow-pop animate-pop-in"
          onClick={() => setOpen(false)}
        >
          {user ? (
            <>
              <div className="px-4 py-2">
                <div className="truncate text-sm font-bold text-ink-900">{user.name}</div>
                <div className="truncate text-xs text-ink-400">{user.email}</div>
              </div>
              <div className="my-1 h-px bg-ink-100" />
              <MenuLink href="/messages" label={tr("messages", lang)} badge={unread} />
              <MenuLink href="/favorites" label={tr("favorites", lang)} />
              <MenuLink href="/listings" label={tr("my_listings", lang)} />
              <MenuLink href="/listings/new" label={tr("new_listing", lang)} />
              <MenuLink href="/compare" label={tr("compare", lang)} badge={compareCount} />
              <div className="my-1 h-px bg-ink-100" />
              <MenuLink href="/profile" label={tr("profile", lang)} />
              <MenuLink href="/settings" label={tr("settings", lang)} />
              <button
                onClick={onLogout}
                className="block w-full px-4 py-2 text-left text-sm text-ink-600 transition hover:bg-ink-50"
              >
                {tr("logout", lang)}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuth("register")}
                className="block w-full px-4 py-2 text-left text-sm font-semibold text-ink-900 transition hover:bg-ink-50"
              >
                {tr("register", lang)}
              </button>
              <button
                onClick={() => openAuth("login")}
                className="block w-full px-4 py-2 text-left text-sm text-ink-600 transition hover:bg-ink-50"
              >
                {tr("login", lang)}
              </button>
              <div className="my-1 h-px bg-ink-100" />
              <MenuLink href="/search" label={tr("search", lang)} />
              <MenuLink href="/compare" label={tr("compare", lang)} badge={compareCount} />
              <MenuLink href="/guide" label={tr("guide", lang)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label, badge }: { href: string; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-2 text-sm text-ink-600 transition hover:bg-ink-50"
    >
      {label}
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
