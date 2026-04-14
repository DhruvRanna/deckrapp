import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const WEBHOOK_SECRET = Deno.env.get("DODO_PAYMENTS_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Verify webhook signature
    const signature = req.headers.get("webhook-signature") || req.headers.get("x-webhook-signature") || "";
    const body = await req.text();
    
    // For now, parse the event. In production, verify the signature.
    const event = JSON.parse(body);
    console.log("Webhook event received:", event.event_type || event.type);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const eventType = event.event_type || event.type;
    const metadata = event.data?.metadata || event.metadata || {};
    const userId = metadata.user_id;
    const plan = metadata.plan;

    if (!userId) {
      console.log("No user_id in metadata, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (eventType) {
      case "subscription.active":
      case "payment.succeeded": {
        if (plan) {
          // Activate the plan for the user using service role (bypasses RLS trigger)
          const { error } = await supabase
            .from("profiles")
            .update({ plan: plan })
            .eq("user_id", userId);

          if (error) {
            console.error("Error updating plan:", error);
          } else {
            console.log(`Plan ${plan} activated for user ${userId}`);
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed": {
        // Downgrade to free
        const { error } = await supabase
          .from("profiles")
          .update({ plan: "FREE" })
          .eq("user_id", userId);

        if (error) {
          console.error("Error downgrading plan:", error);
        } else {
          console.log(`User ${userId} downgraded to FREE`);
        }
        break;
      }

      case "subscription.renewed": {
        console.log(`Subscription renewed for user ${userId}`);
        // Plan stays active, no action needed
        break;
      }

      case "subscription.on_hold": {
        console.log(`Subscription on hold for user ${userId}`);
        // Optionally downgrade or notify user
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});