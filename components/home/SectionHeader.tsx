"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function SectionHeader({
  title,
  href,
  cta
}: {
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="display text-2xl text-ink-900 sm:text-3xl">{title}</h2>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink-900 transition hover:text-brand-600"
        >
          {cta} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}
