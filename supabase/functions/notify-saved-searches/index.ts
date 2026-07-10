// Supabase Edge Function — "notify-saved-searches"
// Végigmegy az értesítést kérő mentett kereséseken, megkeresi az azóta feltöltött
// (last_notified_at utáni) illeszkedő aktív hirdetéseket, és e-mailt küld a
// felhasználónak (Resend). RESEND_API_KEY nélkül 501. Cron hívja (lásd
// supabase/cron.sql). Védelem: ha CRON_SECRET be van állítva, kötelező a
// megegyező x-cron-secret fejléc.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// A kereső-lekérdezés (URLSearchParams string) illesztése egy DB-hirdetés-sorra.
function matches(l: Record<string, any>, p: URLSearchParams): boolean {
  const s = (k: string) => p.get(k) || "";
  const n = (k: string) => Number(p.get(k));
  if (l.status !== "active") return false;
  if (s("mode") && l.mode !== s("mode")) return false;
  if (s("city") && l.city !== s("city")) return false;
  if (s("type") && l.type !== s("type")) return false;
  if (s("view") && l.view !== s("view")) return false;
  if (s("condition") && l.condition !== s("condition")) return false;
  if (s("priceMin") && Number(l.price) < n("priceMin")) return false;
  if (s("priceMax") && Number(l.price) > n("priceMax")) return false;
  if (s("roomsMin") && Number(l.rooms) < n("roomsMin")) return false;
  if (s("roomsMax") && Number(l.rooms) > n("roomsMax")) return false;
  if (s("areaMin") && Number(l.area) < n("areaMin")) return false;
  if (s("areaMax") && Number(l.area) > n("areaMax")) return false;
  if (s("maxSeaDist") && Number(l.distance_to_sea) > n("maxSeaDist")) return false;
  if (s("energyClass") && l.energy !== s("energyClass")) return false;
  if (s("verifiedOnly") === "1" && l.verification === "none") return false;
  if (s("furnished") === "1" && !l.furnished) return false;
  if (s("amenities")) {
    const need = s("amenities").split(",").filter(Boolean);
    const have: string[] = l.amenities ?? [];
    if (!need.every((a) => have.includes(a))) return false;
  }
  const q = s("q").trim().toLowerCase();
  if (q) {
    const t = l.title ?? {};
    const hay = `${l.city} ${l.district} ${t.hu} ${t.me} ${t.en} ${t.ru} ${l.agency}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jadran.vercel.app";

Deno.serve(async (req: Request) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response(JSON.stringify({ error: "no_resend_key" }), { status: 501 });

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("unauthorized", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: searches } = await admin
    .from("saved_searches")
    .select("id, user_id, label, query, last_notified_at, profiles(email, name)")
    .eq("notify", true);
  if (!searches?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const { data: listings } = await admin
    .from("listings")
    .select("*")
    .eq("status", "active");
  const all = listings ?? [];

  const from = Deno.env.get("RESEND_FROM") ?? "Jadran <onboarding@resend.dev>";
  let sent = 0;

  for (const ss of searches) {
    const email = (ss as any).profiles?.email;
    if (!email) continue;
    const since = new Date(ss.last_notified_at).getTime();
    const params = new URLSearchParams(ss.query);
    const fresh = all.filter(
      (l) => new Date(l.created_at).getTime() > since && matches(l, params)
    );
    if (!fresh.length) continue;

    const rows = fresh
      .slice(0, 10)
      .map((l) => {
        const title = (l.title?.hu ?? "Hirdetés") as string;
        const price = new Intl.NumberFormat("hu-HU").format(Number(l.price));
        return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">
          <a href="${SITE_URL}/listing/${l.id}" style="color:#0f172a;font-weight:600;text-decoration:none">${title}</a>
          <div style="color:#64748b;font-size:13px">${l.city} · ${price} €</div></td></tr>`;
      })
      .join("");

    const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#0f172a">${fresh.length} új találat a keresésedre</h2>
      <p style="color:#475569">„${ss.label}" — új hirdetések Montenegróban:</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <p style="margin-top:20px"><a href="${SITE_URL}/search?${ss.query}"
        style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Összes megtekintése</a></p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Jadran · leiratkozás a profilod beállításaiban.</p>
    </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${fresh.length} új ingatlan a keresésedre — Jadran`,
        html
      })
    });
    if (r.ok) {
      sent++;
      await admin
        .from("saved_searches")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", ss.id);
    }
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
