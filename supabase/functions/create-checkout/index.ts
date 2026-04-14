import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs - you need to create these in Dodo Payments dashboard
// and replace with actual product IDs
const PLAN_PRODUCTS: Record<string, { monthly: string; yearly: string }> = {
  CREATOR: {
    monthly: "pdt_0NcfMt0cDXhPtajGfPDJ3",
    yearly: "pdt_0NcfNQ6k6AqTZGRLSMWzA",
  },
  PRO: {
    monthly: "pdt_0NcfN6wjDJH4MQWmDJ2je",
    yearly: "pdt_0NcfNVH2PTbMFOMqNYyl6",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const DODO_API_KEY = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!DODO_API_KEY) throw new Error("DODO_PAYMENTS_API_KEY is not configured");

    const { plan, billing, email, name, userId } = await req.json();
    
    if (!plan || !billing || !email || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields: plan, billing, email, userId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = PLAN_PRODUCTS[plan];
    if (!productMap) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = billing === "yearly" ? productMap.yearly : productMap.monthly;

    // Live mode API
    const baseUrl = "https://live.dodopayments.com";

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DODO_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email,
          name: name || email.split("@")[0],
        },
        payment_link: true,
        return_url: `${req.headers.get("origin") || "https://deckrapp.lovable.app"}/profile?payment=success&plan=${plan}`,
        metadata: {
          user_id: userId,
          plan: plan,
          billing: billing,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dodo API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `Payment service error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ checkout_url: data.checkout_url, session_id: data.session_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});