"use client";

import { useState } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AvatarUpload from "@/components/profile/AvatarUpload";
import PageHeading from "@/components/ui/PageHeading";
import { toast } from "@/lib/ui";

export default function SettingsClient() {
  const { lang } = useLang();
  const { user, updateProfile } = useAuth();
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
    </div>
  );
}
