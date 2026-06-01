import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ For production, change to https://api.kopokopo.com
const KOPOKOPO_BASE = "https://api.kopokopo.com";

// CORS headers that allow the Supabase client's default headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSetting(supabase: any, key: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error || !data) return undefined;
  return data.value;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { transactionId } = await req.json();
    if (!transactionId) throw new Error("Missing transactionId");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [clientId, clientSecret] = await Promise.all([
      getSetting(supabaseAdmin, "kopokopo_client_id"),
      getSetting(supabaseAdmin, "kopokopo_client_secret"),
    ]);

    if (!clientId || !clientSecret) {
      throw new Error("Kopo Kopo credentials not configured");
    }

    // Get fresh token
    const tokenRes = await fetch(`${KOPOKOPO_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MaragaApp/1.0",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Auth failed (${tokenRes.status}): ${errText}`);
    }
    const { access_token } = await tokenRes.json();

    // Query the incoming payment status
    const statusRes = await fetch(
      `${KOPOKOPO_BASE}/api/v2/incoming_payments/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/json",
          "User-Agent": "MaragaApp/1.0",
        },
      }
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      throw new Error(`Status check failed (${statusRes.status}): ${errText}`);
    }

    const result = await statusRes.json();
    const attributes = result?.data?.attributes;
    const paymentStatus = attributes?.status; // "Success", "Failed", "Pending"
    const eventResource = attributes?.event?.resource ?? {};
    const errorMsg =
      attributes?.event?.errors ||
      eventResource?.error_description ||
      attributes?.metadata?.message ||
      null;

    // Always record the poll: bump updated_at, store latest raw response
    const newStatus =
      paymentStatus === "Success"
        ? "completed"
        : paymentStatus === "Failed"
        ? "failed"
        : "pending";

    await supabaseAdmin
      .from("kopokopo_transactions")
      .update({
        status: newStatus,
        raw_callback: attributes ?? result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (paymentStatus === "Success") {
      const { data: txn } = await supabaseAdmin
        .from("kopokopo_transactions")
        .select("donation_id")
        .eq("id", transactionId)
        .single();
      if (txn?.donation_id) {
        await supabaseAdmin
          .from("donations")
          .update({ status: "completed" })
          .eq("id", txn.donation_id);
      }
    }

    return new Response(
      JSON.stringify({
        status: newStatus,
        gateway_status: paymentStatus,
        error: errorMsg,
        raw: attributes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("kopokopo-status error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ status: "error", error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
