"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, useLang, useConversations, useMessages, useListings, useProfiles } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { tr, loc } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { translateText } from "@/lib/translate";
import * as db from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";

/* ------------------------------ dátum-segédek ------------------------------ */

const locFor = (lang: Lang) => (lang === "hu" ? "hu-HU" : lang === "ru" ? "ru-RU" : lang === "me" ? "sr-Latn" : "en-GB");

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Nap-chip felirata: Ma / Tegnap / dátum. */
function dayLabel(d: Date, lang: Lang): string {
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return tr("msg_today", lang);
  if (sameDay(d, yest)) return tr("msg_yesterday", lang);
  return d.toLocaleDateString(locFor(lang), { year: "numeric", month: "short", day: "numeric" });
}

const timeLabel = (d: Date, lang: Lang) =>
  d.toLocaleTimeString(locFor(lang), { hour: "2-digit", minute: "2-digit" });

/** Rövid, listához való időbélyeg: ma → óra:perc, héten belül → nap, egyébként dátum. */
function shortStamp(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return timeLabel(d, lang);
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 7) return d.toLocaleDateString(locFor(lang), { weekday: "short" });
  return d.toLocaleDateString(locFor(lang), { month: "short", day: "numeric" });
}

/* ================================ fő komponens ================================ */

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

  // Kereső-szűrés: partner neve vagy hirdetés címe alapján.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !user) return conversations;
    return conversations.filter((c) => {
      const otherId = c.buyerId === user.id ? c.sellerId : c.buyerId;
      const other = profileFor(otherId);
      const listing = listingFor(c.listingId);
      const hay = `${other?.name ?? ""} ${listing ? loc(listing.title, lang) : ""}`.toLowerCase();
      return hay.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, conversations, user, profiles, listings, lang]);

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

  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-4 sm:py-5">
      {/* Kártya-keret, ami a lista + thread két paneljét egyben tartja (mint egy
          asztali üzenetküldő). Mobilon a kártya PONTOSAN a fejléc (≈67px) és a
          fix alsó menü (≈76px) közötti helyet tölti ki (100dvh − 9rem), így a lap
          maga NEM görgethető — csak a listán/threaden belül van görgetés. */}
      <div className="flex h-[calc(100dvh-9rem)] overflow-hidden border-ink-100 bg-white sm:h-[78vh] sm:rounded-3xl sm:border sm:shadow-card">
        {/* ---------------- Beszélgetés-lista ---------------- */}
        <aside
          className={`${active ? "hidden lg:flex" : "flex"} w-full shrink-0 flex-col border-ink-100 lg:w-[360px] lg:border-r`}
        >
          <div className="shrink-0 border-b border-ink-100 px-4 pb-3 pt-4">
            <h1 className="text-xl font-black tracking-tight text-ink-900">{tr("conversations", lang)}</h1>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-ink-50 px-3.5 py-2">
              <Icon name="search" size={16} className="shrink-0 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("search_convos", lang)}
                className="w-full bg-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label={tr("close", lang)} className="text-ink-400 hover:text-ink-700">
                  <Icon name="close" size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-400">{tr("no_convo_results", lang)}</p>
            ) : (
              filtered.map((c) => {
                const listing = listingFor(c.listingId);
                const otherId = c.buyerId === user!.id ? c.sellerId : c.buyerId;
                const other = profileFor(otherId);
                const isActive = c.id === activeId;
                const msgs = db.getMessagesForConversation(c.id);
                const last = msgs[msgs.length - 1];
                const unread = msgs.some((m) => m.senderId !== user!.id && !m.readBy.includes(user!.id));
                const mine = last && last.senderId === user!.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                      isActive ? "bg-ink-50" : "hover:bg-ink-50/70"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={other?.name ?? "?"} src={other?.avatar} size={52} />
                      {unread && (
                        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#c8ff00]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[15px] ${unread ? "font-black text-ink-900" : "font-semibold text-ink-800"}`}>
                          {other?.name ?? "—"}
                        </span>
                        <span className={`shrink-0 text-[11px] ${unread ? "font-bold text-ink-700" : "text-ink-400"}`}>
                          {last ? shortStamp(last.createdAt, lang) : ""}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className={`truncate text-[13px] ${unread ? "font-semibold text-ink-800" : "text-ink-400"}`}>
                          {last ? `${mine ? `${tr("you", lang)}: ` : ""}${last.text}` : listing ? loc(listing.title, lang) : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ---------------- Thread ---------------- */}
        <section className={`${active ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col bg-ink-50/30`}>
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
            <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-ink-400 lg:flex">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-soft">
                <Icon name="message" size={28} className="text-ink-300" />
              </div>
              <p className="text-sm font-medium">{tr("conversations", lang)}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ================================ Thread nézet ================================ */

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    // A textarea magasságát visszaállítjuk egy sorra.
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  // Az utolsó SAJÁT üzenet indexe — csak alá teszünk olvasottság-jelet.
  const lastMineIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].senderId === meId) return i;
    return -1;
  })();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Fejléc — ragadós felül */}
      <div className="flex shrink-0 items-center gap-3 border-b border-ink-100 bg-white/95 px-3 py-2.5 backdrop-blur">
        <button
          onClick={onBack}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 lg:hidden"
          aria-label={tr("close", lang)}
        >
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <Avatar name={other?.name ?? "?"} src={other?.avatar} size={42} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink-900">{other?.name ?? "—"}</div>
          {other?.responseTime && (
            <div className="flex items-center gap-1.5 truncate text-[11px] text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {other.responseTime}
            </div>
          )}
        </div>
        {listing && (
          <Link
            href={`/listing/${listing.id}`}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-ink-100 p-1 pr-3 transition hover:bg-ink-50"
          >
            <Photo src={listing.images[0]} alt={loc(listing.title, lang)} className="h-10 w-10 rounded-xl" />
            <span className="hidden text-xs font-bold text-ink-800 sm:block">{formatPrice(listing.price, lang)}</span>
          </Link>
        )}
      </div>

      {/* Üzenetfolyam */}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">{tr("msg_empty_thread", lang)}</p>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === meId;
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt));
          // Buborék-csoportosítás: az azonos feladótól, közel érkező üzenetek
          // „összetapadnak" (kisebb köz, farok csak a csoport alján).
          const grouped = !!next && next.senderId === m.senderId && !showDayBetween(m, next);
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-[11px] font-semibold text-ink-500">
                    {dayLabel(new Date(m.createdAt), lang)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${grouped ? "mb-0.5" : "mb-1.5"}`}>
                {!mine && (
                  <span className={`w-7 shrink-0 ${grouped ? "opacity-0" : ""}`}>
                    {!grouped && <Avatar name={other?.name ?? "?"} src={other?.avatar} size={28} />}
                  </span>
                )}
                <MessageBubble
                  text={m.text}
                  mine={mine}
                  createdAt={m.createdAt}
                  lang={lang}
                  endGroup={!grouped}
                />
              </div>
              {mine && i === lastMineIdx && (
                <div className="mb-1 mr-1 mt-0.5 text-right text-[10px] font-medium text-ink-400">
                  {other && m.readBy.includes(other.id) ? tr("msg_read", lang) : tr("msg_delivered", lang)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Szerkesztő — ragadós alul, kör alakú neon küldés-gomb */}
      <div className="flex shrink-0 items-end gap-2 border-t border-ink-100 bg-white px-3 py-2.5 sm:px-4">
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={tr("message_placeholder", lang)}
          className="max-h-[120px] flex-1 resize-none rounded-3xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          aria-label={tr("send_message", lang)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink-950 bg-[#c8ff00] text-ink-950 shadow-[0_8px_20px_-8px_rgba(160,200,0,0.8)] transition hover:brightness-95 active:scale-90 disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-300 disabled:shadow-none"
        >
          <PaperPlane />
        </button>
      </div>
    </div>
  );
}

/** Két üzenet közt nap-váltás van-e (a csoportosításhoz). */
function showDayBetween(a: { createdAt: string }, b: { createdAt: string }): boolean {
  return !sameDay(new Date(a.createdAt), new Date(b.createdAt));
}

function PaperPlane() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
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
  endGroup
}: {
  text: string;
  mine: boolean;
  createdAt: string;
  lang: Lang;
  endGroup: boolean;
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

  // A buborék sarkai: a csoport tetején/alján „farok" (kisebb sarok a feladó
  // felőli alsó sarokban), közben lekerekített — mint az Instagram/Messenger.
  const corners = mine
    ? `rounded-3xl ${endGroup ? "rounded-br-md" : "rounded-br-3xl"}`
    : `rounded-3xl ${endGroup ? "rounded-bl-md" : "rounded-bl-3xl"}`;

  return (
    <div
      className={`max-w-[76%] px-3.5 py-2 text-[14px] leading-snug ${corners} ${
        mine ? "bg-ink-950 text-white" : "border border-ink-100 bg-white text-ink-800 shadow-soft"
      }`}
    >
      <span className="whitespace-pre-wrap break-words">{body}</span>
      {translated && (
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${mine ? "text-white/60 hover:text-white" : "text-ink-400 hover:text-ink-700"}`}
        >
          <Icon name="globe" size={11} />
          {showOriginal ? tr("show_translation", lang) : tr("show_original", lang)}
        </button>
      )}
      <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/50" : "text-ink-300"}`}>
        {timeLabel(new Date(createdAt), lang)}
      </div>
    </div>
  );
}
