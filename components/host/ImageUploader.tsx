"use client";

import { useRef, useState } from "react";
import { supabase, hasSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/store";
import { tr } from "@/lib/i18n";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/Input";
import { toast } from "@/lib/ui";
import { cn } from "@/lib/cn";

/**
 * Valódi kép-feltöltő a hirdetés-varázslóhoz. A képeket a Supabase Storage
 * `listings` bucketjébe tölti a `${userId}/…` mappába (RLS: csak a saját
 * mappájába írhat), és a publikus URL-t adja vissza. A képek listáját
 * sortöréssel elválasztott stringként tárolja — pontosan úgy, ahogy a
 * varázsló eddig is (form.images), így a beküldési logika változatlan.
 */
export default function ImageUploader({
  value,
  onChange,
  userId
}: {
  value: string;
  onChange: (v: string) => void;
  userId: string;
}) {
  const { lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showUrls, setShowUrls] = useState(false);

  const urls = value.split("\n").map((s) => s.trim()).filter(Boolean);
  const setUrls = (next: string[]) => onChange(next.join("\n"));

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    if (!hasSupabase || !supabase) {
      toast(tr("upload_no_backend", lang));
      return;
    }
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("listings")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error("upload", error.message);
        toast(tr("upload_failed", lang));
        continue;
      }
      const { data } = supabase.storage.from("listings").getPublicUrl(path);
      added.push(data.publicUrl);
    }
    if (added.length) {
      setUrls([...urls, ...added]);
      toast(tr("upload_done", lang));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Feltöltő gomb / dropzone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center transition hover:border-ink-300 hover:bg-ink-50",
          busy && "opacity-60"
        )}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-900 text-white">
          <Icon name={busy ? "compass" : "plus"} size={20} className={busy ? "animate-spin" : ""} />
        </span>
        <span className="text-sm font-semibold text-ink-900">
          {busy ? tr("uploading", lang) : tr("upload_cta", lang)}
        </span>
        <span className="text-xs text-ink-400">{tr("upload_hint", lang)}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Thumbnail rács */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {urls.map((src, i) => (
            <div key={src + i} className="group relative">
              <Photo src={src} alt="" className="h-20 w-full rounded-xl" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-md bg-ink-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {tr("cover_badge", lang)}
                </span>
              )}
              <button
                type="button"
                onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-ink-700 opacity-0 shadow transition group-hover:opacity-100"
                aria-label={tr("remove", lang)}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL-beillesztés fallback */}
      <button
        type="button"
        onClick={() => setShowUrls((s) => !s)}
        className="text-xs font-medium text-ink-500 hover:text-ink-800"
      >
        {showUrls ? tr("hide_url_input", lang) : tr("paste_url_instead", lang)}
      </button>
      {showUrls && (
        <Textarea
          label={tr("photos_label", lang)}
          hint={tr("photos_hint", lang)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="https://…"
        />
      )}
    </div>
  );
}
