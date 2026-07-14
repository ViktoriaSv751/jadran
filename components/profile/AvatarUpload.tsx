"use client";

import { useRef, useState } from "react";
import { supabase, hasSupabase } from "@/lib/supabase";
import { useAuth, useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";
import { toast } from "@/lib/ui";

/**
 * Profilkép — kattintható avatar, ami galériából tölthet fel képet a Supabase
 * Storage-ba (a saját profil-id mappájába), majd frissíti a profilt.
 */
export default function AvatarUpload({ size = 88 }: { size?: number }) {
  const { lang } = useLang();
  const { user, updateProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  async function handle(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(tr("file_too_large", lang), "error");
      return;
    }
    if (!hasSupabase || !supabase) {
      toast(tr("upload_no_backend", lang));
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user!.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: true });
    if (error) {
      toast(tr("upload_failed", lang));
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("listings").getPublicUrl(path);
    const ok = await updateProfile({ avatar: data.publicUrl });
    toast(ok ? tr("upload_done", lang) : tr("upload_failed", lang), ok ? "success" : "error");
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative rounded-full ring-4 ring-white"
      aria-label={tr("change_photo", lang)}
    >
      <Avatar name={user.name} src={user.avatar} size={size} />
      <span className="absolute inset-0 grid place-items-center rounded-full bg-ink-950/45 opacity-0 transition group-hover:opacity-100">
        <Icon name={busy ? "compass" : "plus"} size={22} strokeWidth={2.2} className={`text-white ${busy ? "animate-spin" : ""}`} />
      </span>
      <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#c8ff00] text-ink-950">
        <Icon name="plus" size={14} strokeWidth={2.6} />
      </span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files)} />
    </button>
  );
}
