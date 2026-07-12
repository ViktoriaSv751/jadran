"use client";

import { openLogoutConfirm } from "@/lib/ui";

/**
 * Kijelentkezés gomb — app-szintű megerősítőt nyit (lásd LogoutConfirmHost).
 * Nem tartalmaz saját modált, így akkor is működik, ha a szülő (fejléc-menü)
 * kattintásra bezárul. Újrahasznosítható: fejléc-menü ÉS profil oldal is ezt
 * használja.
 */
export default function LogoutButton({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // Ne engedje a szülő menüt/dokumentumot reagálni (ne unmountoljon).
        e.preventDefault();
        e.stopPropagation();
        openLogoutConfirm();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
