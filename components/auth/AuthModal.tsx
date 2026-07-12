"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Modal from "@/components/ui/Modal";
import AuthForm from "./AuthForm";

export default function AuthModal({
  open,
  mode: initialMode,
  onClose,
  onSuccess
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Tartsuk szinkronban, ha új módban nyílik újra a modál.
  const [seenMode, setSeenMode] = useState(initialMode);
  if (seenMode !== initialMode) {
    setSeenMode(initialMode);
    setMode(initialMode);
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title={mode === "login" ? tr("login", lang) : tr("register", lang)}>
      <AuthForm
        mode={mode}
        onModeChange={setMode}
        onSuccess={() => {
          onClose();
          // Ha van folytatás (pl. érdeklődés befejezése), azt futtatjuk; egyébként
          // MINDIG a főoldalra irányítunk belépés után.
          if (onSuccess) onSuccess();
          else router.push("/");
        }}
      />
    </Modal>
  );
}
