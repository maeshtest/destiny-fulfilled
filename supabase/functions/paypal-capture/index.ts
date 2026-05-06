import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CaptureRequest {
  orderId: string;
  donationId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PayPal credentials
    const { data: clientIdSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "paypal_client_id")
      .single();

    const { data: secretSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "paypal_secret")
      .single();

    const clientId = clientIdSetting?.value;
    const clientSecret = secretSetting?.value;

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    const body: CaptureRequest = await req.json();
    const { orderId, donationId } = body;

    // Get access token
    const authResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await authResponse.json();

    // Capture the payment
    const captureResponse = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error("PayPal capture error:", errorData);
      throw new Error(`PayPal capture failed: ${captureResponse.status}`);
    }

    const captureData = await captureResponse.json();

    // Update donation status
    if (captureData.status === "COMPLETED") {
      await supabase
        .from("donations")
        .update({
          status: "completed",
          transaction_id: orderId,
        })
        .eq("id", donationId);
    }

    return new Response(
      JSON.stringify({ success: true, status: captureData.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in paypal-capture:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
