"use client";

import { useEffect, useState } from "react";

/**
 * Tiny global UI store for app-wide overlays (auth modal, toasts) that any
 * component can trigger without prop drilling.
 */

export type AuthModalMode = "login" | "register";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  /** Optional callback fired after a successful auth (e.g. continue an inquiry). */
  onSuccess?: () => void;
}

let authState: AuthModalState = { open: false, mode: "login" };
const authSubs = new Set<() => void>();

function emitAuth() {
  authSubs.forEach((f) => f());
}

export function openAuth(mode: AuthModalMode = "login", onSuccess?: () => void): void {
  authState = { open: true, mode, onSuccess };
  emitAuth();
}

export function closeAuth(): void {
  authState = { ...authState, open: false, onSuccess: undefined };
  emitAuth();
}

export function useAuthModal(): AuthModalState {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    authSubs.add(f);
    return () => {
      authSubs.delete(f);
    };
  }, []);
  return authState;
}

/* ----------------------------- Logout confirm ----------------------------- */

let logoutOpen = false;
const logoutSubs = new Set<() => void>();

function emitLogout() {
  logoutSubs.forEach((f) => f());
}

/** Bárhonnan megnyitható kijelentkezés-megerősítő (app-szintű, portál-mentes,
 *  nem függ a fejléc-menü életciklusától — ezért mindig megbízhatóan működik). */
export function openLogoutConfirm(): void {
  logoutOpen = true;
  emitLogout();
}

export function closeLogoutConfirm(): void {
  logoutOpen = false;
  emitLogout();
}

export function useLogoutConfirm(): boolean {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    logoutSubs.add(f);
    return () => {
      logoutSubs.delete(f);
    };
  }, []);
  return logoutOpen;
}

/* ----------------------------- Toasts ----------------------------- */

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

let toasts: Toast[] = [];
const toastSubs = new Set<() => void>();
let toastId = 0;

function emitToasts() {
  toastSubs.forEach((f) => f());
}

export function toast(message: string, kind: Toast["kind"] = "success"): void {
  const id = ++toastId;
  toasts = [...toasts, { id, message, kind }];
  emitToasts();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitToasts();
  }, 3200);
}

export function useToasts(): Toast[] {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    toastSubs.add(f);
    return () => {
      toastSubs.delete(f);
    };
  }, []);
  return toasts;
}
