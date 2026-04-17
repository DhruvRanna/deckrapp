import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWithFallback, AllProvidersFailedError } from "../_shared/aiProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function templateScript(title: string, platform: string, hook: string, niche: string, duration: string) {
  const cleanHook = hook || `Most people get ${niche} completely wrong.`;
  return {
    hookText: cleanHook,
    bodyText: `[OPEN — 0-3s]\n${cleanHook} Stop scrolling — this matters.\n\n[MIDDLE — main value]\nHere are 3 things nobody tells you about ${title.toLowerCase()}:\n1. The first thing most people miss is the foundation — without it, nothing else works.\n2. Then comes the part that actually moves the needle. Most creators skip straight to this and wonder why it fails.\n3. Finally, the small detail that 10x's everything once you understand it.\n\n[CLOSE]\nIf this hit, follow for more ${niche} breakdowns. Save this so you don't forget.`,
    ctaText: `Follow for more ${niche} content. Comment "YES" if you're trying this.`,
    deliveryTip: `Shoot in vertical 9:16 for ${platform}. Look directly into the camera for the hook. Use quick cuts every 1.5-2s to keep retention high. Add bold on-screen text for each numbered point.`,
    hashtags: [niche.replace(/\s+/g, ""), platform.replace(/\s+/g, ""), "ContentCreator", "Viral", "FYP", "Trending2026", "CreatorTips", "Shorts"],
    thumbnailIdea: `Bold contrasting colors. Your face on the left with a shocked/intense expression. Big block text on the right reading "${title.split(" ").slice(0, 4).join(" ").toUpperCase()}". Add a red circle/arrow highlighting one key element.`,
    captionIdea: `${cleanHook} 🔥\n\nThe truth about ${niche} that nobody is talking about. Save this for later 👇\n\n#${niche.replace(/\s+/g, "")} #${platform.replace(/\s+/g, "")}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, platform, hook, duration, niche } = await req.json();

    const systemPrompt = `You are a professional content script writer and social media strategist. Generate engaging, platform-optimized scripts with complete creator resources.

Return these fields via the tool call:
- hookText: opening hook (first 3 seconds)
- bodyText: main script body with [OPEN], [MIDDLE], [CLOSE] sections and scene directions
- ctaText: compelling call-to-action
- deliveryTip: camera/delivery advice
- hashtags: 8-12 relevant trending hashtags (without # symbol)
- thumbnailIdea: detailed thumbnail concept
- captionIdea: ready-to-post caption with emojis

Tone: energetic, authentic, optimized for ${platform}. Duration: ${duration}. Niche: ${niche}. Make this script feel UNIQUE — not generic.`;

    try {
      const script = await generateWithFallback({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a complete script and creator resources for:\nTitle: "${title}"\nHook: "${hook}"\nPlatform: ${platform}\nNiche: ${niche}\nDuration: ${duration}` },
        ],
        tool: {
          name: "generate_script",
          description: "Generate a structured content script with creator resources",
          parameters: {
            type: "object",
            properties: {
              hookText: { type: "string" },
              bodyText: { type: "string" },
              ctaText: { type: "string" },
              deliveryTip: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
              thumbnailIdea: { type: "string" },
              captionIdea: { type: "string" },
            },
            required: ["hookText", "bodyText", "ctaText", "deliveryTip", "hashtags", "thumbnailIdea", "captionIdea"],
            additionalProperties: false,
          },
        },
        temperature: 0.9,
      });

      return new Response(JSON.stringify({ ...script, fallback: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      // Graceful fallback: deliver a template script so the user always gets something.
      const reason = e instanceof AllProvidersFailedError ? e.reason : "generic";
      console.warn("[generate-script] using template fallback:", reason, (e as Error).message);
      const tpl = templateScript(title, platform, hook, niche || "Content", duration || "60s");
      return new Response(JSON.stringify({ ...tpl, fallback: true, reason }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
