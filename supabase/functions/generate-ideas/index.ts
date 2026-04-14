import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CARD_COLORS = ["save", "script", "skip", "viral", "trend"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niches, platforms, count = 10 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const nicheStr = (niches || ["General"]).join(", ");
    const platStr = (platforms || ["YouTube Shorts"]).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a viral content strategist for 2026. You deeply understand current trending topics, viral formats, and what makes content go viral RIGHT NOW in April 2026 on each specific platform. You generate highly targeted, platform-specific content ideas that are FRESH, UNIQUE, and ACTIONABLE for creators.

CRITICAL RULES:
1. Generate ideas ONLY for: ${platStr}. Do NOT generate for other platforms.
2. Focus ONLY on niches: ${nicheStr}. Every idea must be deeply relevant.
3. ALL ideas must be for 2026 — reference current trends, events, algorithm changes, cultural moments of 2026.
4. Ideas must be UNIQUE — not generic recycled advice. Think like a top creator who studies analytics daily.
5. Each idea should feel like it could genuinely go viral TODAY on that specific platform.

PLATFORM TITLE LENGTH RULES:
- YouTube (long-form): 8-15 words, descriptive, SEO-friendly, clickbait-worthy
- YouTube Shorts: 5-8 words, punchy and curiosity-driven
- TikTok: 4-7 words, trendy and scroll-stopping
- Instagram Reels: 5-8 words, aesthetic and engaging

CONTENT TYPES TO MIX:
- YouTube long-form: In-depth tutorials, reviews, comparisons, challenges, experiments, "I tried X"
- YouTube Shorts: Quick tips, shocking facts, mini tutorials, before/after, myth-busting
- TikTok: Trending formats, POV content, quick hacks, relatable moments, hot takes
- Instagram: Reels trends, carousel-worthy topics, aesthetic content, tips

HOOK QUALITY:
- Must be SCROLL-STOPPING — use curiosity gaps, shocking stats, bold claims, personal stories
- First line should make someone STOP scrolling immediately
- Use proven psychological triggers: fear of missing out, curiosity, controversy, transformation

INSIGHT QUALITY:
- Explain WHY this specific format/angle works on this platform in 2026
- Reference algorithm preferences, audience behavior patterns, trending content styles`,
          },
          {
            role: "user",
            content: `Generate ${count} viral content ideas for ${nicheStr} creators posting on ${platStr} in April 2026. Each idea must be specifically tailored for the platform's format, audience, and current algorithm. Make them trending, unique, and highly actionable. Include a mix of content types.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_ideas",
            description: "Return content ideas array",
            parameters: {
              type: "object",
              properties: {
                ideas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string", description: "Target platform e.g. YOUTUBE SHORTS, TIKTOK, YOUTUBE, INSTAGRAM" },
                      title: { type: "string", description: "Platform-appropriate title" },
                      hook: { type: "string", description: "Opening hook line (1-2 sentences, scroll-stopping)" },
                      insight: { type: "string", description: "Why this content works on this specific platform in 2026" },
                      tags: { type: "array", items: { type: "string" }, description: "3-4 tags like SHORT VIDEO, 60S, LOW COMPETITION, TRENDING" },
                      duration: { type: "string", description: "e.g. 30s, 60s, 10min, 15min, 20min" },
                      competition: { type: "string", enum: ["Low", "Medium", "High"] },
                      viralScore: { type: "number", description: "Score from 75-99" },
                      thumbnailIdea: { type: "string", description: "Vivid thumbnail concept" },
                    },
                    required: ["platform", "title", "hook", "insight", "tags", "duration", "competition", "viralScore", "thumbnailIdea"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ideas"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_ideas" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited." }), {
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

    const { ideas } = JSON.parse(toolCall.function.arguments);
    const enriched = ideas.map((idea: any, i: number) => ({
      ...idea,
      id: crypto.randomUUID(),
      color: CARD_COLORS[i % CARD_COLORS.length],
    }));

    return new Response(JSON.stringify({ ideas: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ideas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
