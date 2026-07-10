"use client";

import { useState } from "react";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { toast } from "@/lib/ui";

export default function SettingsClient() {
  const { lang } = useLang();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");

  if (!user) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: name.trim(), phone, location, bio, avatar: avatar.trim() || null });
    toast(tr("profile_saved", lang));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-bold text-ink-900">{tr("settings", lang)}</h1>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} src={avatar || null} size={64} />
          <Input
            className="flex-1"
            label={tr("avatar_label", lang)}
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <Input label={tr("full_name", lang)} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={tr("phone_label", lang)} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={tr("location_label", lang)} value={location} onChange={(e) => setLocation(e.target.value)} />
        <Textarea label={tr("bio_label", lang)} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />

        <Button type="submit" full size="lg">
          {tr("save_changes", lang)}
        </Button>
      </form>
    </div>
  );
}
