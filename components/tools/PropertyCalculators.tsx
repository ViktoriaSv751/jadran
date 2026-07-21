"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  transferTaxFor,
  hasProgressiveTransferTax
} from "@/lib/geo";
import type { CountryCode } from "@/lib/types";
import Icon from "@/components/ui/Icon";

const euro = (n: number, lang: string) => `${formatNumber(Math.round(n), lang as never)} €`;

/**
 * Ingatlan-kalkulátorok — a videó „interaktív eszköz" tanulsága: dwell-time-jel,
 * és az AI-keresés nem tudja lemásolni a találati oldalon, ezért a felhasználót
 * hozzánk tereli. Mindhárom kalkulátor a rendszerben tárolt VALÓS adatokból
 * dolgozik (adók, küszöbök — lib/geo.ts), így nincs adat-drift.
 */
export default function PropertyCalculators() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-3xl text-ink-900 sm:text-4xl">{tr("calc_page_title", lang)}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{tr("calc_page_lead", lang)}</p>
      </header>

      <div className="mt-10 space-y-6">
        <CostCalculator />
        <GoldenVisaChecker />
        <YieldCalculator />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-400">
        {tr("calc_disclaimer", lang)}
      </p>
    </div>
  );
}

/** Közös ország-választó + szám-mező stílus. */
function CountrySelect({
  value,
  onChange
}: {
  value: CountryCode;
  onChange: (c: CountryCode) => void;
}) {
  const { lang } = useLang();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        {tr("calc_country", lang)}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CountryCode)}
        className="w-full rounded-2xl border-2 border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-ink-900"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {tr(c.nameKey, lang)}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value || ""}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-2xl border-2 border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 outline-none transition focus:border-ink-900"
      />
    </label>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
          <Icon name={icon as never} size={18} strokeWidth={2.2} />
        </span>
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ---------- 1. Bekerülési költség ---------- */
function CostCalculator() {
  const { lang } = useLang();
  const [country, setCountry] = useState<CountryCode>("ME");
  const [price, setPrice] = useState(250000);
  const [inclAgency, setInclAgency] = useState(false);

  const costs = COUNTRY_BY_CODE[country].costs;
  const transfer = transferTaxFor(country, price);
  const notary = Math.round(price * costs.notaryRate) + costs.notaryFixed;
  const lawyer = Math.round(price * costs.lawyerRate);
  const agency = Math.round(price * costs.agencyRate);
  const total = price + transfer + notary + lawyer + (inclAgency ? agency : 0);
  const extra = total - price;

  const Row = ({ label, val, hint }: { label: string; val: number; hint?: string }) => (
    <div className="flex items-baseline justify-between border-t border-ink-100 py-2 text-sm">
      <span className="text-ink-600">
        {label}
        {hint && <span className="ml-1 text-ink-400">{hint}</span>}
      </span>
      <span className="font-semibold text-ink-900">{euro(val, lang)}</span>
    </div>
  );

  return (
    <Card icon="wallet" title={tr("calc_cost_h", lang)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CountrySelect value={country} onChange={setCountry} />
        <NumberField label={tr("calc_price", lang)} value={price} onChange={setPrice} />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-600">
        <input
          type="checkbox"
          checked={inclAgency}
          onChange={(e) => setInclAgency(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300"
        />
        {tr("calc_incl_agency", lang)} ({Math.round(costs.agencyRate * 1000) / 10}%)
      </label>

      <div className="mt-4">
        <Row
          label={tr("calc_transfer_tax", lang)}
          val={transfer}
          hint={hasProgressiveTransferTax(country) ? "(sávos)" : undefined}
        />
        <Row label={tr("calc_notary", lang)} val={notary} />
        <Row label={tr("calc_lawyer", lang)} val={lawyer} />
        {inclAgency && <Row label={tr("calc_agency", lang)} val={agency} />}
      </div>

      <div className="mt-4 flex items-baseline justify-between rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 px-4 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-950">
            {tr("calc_total", lang)}
          </div>
          <div className="text-[11px] text-ink-500">+{euro(extra, lang)}</div>
        </div>
        <div className="text-2xl font-black text-ink-900">{euro(total, lang)}</div>
      </div>
    </Card>
  );
}

/* ---------- 2. Golden Visa jogosultság ---------- */
function GoldenVisaChecker() {
  const { lang } = useLang();
  const [country, setCountry] = useState<CountryCode>("GR");
  const [budget, setBudget] = useState(400000);

  const gv = COUNTRY_BY_CODE[country].goldenVisa;
  const qualifies = gv ? budget >= gv.minEur : false;
  const shortfall = gv ? Math.max(0, gv.minEur - budget) : 0;

  return (
    <Card icon="globe" title={tr("calc_gv_h", lang)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CountrySelect value={country} onChange={setCountry} />
        <NumberField label={tr("calc_budget", lang)} value={budget} onChange={setBudget} />
      </div>

      <div className="mt-4">
        {!gv ? (
          <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-600">
            {tr("calc_no_program", lang)}
          </div>
        ) : (
          <div
            className={`rounded-2xl border-2 px-4 py-3 ${
              qualifies ? "border-ink-950 bg-[#c8ff00]/20" : "border-ink-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900">
                {qualifies ? tr("calc_qualifies", lang) : tr("calc_not_qualifies", lang)}
              </span>
              <span className="rounded-full bg-ink-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {gv.kind === "citizenship"
                  ? tr("kb_cat_citizenship", lang)
                  : tr("kb_cat_golden_visa", lang)}
              </span>
            </div>
            <div className="mt-1.5 text-[13px] text-ink-500">
              {`${euro(gv.minEur, lang)}+ · `}
              {gv.kind === "citizenship"
                ? tr("kb_cat_citizenship", lang)
                : tr("kb_cat_golden_visa", lang)}
            </div>
            {!qualifies && shortfall > 0 && (
              <div className="mt-1 text-sm font-semibold text-ink-900">
                {tr("calc_shortfall", lang)}: {euro(shortfall, lang)}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- 3. Bérleti hozam ---------- */
function YieldCalculator() {
  const { lang } = useLang();
  const [price, setPrice] = useState(200000);
  const [rent, setRent] = useState(900);

  const gross = price > 0 ? ((rent * 12) / price) * 100 : 0;
  const net = gross * 0.75;
  const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

  return (
    <Card icon="trendUp" title={tr("calc_yield_h", lang)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField label={tr("calc_price", lang)} value={price} onChange={setPrice} />
        <NumberField label={tr("calc_monthly_rent", lang)} value={rent} onChange={setRent} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-ink-950 bg-[#c8ff00]/20 px-4 py-3 text-center">
          <div className="text-2xl font-black text-ink-900">{pct(gross)}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {tr("calc_gross_yield", lang)}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white px-4 py-3 text-center">
          <div className="text-2xl font-black text-ink-900">{pct(net)}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {tr("calc_net_yield", lang)}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-400">{tr("calc_net_note", lang)}</p>
    </Card>
  );
}
