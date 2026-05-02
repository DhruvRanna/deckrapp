import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWithFallback, AllProvidersFailedError } from "../_shared/aiProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isTextPostPlatform(platform: string): "linkedin" | "twitter" | null {
  const p = (platform || "").toLowerCase();
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("twitter") || p === "x" || p.includes("/x") || p.includes("x ")) return "twitter";
  return null;
}

function templateScript(title: string, platform: string, hook: string, niche: string, duration: string) {
  const cleanHook = hook || `Most people get ${niche} completely wrong.`;
  const kind = isTextPostPlatform(platform);

  if (kind === "linkedin") {
    const body = `${cleanHook}\n\nHere's what most people in ${niche} get wrong about ${title.toLowerCase()} 👇\n\n1. They focus on the surface, not the system.\n2. They copy what worked yesterday — not what works today.\n3. They quit right before the compounding kicks in.\n\nThe shift? Stop chasing tactics. Start building one repeatable habit that you can run every single week.\n\nThat's the difference between people who plateau and people who break out.\n\nIf this resonated, share it with someone in ${niche} who needs to read it today.`;
    return {
      hookText: cleanHook,
      bodyText: body,
      ctaText: `What's ONE thing you wish you knew earlier about ${niche}? Drop it in the comments 👇`,
      deliveryTip: `LinkedIn post format: short paragraphs (1-2 lines each), generous line breaks for mobile readability, 1-2 emojis max, end with an open question to drive comments. Post Tue–Thu, 8–10am for max reach.`,
      hashtags: [niche.replace(/\s+/g, ""), "LinkedIn", "Leadership", "CareerGrowth", "Mindset", "PersonalBrand", "Founders"],
      thumbnailIdea: `Optional carousel cover: solid brand color, bold serif headline "${title.slice(0, 50)}", small "Swipe →" hint bottom-right.`,
      captionIdea: body,
    };
  }

  if (kind === "twitter") {
    const body = `${cleanHook}\n\n—\n\n3 things nobody tells you about ${title.toLowerCase()}:\n\n1/ The foundation matters more than the hack.\n2/ Consistency beats intensity, every time.\n3/ The small detail at the end is what 10x's it.\n\nSteal this and run it for 30 days. Thank me later.`;
    return {
      hookText: cleanHook,
      bodyText: body,
      ctaText: `RT if this helped. Follow @you for more ${niche} threads.`,
      deliveryTip: `X/Twitter post: keep under 280 chars per tweet. If longer, format as a thread (1/, 2/, 3/). Hook line MUST stop the scroll. No hashtags inside the post — they hurt reach.`,
      hashtags: [niche.replace(/\s+/g, ""), "BuildInPublic", "Thread"],
      thumbnailIdea: `Optional image: minimalist quote card, black bg, white text of the hook line, your @handle bottom-right.`,
      captionIdea: body,
    };
  }

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

    const postKind = isTextPostPlatform(platform);

    const videoSpec = `Return these fields via the tool call:
- hookText: opening hook (first 3 seconds)
- bodyText: main script body with [OPEN], [MIDDLE], [CLOSE] sections and scene directions (min 400 chars)
- ctaText: compelling call-to-action
- deliveryTip: camera/delivery advice
- hashtags: 8-12 relevant trending hashtags (without # symbol)
- thumbnailIdea: detailed thumbnail concept
- captionIdea: ready-to-post caption with emojis

Tone: energetic, authentic, optimized for ${platform}. Duration: ${duration}. Niche: ${niche}. Make this script feel UNIQUE — not generic.`;

    const linkedinSpec = `You are writing a READY-TO-POST LinkedIn post for a ${niche} creator. This is NOT a video script. Do NOT use [OPEN]/[MIDDLE]/[CLOSE] tags, scene directions, camera tips, or "stop scrolling" language.

Return via tool call:
- hookText: a scroll-stopping first line (under 120 chars) — bold claim, contrarian take, or curiosity gap
- bodyText: the FULL ready-to-paste LinkedIn post (300–800 chars). Use SHORT paragraphs (1–2 lines), generous line breaks for mobile, max 1–2 emojis, structured with a hook → insight → 3 short points/story → takeaway → open question. Plain text only — no markdown, no [tags].
- ctaText: an open-ended question that drives comments
- deliveryTip: LinkedIn-specific posting advice (timing, format, why it works on the LinkedIn algorithm — NO camera advice)
- hashtags: 5–8 professional LinkedIn hashtags (without # symbol)
- thumbnailIdea: optional carousel/image cover idea (or empty string if not needed)
- captionIdea: same as bodyText (the post itself, ready to paste)

Niche: ${niche}. Make it sound human, specific, and valuable — not corporate fluff.`;

    const twitterSpec = `You are writing a READY-TO-POST tweet (or short thread) for a ${niche} creator on X/Twitter. This is NOT a video script. Do NOT use [OPEN]/[MIDDLE]/[CLOSE] tags, scene directions, or camera tips.

Return via tool call:
- hookText: the first tweet (≤ 270 chars) — must stop the scroll. Bold claim, stat, or contrarian take.
- bodyText: the FULL ready-to-paste post. If it fits in 280 chars, return ONE punchy tweet. Otherwise return a thread formatted as "1/ ...\\n\\n2/ ...\\n\\n3/ ..." where each numbered tweet is ≤ 270 chars. Plain text, no markdown.
- ctaText: a short final-tweet CTA (RT/follow/reply prompt)
- deliveryTip: X-specific advice (best time, why threads vs single, no hashtags inside post — they hurt reach)
- hashtags: 2–4 ONLY (without #), to be used in profile/search context — NOT inside the tweet
- thumbnailIdea: optional image/quote-card idea (or empty string)
- captionIdea: same as bodyText (the tweet/thread itself, ready to paste)

Niche: ${niche}. Be sharp, opinionated, useful. No fluff.`;

    const systemPrompt = postKind === "linkedin" ? linkedinSpec : postKind === "twitter" ? twitterSpec : `You are a professional content script writer and social media strategist. Generate engaging, platform-optimized scripts with complete creator resources.\n\n${videoSpec}`;

    try {
      const userPrompt = postKind
        ? `Write a ready-to-post ${postKind === "linkedin" ? "LinkedIn post" : "X/Twitter post or short thread"} for:\nTitle: "${title}"\nHook idea: "${hook}"\nNiche: ${niche}\n\nThe bodyText MUST be the actual post copy the user can paste directly into ${postKind === "linkedin" ? "LinkedIn" : "X"} — no script tags, no scene directions, no camera advice.`
        : `Generate a complete script and creator resources for:\nTitle: "${title}"\nHook: "${hook}"\nPlatform: ${platform}\nNiche: ${niche}\nDuration: ${duration}\n\nIMPORTANT: bodyText MUST be a detailed multi-paragraph script (at least 400 characters) with [OPEN], [MIDDLE], [CLOSE] sections, scene directions, and concrete value. Never return an empty or one-line body.`;

      const script = await generateWithFallback({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tool: {
          name: "generate_script",
          description: "Generate a structured content script with creator resources",
          parameters: {
            type: "object",
            properties: {
              hookText: { type: "string", description: "Opening hook, 1-2 sentences" },
              bodyText: { type: "string", description: "Detailed script body with [OPEN], [MIDDLE], [CLOSE] sections — minimum 400 chars" },
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

      // Backfill any missing/too-short fields from template so user always gets a complete viral script.
      const tpl = templateScript(title, platform, hook, niche || "Content", duration || "60s");
      const safe = {
        hookText: (script?.hookText && script.hookText.trim().length > 5) ? script.hookText : tpl.hookText,
        bodyText: (script?.bodyText && script.bodyText.trim().length > 80) ? script.bodyText : tpl.bodyText,
        ctaText: (script?.ctaText && script.ctaText.trim().length > 5) ? script.ctaText : tpl.ctaText,
        deliveryTip: (script?.deliveryTip && script.deliveryTip.trim().length > 10) ? script.deliveryTip : tpl.deliveryTip,
        hashtags: (Array.isArray(script?.hashtags) && script.hashtags.length >= 3) ? script.hashtags : tpl.hashtags,
        thumbnailIdea: (script?.thumbnailIdea && script.thumbnailIdea.trim().length > 10) ? script.thumbnailIdea : tpl.thumbnailIdea,
        captionIdea: (script?.captionIdea && script.captionIdea.trim().length > 10) ? script.captionIdea : tpl.captionIdea,
      };

      return new Response(JSON.stringify({ ...safe, fallback: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
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
