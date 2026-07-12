"use client";

import { useState } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import type { UserRole } from "@/lib/types";
import * as db from "@/lib/db";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Icon, { type IconName } from "@/components/ui/Icon";
import { toast } from "@/lib/ui";
import { cn } from "@/lib/cn";

/** Google színes „G" logó (inline, hogy külső kép ne kelljen). */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7C42.6 36.4 45.1 30.9 45.1 24.5z" />
      <path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.6v5.6C8.2 41.1 15.5 46 24 46z" />
      <path fill="#FBBC05" d="M11.9 28.5c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4v-5.6H4.6C3.2 17.7 2.4 20.8 2.4 24s.8 6.3 2.2 9.1l7.3-5.6z" />
      <path fill="#EA4335" d="M24 11.1c3.2 0 6 1.1 8.2 3.2l6.1-6.1C34.7 4.7 29.8 2.7 24 2.7 15.5 2.7 8.2 7.6 4.6 14.9l7.3 5.6c1.7-5.1 6.5-9.4 12.1-9.4z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 5.9c.6-.8 1.1-1.9.9-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

/**
 * Bejelentkezés / regisztráció űrlap — a modál ÉS a /login, /register oldalak
 * is ezt használják. Google/Apple OAuth, email+jelszó, plusz egykattintásos
 * demo belépés (vevő és eladó), hogy fiók nélkül is kipróbálható legyen.
 */
export default function AuthForm({
  mode,
  onModeChange,
  onSuccess
}: {
  mode: "login" | "register";
  onModeChange: (m: "login" | "register") => void;
  onSuccess?: () => void;
}) {
  const { lang } = useLang();
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);
  const [demoBusy, setDemoBusy] = useState<"buyer" | "seller" | "agency" | null>(null);

  const done = () => {
    toast(mode === "login" ? tr("welcome_back_toast", lang) : tr("account_created_toast", lang));
    onSuccess?.();
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
      if (!res.ok) return setError(tr("err_bad_credentials", lang));
    } else {
      if (!email || !password || !name || (role === "agency" && !agencyName)) {
        setError(tr("err_fill_all", lang));
        setBusy(false);
        return;
      }
      const res = await register({ email, password, name, role, agencyName });
      setBusy(false);
      if (!res.ok) {
        return setError(
          res.error === "exists"
            ? tr("err_email_exists", lang)
            : res.error === "confirm_email"
              ? tr("err_confirm_email", lang)
              : tr("err_fill_all", lang)
        );
      }
    }
    done();
  };

  const oauth = async (provider: "google" | "apple") => {
    setOauthBusy(provider);
    setError("");
    const res = await db.loginOAuth(provider);
    if (!res.ok) {
      setOauthBusy(null);
      setError(tr("oauth_unavailable", lang));
    }
    // siker esetén átirányít
  };

  const demo = async (r: "buyer" | "seller" | "agency") => {
    setDemoBusy(r);
    setError("");
    const res = await db.loginDemo(r);
    setDemoBusy(null);
    if (!res.ok) return setError(tr("err_bad_credentials", lang));
    toast(tr("demo_welcome", lang));
    onSuccess?.();
  };

  const roles: { value: UserRole; label: string; desc: string; icon: IconName }[] = [
    { value: "buyer", label: tr("role_buyer", lang), desc: tr("role_buyer_desc", lang), icon: "search" },
    { value: "seller", label: tr("role_seller", lang), desc: tr("role_seller_desc", lang), icon: "home" },
    { value: "agency", label: tr("role_agency", lang), desc: tr("role_agency_desc", lang), icon: "building" }
  ];

  return (
    <div className="px-5 py-5">
      <h2 className="display text-2xl text-ink-900">
        {mode === "login" ? tr("auth_welcome", lang) : tr("auth_register_title", lang)}
      </h2>
      <p className="mt-1 text-sm text-ink-400">{tr("brand_tagline", lang)}</p>

      {/* OAuth */}
      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={() => oauth("google")}
          disabled={!!oauthBusy}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-ink-200 bg-white py-3 text-sm font-semibold text-ink-800 transition hover:bg-ink-50 disabled:opacity-60"
        >
          <GoogleG /> {tr("continue_google", lang)}
        </button>
        <button
          type="button"
          onClick={() => oauth("apple")}
          disabled={!!oauthBusy}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
        >
          <AppleLogo /> {tr("continue_apple", lang)}
        </button>
      </div>

      {/* Demo belépés */}
      <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-3">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">
          {tr("demo_try_title", lang)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" loading={demoBusy === "buyer"} onClick={() => demo("buyer")}>
            <Icon name="search" size={14} className="mr-1" /> {tr("demo_buyer", lang)}
          </Button>
          <Button variant="outline" size="sm" loading={demoBusy === "seller"} onClick={() => demo("seller")}>
            <Icon name="home" size={14} className="mr-1" /> {tr("demo_seller", lang)}
          </Button>
          <Button variant="outline" size="sm" loading={demoBusy === "agency"} onClick={() => demo("agency")}>
            <Icon name="building" size={14} className="mr-1" /> {tr("demo_agency", lang)}
          </Button>
        </div>
      </div>

      {/* Elválasztó */}
      <div className="my-4 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        {tr("or_email", lang)}
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <form onSubmit={submit} className="space-y-3">
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

      <div className="mt-4 text-center text-sm text-ink-500">
        {mode === "login" ? tr("no_account_q", lang) : tr("have_account_q", lang)}{" "}
        <button
          type="button"
          onClick={() => {
            onModeChange(mode === "login" ? "register" : "login");
            setError("");
          }}
          className="font-semibold text-brand-600 hover:underline"
        >
          {mode === "login" ? tr("register", lang) : tr("login", lang)}
        </button>
      </div>
    </div>
  );
}
