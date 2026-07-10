// Supabase Edge Function — "stripe-webhook"
// Stripe hívja fizetés után. Ellenőrzi az aláírást (STRIPE_WEBHOOK_SECRET),
// és checkout.session.completed esetén beállítja a hirdetés featured_until
// mezőjét + a fizetést 'paid'-re. verify_jwt = false (Stripe nem küld JWT-t).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const encoder = new TextEncoder();

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${t}.${payload}`));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // konstans-idejű összehasonlítás
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("no_webhook_secret", { status: 501 });

  const sig = req.headers.get("Stripe-Signature") ?? "";
  const payload = await req.text();
  const ok = await verifyStripeSignature(payload, sig, secret);
  if (!ok) return new Response("bad_signature", { status: 400 });

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") {
    return new Response("ignored", { status: 200 });
  }

  const session = event.data.object;
  const md = session.metadata ?? {};
  const listingId = md.listing_id;
  const days = Number(md.days ?? 0);
  if (!listingId || !days) return new Response("no_metadata", { status: 200 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("listings").update({ featured_until: until }).eq("id", listingId);
  await admin
    .from("payments")
    .update({ status: "paid" })
    .eq("stripe_session_id", session.id);

  return new Response("ok", { status: 200 });
});
