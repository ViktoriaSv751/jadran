"use client";

import { useState } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Icon, { type IconName } from "@/components/ui/Icon";
import { toast } from "@/lib/ui";
import { cn } from "@/lib/cn";

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
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Keep the displayed mode in sync when the modal is reopened in a new mode.
  const [seenMode, setSeenMode] = useState(initialMode);
  if (seenMode !== initialMode) {
    setSeenMode(initialMode);
    setMode(initialMode);
    setError("");
  }

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRole("buyer");
    setAgencyName("");
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (mode === "login") {
      if (!email || !password) {
        setError(tr("err_fill_all", lang));
        setBusy(false);
        return;
      }
      const res = await login(email, password);
      setBusy(false);
      if (!res.ok) {
        setError(tr("err_bad_credentials", lang));
        return;
      }
      toast(tr("welcome_back_toast", lang));
    } else {
      if (!email || !password || !name || (role === "agency" && !agencyName)) {
        setError(tr("err_fill_all", lang));
        setBusy(false);
        return;
      }
      const res = await register({ email, password, name, role, agencyName });
      setBusy(false);
      if (!res.ok) {
        const msg =
          res.error === "exists"
            ? tr("err_email_exists", lang)
            : res.error === "confirm_email"
              ? tr("err_confirm_email", lang)
              : tr("err_fill_all", lang);
        setError(msg);
        return;
      }
      toast(tr("account_created_toast", lang));
    }

    reset();
    onClose();
    onSuccess?.();
  };

  const roles: { value: UserRole; label: string; desc: string; icon: IconName }[] = [
    { value: "buyer", label: tr("role_buyer", lang), desc: tr("role_buyer_desc", lang), icon: "search" },
    { value: "seller", label: tr("role_seller", lang), desc: tr("role_seller_desc", lang), icon: "home" },
    { value: "agency", label: tr("role_agency", lang), desc: tr("role_agency_desc", lang), icon: "building" }
  ];

  return (
    <Modal open={open} onClose={onClose} size="md" title={mode === "login" ? tr("login", lang) : tr("register", lang)}>
      <div className="px-5 py-5">
        <h2 className="text-xl font-black tracking-tight text-ink-900">
          {mode === "login" ? tr("auth_welcome", lang) : tr("auth_register_title", lang)}
        </h2>
        <p className="mt-1 text-sm text-ink-400">{tr("brand_tagline", lang)}</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "register" && (
            <>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-700">{tr("account_type", lang)}</span>
                <div className="grid gap-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                        role === r.value
                          ? "border-ink-900 bg-ink-900/[0.03] ring-2 ring-ink-900/10"
                          : "border-ink-200 hover:border-ink-300"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                          role === r.value ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-600"
                        )}
                      >
                        <Icon name={r.icon} size={18} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">{r.label}</span>
                        <span className="block text-xs text-ink-500">{r.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Input label={tr("full_name", lang)} value={name} onChange={(e) => setName(e.target.value)} />
              {role === "agency" && (
                <Input
                  label={tr("agency_name_label", lang)}
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              )}
            </>
          )}

          <Input
            label={tr("email", lang)}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label={tr("password", lang)}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <Button type="submit" full loading={busy} size="lg">
            {mode === "login" ? tr("sign_in_cta", lang) : tr("create_account_cta", lang)}
          </Button>
        </form>

        {mode === "login" && (
          <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">{tr("demo_hint", lang)}</p>
        )}

        <div className="mt-4 text-center text-sm text-ink-500">
          {mode === "login" ? tr("no_account_q", lang) : tr("have_account_q", lang)}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-semibold text-brand-600 hover:underline"
          >
            {mode === "login" ? tr("register", lang) : tr("login", lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
