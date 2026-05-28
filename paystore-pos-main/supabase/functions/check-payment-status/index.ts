import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { payment_id, store_code } = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing payment_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get payment record
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("id, status, provider_order_id, provider_payment_id, payment_mode, webhook_verified, amount, expires_at")
      .eq("id", payment_id)
      .maybeSingle();

    if (error || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry if pending
    if (payment.status === "pending" && payment.expires_at && new Date(payment.expires_at) < new Date()) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "expired" })
        .eq("id", payment.id);
      
      return new Response(
        JSON.stringify({ ...payment, status: "expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(payment),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-payment-status error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
