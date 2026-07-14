"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import * as db from "@/lib/db";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageHeading from "@/components/ui/PageHeading";
import { toast } from "@/lib/ui";

/**
 * Új jelszó beállítása. A felhasználó az e-mailben kapott linkről érkezik ide;
 * a Supabase kliens a `detectSessionInUrl` révén létrehoz egy ideiglenes
 * recovery-sessiont, amivel az `updateUser({ password })` működik.
 */
export default function ResetPasswordPage() {
  const { lang } = useLang();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 6) return setError(tr("err_weak_password", lang));
    setBusy(true);
    const { ok } = await db.updatePassword(password);
    setBusy(false);
    if (!ok) return setError(tr("reset_failed", lang));
    toast(tr("reset_done", lang));
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageHeading icon="key">{tr("reset_title", lang)}</PageHeading>
      <form onSubmit={save} className="mt-4 space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <Input
          label={tr("reset_new_password", lang)}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <Button type="submit" full size="lg" loading={busy}>
          {tr("reset_save", lang)}
        </Button>
      </form>
    </div>
  );
}
