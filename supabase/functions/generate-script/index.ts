import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, platform, hook, duration, niche } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional content script writer and social media strategist. Generate engaging, platform-optimized scripts with complete creator resources.

Return JSON with these fields:
- hookText: The opening hook (first 3 seconds)
- bodyText: The main script body with [OPEN], [MIDDLE], [CLOSE] sections and scene directions
- ctaText: A compelling call-to-action
- deliveryTip: Camera/delivery advice for the creator
- hashtags: Array of 8-12 relevant trending hashtags (without # symbol)
- thumbnailIdea: A detailed thumbnail concept (text overlay, expression, colors, layout)
- captionIdea: A ready-to-post caption/description for the video (2-3 lines with emojis)

Keep the tone energetic, authentic, and optimized for ${platform}. Duration target: ${duration}. Niche: ${niche}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a complete script and creator resources for:\nTitle: "${title}"\nHook: "${hook}"\nPlatform: ${platform}\nNiche: ${niche}\nDuration: ${duration}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_script",
            description: "Generate a structured content script with creator resources",
            parameters: {
              type: "object",
              properties: {
                hookText: { type: "string", description: "The opening hook section" },
                bodyText: { type: "string", description: "The main script body with scene directions" },
                ctaText: { type: "string", description: "Call to action text" },
                deliveryTip: { type: "string", description: "Camera and delivery advice" },
                hashtags: { type: "array", items: { type: "string" }, description: "8-12 trending hashtags without # symbol" },
                thumbnailIdea: { type: "string", description: "Detailed thumbnail concept" },
                captionIdea: { type: "string", description: "Ready-to-post video caption/description" },
              },
              required: ["hookText", "bodyText", "ctaText", "deliveryTip", "hashtags", "thumbnailIdea", "captionIdea"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_script" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const script = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(script), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
