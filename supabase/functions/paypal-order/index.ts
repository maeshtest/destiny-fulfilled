import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PayPalOrderRequest {
  donationId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
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

    // Get PayPal credentials from site_settings
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
      return new Response(
        JSON.stringify({
          error: "PayPal is not configured. Please add your PayPal API credentials in the admin dashboard.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: PayPalOrderRequest = await req.json();
    const { donationId, amount, currency, returnUrl, cancelUrl } = body;

    // Get PayPal access token
    const authResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate with PayPal");
    }

    const { access_token } = await authResponse.json();

    // Create PayPal order
    const orderResponse = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: donationId,
            description: "Maraga 2027 Campaign Donation",
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Maraga 2027",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: `${returnUrl}?donation_id=${donationId}`,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("PayPal error:", errorData);
      throw new Error(`PayPal API error: ${orderResponse.status}`);
    }

    const order = await orderResponse.json();
    const approvalUrl = order.links.find((link: any) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({ orderId: order.id, approvalUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in paypal-order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
