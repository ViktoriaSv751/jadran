"use client";

import type { Lang, VerificationLevel } from "@/lib/types";
import { tr } from "@/lib/i18n";
import Icon, { type IconName } from "./ui/Icon";

const config: Record<
  VerificationLevel,
  { icon: IconName; cls: string; labelKey: string; explainKey: string }
> = {
  full: {
    icon: "shield",
    cls: "bg-ink-950 text-white",
    labelKey: "verified_full",
    explainKey: "verif_explain_full"
  },
  deed: {
    icon: "shield",
    cls: "bg-white text-ink-900",
    labelKey: "verified_deed",
    explainKey: "verif_explain_deed"
  },
  basic: {
    icon: "check",
    cls: "bg-white text-ink-600",
    labelKey: "verified_basic",
    explainKey: "verif_explain_basic"
  },
  none: {
    icon: "minus",
    cls: "bg-white text-ink-400",
    labelKey: "verified_none",
    explainKey: "verif_explain_none"
  }
};

export default function VerificationBadge({
  level,
  lang,
  withText = false
}: {
  level: VerificationLevel;
  lang: Lang;
  withText?: boolean;
}) {
  const c = config[level];
  return (
    <span
      title={tr(c.explainKey, lang)}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-soft ${c.cls}`}
    >
      <Icon name={c.icon} size={13} strokeWidth={2.2} />
      {withText && tr(c.labelKey, lang)}
    </span>
  );
}
