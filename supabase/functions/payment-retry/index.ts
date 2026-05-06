import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { donationId, provider } = await req.json();
    if (!donationId || !provider) return new Response(JSON.stringify({ error: "donationId and provider required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const baseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let body: Record<string, unknown> = { donationId };
    let fnName = "kopokopo-status";

    if (provider === "pesaflux") {
      fnName = "pesaflux-status";
      const { data: txn } = await supabase.from("pesaflux_transactions")
        .select("transaction_request_id").eq("donation_id", donationId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!txn?.transaction_request_id) {
        return new Response(JSON.stringify({ error: "No pesaflux transaction found for donation" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      body = { transaction_request_id: txn.transaction_request_id };
    }

    const r = await fetch(`${baseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return new Response(JSON.stringify({ ok: true, result: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
