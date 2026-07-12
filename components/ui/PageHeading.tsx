import React from "react";
import { cn } from "@/lib/cn";
import Icon, { type IconName } from "./Icon";

/**
 * Egységes oldalcím — PONTOSAN úgy, mint a Mentett oldalon: sans „font-black",
 * `tracking-tight`, `text-2xl sm:text-3xl`, előtte egy oldalra szabott, brand
 * színű ikonnal. Minden belső oldal ezt használja a következetes fejlécekhez.
 */
export default function PageHeading({
  icon,
  children,
  className,
  right
}: {
  icon: IconName;
  children: React.ReactNode;
  className?: string;
  /** Opcionális jobb oldali tartalom (pl. gomb, lépésszámláló). */
  right?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-5 flex items-center justify-between gap-3", className)}>
      <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
        <Icon name={icon} size={24} className="shrink-0 text-brand-500" />
        <span className="min-w-0 truncate">{children}</span>
      </h1>
      {right}
    </div>
  );
}
