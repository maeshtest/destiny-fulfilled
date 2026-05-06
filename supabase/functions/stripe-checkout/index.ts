import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StripeCheckoutRequest {
  donationId: string;
  amount: number;
  currency: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Get Stripe secret key from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    const stripeSecretKey = settings?.value;

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({
          error: "Stripe is not configured. Please add your Stripe API key in the admin dashboard.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: StripeCheckoutRequest = await req.json();
    const { donationId, amount, currency, email, successUrl, cancelUrl } = body;

    // Convert currency code for Stripe
    const stripeCurrency = currency.toLowerCase();

    // Create Stripe checkout session
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": stripeCurrency,
        "line_items[0][price_data][unit_amount]": (amount * 100).toString(),
        "line_items[0][price_data][product_data][name]": "Campaign Donation",
        "line_items[0][price_data][product_data][description]": "Maraga 2027 Campaign Donation",
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: `${successUrl}?donation_id=${donationId}`,
        cancel_url: cancelUrl,
        ...(email && { customer_email: email }),
        "metadata[donation_id]": donationId,
      }),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error("Stripe error:", errorData);
      throw new Error(`Stripe API error: ${stripeResponse.status}`);
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in stripe-checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
