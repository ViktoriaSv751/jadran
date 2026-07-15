"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Listing } from "@/lib/types";
import { useLang, useFavorites, useListings, useAuth, useProfile } from "@/lib/store";
import { openAuth, toast } from "@/lib/ui";
import { tr, typeLabels, conditionLabels, viewLabels, modeLabels, heatingLabels, loc } from "@/lib/i18n";
import { formatPrice, formatNumber, pricePerM2, distanceLabel } from "@/lib/format";
import { cityTrend, cityAvgPricePerM2, similarListings } from "@/lib/data";
import VerificationBadge from "./VerificationBadge";
import Icon, { type IconName } from "./ui/Icon";
import Gallery from "./Gallery";
import ListingCard from "./ListingCard";
import Chart from "./Chart";
import Amenities from "./listing/Amenities";
import SellerCard from "./listing/SellerCard";
import InquiryButton from "./listing/InquiryButton";
import MortgageCalculator from "./MortgageCalculator";
import ForeignBuyerInfo from "./ForeignBuyerInfo";
import InvestorCard from "./listing/InvestorCard";
import CurrencyHint from "./listing/CurrencyHint";
import ReportButton from "./listing/ReportButton";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="shimmer h-full w-full" />
});

export default function ListingDetail({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const { items } = useListings();
  const favorites = useFavorites();
  const router = useRouter();
  const { user } = useAuth();
  const seller = useProfile(listing.ownerId);
  const isFav = favorites.has(listing.id);
  // Mentéshez be kell jelentkezni — kilépve a belépő-ablakot nyitjuk.
  const toggleFav = () => (user ? favorites.toggle(listing.id) : openAuth("login"));
  const isRent = listing.mode === "rent";

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: loc(listing.title, lang), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(tr("link_copied", lang));
      }
    } catch {
      /* user dismissed share sheet — ignore */
    }
  };

  const similar = useMemo(() => similarListings(listing, items), [listing, items]);
  const cityAvg = useMemo(() => cityAvgPricePerM2(listing.city, items), [listing.city, items]);
  const trend = useMemo(() => cityTrend(listing.city, items), [listing.city, items]);

  const [descOpen, setDescOpen] = useState(false);

  const ppm2 = pricePerM2(listing.price, listing.area);
  const diff = cityAvg ? Math.round(((ppm2 - cityAvg) / cityAvg) * 100) : 0;
  const goodDeal = diff <= 0;

  const transferTax = Math.round(listing.price * 0.03);
  const notary = Math.round(listing.price * 0.005) + 200;
  const lawyer = Math.round(listing.price * 0.01);
  const total = listing.price + transferTax + notary + lawyer;

  type Fact = [IconName, string, string];
  const f = (cond: boolean, fact: Fact): Fact[] => (cond ? [fact] : []);

  // Facts shown depend on the listing mode — a property *for sale* surfaces
  // condition / heating / plot, while a *rental* surfaces deposit / term /
  // move-in / pets. We never mix vacation-style fields in.
  const facts: Fact[] = [
    ["area", tr("area", lang), `${formatNumber(listing.area, lang)} m²`],
    ...f(listing.rooms > 0, ["bed", tr("rooms", lang), String(listing.rooms)]),
    ...f(listing.floor !== null, ["building", tr("floor", lang), String(listing.floor)]),
    ...f(listing.year > 0, ["calendar", tr("year_built", lang), String(listing.year)]),
    ["eye", tr("view", lang), (viewLabels[listing.view][lang] ?? "")],
    ["bolt", tr("energy", lang), listing.energy],
    ["waves", tr("to_sea", lang), distanceLabel(listing.distanceToSea)],
    ...(isRent
      ? [
          ["sofa", tr("furnished", lang), listing.furnished ? tr("yes", lang) : tr("no", lang)] as Fact,
          ...f(listing.deposit != null, ["euro", tr("deposit_label", lang), formatPrice(listing.deposit ?? 0, lang)]),
          ...f(listing.minTermMonths != null, [
            "calendar",
            tr("min_term_label", lang),
            `${listing.minTermMonths} ${tr("months_short", lang)}`
          ]),
          ...f(!!listing.availableFrom, ["key", tr("available_from_label", lang), listing.availableFrom ?? ""]),
          ["bolt", tr("utilities_included", lang), listing.utilitiesIncluded ? tr("yes", lang) : tr("no", lang)] as Fact,
          ["paw", tr("pets_allowed", lang), listing.petsAllowed ? tr("yes", lang) : tr("no", lang)] as Fact
        ]
      : [
          ["star", tr("condition", lang), (conditionLabels[listing.condition][lang] ?? "")] as Fact,
          ...f(!!listing.heatingType, [
            "flame",
            tr("heating_label", lang),
            heatingLabels[listing.heatingType ?? "gas"]?.[lang] ?? ""
          ]),
          ...f(listing.plotArea != null, [
            "tree",
            tr("plot_area_label", lang),
            `${formatNumber(listing.plotArea ?? 0, lang)} m²`
          ]),
          ...f(listing.monthlyCommonCost != null, [
            "building",
            tr("common_cost_label", lang),
            `${formatPrice(listing.monthlyCommonCost ?? 0, lang)}${tr("per_month_short", lang)}`
          ])
        ])
  ];

  // Scannable highlight pills — the few things a buyer checks first.
  type Highlight = [IconName, string];
  const highlights: Highlight[] = [
    ["area", `${formatNumber(listing.area, lang)} m²`],
    ...(listing.rooms > 0 ? ([["bed", `${listing.rooms} ${tr("rooms", lang).toLowerCase()}`]] as Highlight[]) : []),
    ["eye", (viewLabels[listing.view][lang] ?? "")],
    ["bolt", `${tr("energy", lang)} ${listing.energy}`],
    ...(listing.verification !== "none" ? ([["shield", tr("chip_verified", lang)]] as Highlight[]) : []),
    ...(!isRent && goodDeal && cityAvg > 0 ? ([["trendUp", tr("good_deal", lang)]] as Highlight[]) : [])
  ];

  const histData = listing.priceHistory.map((p) => ({ label: p.date.slice(5), value: p.price }));
  const desc = loc(listing.description, lang);
  const longDesc = desc.length > 260;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-0 sm:pt-5 lg:pb-5">
      <Link
        href="/search"
        className="hidden items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900 sm:inline-flex"
      >
        <Icon name="arrowLeft" size={16} /> {tr("back_to_search", lang)}
      </Link>

      <div className="mt-0 grid grid-cols-1 gap-6 sm:mt-3 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="relative">
            {/* Floating circular controls over the full-bleed mobile hero (Airbnb DNA) */}
            <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex items-center justify-between px-1 sm:hidden">
              <button
                onClick={() => router.back()}
                aria-label={tr("back", lang)}
                className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink-800 shadow-float backdrop-blur transition active:scale-90"
              >
                <Icon name="arrowLeft" size={18} strokeWidth={2} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={share}
                  aria-label={tr("share", lang)}
                  className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink-800 shadow-float backdrop-blur transition active:scale-90"
                >
                  <Icon name="share" size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={toggleFav}
                  aria-label="favorite"
                  className={`pointer-events-auto grid h-9 w-9 place-items-center rounded-full shadow-float backdrop-blur transition active:scale-90 ${
                    isFav ? "bg-brand-500 text-white" : "bg-white/95 text-ink-700"
                  }`}
                >
                  <Icon name={isFav ? "heartFilled" : "heart"} size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
            <Gallery images={listing.images} alt={loc(listing.title, lang)} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isRent ? "bg-brand-600 text-white" : "bg-ink-900 text-white"
              }`}
            >
              {modeLabels[listing.mode][lang]}
            </span>
            <span className="rounded-lg bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
              {typeLabels[listing.type][lang]}
            </span>
            <VerificationBadge level={listing.verification} lang={lang} withText />
            {seller && (
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  seller.role === "agency" ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-700"
                }`}
              >
                <Icon name={seller.role === "agency" ? "building" : "user"} size={12} strokeWidth={2.4} />
                {seller.role === "agency" ? tr("role_agency", lang) : tr("role_private", lang)}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {loc(listing.title, lang)}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-ink-500">
            <Icon name="mapPin" size={16} className="text-brand-500" />
            <span className="font-medium text-ink-700">{listing.city}</span> · {listing.district}
            <span className="text-ink-300">·</span>
            <span>{distanceLabel(listing.distanceToSea)} {tr("to_sea", lang).toLowerCase()}</span>
          </p>

          {/* Meta: reference, listed date, views */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
            <span className="font-medium">{tr("ref_label", lang)}: #{listing.id.slice(-6).toUpperCase()}</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={13} />
              {tr("listed_on", lang)}: {new Date(listing.createdAt).toLocaleDateString(lang === "hu" ? "hu-HU" : "en-GB", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="eye" size={13} />
              {formatNumber(listing.views, lang)} {tr("views_label", lang)}
            </span>
          </div>

          {/* Highlights — scannable accent pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {highlights.map(([icon, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
              >
                <Icon name={icon} size={14} />
                {label}
              </span>
            ))}
          </div>

          {/* Facts — bold tiles with brand-tinted icon chips */}
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink-900">
              <span className="h-5 w-1 rounded-full bg-brand-500" />
              {tr("overview", lang)}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map(([icon, k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-soft transition hover:border-brand-200 hover:shadow-card"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={icon} size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-400">{k}</div>
                    <div className="truncate font-bold text-ink-900">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="mt-7">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink-900">
              <span className="h-5 w-1 rounded-full bg-brand-500" />
              {tr("description", lang)}
            </h2>
            <p className={`mt-2 leading-relaxed text-ink-600 ${longDesc && !descOpen ? "line-clamp-3" : ""}`}>
              {desc}
            </p>
            {longDesc && (
              <button
                onClick={() => setDescOpen((v) => !v)}
                className="mt-2 text-sm font-semibold text-ink-900 underline"
              >
                {descOpen ? tr("show_less", lang) : tr("show_more", lang)}
              </button>
            )}
          </section>

          {/* Amenities */}
          <Amenities amenities={listing.amenities} />

          {/* Seller */}
          <SellerCard listing={listing} />

          {/* Bejelentés (moderáció) — diszkréten a hirdető-kártya alatt. */}
          <div className="mt-3 flex justify-end">
            <ReportButton listingId={listing.id} />
          </div>

          {/* Price history */}
          <section className="mt-7 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <span className="h-5 w-1 rounded-full bg-brand-500" />
              {tr("price_history", lang)}
            </h2>
            <div className="mt-4">
              {histData.length > 1 ? (
                <Chart data={histData} format={(v) => formatPrice(v, lang)} height={160} />
              ) : (
                <p className="text-sm text-ink-400">{formatPrice(listing.price, lang)}</p>
              )}
            </div>
          </section>

          {/* Market trend (sale only) */}
          {!isRent && (
            <section className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                <span className="h-5 w-1 rounded-full bg-brand-500" />
                {tr("market_trend", lang)}
              </h2>
              <p className="text-sm text-ink-400">
                {tr("market_trend_sub", lang)} · {listing.city}
              </p>
              <div className="mt-4">
                <Chart data={trend} format={(v) => `${formatNumber(v, lang)} €`} height={170} />
              </div>
            </section>
          )}

          {/* Location */}
          <section className="mt-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <span className="h-5 w-1 rounded-full bg-brand-500" />
              {tr("location", lang)}
            </h2>
            <div className="mt-3 h-72 overflow-hidden rounded-2xl border border-ink-100">
              <MapView listings={[listing]} lang={lang} activeId={listing.id} />
            </div>
          </section>

          {/* Külföldi vásárló infó (eladó módban) */}
          {!isRent && <ForeignBuyerInfo />}

          {/* Similar */}
          {similar.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                <span className="h-5 w-1 rounded-full bg-brand-500" />
                {tr("similar", lang)}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl font-black tracking-tight text-ink-900">
                    {formatPrice(listing.price, lang)}
                    {isRent && <span className="text-base font-semibold text-ink-400">{tr("per_month", lang)}</span>}
                  </div>
                  {!isRent && (
                    <div className="mt-0.5 text-sm text-ink-500">
                      {formatNumber(ppm2, lang)} €{tr("per_m2", lang)}
                    </div>
                  )}
                  <CurrencyHint amount={listing.price} />
                </div>
                <button
                  onClick={toggleFav}
                  className={`grid h-11 w-11 place-items-center rounded-full transition active:scale-90 ${
                    isFav ? "bg-brand-500 text-white" : "border border-ink-200 text-ink-500 hover:text-brand-500"
                  }`}
                  aria-label="favorite"
                >
                  <Icon name={isFav ? "heartFilled" : "heart"} size={20} strokeWidth={2} />
                </button>
              </div>

              {!isRent && cityAvg > 0 && (
                <div
                  className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
                    goodDeal ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}% {tr("vs_avg", lang)} · {goodDeal ? tr("good_deal", lang) : tr("above_avg", lang)}
                </div>
              )}

              <div className="mt-4">
                <InquiryButton listing={listing} />
              </div>
            </div>

            {/* Cost calculator (sale only) */}
            {!isRent && (
              <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
                <h3 className="font-bold text-ink-900">{tr("costs_title", lang)}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label={tr("price", lang)} value={formatPrice(listing.price, lang)} />
                  <Row label={tr("transfer_tax", lang)} value={formatPrice(transferTax, lang)} />
                  <Row label={tr("notary", lang)} value={formatPrice(notary, lang)} />
                  <Row label={tr("lawyer", lang)} value={formatPrice(lawyer, lang)} />
                  <div className="mt-1 border-t border-ink-100 pt-2">
                    <Row label={tr("total_est", lang)} value={formatPrice(total, lang)} bold />
                  </div>
                </dl>
              </div>
            )}

            {/* Befektetői nézet: hozam + Deal Score (eladó módban) */}
            {!isRent && <InvestorCard listing={listing} />}

            {/* Interaktív hitelkalkulátor (eladó módban) */}
            {!isRent && <MortgageCalculator price={listing.price} />}
          </div>
        </aside>
      </div>

      {/* Mobile sticky price + CTA bar (sits over the bottom nav, Airbnb-style).
          Az ár NAGY és látványos; a „Kapcsolat" gomb kisebb (nowrap), hogy a kettő
          mindig kényelmesen kiférjen egymás mellett. A sáv magassága nem csökken. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink-100 bg-white px-4 py-3.5 pb-safe shadow-[0_-6px_24px_-12px_rgba(16,26,38,0.35)] lg:hidden">
        <div className="min-w-0 flex-1">
          <div className="truncate text-2xl font-black tracking-tight text-ink-900">
            {formatPrice(listing.price, lang)}
            {isRent && <span className="text-sm font-semibold text-ink-400">{tr("per_month", lang)}</span>}
          </div>
          {!isRent && (
            <div className="text-xs text-ink-500">
              {formatNumber(ppm2, lang)} €{tr("per_m2", lang)}
            </div>
          )}
        </div>
        <div className="shrink-0">
          <InquiryButton listing={listing} size="md" full={false} compact />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className={bold ? "text-base font-extrabold text-ink-900" : "font-medium text-ink-700"}>{value}</dd>
    </div>
  );
}
