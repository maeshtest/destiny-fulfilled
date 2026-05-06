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
    const { amount, msisdn, reference, donationId } = await req.json();

    if (!amount || !msisdn) {
      return new Response(
        JSON.stringify({ error: "Amount and phone number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch PesaFlux API settings from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["pesaflux_api_key", "pesaflux_email"]);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value || ""; });

    const apiKey = settingsMap.pesaflux_api_key;
    const email = settingsMap.pesaflux_email;

    if (!apiKey || !email) {
      return new Response(
        JSON.stringify({ error: "PesaFlux API not configured. Please set API key and email in admin settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number - ensure it starts with 254
    let formattedPhone = msisdn.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    const stkPayload = {
      api_key: apiKey,
      email: email,
      amount: String(amount),
      msisdn: formattedPhone,
      reference: reference || `DON-${Date.now()}`,
    };

    console.log("Sending STK push to PesaFlux:", { ...stkPayload, api_key: "[REDACTED]" });

    const stkResponse = await fetch("https://api.pesaflux.co.ke/v1/initiatestk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkResponse.json();
    console.log("PesaFlux STK response:", stkData);

    // Store transaction record
    const { data: txn, error: txnError } = await supabase
      .from("pesaflux_transactions")
      .insert({
        donation_id: donationId || null,
        transaction_request_id: stkData.transaction_request_id || stkData.TransactionRequestID || null,
        merchant_request_id: stkData.merchant_request_id || stkData.MerchantRequestID || null,
        checkout_request_id: stkData.checkout_request_id || stkData.CheckoutRequestID || null,
        amount: Number(amount),
        msisdn: formattedPhone,
        reference: reference || `DON-${Date.now()}`,
        status: "pending",
      })
      .select()
      .single();

    if (txnError) {
      console.error("Error saving transaction:", txnError);
    }

    return new Response(
      JSON.stringify({
        success: stkResponse.ok,
        transaction_id: txn?.id,
        transaction_request_id: stkData.transaction_request_id || stkData.TransactionRequestID,
        message: stkData.message || stkData.Message || "STK push sent",
        raw: stkData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("PesaFlux STK error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
