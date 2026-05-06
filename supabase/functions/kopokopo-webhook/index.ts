import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kopokopo-signature",
};

async function verifySignature(rawBody: string, signature: string, apiKey: string): Promise<boolean> {
  if (!signature || !apiKey) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(apiKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Read K2 API key (used as HMAC signing secret) from site_settings, with env fallback
  let apiKey = Deno.env.get("K2_API_KEY") ?? "";
  try {
    const { data: keyRow } = await supabase
      .from("site_settings").select("value").eq("key", "kopokopo_api_key").maybeSingle();
    if (keyRow?.value) apiKey = keyRow.value;
  } catch (_) { /* ignore */ }
  const signature = req.headers.get("x-kopokopo-signature") ?? "";
  const rawBody = await req.text();

  let payload: any = {};
  try { payload = JSON.parse(rawBody); } catch { /* */ }
  const valid = await verifySignature(rawBody, signature, apiKey);

  // Determine event type & resource
  const topic = payload.topic ?? payload.data?.type ?? "unknown";
  const gatewayEventId = payload.id ?? payload.data?.id ?? null;
  const resource = payload.event?.resource ?? payload.data?.attributes?.event?.resource ?? null;
  const status = (payload.data?.attributes?.status ?? resource?.status ?? "").toLowerCase();
  const reference = resource?.reference ?? null;
  const amount = resource?.amount ? Number(resource.amount) : null;
  const k2ResourceId = resource?.id ?? null;
  const metadata = payload.data?.attributes?.metadata ?? {};
  const donationIdFromMeta = metadata?.donation_id || null;

  let processError: string | null = null;
  let donationId: string | null = donationIdFromMeta;

  try {
    if (!valid) throw new Error("Invalid signature");

    // Find matching kopokopo_transaction
    let txn: any = null;
    if (k2ResourceId) {
      const { data } = await supabase.from("kopokopo_transactions").select("*").eq("k2_payment_id", k2ResourceId).maybeSingle();
      txn = data;
    }
    if (!txn && reference) {
      const { data } = await supabase.from("kopokopo_transactions").select("*").eq("reference", reference).maybeSingle();
      txn = data;
    }
    if (!txn && donationId) {
      const { data } = await supabase.from("kopokopo_transactions").select("*").eq("donation_id", donationId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      txn = data;
    }

    const newStatus = ["success", "received", "complete", "completed"].includes(status) ? "completed"
      : ["failed", "reversed"].includes(status) ? "failed" : "pending";

    if (txn) {
      donationId = donationId || txn.donation_id;
      // Idempotency: skip if already in final state with same gateway_event_id
      if (txn.gateway_event_id && txn.gateway_event_id === gatewayEventId) {
        // already processed
      } else {
        await supabase.from("kopokopo_transactions").update({
          status: newStatus,
          gateway_event_id: gatewayEventId,
          raw_callback: payload,
          updated_at: new Date().toISOString(),
        }).eq("id", txn.id);
      }
    }

    if (donationId && newStatus !== "pending") {
      await supabase.from("donations").update({
        status: newStatus,
        transaction_id: reference,
      }).eq("id", donationId);
    }

    await supabase.from("webhook_logs").insert({
      provider: "kopokopo",
      event_type: topic,
      donation_id: donationId,
      payload,
      signature_valid: valid,
      processed: true,
    });
  } catch (e) {
    processError = e instanceof Error ? e.message : String(e);
    await supabase.from("webhook_logs").insert({
      provider: "kopokopo",
      event_type: topic,
      donation_id: donationId,
      payload,
      signature_valid: valid,
      processed: false,
      error: processError,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
