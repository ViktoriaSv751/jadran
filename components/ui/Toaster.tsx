"use client";

import { useToasts } from "@/lib/ui";
import { cn } from "@/lib/cn";

const tone = {
  success: "bg-emerald-600",
  error: "bg-rose-600",
  info: "bg-ink-900"
};

export default function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto animate-pop-in rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-pop",
            tone[t.kind]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
