"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/cn";
import Icon from "./Icon";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "center" = desktop dialog; on mobile it becomes a bottom sheet. */
  size?: "sm" | "md" | "lg" | "full";
  title?: string;
  className?: string;
}

const sizes = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  full: "sm:max-w-4xl"
};

export default function Modal({ open, onClose, children, size = "md", title, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      {/* 100% fehér, fix (nem átlátszó, nem görgethető) háttér */}
      <div className="absolute inset-0 bg-white animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-ink-100 bg-white shadow-pop animate-pop-in sm:rounded-3xl",
          sizes[size],
          className
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-base font-bold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100"
              aria-label="Bezárás"
            >
              <Icon name="close" size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
