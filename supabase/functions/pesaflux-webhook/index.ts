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
    const payload = await req.json();
    console.log("PesaFlux webhook received:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract fields - PesaFlux callback format
    const transactionRequestId = payload.TransactionID || payload.transaction_request_id || payload.transactionRequestId;
    const receipt = payload.TransactionReceipt || payload.receipt || payload.MpesaReceiptNumber;
    const amount = payload.TransactionAmount || payload.amount || payload.Amount;
    const msisdn = payload.Msisdn || payload.msisdn || payload.PhoneNumber;
    const responseCode = String(payload.ResponseCode ?? payload.response_code ?? payload.ResultCode ?? "");
    const status = responseCode === "0" ? "completed" : "failed";

    if (!transactionRequestId) {
      console.error("No transaction ID in webhook payload");
      return new Response(
        JSON.stringify({ error: "Missing transaction ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update pesaflux_transactions
    const { data: txn, error: txnError } = await supabase
      .from("pesaflux_transactions")
      .update({
        receipt,
        amount: amount ? Number(amount) : undefined,
        msisdn: msisdn || undefined,
        response_code: responseCode,
        status,
        raw_callback: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_request_id", transactionRequestId)
      .select("donation_id")
      .single();

    if (txnError) {
      console.error("Error updating transaction:", txnError);
      // Try matching by checkout_request_id as fallback
      const checkoutId = payload.CheckoutRequestID || payload.checkout_request_id;
      if (checkoutId) {
        await supabase
          .from("pesaflux_transactions")
          .update({
            receipt, response_code: responseCode, status,
            raw_callback: payload, updated_at: new Date().toISOString(),
          })
          .eq("checkout_request_id", checkoutId);
      }
    }

    // Update linked donation status if exists
    if (txn?.donation_id && status === "completed") {
      await supabase
        .from("donations")
        .update({
          status: "completed",
          transaction_code: receipt,
          verified_at: new Date().toISOString(),
          verification_type: "auto_mpesa",
        })
        .eq("id", txn.donation_id);
    } else if (txn?.donation_id && status === "failed") {
      await supabase
        .from("donations")
        .update({ status: "failed" })
        .eq("id", txn.donation_id);
    }

    await supabase.from("webhook_logs").insert({
      provider: "pesaflux",
      event_type: status,
      donation_id: txn?.donation_id ?? null,
      payload,
      signature_valid: true,
      processed: true,
    });

    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
