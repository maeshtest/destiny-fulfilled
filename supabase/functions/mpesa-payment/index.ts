import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MpesaRequest {
  donationId: string;
  amount: number;
  phone: string;
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

    // Get M-Pesa credentials from site_settings
    const { data: paybillSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "mpesa_paybill")
      .single();

    const { data: accountSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "mpesa_account")
      .single();

    const paybill = paybillSetting?.value;
    const account = accountSetting?.value;

    if (!paybill) {
      return new Response(
        JSON.stringify({
          error: "M-Pesa is not configured. Please add your M-Pesa Paybill number in the admin dashboard.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MpesaRequest = await req.json();
    const { donationId, amount, phone } = body;

    // Format phone number for M-Pesa (Kenya format)
    let formattedPhone = phone.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // For now, return instructions for manual payment
    // Full M-Pesa Daraja API integration would require:
    // 1. Consumer Key and Consumer Secret from Safaricom
    // 2. Shortcode (Paybill or Till Number)
    // 3. Passkey for Lipa Na M-Pesa Online
    // 4. Callback URL for payment confirmation

    const instructions = {
      method: "paybill",
      paybill: paybill,
      account: account || donationId.substring(0, 8).toUpperCase(),
      amount: amount,
      phone: formattedPhone,
      instructions: [
        "Go to M-Pesa on your phone",
        "Select Lipa na M-Pesa",
        "Select Pay Bill",
        `Enter Business Number: ${paybill}`,
        `Enter Account Number: ${account || donationId.substring(0, 8).toUpperCase()}`,
        `Enter Amount: ${amount}`,
        "Enter your M-Pesa PIN",
        "Confirm the transaction",
      ],
    };

    // Update donation with pending status
    await supabase
      .from("donations")
      .update({ status: "pending" })
      .eq("id", donationId);

    return new Response(
      JSON.stringify({ success: true, instructions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in mpesa-payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
