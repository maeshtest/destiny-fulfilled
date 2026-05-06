import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phone, phones, message, sender_id, message_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["pesaflux_api_key"]);

    const apiKey = settings?.find((s: any) => s.key === "pesaflux_api_key")?.value;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "PesaFlux API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint: string;
    let body: Record<string, any>;

    switch (action) {
      case "send":
        endpoint = "https://api.fluxsms.co.ke/sendsms";
        body = { api_key: apiKey, phone, message, sender_id: sender_id || "fluxsms" };
        break;
      case "bulk":
        endpoint = "https://api.fluxsms.co.ke/bulksms";
        body = { api_key: apiKey, phones, message, sender_id: sender_id || "fluxsms" };
        break;
      case "status":
        endpoint = "https://api.fluxsms.co.ke/smsstatus";
        body = { api_key: apiKey, message_id };
        break;
      case "balance":
        endpoint = "https://api.fluxsms.co.ke/check_sms_balanace";
        body = { api_key: apiKey };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: send, bulk, status, balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Log SMS sends
    if ((action === "send" || action === "bulk") && response.ok) {
      if (action === "send") {
        await supabase.from("sms_logs").insert({
          phone,
          message,
          sender_id: sender_id || "fluxsms",
          message_id: data.message_id || data.messageId || null,
          status: "sent",
          raw_response: data,
        });
      }
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
