"use client";

import React from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50";

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
}

function Wrapper({ label, hint, error, className, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input({ label, hint, error, className, ...rest }, ref) {
  return (
    <Wrapper label={label} hint={hint} error={error} className={className}>
      <input ref={ref} className={cn(base, error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")} {...rest} />
    </Wrapper>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea({ label, hint, error, className, ...rest }, ref) {
  return (
    <Wrapper label={label} hint={hint} error={error} className={className}>
      <textarea ref={ref} className={cn(base, "resize-none", error && "border-rose-300")} {...rest} />
    </Wrapper>
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select({ label, hint, error, className, children, ...rest }, ref) {
  return (
    <Wrapper label={label} hint={hint} error={error} className={className}>
      <select ref={ref} className={cn(base, "appearance-none bg-white pr-9")} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
});
