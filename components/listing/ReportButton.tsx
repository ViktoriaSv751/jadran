"use client";

import { useState } from "react";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import * as db from "@/lib/db";
import { toast } from "@/lib/ui";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const REASONS = [
  { id: "fraud", key: "report_reason_fraud" as const },
  { id: "duplicate", key: "report_reason_duplicate" as const },
  { id: "sold", key: "report_reason_sold" as const },
  { id: "wrong", key: "report_reason_wrong" as const },
  { id: "other", key: "report_reason_other" as const }
];

/** Hirdetés bejelentése (moderáció) — bárki beküldheti, belépés nem kell. */
export default function ReportButton({ listingId }: { listingId: string }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("fraud");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await db.reportListing(listingId, reason, note.trim() || undefined);
    setBusy(false);
    setOpen(false);
    setNote("");
    toast(tr("report_sent", lang));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition hover:text-rose-600"
      >
        <Icon name="shield" size={13} /> {tr("report_listing", lang)}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} size="sm" title={tr("report_listing", lang)}>
        <div className="p-5">
          <p className="mb-3 text-sm font-semibold text-ink-800">{tr("report_title", lang)}</p>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition ${
                  reason === r.id ? "border-ink-900 bg-ink-900/[0.03]" : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-200"
                />
                <span className="font-medium text-ink-800">{tr(r.key, lang)}</span>
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={tr("report_note_ph", lang)}
            className="mt-3 w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-ink-400 focus:outline-none"
          />
          <Button full size="lg" loading={busy} onClick={submit} className="mt-3">
            {tr("report_submit", lang)}
          </Button>
        </div>
      </Modal>
    </>
  );
}
