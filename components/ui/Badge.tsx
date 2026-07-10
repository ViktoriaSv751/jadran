import React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "sea" | "emerald" | "amber" | "rose" | "ink" | "white";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-50 text-ink-700",
  sea: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-600",
  ink: "bg-ink-900 text-white",
  white: "bg-white/90 text-ink-800 backdrop-blur"
};

export default function Badge({
  tone = "neutral",
  className,
  children
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
