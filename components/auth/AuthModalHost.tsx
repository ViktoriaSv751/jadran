"use client";

import { useAuthModal, closeAuth } from "@/lib/ui";
import AuthModal from "./AuthModal";

export default function AuthModalHost() {
  const { open, mode, onSuccess } = useAuthModal();
  return <AuthModal open={open} mode={mode} onClose={closeAuth} onSuccess={onSuccess} />;
}
