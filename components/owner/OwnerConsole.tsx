"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { COUNTRY_BY_CODE } from "@/lib/geo";
import Icon, { type IconName } from "@/components/ui/Icon";

/**
 * Tulajdonosi vezérlőpult (/owner) — CSAK a szoftver tulajdonosának (is_owner).
 *
 * Az „átlátás": felhasználók, bevétel, hirdetések valós számai a Supabase-ből.
 * Az owner-olvasási RLS (is_owner()) engedi a payments/listings teljes olvasását;
 * a profilok amúgy is publikusan olvashatók. A felület magyar, mert egyszemélyes,
 * privát eszköz.
 */

type Row = Record<string, unknown>;

interface Metrics {
  users: number;
  agencies: number;
  privates: number;
  newUsers30: number;
  listingsActive: number;
  listingsTotal: number;
  revenueTotal: number;
  paidCount: number;
  byCountry: { code: string; n: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; joinedAt: string }[];
}

const fmt = (n: number) => new Intl.NumberFormat("hu-HU").format(n);
const daysAgo = (iso: string, now: number) =>
  (now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);

export default function OwnerConsole() {
  const { user, ready } = useAuth();
  const isOwner = !!user?.isOwner;

  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!isOwner || !supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const now = Date.now();
        const [profilesRes, listingsRes, paymentsRes] = await Promise.all([
          supabase.from("profiles").select("id, name, email, role, joined_at"),
          supabase.from("listings").select("id, status, country"),
          supabase.from("payments").select("amount, status")
        ]);
        if (cancelled) return;

        const profiles = (profilesRes.data ?? []) as Row[];
        const listings = (listingsRes.data ?? []) as Row[];
        const payments = (paymentsRes.data ?? []) as Row[];

        const byCountryMap: Record<string, number> = {};
        let active = 0;
        for (const l of listings) {
          if (l.status === "active") active++;
          const c = String(l.country);
          byCountryMap[c] = (byCountryMap[c] ?? 0) + 1;
        }

        const paid = payments.filter(
          (p) => ["paid", "succeeded", "completed", "active"].includes(String(p.status))
        );
        const revenue = paid.reduce((s, p) => s + (Number(p.amount) || 0), 0);

        setM({
          users: profiles.length,
          agencies: profiles.filter((p) => p.role === "agency").length,
          privates: profiles.filter((p) => p.role === "private").length,
          newUsers30: profiles.filter((p) => p.joined_at && daysAgo(String(p.joined_at), now) <= 30)
            .length,
          listingsActive: active,
          listingsTotal: listings.length,
          revenueTotal: revenue,
          paidCount: paid.length,
          byCountry: Object.entries(byCountryMap)
            .map(([code, n]) => ({ code, n }))
            .sort((a, b) => b.n - a.n),
          recentUsers: [...profiles]
            .sort(
              (a, b) =>
                new Date(String(b.joined_at)).getTime() - new Date(String(a.joined_at)).getTime()
            )
            .slice(0, 12)
            .map((p) => ({
              id: String(p.id),
              name: String(p.name ?? "—"),
              email: String(p.email ?? ""),
              role: String(p.role ?? ""),
              joinedAt: String(p.joined_at ?? "")
            }))
        });
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">Betöltés…</div>;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
          <Icon name="shield" size={28} />
        </div>
        <p className="text-base font-semibold text-ink-800">Ez az oldal csak a tulajdonosnak érhető el.</p>
        <p className="mt-1 text-sm text-ink-500">Jelentkezz be a tulajdonosi fiókkal.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
          <Icon name="sliders" size={20} strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="display text-2xl text-ink-900">Tulajdonosi vezérlőpult</h1>
          <p className="text-sm text-ink-500">Szia, {user?.name}! Itt a teljes átlátás.</p>
        </div>
      </header>

      {err && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Nem sikerült betölteni az adatokat. Frissítsd az oldalt.
        </div>
      )}

      {/* ---------- Áttekintő kártyák ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="user" label="Felhasználó" value={m ? fmt(m.users) : "…"} sub={m ? `+${m.newUsers30} / 30 nap` : ""} />
        <Stat icon="building" label="Ingatlaniroda" value={m ? fmt(m.agencies) : "…"} sub={m ? `${fmt(m.privates)} magánszemély` : ""} />
        <Stat icon="home" label="Aktív hirdetés" value={m ? fmt(m.listingsActive) : "…"} sub={m ? `${fmt(m.listingsTotal)} összesen` : ""} />
        <Stat icon="wallet" label="Bevétel" value={m ? `${fmt(m.revenueTotal)} €` : "…"} sub={m ? `${m.paidCount} tranzakció` : ""} />
      </div>

      {/* ---------- Gyors műveletek ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href="/admin" icon="shield" title="Moderáció" desc="Jelentések, verifikáció" />
        <QuickLink href="/tudastar" icon="compass" title="Tudástár" desc="Cikkek megtekintése" />
        <QuickLink href="/kalkulatorok" icon="euro" title="Kalkulátorok" desc="Költség, hozam, Golden Visa" />
      </div>

      {/* ---------- Legutóbbi felhasználók ---------- */}
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Legutóbbi felhasználók</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ink-100">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5 font-semibold">Név</th>
                <th className="px-4 py-2.5 font-semibold">E-mail</th>
                <th className="px-4 py-2.5 font-semibold">Szerep</th>
                <th className="px-4 py-2.5 font-semibold">Csatlakozott</th>
              </tr>
            </thead>
            <tbody>
              {(m?.recentUsers ?? []).map((u) => (
                <tr key={u.id} className="border-t border-ink-100">
                  <td className="px-4 py-2.5 font-medium text-ink-900">
                    <Link href={`/u/${u.id}`} className="hover:underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-600">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                      {u.role === "agency" ? "iroda" : u.role === "private" ? "magánszemély" : u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500">
                    {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString("hu-HU") : "—"}
                  </td>
                </tr>
              ))}
              {m && m.recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-400">
                    Még nincs felhasználó.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Hirdetések országonként ---------- */}
      {m && m.byCountry.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">Hirdetések országonként</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.byCountry.map(({ code, n }) => {
              const info = COUNTRY_BY_CODE[code as keyof typeof COUNTRY_BY_CODE];
              return (
                <div
                  key={code}
                  className="flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-sm shadow-soft"
                >
                  <span>{info?.flag ?? "🏳️"}</span>
                  <span className="font-semibold text-ink-900">{fmt(n)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-ink-400">
        Bővülő funkciók: cikkíró CMS, előfizetés-részletek, forgalmi analitika, napi összefoglaló.
      </p>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: IconName; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-1.5 text-ink-400">
        <Icon name={icon} size={14} strokeWidth={2.2} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1.5 text-2xl font-black text-ink-900">{value}</div>
      {sub && <div className="text-[11px] text-ink-400">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: IconName; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-900"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-2 border-ink-950 bg-[#c8ff00] text-ink-950">
        <Icon name={icon} size={18} strokeWidth={2.2} />
      </span>
      <div>
        <div className="text-sm font-bold text-ink-900">{title}</div>
        <div className="text-xs text-ink-500">{desc}</div>
      </div>
    </Link>
  );
}
