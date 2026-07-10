// Supabase Edge Function — "stripe-checkout"
// Bejelentkezett felhasználó egy SAJÁT hirdetését kiemelheti. Létrehoz egy
// Stripe Checkout Session-t, naplóz egy 'pending' fizetést, és visszaadja a
// fizetési URL-t. STRIPE_SECRET_KEY nélkül 501 (a kliens elrejti a gombot).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Kiemelési csomagok (ár centben, EUR).
const PLANS: Record<string, { amount: number; days: number; label: string }> = {
  feature_7d: { amount: 900, days: 7, label: "Kiemelés 7 napra" },
  feature_30d: { amount: 2900, days: 30, label: "Kiemelés 30 napra" }
};

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://jadran.vercel.app";

function form(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "no_stripe_key" }), {
      status: 501,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  let listingId = "";
  let plan = "";
  try {
    const body = await req.json();
    listingId = String(body.listingId ?? "");
    plan = String(body.plan ?? "");
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const planDef = PLANS[plan];
  if (!listingId || !planDef) {
    return new Response(JSON.stringify({ error: "invalid_plan" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // Ki a hívó? (a saját JWT-jével)
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData } = await userClient.auth.getUser();
  const authId = userData.user?.id;
  if (!authId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // Service role kliens az ellenőrzéshez és íráshoz.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authId)
    .maybeSingle();
  const profileId = prof?.id;
  if (!profileId) {
    return new Response(JSON.stringify({ error: "no_profile" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, owner_id, title")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.owner_id !== profileId) {
    return new Response(JSON.stringify({ error: "not_owner" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // Stripe Checkout Session
  const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": String(planDef.amount),
      "line_items[0][price_data][product_data][name]": planDef.label,
      success_url: `${SITE_URL}/listing/${listingId}?featured=1`,
      cancel_url: `${SITE_URL}/listing/${listingId}?featured=0`,
      "metadata[listing_id]": listingId,
      "metadata[profile_id]": profileId,
      "metadata[kind]": plan,
      "metadata[days]": String(planDef.days)
    })
  });

  const session = await stripeResp.json();
  if (!stripeResp.ok) {
    return new Response(JSON.stringify({ error: "stripe_error", detail: session }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }

  // 'pending' fizetés naplózása
  await admin.from("payments").insert({
    id: `pay-${session.id}`,
    user_id: profileId,
    listing_id: listingId,
    kind: plan,
    amount: planDef.amount,
    currency: "eur",
    stripe_session_id: session.id,
    status: "pending"
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...cors, "Content-Type": "application/json" }
  });
});
