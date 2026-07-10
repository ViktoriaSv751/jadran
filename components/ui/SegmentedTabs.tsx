"use client";

import { cn } from "@/lib/cn";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-soft",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full font-semibold transition",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            value === o.value ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
          )}
        >
          {o.icon && <span className="mr-1">{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}
