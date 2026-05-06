import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Parse the webhook event
    const body = await req.json();
    const eventType = body.type;

    console.log("Received Stripe webhook:", eventType);

    if (eventType === "checkout.session.completed") {
      const session = body.data.object;
      const donationId = session.metadata?.donation_id;

      if (donationId) {
        // Update donation status to completed
        const { error } = await supabase
          .from("donations")
          .update({
            status: "completed",
            transaction_id: session.payment_intent || session.id,
          })
          .eq("id", donationId);

        if (error) {
          console.error("Error updating donation:", error);
          throw error;
        }

        console.log(`Donation ${donationId} marked as completed`);
      }
    } else if (eventType === "payment_intent.payment_failed") {
      const paymentIntent = body.data.object;
      const donationId = paymentIntent.metadata?.donation_id;

      if (donationId) {
        await supabase
          .from("donations")
          .update({ status: "failed" })
          .eq("id", donationId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in stripe-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
