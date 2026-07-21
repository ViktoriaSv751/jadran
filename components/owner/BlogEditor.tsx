"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { blogSlug, rowToPost, type BlogPost, type BlogSection } from "@/lib/blog";
import Icon from "@/components/ui/Icon";

/**
 * Tudástár-CMS szerkesztő (/owner/blog) — csak a tulajdonosnak.
 * A tulajdonos kód nélkül ír, szerkeszt, publikál és töröl cikket. A mentés a
 * hitelesített kliens-klienssel megy, az owner-RLS mögött.
 */

/** Szerkesztő-modell: a szekció szövege egy textarea (üres sorral elválasztott
 *  bekezdések), mentéskor `p[]`-vé alakul. */
interface DraftSection {
  h: string;
  text: string;
}
interface Draft {
  id?: string;
  slug?: string;
  title: string;
  excerpt: string;
  cover: string;
  published: boolean;
  sections: DraftSection[];
}

const emptyDraft = (): Draft => ({
  title: "",
  excerpt: "",
  cover: "",
  published: false,
  sections: [{ h: "", text: "" }]
});

const toDraft = (p: BlogPost): Draft => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  cover: p.cover ?? "",
  published: p.published,
  sections: p.body.length
    ? p.body.map((s) => ({ h: s.h ?? "", text: s.p.join("\n\n") }))
    : [{ h: "", text: "" }]
});

const draftToBody = (d: Draft): BlogSection[] =>
  d.sections
    .map((s) => ({
      h: s.h.trim() || undefined,
      p: s.text
        .split(/\n\n+/)
        .map((t) => t.trim())
        .filter(Boolean)
    }))
    .filter((s) => s.h || s.p.length);

export default function BlogEditor() {
  const { user, ready } = useAuth();
  const isOwner = !!user?.isOwner;

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data ?? []).map(rowToPost));
  }, []);

  useEffect(() => {
    if (isOwner) void load();
  }, [isOwner, load]);

  const save = async () => {
    if (!supabase || !draft) return;
    if (!draft.title.trim()) {
      setMsg("A cím kötelező.");
      return;
    }
    setSaving(true);
    setMsg("");
    const slug = draft.slug || blogSlug(draft.title);
    const row = {
      slug,
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      cover: draft.cover.trim() || null,
      body: draftToBody(draft),
      published: draft.published,
      author_id: user?.id ?? null,
      updated_at: new Date().toISOString()
    };
    const q = draft.id
      ? supabase.from("blog_posts").update(row).eq("id", draft.id)
      : supabase.from("blog_posts").insert(row);
    const { error } = await q;
    setSaving(false);
    if (error) {
      setMsg(`Mentés sikertelen: ${error.message}`);
      return;
    }
    setDraft(null);
    setMsg("Mentve.");
    await load();
  };

  const remove = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Biztosan törlöd ezt a cikket?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    await load();
  };

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-ink-400">Betöltés…</div>;
  }
  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-base font-semibold text-ink-800">Ez az oldal csak a tulajdonosnak érhető el.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/owner" className="text-ink-400 hover:text-ink-900">
            <Icon name="arrowLeft" size={18} />
          </Link>
          <h1 className="display text-2xl text-ink-900">Cikkek</h1>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft(emptyDraft())}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-4 py-2 text-sm font-bold text-ink-950 transition hover:brightness-95"
          >
            <Icon name="plus" size={16} strokeWidth={2.6} /> Új cikk
          </button>
        )}
      </header>

      {msg && <div className="mt-4 rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-700">{msg}</div>}

      {draft ? (
        /* ---------- Szerkesztő ---------- */
        <div className="mt-6 space-y-4">
          <Field label="Cím">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="A cikk címe"
              className="w-full rounded-2xl border-2 border-ink-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-ink-900"
            />
            {draft.title && (
              <p className="mt-1 text-[11px] text-ink-400">
                URL: /blog/{draft.slug || blogSlug(draft.title)}
              </p>
            )}
          </Field>

          <Field label="Rövid összefoglaló (a listában és a keresőben látszik)">
            <textarea
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              rows={2}
              className="w-full rounded-2xl border-2 border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink-900"
            />
          </Field>

          <Field label="Borítókép URL (opcionális)">
            <input
              value={draft.cover}
              onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
              placeholder="https://…"
              className="w-full rounded-2xl border-2 border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink-900"
            />
          </Field>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">
              Tartalom (szekciók)
            </span>
            <div className="space-y-3">
              {draft.sections.map((s, i) => (
                <div key={i} className="rounded-2xl border border-ink-100 bg-white p-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <input
                      value={s.h}
                      onChange={(e) => {
                        const sections = [...draft.sections];
                        sections[i] = { ...s, h: e.target.value };
                        setDraft({ ...draft, sections });
                      }}
                      placeholder="Szekció-cím (opcionális)"
                      className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-ink-900"
                    />
                    {draft.sections.length > 1 && (
                      <button
                        onClick={() =>
                          setDraft({ ...draft, sections: draft.sections.filter((_, k) => k !== i) })
                        }
                        className="shrink-0 text-ink-400 hover:text-rose-600"
                        aria-label="Szekció törlése"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={s.text}
                    onChange={(e) => {
                      const sections = [...draft.sections];
                      sections[i] = { ...s, text: e.target.value };
                      setDraft({ ...draft, sections });
                    }}
                    rows={5}
                    placeholder="A szöveg. Új bekezdés = üres sor."
                    className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-ink-900"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setDraft({ ...draft, sections: [...draft.sections, { h: "", text: "" }] })
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-bold text-ink-700 transition hover:border-ink-900"
            >
              <Icon name="plus" size={14} strokeWidth={2.6} /> Szekció hozzáadása
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300"
            />
            Publikálás (látható lesz mindenkinek)
          </label>

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-950 bg-[#c8ff00] px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:brightness-95 disabled:opacity-50"
            >
              {saving ? "Mentés…" : "Mentés"}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-full border-2 border-ink-200 px-6 py-2.5 text-sm font-bold text-ink-700 transition hover:border-ink-900"
            >
              Mégse
            </button>
          </div>
        </div>
      ) : (
        /* ---------- Lista ---------- */
        <div className="mt-6 space-y-2">
          {posts === null && <p className="text-sm text-ink-400">Betöltés…</p>}
          {posts && posts.length === 0 && (
            <div className="rounded-2xl border border-ink-100 bg-ink-50 px-6 py-10 text-center text-sm text-ink-500">
              Még nincs cikk. Kattints az „Új cikk" gombra.
            </div>
          )}
          {(posts ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 shadow-soft"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold text-ink-900">{p.title}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.published ? "bg-[#c8ff00] text-ink-950" : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {p.published ? "Publikált" : "Piszkozat"}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">/blog/{p.slug}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {p.published && (
                  <Link href={`/blog/${p.slug}`} className="p-2 text-ink-400 hover:text-ink-900" aria-label="Megnyitás">
                    <Icon name="arrowUpRight" size={16} />
                  </Link>
                )}
                <button onClick={() => setDraft(toDraft(p))} className="p-2 text-ink-500 hover:text-ink-900" aria-label="Szerkesztés">
                  <Icon name="sliders" size={16} />
                </button>
                <button onClick={() => remove(p.id)} className="p-2 text-ink-400 hover:text-rose-600" aria-label="Törlés">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </span>
      {children}
    </label>
  );
}
