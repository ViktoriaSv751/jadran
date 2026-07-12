"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, useLang, useConversations, useMessages, useListings, useProfiles } from "@/lib/store";
import type { Lang, Message } from "@/lib/types";
import { tr, loc } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { translateText } from "@/lib/translate";
import * as db from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";
import PageHeading from "@/components/ui/PageHeading";

export default function MessagesClient() {
  const { lang } = useLang();
  const { user, ready: authReady } = useAuth();
  const params = useSearchParams();
  const { conversations, ready } = useConversations(user?.id);
  const { items: listings } = useListings();
  const { profiles } = useProfiles();

  const [activeId, setActiveId] = useState<string | null>(params.get("c"));
  const [query, setQuery] = useState("");

  // Asztali nézeten az első beszélgetés nyíljon meg alapból; mobilon a
  // beszélgetés-LISTÁVAL indulunk (a felhasználó választ, majd megnyílik).
  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop && !activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  // Frissen tartjuk a beszélgetéseket/üzeneteket: betöltéskor + 8 mp-enként,
  // valamint amikor a lap visszakerül fókuszba (session közbeni új üzenetek).
  useEffect(() => {
    if (!user) return;
    void db.refreshConversations();
    const iv = setInterval(() => void db.refreshConversations(), 8000);
    const onFocus = () => void db.refreshConversations();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const listingFor = (id: string) => listings.find((l) => l.id === id);
  const profileFor = (id: string) => profiles.find((p) => p.id === id);

  const filtered = useMemo(() => {
    if (!user) return conversations;
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const otherId = c.buyerId === user.id ? c.sellerId : c.buyerId;
      const other = profileFor(otherId);
      const listing = listingFor(c.listingId);
      return (
        (other?.name ?? "").toLowerCase().includes(q) ||
        (listing ? loc(listing.title, lang) : "").toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, query, user, profiles, listings, lang]);

  if (!authReady || !ready) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-ink-400">{tr("loading", lang)}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
          <Icon name="message" size={28} />
        </div>
        <p className="text-base font-semibold text-ink-800">{tr("no_conversations", lang)}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">{tr("no_conversations_hint", lang)}</p>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
        >
          {tr("search", lang)} <Icon name="arrowRight" size={16} />
        </Link>
      </div>
    );
  }

  // Kitűzött beszélgetések MINDIG felül.
  const pinnedSet = new Set(user ? db.getPinnedConversations() : []);
  const sorted = [...filtered].sort(
    (a, b) => (pinnedSet.has(b.id) ? 1 : 0) - (pinnedSet.has(a.id) ? 1 : 0)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      {/* Cím ikonnal — ugyanúgy, mint a Mentett oldalon a „Kedvencek". */}
      <PageHeading icon="message" className="mb-4">{tr("conversations", lang)}</PageHeading>
      <div className="grid h-[calc(100vh-11rem)] overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card sm:h-[72vh] lg:grid-cols-[340px_1fr]">
        {/* Lista */}
        <aside className={`${active ? "hidden lg:flex" : "flex"} min-w-0 min-h-0 flex-col border-ink-100 lg:border-r`}>
          <div className="border-b border-ink-100 p-3">
            <div className="flex items-center gap-2 rounded-full bg-ink-100/70 px-3.5 py-2">
              <Icon name="search" size={16} className="shrink-0 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("chat_search", lang)}
                className="w-full min-w-0 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {sorted.map((c) => {
              const listing = listingFor(c.listingId);
              const otherId = c.buyerId === user!.id ? c.sellerId : c.buyerId;
              const other = profileFor(otherId);
              const isActive = c.id === activeId;
              const msgs = db.getMessagesForConversation(c.id);
              const last = msgs[msgs.length - 1];
              const unread = db.conversationHasUnread(c.id, user!.id);
              const pinned = pinnedSet.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 pr-9 text-left transition ${
                    isActive ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-ink-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={other?.name ?? "?"} src={other?.avatar} size={48} />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex min-w-0 items-center gap-1 truncate text-sm ${unread ? "font-bold text-ink-900" : "font-semibold text-ink-800"}`}>
                        {pinned && <Icon name="star" size={12} strokeWidth={2.4} className="shrink-0 text-amber-400" />}
                        <span className="truncate">{other?.name ?? "—"}</span>
                      </span>
                      {last && <span className="shrink-0 text-[11px] text-ink-400">{shortTime(last.createdAt, lang)}</span>}
                    </div>
                    <div className="truncate text-xs text-ink-400">{listing ? loc(listing.title, lang) : ""}</div>
                    {last && (
                      <div className={`truncate text-xs ${unread ? "font-semibold text-ink-700" : "text-ink-500"}`}>
                        {last.senderId === user!.id ? "· " : ""}
                        {last.text}
                      </div>
                    )}
                  </div>
                  {/* Kitűzés — a kitűzött beszélgetés a lista tetejére kerül. */}
                  <button
                    type="button"
                    aria-label={tr("pin_conversation", lang)}
                    title={tr("pin_conversation", lang)}
                    onClick={(e) => {
                      e.stopPropagation();
                      db.togglePinnedConversation(c.id);
                    }}
                    className={`absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full transition ${
                      pinned
                        ? "text-amber-400"
                        : "text-ink-300 opacity-60 hover:text-ink-600 sm:opacity-0 sm:group-hover:opacity-100"
                    }`}
                  >
                    <Icon name="star" size={16} strokeWidth={2.2} />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat — TELEFONON teljes képernyős réteg (fedi a fejlécet és az alsó
            menüsort is), így a lap nem görgethető és az „Írj üzenetet" mező
            görgetés nélkül látszik. ASZTALON a rácsban marad. */}
        <section
          className={`${
            active ? "fixed inset-0 z-[60] flex bg-white lg:static lg:z-auto" : "hidden lg:flex"
          } min-w-0 min-h-0 flex-col`}
        >
          {active ? (
            <ChatView
              key={active.id}
              conversationId={active.id}
              meId={user!.id}
              listing={listingFor(active.listingId)}
              other={profileFor(active.buyerId === user!.id ? active.sellerId : active.buyerId)}
              onBack={() => setActiveId(null)}
              lang={lang}
            />
          ) : (
            <div className="grid h-full place-items-center p-10 text-center text-ink-300">
              <div>
                <Icon name="message" size={40} className="mx-auto" />
                <p className="mt-3 text-sm font-medium text-ink-400">{tr("conversations", lang)}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatView({
  conversationId,
  meId,
  listing,
  other,
  onBack,
  lang
}: {
  conversationId: string;
  meId: string;
  listing: ReturnType<typeof useListings>["items"][number] | undefined;
  other: ReturnType<typeof useProfiles>["profiles"][number] | undefined;
  onBack: () => void;
  lang: Lang;
}) {
  const messages = useMessages(conversationId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.markConversationRead(conversationId, meId);
  }, [conversationId, meId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    db.sendMessage(conversationId, meId, t);
    setText("");
  };

  const lastMine = [...messages].reverse().find((m) => m.senderId === meId);

  return (
    <div className="flex h-full min-h-0 flex-col bg-ink-50/50">
      {/* Fejléc */}
      <div className="flex items-center gap-3 border-b border-ink-100 bg-white/90 p-3 backdrop-blur">
        <button
          onClick={onBack}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-700 hover:bg-ink-100 lg:hidden"
        >
          <Icon name="arrowLeft" size={18} />
        </button>
        <div className="relative shrink-0">
          <Avatar name={other?.name ?? "?"} src={other?.avatar} size={42} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        {other ? (
          <Link href={`/u/${other.id}`} className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink-900">{other.name}</div>
            <div className="truncate text-xs text-ink-400">{other.responseTime}</div>
          </Link>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-ink-900">—</div>
          </div>
        )}
        {listing && (
          <Link
            href={`/listing/${listing.id}`}
            className="flex items-center gap-2 rounded-2xl border border-ink-100 p-1.5 pr-3 transition hover:bg-ink-50"
          >
            <Photo src={listing.images[0]} alt={loc(listing.title, lang)} className="h-10 w-10 rounded-xl" />
            <span className="hidden text-right sm:block">
              <span className="block max-w-[9rem] truncate text-[11px] font-medium text-ink-500">
                {loc(listing.title, lang)}
              </span>
              <span className="block text-xs font-bold text-ink-900">{formatPrice(listing.price, lang)}</span>
            </span>
          </Link>
        )}
      </div>

      {/* Üzenetek */}
      <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-sm text-ink-400">{tr("chat_empty_thread", lang)}</div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
          const mine = m.senderId === meId;
          // Csoportosítás: az azonos feladótól, rövid időn belül érkező üzenetek
          // szorosabban tapadnak (csak az utolsón látszik az idő).
          const next = messages[i + 1];
          const grouped = next && next.senderId === m.senderId && !showDayBetween(m, next);
          const isLastMine = mine && lastMine?.id === m.id;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-ink-500 shadow-soft">
                    {dayLabel(m.createdAt, lang)}
                  </span>
                </div>
              )}
              <MessageBubble
                text={m.text}
                mine={mine}
                createdAt={m.createdAt}
                lang={lang}
                grouped={!!grouped}
                seen={isLastMine ? seenByOther(m, meId) : false}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Szövegdoboz */}
      <div
        className="flex items-center gap-2 border-t border-ink-100 bg-white p-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={tr("message_placeholder", lang)}
          className="min-w-0 flex-1 rounded-full border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          aria-label={tr("send_message", lang)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-glow transition hover:bg-brand-600 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Icon name="arrowUpRight" size={20} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/**
 * Üzenetbuborék élő fordítással. A BEÉRKEZŐ üzeneteket a felhasználó nyelvére
 * fordítja (ha van fordító-kulcs), és ad egy „eredeti / fordítás" kapcsolót.
 */
function MessageBubble({
  text,
  mine,
  createdAt,
  lang,
  grouped,
  seen
}: {
  text: string;
  mine: boolean;
  createdAt: string;
  lang: Lang;
  grouped: boolean;
  seen: boolean;
}) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let alive = true;
    if (mine) return;
    void translateText(text, lang).then((res) => {
      if (alive && res && res.trim() !== text.trim()) setTranslated(res);
    });
    return () => {
      alive = false;
    };
  }, [text, lang, mine]);

  const body = translated && !showOriginal ? translated : text;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mb-0.5" : "mb-1.5"}`}>
      <div
        className={`max-w-[82%] px-3.5 py-2 text-[14px] leading-relaxed shadow-sm sm:max-w-[70%] ${
          mine
            ? `bg-brand-600 text-white ${grouped ? "rounded-2xl" : "rounded-2xl rounded-br-md"}`
            : `bg-white text-ink-800 ${grouped ? "rounded-2xl" : "rounded-2xl rounded-bl-md"}`
        }`}
      >
        <span className="whitespace-pre-wrap break-words">{body}</span>
        {translated && (
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${
              mine ? "text-white/70 hover:text-white" : "text-ink-400 hover:text-ink-700"
            }`}
          >
            <Icon name="globe" size={11} />
            {showOriginal ? tr("show_translation", lang) : tr("show_original", lang)}
          </button>
        )}
        {!grouped && (
          <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${mine ? "justify-end text-white/70" : "text-ink-400"}`}>
            {shortTime(createdAt, lang)}
            {mine && seen && (
              <span className="inline-flex items-center gap-0.5">
                · <Icon name="check" size={10} strokeWidth={2.8} /> {tr("chat_seen", lang)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */

function locale(lang: Lang): string {
  return lang === "hu" ? "hu-HU" : lang === "ru" ? "ru-RU" : "en-GB";
}

function shortTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit" });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function showDayBetween(a: Message, b: Message): boolean {
  return dayKey(a.createdAt) !== dayKey(b.createdAt);
}

function dayLabel(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return tr("chat_today", lang);
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return tr("chat_yesterday", lang);
  return d.toLocaleDateString(locale(lang), { month: "short", day: "numeric", year: "numeric" });
}

function seenByOther(m: Message, meId: string): boolean {
  return m.readBy.some((id) => id !== meId);
}
