"use client";

import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { useAuth, useLang } from "@/lib/store";
import { tr, loc } from "@/lib/i18n";
import * as db from "@/lib/db";
import { openAuth, toast } from "@/lib/ui";
import Button from "@/components/ui/Button";

export default function InquiryButton({ listing }: { listing: Listing }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();

  const isOwn = user?.id === listing.ownerId;
  const isAgency = listing.agency && db.getProfile(listing.ownerId)?.role === "agency";

  const startInquiry = () => {
    const run = () => {
      const me = db.getCurrentUser();
      if (!me) return;
      const conv = db.getOrCreateConversation(listing.id, me.id, listing.ownerId);
      const existing = db.getMessagesForConversation(conv.id);
      if (existing.length === 0) {
        db.sendMessage(conv.id, me.id, `${tr("inquiry_default", lang)}${loc(listing.title, lang)}`);
      }
      toast(tr("inquiry_sent_toast", lang));
      router.push(`/messages?c=${conv.id}`);
    };

    if (!user) {
      openAuth("login", run);
      return;
    }
    run();
  };

  if (isOwn) {
    return (
      <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-center text-sm text-ink-500">
        {tr("own_listing_note", lang)}
      </div>
    );
  }

  return (
    <Button full size="lg" variant="accent" onClick={startInquiry}>
      {isAgency ? tr("contact_agency", lang) : tr("contact_seller", lang)}
    </Button>
  );
}
