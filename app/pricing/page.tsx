"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/ui";
import PageHeading from "@/components/ui/PageHeading";
import Icon from "@/components/ui/Icon";

const L = (o: { hu: string; me: string; en: string; ru: string }, lang: Lang) =>
  (o as Record<string, string>)[lang] ?? o.en ?? o.hu;

interface Tier {
  id: "start" | "pro" | "premium";
  name: string;
  tagline: { hu: string; me: string; en: string; ru: string };
  monthly: number; // EUR / hó
  yearly: number; // EUR / év (≈ 10 hónap ára)
  popular?: boolean;
  features: { hu: string; me: string; en: string; ru: string }[];
}

const TIERS: Tier[] = [
  {
    id: "start",
    name: "Start",
    tagline: {
      hu: "Kis irodáknak, akik most kezdenek.",
      me: "Za male agencije na početku.",
      en: "For small agencies getting started.",
      ru: "Для небольших агентств."
    },
    monthly: 29,
    yearly: 290,
    features: [
      { hu: "10 aktív hirdetés", me: "10 aktivnih oglasa", en: "10 active listings", ru: "10 активных объявлений" },
      { hu: "1 kiemelés / hó", me: "1 izdvajanje / mj.", en: "1 featured boost / mo", ru: "1 продвижение / мес" },
      { hu: "Alap statisztikák", me: "Osnovna statistika", en: "Basic stats", ru: "Базовая статистика" },
      { hu: "1 felhasználó", me: "1 korisnik", en: "1 team member", ru: "1 пользователь" },
      { hu: "E-mailes támogatás", me: "Email podrška", en: "Email support", ru: "Поддержка по почте" }
    ]
  },
  {
    id: "pro",
    name: "Profi",
    tagline: {
      hu: "Növekvő irodáknak, több hirdetéssel.",
      me: "Za agencije u rastu.",
      en: "For growing agencies.",
      ru: "Для растущих агентств."
    },
    monthly: 79,
    yearly: 790,
    popular: true,
    features: [
      { hu: "50 aktív hirdetés", me: "50 aktivnih oglasa", en: "50 active listings", ru: "50 активных объявлений" },
      { hu: "5 kiemelés / hó", me: "5 izdvajanja / mj.", en: "5 featured boosts / mo", ru: "5 продвижений / мес" },
      { hu: "Részletes statisztikák", me: "Detaljna statistika", en: "Detailed stats", ru: "Подробная статистика" },
      { hu: "Kiemelt iroda-profil", me: "Istaknuti profil agencije", en: "Featured agency profile", ru: "Выделенный профиль" },
      { hu: "3 csapattag", me: "3 člana tima", en: "3 team members", ru: "3 пользователя" },
      { hu: "Prioritásos támogatás", me: "Prioritetna podrška", en: "Priority support", ru: "Приоритетная поддержка" }
    ]
  },
  {
    id: "premium",
    name: "Prémium",
    tagline: {
      hu: "Nagy irodáknak, korlátlan kínálattal.",
      me: "Za velike agencije.",
      en: "For large agencies.",
      ru: "Для крупных агентств."
    },
    monthly: 199,
    yearly: 1990,
    features: [
      { hu: "Korlátlan hirdetés", me: "Neograničeno oglasa", en: "Unlimited listings", ru: "Безлимит объявлений" },
      { hu: "20 kiemelés / hó + főoldal", me: "20 izdvajanja + naslovna", en: "20 boosts + homepage", ru: "20 продвижений + главная" },
      { hu: "Teljes analitika + piactér", me: "Puna analitika + tržište", en: "Full analytics + market", ru: "Полная аналитика" },
      { hu: "Korlátlan csapattag", me: "Neograničeno članova", en: "Unlimited members", ru: "Безлимит пользователей" },
      { hu: "Feed-import (API)", me: "Uvoz feeda (API)", en: "Feed import (API)", ru: "Импорт фида (API)" },
      { hu: "Dedikált menedzser", me: "Posvećeni menadžer", en: "Dedicated manager", ru: "Персональный менеджер" }
    ]
  }
];

const FAQ: { q: { hu: string; me: string; en: string; ru: string }; a: { hu: string; me: string; en: string; ru: string } }[] = [
  {
    q: { hu: "Bármikor válthatok csomagot?", me: "Mogu li promijeniti paket?", en: "Can I switch plans anytime?", ru: "Можно менять тариф?" },
    a: {
      hu: "Igen, bármikor válthatsz feljebb vagy lejjebb; a különbözetet arányosan számoljuk.",
      me: "Da, u svakom trenutku; razliku obračunavamo srazmjerno.",
      en: "Yes, upgrade or downgrade anytime — we prorate the difference.",
      ru: "Да, в любой момент — разницу пересчитываем пропорционально."
    }
  },
  {
    q: { hu: "Mi történik a hirdetéseimmel, ha lejár?", me: "Šta biva sa oglasima po isteku?", en: "What happens to my listings if it lapses?", ru: "Что с объявлениями по истечении?" },
    a: {
      hu: "A hirdetéseid szüneteltetve maradnak 30 napig, így megújításkor egy kattintással visszakapcsolhatók.",
      me: "Oglasi ostaju pauzirani 30 dana i vraćaju se jednim klikom.",
      en: "Your listings are paused for 30 days and restored with one click on renewal.",
      ru: "Объявления ставятся на паузу на 30 дней и возвращаются одним кликом."
    }
  },
  {
    q: { hu: "Magánszemélyként is kell fizetnem?", me: "Plaćaju li fizička lica?", en: "Do private sellers pay?", ru: "Платят ли частные лица?" },
    a: {
      hu: "Nem. Magánszemélyként akár 3 hirdetést ingyen adhatsz fel; előfizetés csak irodáknak kell.",
      me: "Ne. Do 3 oglasa besplatno; pretplata je samo za agencije.",
      en: "No. Up to 3 free listings for private sellers; subscriptions are for agencies only.",
      ru: "Нет. До 3 бесплатных объявлений; подписка только для агентств."
    }
  }
];

export default function PricingPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [yearly, setYearly] = useState(false);

  const isAgency = user?.role === "agency";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeading icon="wallet" className="mb-2">{tr("pricing_title", lang)}</PageHeading>
      <p className="max-w-2xl text-sm text-ink-500 sm:text-base">{tr("pricing_sub", lang)}</p>

      {/* Havi / Éves kapcsoló */}
      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1">
        <button
          onClick={() => setYearly(false)}
          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
            !yearly ? "bg-ink-900 text-white shadow-soft" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {tr("pricing_monthly", lang)}
        </button>
        <button
          onClick={() => setYearly(true)}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
            yearly ? "bg-ink-900 text-white shadow-soft" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {tr("pricing_yearly", lang)}
          <span className="rounded-full bg-[#c8ff00] px-2 py-0.5 text-[10px] font-black text-ink-950">
            {tr("pricing_save_badge", lang)}
          </span>
        </button>
      </div>

      {/* Csomagok */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((t) => {
          const price = yearly ? Math.round(t.yearly / 12) : t.monthly;
          return (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft transition ${
                t.popular ? "border-2 border-ink-950 shadow-card lg:-translate-y-2" : "border-ink-100"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-ink-950">
                  {tr("pricing_popular", lang)}
                </span>
              )}
              <h2 className="text-xl font-black tracking-tight text-ink-900">{t.name}</h2>
              <p className="mt-1 min-h-[2.5rem] text-sm text-ink-500">{L(t.tagline, lang)}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight text-ink-900">{formatPrice(price, lang)}</span>
                <span className="pb-1 text-sm font-semibold text-ink-400">{tr("pricing_per_month", lang)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {yearly
                  ? tr("pricing_billed_yearly", lang).replace("{n}", formatPrice(t.yearly, lang))
                  : " "}
              </p>

              <ul className="mt-5 space-y-2.5">
                {t.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                    <Icon name="check" size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-500" />
                    {L(f, lang)}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />
              <button
                onClick={() => toast(tr("pricing_soon_toast", lang), "info")}
                className={`w-full rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.99] ${
                  t.popular
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:from-brand-600 hover:to-brand-700"
                    : "border border-ink-200 text-ink-800 hover:border-ink-900 hover:bg-ink-50"
                }`}
              >
                {tr("pricing_choose", lang)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Magánszemély-jegyzet */}
      {!isAgency && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50/70 p-4">
          <Icon name="user" size={20} className="mt-0.5 shrink-0 text-brand-500" />
          <div className="text-sm text-ink-700">
            {tr("pricing_private_note", lang)}{" "}
            <Link href="/listings/new" className="font-bold text-brand-600 hover:underline">
              {tr("new_listing", lang)}
            </Link>
          </div>
        </div>
      )}

      {/* GYIK */}
      <div className="mt-10">
        <h2 className="display mb-4 text-2xl text-ink-900">{tr("pricing_faq_title", lang)}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
              <p className="font-bold text-ink-900">{L(item.q, lang)}</p>
              <p className="mt-1 text-sm text-ink-500">{L(item.a, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
