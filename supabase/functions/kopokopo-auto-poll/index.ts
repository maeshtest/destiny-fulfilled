// Automatic poller: iterates pending kopokopo_transactions (last 30 min)
// and queries Kopo Kopo for status, updating rows + linked donations.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KOPOKOPO_BASE = "https://api.kopokopo.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSetting(supabase: any, key: string): Promise<string | undefined> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single();
  return data?.value;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const startedAt = new Date().toISOString();
  const results: any[] = [];

  try {
    const [clientId, clientSecret] = await Promise.all([
      getSetting(supabaseAdmin, "kopokopo_client_id"),
      getSetting(supabaseAdmin, "kopokopo_client_secret"),
    ]);
    if (!clientId || !clientSecret) throw new Error("Kopo Kopo credentials not configured");

    // Pending rows from the last 30 minutes
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from("kopokopo_transactions")
      .select("id, donation_id, status, created_at")
      .eq("status", "pending")
      .gte("created_at", cutoff)
      .limit(50);
    if (fetchErr) throw fetchErr;

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, polled: 0, started_at: startedAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get a single token for the whole batch
    const tokenRes = await fetch(`${KOPOKOPO_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MaragaApp/1.0" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });
    if (!tokenRes.ok) throw new Error(`Auth failed: ${await tokenRes.text()}`);
    const { access_token } = await tokenRes.json();

    for (const row of pending) {
      try {
        const r = await fetch(`${KOPOKOPO_BASE}/api/v2/incoming_payments/${row.id}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: "application/json",
            "User-Agent": "MaragaApp/1.0",
          },
        });
        const json = await r.json().catch(() => ({}));
        const attrs = json?.data?.attributes ?? {};
        const gw = attrs?.status; // Success | Failed | Pending
        const newStatus = gw === "Success" ? "completed" : gw === "Failed" ? "failed" : "pending";

        const tillNumber = attrs?.till_number || attrs?.destination_till || null;

        await supabaseAdmin
          .from("kopokopo_transactions")
          .update({
            status: newStatus,
            raw_callback: attrs ?? json,
            updated_at: new Date().toISOString(),
            ...(tillNumber ? { till: tillNumber } : {}),
          })
          .eq("id", row.id);

        if (newStatus === "completed" && row.donation_id) {
          await supabaseAdmin
            .from("donations")
            .update({ status: "completed" })
            .eq("id", row.donation_id);
        }

        results.push({ id: row.id, gateway: gw, status: newStatus });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ id: row.id, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, polled: results.length, started_at: startedAt, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("kopokopo-auto-poll error:", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, started_at: startedAt, results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
