"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import * as db from "@/lib/db";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import AvatarUpload from "@/components/profile/AvatarUpload";
import PageHeading from "@/components/ui/PageHeading";
import { toast } from "@/lib/ui";

export default function SettingsClient() {
  const { lang } = useLang();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // Minden mezőt trimmelünk (ne mentsünk csak szóközt), és a mentés VALÓS
    // eredményét jelezzük — hiba esetén nem hazudunk „Mentve"-t.
    const ok = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim()
    });
    setBusy(false);
    toast(ok ? tr("profile_saved", lang) : tr("profile_save_failed", lang), ok ? "success" : "error");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeading icon="sliders">{tr("settings", lang)}</PageHeading>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        {/* Profilkép — VALÓDI feltöltés a galériából (nem URL). */}
        <div className="flex items-center gap-4">
          <AvatarUpload size={72} />
          <div>
            <div className="text-sm font-semibold text-ink-800">{tr("avatar_label", lang)}</div>
            <div className="text-xs text-ink-400">{tr("change_photo", lang)}</div>
          </div>
        </div>
        <Input label={tr("full_name", lang)} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={tr("phone_label", lang)} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={tr("location_label", lang)} value={location} onChange={(e) => setLocation(e.target.value)} />
        <Textarea label={tr("bio_label", lang)} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />

        <Button type="submit" full size="lg" loading={busy}>
          {tr("save_changes", lang)}
        </Button>
      </form>

      {/* Veszélyzóna — végleges fiók-törlés (GDPR). */}
      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-rose-600">
          <Icon name="bolt" size={15} /> {tr("danger_zone", lang)}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{tr("delete_account_desc", lang)}</p>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!window.confirm(tr("delete_account_confirm", lang))) return;
            setDeleting(true);
            const { ok } = await db.deleteAccount();
            setDeleting(false);
            if (!ok) return toast(tr("delete_failed", lang), "error");
            toast(tr("account_deleted", lang));
            router.push("/");
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-60"
        >
          <Icon name="close" size={15} strokeWidth={2.4} /> {tr("delete_account", lang)}
        </button>
      </div>
    </div>
  );
}
