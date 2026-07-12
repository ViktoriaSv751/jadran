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

export default function MessagesClient() {
  const { lang } = useLang();
  const { user, ready: authReady } = useAuth();
  const params = useSearchParams();
  const { conversations, ready } = useConversations(user?.id);
  const { items: listings } = useListings();
  const { profiles } = useProfiles();

  const [activeId, setActiveId] = useState<string | null>(params.get("c"));

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
    <div className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="mb-4 text-2xl font-bold text-ink-900">{tr("conversations", lang)}</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <aside className={`${active ? "hidden lg:block" : "block"} space-y-2`}>
          {conversations.map((c) => {
            const listing = listingFor(c.listingId);
            const otherId = c.buyerId === user!.id ? c.sellerId : c.buyerId;
            const other = profileFor(otherId);
            const isActive = c.id === activeId;
            const msgs = db.getMessagesForConversation(c.id);
            const last = msgs[msgs.length - 1];
            const unread = msgs.some((m) => m.senderId !== user!.id && !m.readBy.includes(user!.id));
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  isActive ? "border-brand-300 bg-brand-50" : "border-ink-100 bg-white hover:bg-ink-50"
                }`}
              >
                <Avatar name={other?.name ?? "?"} src={other?.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink-900">{other?.name ?? "—"}</span>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  </div>
                  <div className="truncate text-xs text-ink-400">{listing ? loc(listing.title, lang) : ""}</div>
                  {last && <div className="truncate text-xs text-ink-500">{last.text}</div>}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Chat */}
        <section className={`${active ? "block" : "hidden lg:block"}`}>
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
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-ink-200 p-10 text-ink-400">
              {tr("conversations", lang)}
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

  return (
    <div className="flex h-[72vh] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-100 p-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-ink-50 lg:hidden">
          <Icon name="arrowLeft" size={18} />
        </button>
        <Avatar name={other?.name ?? "?"} src={other?.avatar} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink-900">{other?.name ?? "—"}</div>
          <div className="truncate text-xs text-ink-400">{other?.responseTime}</div>
        </div>
        {listing && (
          <Link
            href={`/listing/${listing.id}`}
            className="flex items-center gap-2 rounded-xl border border-ink-100 p-1.5 pr-3 transition hover:bg-ink-50"
          >
            <Photo src={listing.images[0]} alt={loc(listing.title, lang)} className="h-9 w-9 rounded-lg" />
            <span className="hidden text-xs font-semibold text-ink-700 sm:block">
              {formatPrice(listing.price, lang)}
            </span>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-ink-50/40 p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} text={m.text} mine={m.senderId === meId} createdAt={m.createdAt} lang={lang} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-ink-100 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={tr("message_placeholder", lang)}
          className="flex-1 rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          onClick={send}
          className="rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {tr("send_message", lang)}
        </button>
      </div>
    </div>
  );
}

/**
 * Üzenetbuborék élő fordítással. A BEÉRKEZŐ üzeneteket a felhasználó nyelvére
 * fordítja (ha van fordító-kulcs), és ad egy „eredeti / fordítás" kapcsolót.
 * Ha nincs kulcs vagy a szöveg már a cél nyelven van, egyszerűen az eredetit
 * mutatja — kapcsoló nélkül.
 */
function MessageBubble({
  text,
  mine,
  createdAt,
  lang
}: {
  text: string;
  mine: boolean;
  createdAt: string;
  lang: Lang;
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
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
          mine ? "bg-brand-600 text-white" : "bg-white text-ink-800 shadow-soft"
        }`}
      >
        {body}
        {translated && (
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="mt-1 flex items-center gap-1 text-[10px] font-medium text-ink-400 hover:text-ink-700"
          >
            <Icon name="globe" size={11} />
            {showOriginal ? tr("show_translation", lang) : tr("show_original", lang)}
          </button>
        )}
        <div className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-ink-400"}`}>
          {new Date(createdAt).toLocaleString(lang === "hu" ? "hu-HU" : "en-GB", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
}
