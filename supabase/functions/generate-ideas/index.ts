import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateWithFallback, AllProvidersFailedError, aiVariety } from "../_shared/aiProviders.ts";
import { getYouTubeTrendingTitles } from "../_shared/youtubeTrends.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CARD_COLORS = ["save", "script", "skip", "viral", "trend"];

const VARIETY_ANGLES = [
  "controversial hot take", "personal failure story", "data-driven analysis", "behind-the-scenes secret",
  "myth-busting comparison", "before/after transformation", "day-in-the-life", "rapid-fire tips list",
  "expert interview style", "experiment / 'I tried X for 30 days'", "reaction to current trend",
  "case study breakdown", "common mistake exposé", "tool/app review", "prediction for the future",
];

const FORMATS = [
  "POV / first-person", "tutorial walkthrough", "listicle countdown", "story-time confession",
  "challenge / dare", "Q&A response", "duet/stitch reaction", "mini documentary",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niches, platforms, count = 10, recentTitles = [] } = await req.json();
    const nicheStr = (niches || ["General"]).join(", ");
    const platStr = (platforms || ["YouTube Shorts"]).join(", ");

    // Pick a few random angles/formats to nudge the model toward NEW territory each call
    const seedAngles = aiVariety.shuffle(VARIETY_ANGLES).slice(0, 5).join(", ");
    const seedFormats = aiVariety.shuffle(FORMATS).slice(0, 4).join(", ");
    const today = new Date().toISOString().slice(0, 10);
    const sessionSeed = crypto.randomUUID().slice(0, 8);

    const avoidStr = (recentTitles as string[]).slice(-30).map(t => `- ${t}`).join("\n") || "(none yet)";

    // Pull live YouTube trending titles for each niche (cached 1h, runs in parallel).
    const trendingByNiche = await Promise.all(
      (niches || ["General"]).slice(0, 3).map(async (n: string) => ({
        niche: n,
        titles: await getYouTubeTrendingTitles(n, 8),
      }))
    );
    const trendingBlock = trendingByNiche
      .filter(t => t.titles.length > 0)
      .map(t => `${t.niche}:\n${t.titles.map(x => `  • ${x}`).join("\n")}`)
      .join("\n\n") || "(no live data available)";

    const systemPrompt = `You are a viral content strategist for ${today}. You deeply understand trending topics, viral formats, and what makes content go viral RIGHT NOW on each specific platform. Generate FRESH, UNIQUE, ACTIONABLE ideas.

CRITICAL RULES:
1. Generate ideas ONLY for: ${platStr}. Do NOT generate for other platforms.
2. Focus ONLY on niches: ${nicheStr}. Every idea must be deeply relevant.
3. Reference ${today} trends, algorithm changes, cultural moments.
4. Ideas must be UNIQUE — avoid generic recycled advice.
5. AVOID DUPLICATES: do NOT repeat or paraphrase any of these recently shown titles:
${avoidStr}
6. Each of the ${count} ideas must use a DIFFERENT angle and format.

LIVE TRENDING ON YOUTUBE (last 7 days, ordered by views) — use as REAL-TIME INSPIRATION for angles, topics, and what's actually hot. Do NOT copy these titles verbatim; reinterpret them for ${platStr}:
${trendingBlock}

VARIETY SEEDS (mix these angles): ${seedAngles}
FORMATS to mix: ${seedFormats}
Session seed (use to ensure novelty): ${sessionSeed}

PLATFORM TITLE LENGTH:
- YouTube long-form: 8-15 words, descriptive, SEO-friendly
- YouTube Shorts: 5-8 words, punchy
- TikTok: 4-7 words, scroll-stopping
- Instagram Reels: 5-8 words, aesthetic

HOOK QUALITY: scroll-stopping, curiosity gap, shocking stat, bold claim, or personal story.
INSIGHT: explain WHY this format/angle works on this platform right now.
TRENDING FLAG: set "trending": true ONLY for ideas directly inspired by a title in the LIVE TRENDING ON YOUTUBE block above. Set false (or omit) otherwise.`;

    const ideas = await generateWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${count} viral content ideas for ${nicheStr} creators on ${platStr}. Mix content types, angles, and formats. Make each one feel different from the others. Session: ${sessionSeed}` },
      ],
      tool: {
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
                  platform: { type: "string", description: "e.g. YOUTUBE SHORTS, TIKTOK, YOUTUBE, INSTAGRAM" },
                  title: { type: "string" },
                  hook: { type: "string", description: "Opening hook line, scroll-stopping" },
                  insight: { type: "string", description: "Why it works on this platform now" },
                  tags: { type: "array", items: { type: "string" } },
                  duration: { type: "string", description: "e.g. 30s, 60s, 10min" },
                  competition: { type: "string", enum: ["Low", "Medium", "High"] },
                  viralScore: { type: "number" },
                  thumbnailIdea: { type: "string" },
                  trending: { type: "boolean", description: "True if directly inspired by a title in the LIVE TRENDING ON YOUTUBE block" },
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
      temperature: 1.05,
    });

    const list = (ideas?.ideas || []).map((idea: any) => ({
      ...idea,
      trending: !!idea.trending,
      id: crypto.randomUUID(),
      color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
    }));

    return new Response(JSON.stringify({ ideas: list }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ideas error:", e);
    const reason = e instanceof AllProvidersFailedError ? e.reason : "generic";
    // Smart fallback: build ideas from LIVE YouTube trending titles so users still get
    // fresh, real-world relevant cards even when all AI providers fail.
    try {
      const { niches: nb = ["General"], platforms: pb = ["YouTube Shorts"], count: cb = 10 } = await req.clone().json().catch(() => ({}));
      const platform = (pb[0] || "YouTube Shorts").toUpperCase();
      const trending = await Promise.all(
        nb.slice(0, 3).map(async (n: string) => ({ niche: n, titles: await getYouTubeTrendingTitles(n, 10) }))
      );
      const flat = trending.flatMap(t => t.titles.map(title => ({ niche: t.niche, title })));
      const ANGLES = ["POV", "Top 5", "I Tried", "Why You're Wrong About", "The Truth About", "Stop Doing", "Secret to", "Hidden", "Beginner Guide:", "Pro Tips:"];
      const ideas = aiVariety.shuffle(flat).slice(0, cb).map((t, i) => {
        const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
        const reframed = `${angle} ${t.title.split("|")[0].split("-")[0].trim().slice(0, 60)}`;
        return {
          id: crypto.randomUUID(),
          platform,
          title: reframed,
          hook: `Everyone's watching "${t.title.slice(0, 70)}" — here's what they missed.`,
          insight: `Live trending on YouTube right now in ${t.niche}. Reframe with your unique angle for fast reach.`,
          tags: [t.niche.toUpperCase().replace(/\s+/g, ""), "TRENDING NOW", "LIVE DATA"],
          duration: ["30s", "60s", "90s"][i % 3],
          competition: ["Low", "Medium", "High"][i % 3],
          viralScore: 80 + Math.floor(Math.random() * 18),
          thumbnailIdea: `Bold text overlay echoing "${reframed.split(" ").slice(0, 4).join(" ")}" with shocked-face reaction shot.`,
          trending: true,
          color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
        };
      });
      if (ideas.length > 0) {
        return new Response(JSON.stringify({ ideas, fallback: true, source: "youtube-trending", reason }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (innerErr) {
      console.warn("[generate-ideas] trending fallback also failed:", innerErr);
    }
    return new Response(JSON.stringify({ fallback: true, reason, error: e instanceof Error ? e.message : "Unknown error", ideas: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
