"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useLang, useListings } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import * as db from "@/lib/db";
import type { ListingReport } from "@/lib/types";
import PageHeading from "@/components/ui/PageHeading";
import Icon from "@/components/ui/Icon";

export default function AdminPage() {
  const { lang } = useLang();
  const { user, ready } = useAuth();
  const { items } = useListings();
  const [reports, setReports] = useState<ListingReport[] | null>(null);

  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    if (!isAdmin) return;
    void db.getListingReports().then(setReports);
  }, [isAdmin]);

  const listingTitle = (id: string) => {
    const l = items.find((x) => x.id === id);
    return l ? loc(l.title, lang) : id;
  };

  const resolve = async (id: string) => {
    await db.resolveListingReport(id);
    setReports((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)) : prev));
  };

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">{tr("loading", lang)}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-ink-600">
          <Icon name="shield" size={28} />
        </div>
        <p className="text-base font-semibold text-ink-800">{tr("admin_no_access", lang)}</p>
      </div>
    );
  }

  const open = (reports ?? []).filter((r) => r.status !== "resolved");
  const resolved = (reports ?? []).filter((r) => r.status === "resolved");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeading icon="shield">{tr("admin_reports_title", lang)}</PageHeading>

      {reports === null ? (
        <p className="mt-8 text-center text-ink-400">{tr("loading", lang)}</p>
      ) : open.length === 0 && resolved.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-ink-500">
          {tr("admin_no_reports", lang)}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {[...open, ...resolved].map((r) => {
            const done = r.status === "resolved";
            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 shadow-soft ${done ? "border-ink-100 bg-ink-50/50 opacity-70" : "border-ink-100 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        done ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {done ? tr("status_resolved", lang) : tr("status_open", lang)}
                    </span>
                    <Link
                      href={`/listing/${r.listingId}`}
                      className="mt-1.5 block truncate font-bold text-ink-900 hover:underline"
                    >
                      {listingTitle(r.listingId)}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-600">
                      <span className="font-semibold text-ink-800">{r.reason}</span>
                      {r.note ? ` — ${r.note}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-400">{r.createdAt.slice(0, 10)}</p>
                  </div>
                  {!done && (
                    <button
                      onClick={() => resolve(r.id)}
                      className="shrink-0 rounded-full bg-ink-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-ink-800"
                    >
                      {tr("admin_resolve", lang)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
