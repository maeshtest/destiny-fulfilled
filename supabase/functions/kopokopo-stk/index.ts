import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KOPOKOPO_BASE = "https://api.kopokopo.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getSetting(supabase: any, key: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error || !data) return undefined;
  return data.value;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      amount,
      msisdn,
      reference,
      donationId,
      firstName = "Donor",
      lastName = "User",
      email = "",
    } = body;

    if (!amount || !msisdn) {
      throw new Error("Missing amount or phone number (msisdn)");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [clientId, clientSecret, tillNumber] = await Promise.all([
      getSetting(supabaseAdmin, "kopokopo_client_id"),
      getSetting(supabaseAdmin, "kopokopo_client_secret"),
      getSetting(supabaseAdmin, "kopokopo_till_number"),
    ]);

    if (!clientId || !clientSecret || !tillNumber) {
      throw new Error("Kopo Kopo credentials not configured in site_settings");
    }

    const tokenRes = await fetch(`${KOPOKOPO_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MaragaApp/1.0",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Auth failed (${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No access token returned");

    const phoneWithPlus = msisdn.startsWith("+") ? msisdn : `+${msisdn}`;
    const payload = {
      payment_channel: "M-PESA STK Push",
      till_number: tillNumber,
      subscriber: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneWithPlus,
        email: email || undefined,
      },
      amount: {
        currency: "KES",
        value: amount,
      },
      metadata: {
        reference: reference || "",
        donation_id: donationId,
      },
      _links: {
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/kopokopo-webhook`,
      },
    };

    const stkRes = await fetch(`${KOPOKOPO_BASE}/api/v2/incoming_payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "MaragaApp/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (!stkRes.ok) {
      const errText = await stkRes.text();
      throw new Error(`STK push failed (${stkRes.status}): ${errText}`);
    }

    const location = stkRes.headers.get("Location");
    const transactionId = location?.split("/").pop() ?? "";

    if (transactionId) {
      await supabaseAdmin.from("kopokopo_transactions").insert({
        id: transactionId,
        donation_id: donationId,
        amount,
        msisdn,
        status: "pending",
        reference,
      });
    }

    return new Response(
      JSON.stringify({ success: true, transaction_id: transactionId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("kopokopo-stk error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
