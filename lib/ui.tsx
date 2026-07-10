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
