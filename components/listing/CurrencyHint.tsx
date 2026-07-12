"use client";

import { useEffect, useState } from "react";

/**
 * Ár átszámítás a fő vevő-devizákra (USD / GBP / RUB) — a montenegrói piac
 * vevői jórészt külföldiek. Élő árfolyam az open.er-api.com-ról (kulcs nélküli,
 * ingyenes), 24 órás localStorage cache-sel; hiba esetén konzervatív fix
 * fallback. Tájékoztató jellegű, ezért "≈" jellel.
 */

type Rates = { USD: number; GBP: number; RUB: number };
const FALLBACK: Rates = { USD: 1.08, GBP: 0.85, RUB: 100 };
const CACHE_KEY = "jadran_fx_eur";
const TTL = 24 * 60 * 60 * 1000;

async function getRates(): Promise<Rates> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; rates: Rates };
      if (Date.now() - cached.at < TTL) return cached.rates;
    }
  } catch {
    /* sérült cache — megyünk tovább */
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR");
    const data = await res.json();
    const rates: Rates = {
      USD: data?.rates?.USD ?? FALLBACK.USD,
      GBP: data?.rates?.GBP ?? FALLBACK.GBP,
      RUB: data?.rates?.RUB ?? FALLBACK.RUB
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rates }));
    return rates;
  } catch {
    return FALLBACK;
  }
}

function fmt(n: number, currency: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M ${currency}`;
  return `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(n)} ${currency}`;
}

export default function CurrencyHint({ amount }: { amount: number }) {
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    let alive = true;
    void getRates().then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, []);

  if (!rates || amount <= 0) return null;

  return (
    <div className="mt-1 text-xs text-ink-400">
      ≈ {fmt(amount * rates.USD, "USD")} · {fmt(amount * rates.GBP, "GBP")} ·{" "}
      {fmt(amount * rates.RUB, "RUB")}
    </div>
  );
}
