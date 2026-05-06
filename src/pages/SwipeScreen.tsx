import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp, type ContentIdea } from "@/context/AppContext";
import { X, Star, Check, Zap, User, Clock, Lightbulb, Flame, Play, TrendingUp, Hash, Timer, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ScriptModal from "@/components/ScriptModal";
import { parseAiError } from "@/lib/aiErrors";

// Map legacy color keys → aesthetic pastel themes (driven by CSS vars in index.css)
const THEME_BY_COLOR: Record<string, string> = {
  save: "theme-mint",
  script: "theme-lavender",
  skip: "theme-rose",
  trend: "theme-sky",
  viral: "theme-butter",
};
const THEME_CYCLE = [
  "theme-mint", "theme-lavender", "theme-peach", "theme-sky", "theme-butter",
  "theme-rose", "theme-teal", "theme-coral", "theme-indigo", "theme-lime",
  "theme-sunset", "theme-plum", "theme-ocean", "theme-forest", "theme-blush",
  "theme-amber", "theme-violet",
];
const themeFor = (idea: ContentIdea, idx: number) =>
  THEME_BY_COLOR[idea.color] || THEME_CYCLE[idx % THEME_CYCLE.length];

const tagIcon = (label: string) => {
  const l = label.toUpperCase();
  if (l.includes("60S") || l.includes("30S") || l.includes("SEC")) return Timer;
  if (l.includes("TIP")) return Lightbulb;
  if (l.includes("COMPETITION")) return TrendingUp;
  if (l.includes("VIDEO") || l.includes("SHORT")) return Play;
  if (l.includes("TREND")) return Flame;
  if (l.includes("TUTORIAL")) return Eye;
  return Hash;
};

type SwipeIdea = ContentIdea & { thumbnailIdea?: string };
type SwipeFeedCache = {
  ideas: SwipeIdea[];
  currentIndex: number;
  selectedNiche: string;
  updatedAt: number;
};

const FEED_CACHE_TTL_MS = 1000 * 60 * 20;
const FEED_PREFETCH_THRESHOLD = 4;
const MAX_RECENT_TITLES = 80;
const swipeFeedMemoryCache = new Map<string, SwipeFeedCache>();

const normalizeIdeaTitle = (title: string) => title.trim().toLowerCase().replace(/\s+/g, " ");
const feedCacheKey = (userId: string, niche: string) => `deckr_swipe_feed_${userId}_${niche.toLowerCase().replace(/\s+/g, "-")}`;
const seenTitlesKey = (userId: string, niche: string) => `deckr_seen_titles_${userId}_${niche.toLowerCase().replace(/\s+/g, "-")}`;

const dedupeIdeas = (existing: SwipeIdea[], incoming: SwipeIdea[], blockedTitles: string[] = []) => {
  const seen = new Set([
    ...existing.map((idea) => normalizeIdeaTitle(idea.title)),
    ...blockedTitles.map((title) => normalizeIdeaTitle(title)),
  ]);

  return incoming.filter((idea) => {
    const normalized = normalizeIdeaTitle(idea.title);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const SwipeScreen: React.FC = () => {
  const { user, authUser, saveIdea, incrementSwipe, canSwipe, canGenerateScript, refreshData } = useApp();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<SwipeIdea[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animClass, setAnimClass] = useState("");
  const [stampVisible, setStampVisible] = useState<"save" | "skip" | "script" | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [scriptIdea, setScriptIdea] = useState<ContentIdea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const loadingRef = useRef(false);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const ideasRef = useRef<SwipeIdea[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    ideasRef.current = ideas;
  }, [ideas]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!authUser) return;
    const key = `deckr_hint_shown_${authUser.id}`;
    if (!localStorage.getItem(key)) {
      setShowFirstTimeHint(true);
      localStorage.setItem(key, "1");
    }
  }, [authUser]);

  // Set default selected niche
  useEffect(() => {
    if (user?.niches?.length && !selectedNiche) {
      setSelectedNiche(user.niches[0]);
    }
  }, [user?.niches, selectedNiche]);

  const activeNiche = selectedNiche || user?.niches[0] || "";

  const readRecentTitles = useCallback((niche: string) => {
    if (!authUser || typeof window === "undefined") return [] as string[];

    try {
      const raw = localStorage.getItem(seenTitlesKey(authUser.id, niche));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
    } catch {
      return [];
    }
  }, [authUser]);

  const writeRecentTitles = useCallback((niche: string, titles: string[]) => {
    if (!authUser || typeof window === "undefined") return;
    const merged = Array.from(new Set([...readRecentTitles(niche), ...titles].map(normalizeIdeaTitle))).slice(-MAX_RECENT_TITLES);
    localStorage.setItem(seenTitlesKey(authUser.id, niche), JSON.stringify(merged));
  }, [authUser, readRecentTitles]);

  const readCachedFeed = useCallback((niche: string): SwipeFeedCache | null => {
    if (!authUser || typeof window === "undefined") return null;

    const key = feedCacheKey(authUser.id, niche);
    const memoryCached = swipeFeedMemoryCache.get(key);
    if (memoryCached && Date.now() - memoryCached.updatedAt < FEED_CACHE_TTL_MS) {
      return memoryCached;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SwipeFeedCache;
      if (!parsed?.ideas?.length || Date.now() - parsed.updatedAt >= FEED_CACHE_TTL_MS) {
        localStorage.removeItem(key);
        swipeFeedMemoryCache.delete(key);
        return null;
      }
      swipeFeedMemoryCache.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }, [authUser]);

  const persistCachedFeed = useCallback((niche: string, nextIdeas: SwipeIdea[], nextIndex: number) => {
    if (!authUser || typeof window === "undefined" || !niche || nextIdeas.length === 0) return;

    const payload: SwipeFeedCache = {
      ideas: nextIdeas,
      currentIndex: Math.min(nextIndex, Math.max(nextIdeas.length - 1, 0)),
      selectedNiche: niche,
      updatedAt: Date.now(),
    };

    const key = feedCacheKey(authUser.id, niche);
    swipeFeedMemoryCache.set(key, payload);
    localStorage.setItem(key, JSON.stringify(payload));
  }, [authUser]);

  const restoreCachedFeed = useCallback((niche: string) => {
    const cached = readCachedFeed(niche);
    if (!cached || !cached.ideas?.length) return false;

    setIdeas(cached.ideas);
    // If user already swiped through everything cached, recycle to 0 so a card
    // shows immediately instead of a blank skeleton while AI fetch is pending.
    const safeIndex = cached.currentIndex >= cached.ideas.length ? 0 : cached.currentIndex;
    setCurrentIndex(safeIndex);
    return true;
  }, [readCachedFeed]);

  const getFallbackIdeas = useCallback((): ContentIdea[] => {
    const niche = selectedNiche || user?.niches[0] || "General";
    const platform = (user?.platforms[0] || "YOUTUBE SHORTS").toUpperCase();
    // Large variety pool — every call randomizes templates, hooks, durations and viral scores
    // so users never see the same generic 5 cards twice.
    const TEMPLATES: Array<(n: string) => { title: string; hook: string; insight: string; angle: string }> = [
      (n) => ({ title: `${n} Mistake That's Killing Your Reach`, hook: `Stop scrolling — this one ${n} habit is destroying 90% of accounts.`, insight: "Loss-aversion hooks outperform positive framings", angle: "MYTH BUST" }),
      (n) => ({ title: `I Tried ${n} For 30 Days — Here's What Happened`, hook: `Day 1 vs Day 30: the ${n} transformation nobody expected.`, insight: "Time-bound experiments build retention", angle: "EXPERIMENT" }),
      (n) => ({ title: `${n} in 60 Seconds (No Fluff)`, hook: `Everything you need to know about ${n} — fast.`, insight: "Speed-promise hooks drive completion", angle: "FAST GUIDE" }),
      (n) => ({ title: `Hot Take: ${n} Is Changing Forever`, hook: `Unpopular opinion — what everyone teaches about ${n} is outdated.`, insight: "Controversial takes spark comments", angle: "HOT TAKE" }),
      (n) => ({ title: `POV: You Just Discovered ${n}`, hook: `What I wish someone told me when I started ${n}.`, insight: "POV format wins on TikTok/Reels", angle: "POV" }),
      (n) => ({ title: `3 ${n} Tools You're Not Using`, hook: `These free ${n} tools will save you hours every week.`, insight: "Tool listicles get high saves", angle: "LISTICLE" }),
      (n) => ({ title: `Why Your ${n} Strategy Isn't Working`, hook: `If your ${n} isn't growing, it's probably this one thing.`, insight: "Diagnosis hooks trigger self-reflection", angle: "DIAGNOSIS" }),
      (n) => ({ title: `Behind the Scenes: My ${n} Setup`, hook: `Take a peek inside my real ${n} workflow.`, insight: "BTS content humanizes creators", angle: "BTS" }),
      (n) => ({ title: `${n} Trends to Watch This Month`, hook: `These ${n} trends are about to blow up — get in early.`, insight: "Predictive content earns shares", angle: "TREND FORECAST" }),
      (n) => ({ title: `Reacting to Bad ${n} Advice Online`, hook: `I can't believe people are saying THIS about ${n}.`, insight: "Reaction format leverages controversy", angle: "REACTION" }),
      (n) => ({ title: `The ${n} Question Nobody Asks`, hook: `Real talk — why is no one talking about this ${n} issue?`, insight: "Curiosity-gap questions stop the scroll", angle: "CURIOSITY" }),
      (n) => ({ title: `Day in the Life: ${n} Creator`, hook: `What a productive ${n} day actually looks like.`, insight: "DITL content builds parasocial trust", angle: "DITL" }),
    ];
    const COLORS = ["save", "script", "skip", "viral", "trend"];
    const DURATIONS = ["15s", "30s", "60s", "90s"];
    const shuffled = [...TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 6);
    const stamp = Date.now();
    return shuffled.map((tpl, i) => {
      const t = tpl(niche);
      return {
        id: `f${stamp}${i}${Math.random().toString(36).slice(2, 6)}`,
        platform,
        title: t.title,
        hook: t.hook,
        insight: t.insight,
        tags: [t.angle, niche.toUpperCase(), DURATIONS[i % DURATIONS.length].toUpperCase()],
        duration: DURATIONS[i % DURATIONS.length],
        competition: (["Low", "Medium", "High"] as const)[i % 3],
        viralScore: 78 + Math.floor(Math.random() * 20),
        color: COLORS[i % COLORS.length],
      };
    });
  }, [selectedNiche, user?.niches, user?.platforms]);

  const loadIdeas = useCallback(async (options?: { niche?: string; reset?: boolean; background?: boolean }) => {
    if (!user || !authUser) return;
    // Allow background fetches to coexist with one another only if not already in flight.
    if (loadingRef.current) return;

    const niche = options?.niche || activeNiche;
    if (!niche) return;

    loadingRef.current = true;

    try {
      const existingIdeas = options?.reset ? [] : ideasRef.current;
      const recentTitles = readRecentTitles(niche);
      // Direct fetch with hard timeout — supabase.functions.invoke can hang in preview proxy.
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      let data: any = null;
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ideas`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ niches: [niche], platforms: user.platforms, count: 12, recentTitles }),
          signal: controller.signal,
        });
        if (resp.ok) data = await resp.json();
      } catch (fetchErr) {
        console.warn("[loadIdeas] direct fetch failed:", fetchErr);
      } finally {
        window.clearTimeout(timeoutId);
      }

      // Use the LATEST ideas (might have been seeded with fallback while AI was fetching).
      const baseIdeas = options?.reset ? [] : ideasRef.current;

      if (data?.ideas?.length) {
        const uniqueIdeas = dedupeIdeas(baseIdeas, data.ideas, recentTitles);
        if (uniqueIdeas.length > 0) {
          // Merge AI ideas into existing list — no flicker, just appended fresh cards.
          const nextIdeas = [...baseIdeas, ...uniqueIdeas];
          setIdeas(nextIdeas);
          persistCachedFeed(niche, nextIdeas, currentIndexRef.current);
          writeRecentTitles(niche, uniqueIdeas.map((idea) => idea.title));
          return;
        }
      }

      // AI returned nothing new (or failed) — only seed fallback if we have NO ideas at all.
      if (baseIdeas.length === 0) {
        const fallbackIdeas = dedupeIdeas([], getFallbackIdeas() as SwipeIdea[], recentTitles);
        setIdeas(fallbackIdeas);
        setCurrentIndex(0);
        persistCachedFeed(niche, fallbackIdeas, 0);
        if (fallbackIdeas.length > 0) writeRecentTitles(niche, fallbackIdeas.map((idea) => idea.title));
      }
    } catch {
      if (ideasRef.current.length === 0) {
        const fallbackIdeas = dedupeIdeas([], getFallbackIdeas() as SwipeIdea[], readRecentTitles(niche));
        setIdeas(fallbackIdeas);
        setCurrentIndex(0);
        persistCachedFeed(niche, fallbackIdeas, 0);
        if (fallbackIdeas.length > 0) writeRecentTitles(niche, fallbackIdeas.map((idea) => idea.title));
      }
    } finally {
      loadingRef.current = false;
    }
  }, [activeNiche, authUser, getFallbackIdeas, persistCachedFeed, readRecentTitles, user, writeRecentTitles]);

  useEffect(() => {
    if (!user || !authUser || !activeNiche) return;

    const restored = restoreCachedFeed(activeNiche);
    if (restored) {
      const cached = readCachedFeed(activeNiche);
      const remainingCards = (cached?.ideas.length || 0) - (cached?.currentIndex || 0);
      if (remainingCards <= FEED_PREFETCH_THRESHOLD) {
        loadIdeas({ niche: activeNiche, background: true });
      }
      return;
    }

    // No cache — seed instantly with deduped fallback so user sees cards immediately,
    // then fetch fresh AI ideas in background and merge them in.
    const recent = readRecentTitles(activeNiche);
    const seed = dedupeIdeas([], getFallbackIdeas() as SwipeIdea[], recent);
    if (seed.length > 0) {
      setIdeas(seed);
      setCurrentIndex(0);
      persistCachedFeed(activeNiche, seed, 0);
      writeRecentTitles(activeNiche, seed.map((idea) => idea.title));
    }
    loadIdeas({ niche: activeNiche, background: true });
  }, [activeNiche, authUser, getFallbackIdeas, loadIdeas, persistCachedFeed, readCachedFeed, readRecentTitles, restoreCachedFeed, user, writeRecentTitles]);

  useEffect(() => {
    if (!activeNiche || ideas.length === 0) return;
    persistCachedFeed(activeNiche, ideas, currentIndex);
  }, [activeNiche, currentIndex, ideas, persistCachedFeed]);

  // Reset ideas when niche changes
  const handleNicheChange = (niche: string) => {
    if (niche === selectedNiche) return;
    setSelectedNiche(niche);
    loadingRef.current = false;
  };

  const idea = currentIndex < ideas.length ? ideas[currentIndex] : null;
  const nextIdea = currentIndex + 1 < ideas.length ? ideas[currentIndex + 1] : null;

  const generateScriptForIdea = async (idea: ContentIdea) => {
    if (!canGenerateScript()) {
      toast.error("Script limit reached. Upgrade your plan!");
      return;
    }
    setCurrentScript(null);
    setScriptIdea(idea);
    setShowScript(true);
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { title: idea.title, platform: idea.platform, hook: idea.hook, duration: idea.duration, niche: user?.niches[0] || "General" },
      });
      if (error) throw error;

      const { data: savedScript, error: saveError } = await supabase.from("scripts").insert({
        user_id: authUser!.id, title: idea.title, platform: idea.platform,
        hook_text: data.hookText, body_text: data.bodyText, cta_text: data.ctaText, delivery_tip: data.deliveryTip,
      }).select().single();
      if (saveError) throw saveError;

      const newCount = (user?.scriptsThisMonth || 0) + 1;
      await supabase.from("profiles").update({ scripts_this_month: newCount }).eq("user_id", authUser!.id);

      setCurrentScript({
        id: savedScript.id, title: idea.title, platform: idea.platform,
        hookText: data.hookText, bodyText: data.bodyText, ctaText: data.ctaText,
        deliveryTip: data.deliveryTip, hashtags: data.hashtags, thumbnailIdea: data.thumbnailIdea,
        captionIdea: data.captionIdea, createdAt: savedScript.created_at,
      });
      await refreshData();
      toast.success("Script generated!");
    } catch (err: unknown) {
      const parsed = await parseAiError(err);
      toast.error(parsed.message);
      setShowScript(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const doSwipe = (dir: "left" | "right" | "up") => {
    if (!canSwipe()) {
      toast.error("Daily swipe limit reached! Upgrade for more.");
      return;
    }
    if (!idea) return;

    setStampVisible(dir === "right" ? "save" : dir === "left" ? "skip" : "script");
    setAnimClass(dir === "left" ? "animate-swipe-left" : dir === "right" ? "animate-swipe-right" : "animate-swipe-up");
    incrementSwipe();
    setShowFirstTimeHint(false);

    if (dir === "right") saveIdea(idea);
    if (dir === "up") generateScriptForIdea(idea);

    setTimeout(() => {
      setAnimClass("");
      setStampVisible(null);
      setDragDelta({ x: 0, y: 0 });
      setCurrentIndex(i => {
        const next = i + 1;
        if (next >= ideas.length - 2) loadIdeas();
        return next;
      });
    }, 400);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    setDragDelta({ x: e.touches[0].clientX - touchRef.current.x, y: e.touches[0].clientY - touchRef.current.y });
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    if (dx > 30) setStampVisible("save");
    else if (dx < -30) setStampVisible("skip");
    else if (dy < -30) setStampVisible("script");
    else setStampVisible(null);
  };
  const handleTouchEnd = () => {
    const { x, y } = dragDelta;
    if (x > 80) doSwipe("right");
    else if (x < -80) doSwipe("left");
    else if (y < -80) doSwipe("up");
    else { setDragDelta({ x: 0, y: 0 }); setStampVisible(null); }
    touchRef.current = null;
  };

  const swipesUsed = user?.swipesToday || 0;
  const swipesMax = user?.plan.swipesPerDay === Infinity ? "∞" : user?.plan.swipesPerDay;
  const isLocked = !canSwipe();

  const getHashtags = (idea: ContentIdea) => {
    const niche = user?.niches[0] || "General";
    return [`#${niche}`, `#${idea.platform.replace(/\s/g, "")}`, "#ContentCreator"];
  };

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
        <h1 className="font-condensed text-2xl">DECKR</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium">
            <Zap className="h-3 w-3" /> {swipesUsed}/{swipesMax}
          </span>
          <button onClick={() => navigate("/profile")} className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Niche tabs */}
      <div className="px-5 pb-3 shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
        {(user?.niches || ["General"]).map((niche) => (
          <button
            key={niche}
            onClick={() => handleNicheChange(niche)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
              selectedNiche === niche
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {niche}
          </button>
        ))}
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="text-center">
            <p className="text-6xl mb-4">🔒</p>
            <h3 className="text-xl font-bold">Daily Swipe Limit Reached</h3>
            <p className="mt-2 text-sm text-muted-foreground">Upgrade to Creator or Pro for more swipes</p>
            <button onClick={() => navigate("/plans")} className="mt-4 rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background">
              View Plans →
            </button>
          </div>
        </div>
      )}

      {/* Card area */}
      {!isLocked && (
        <>
          <div className="mx-4 flex flex-1 min-h-0 items-stretch justify-center overflow-visible py-2">
            <div className="relative w-full max-w-[22rem] flex-1 min-h-0">
              {nextIdea && (
                <div
                  className={`swipe-card ${themeFor(nextIdea, currentIndex + 1)} absolute inset-0 rounded-[1.75rem] scale-[0.965] opacity-65 shadow-card-soft`}
                />
              )}

              {idea && (
                <div
                  className={`swipe-card ${themeFor(idea, currentIndex)} relative flex flex-col rounded-[1.75rem] px-5 py-5 h-full overflow-hidden shadow-card-premium ${animClass}`}
                  style={{
                    ...(!animClass
                      ? { transform: `translate(${dragDelta.x}px, ${dragDelta.y}px) rotate(${dragDelta.x * 0.05}deg)`, transition: dragDelta.x === 0 && dragDelta.y === 0 ? "transform 0.2s" : "none" }
                      : {}
                    ),
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {stampVisible === "save" && (
                    <div className="absolute right-4 top-4 z-10 rotate-12 rounded-md border-[3px] border-save bg-save/10 px-4 py-1.5 opacity-90">
                      <span className="text-2xl font-black italic tracking-wide text-save">SAVE</span>
                    </div>
                  )}
                  {stampVisible === "skip" && (
                    <div className="absolute left-4 top-4 z-10 -rotate-12 rounded-md border-[3px] border-skip bg-skip/10 px-4 py-1.5 opacity-90">
                      <span className="text-2xl font-black italic tracking-wide text-skip">SKIP</span>
                    </div>
                  )}
                  {stampVisible === "script" && (
                    <div className="absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border-[3px] border-script bg-script/10 px-5 py-2 opacity-90">
                      <span className="text-2xl font-black italic tracking-wide text-script">SCRIPT</span>
                    </div>
                  )}

                  {/* Top row: Platform pill + Trending badge + Viral score pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="t-surface-strong t-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shrink-0">
                        <Play className="h-3 w-3 fill-current" /> {idea.platform}
                      </span>
                      {idea.trending && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-viral px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm shrink-0 animate-pulse"
                          title="Inspired by live YouTube trending data"
                        >
                          🔥 Trending
                        </span>
                      )}
                    </div>
                    <span className="t-surface-strong t-text inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold shrink-0">
                      {idea.viralScore}% <span>🔥</span>
                    </span>
                  </div>

                  <div className="mt-3 border-t border-[hsl(var(--t-text)/0.08)]" />

                  {/* Middle content (scrolls if overflow) */}
                  <div className="flex flex-1 flex-col justify-between min-h-0 mt-3">
                    <div className="space-y-3 overflow-y-auto no-scrollbar pr-1 flex-1 min-h-0">
                      {/* Title */}
                      <h2 className="text-[1.45rem] font-black italic leading-[1.15] tracking-[-0.02em] text-black">
                        {idea.title}
                      </h2>

                      {/* Hook */}
                      <div className="t-surface rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-bold tracking-[0.25em] t-primary">HOOK</p>
                        <p className="mt-1.5 text-[0.88rem] italic leading-[1.4] t-text">
                          "{idea.hook}"
                        </p>
                      </div>

                      {/* Insight */}
                      <p className="flex items-start gap-1.5 text-[11px] leading-[1.4] t-muted">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-px t-primary" />
                        <span>{idea.insight}</span>
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {idea.tags.slice(0, 3).map((chip) => {
                          const Icon = tagIcon(chip);
                          return (
                            <span key={chip} className="t-surface t-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em]">
                              <Icon className="h-3 w-3" /> {chip}
                            </span>
                          );
                        })}
                      </div>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1.5">
                        {getHashtags(idea).map((h) => (
                          <span key={h} className="t-surface t-primary rounded-full px-2.5 py-1 text-[10px] font-semibold">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: data grid + viral bar */}
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="t-surface rounded-xl px-2.5 py-2">
                          <p className="text-[8.5px] font-semibold tracking-[0.1em] t-muted">BEST TIME</p>
                          <p className="mt-0.5 text-[12px] font-extrabold t-text">{idea.platform.includes("TIKTOK") ? "6–9 PM" : idea.platform.includes("YOUTUBE") ? "2–5 PM" : "11AM–1PM"}</p>
                        </div>
                        <div className="t-surface rounded-xl px-2.5 py-2">
                          <p className="text-[8.5px] font-semibold tracking-[0.1em] t-muted">REACH</p>
                          <p className="mt-0.5 text-[12px] font-extrabold t-text">{idea.viralScore >= 90 ? "50K+" : idea.viralScore >= 85 ? "10K+" : "5K+"}</p>
                        </div>
                        <div className="t-surface rounded-xl px-2.5 py-2">
                          <p className="text-[8.5px] font-semibold tracking-[0.1em] t-muted">DURATION</p>
                          <p className="mt-0.5 text-[12px] font-extrabold t-text">{idea.duration}</p>
                        </div>
                      </div>

                      <div className="t-surface rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[8.5px] font-semibold tracking-[0.1em] t-muted">VIRAL POTENTIAL</p>
                          <p className="text-[11px] font-extrabold t-primary">{idea.viralScore}%</p>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full t-primary-faint overflow-hidden">
                          <div className="h-full rounded-full t-primary-bg" style={{ width: `${idea.viralScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!idea && (
                <div className="absolute inset-0 rounded-[1.75rem] bg-card shadow-card-soft p-5 flex flex-col gap-3 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                    <div className="h-6 w-14 rounded-full bg-muted animate-pulse" />
                  </div>
                  <div className="mt-2 h-7 w-5/6 rounded-md bg-muted animate-pulse" />
                  <div className="h-7 w-3/4 rounded-md bg-muted animate-pulse" />
                  <div className="mt-2 h-20 w-full rounded-2xl bg-muted animate-pulse" />
                  <div className="flex gap-2 mt-1">
                    <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                    <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    <div className="h-12 rounded-xl bg-muted animate-pulse" />
                    <div className="h-12 rounded-xl bg-muted animate-pulse" />
                    <div className="h-12 rounded-xl bg-muted animate-pulse" />
                  </div>
                  <div className="h-10 rounded-xl bg-muted animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Hint labels with arrows */}
          {showFirstTimeHint && idea && (
            <div className="flex items-center justify-between px-10 pt-1 shrink-0">
              <div className="text-center flex flex-col items-center">
                <span className="text-muted-foreground text-xs">←</span>
                <p className="text-xs font-bold text-skip">Skip</p>
                <p className="text-[9px] text-muted-foreground">Swipe left</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-muted-foreground text-xs">↑</span>
                <p className="text-xs font-bold text-script">Script</p>
                <p className="text-[9px] text-muted-foreground">AI script</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <span className="text-muted-foreground text-xs">→</span>
                <p className="text-xs font-bold text-save">Save</p>
                <p className="text-[9px] text-muted-foreground">Swipe right</p>
              </div>
            </div>
          )}

          {/* Action buttons - more breathing room from bottom nav */}
          {idea && (
            <div className="flex items-center justify-center gap-6 pt-4 pb-6 shrink-0">
              <button onClick={() => doSwipe("left")} className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-2 border-skip/30 bg-skip/10 active:scale-95 transition-transform">
                <X className="h-5 w-5 text-skip" />
              </button>
              <button onClick={() => doSwipe("up")} className="flex h-[66px] w-[66px] items-center justify-center rounded-full border-2 border-script/30 bg-script/10 active:scale-95 transition-transform">
                <Star className="h-6 w-6 text-script fill-script" />
              </button>
              <button onClick={() => doSwipe("right")} className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-2 border-save/30 bg-save/10 active:scale-95 transition-transform">
                <Check className="h-5 w-5 text-save" />
              </button>
            </div>
          )}
        </>
      )}

      <BottomNav />

      {showScript && (
        <ScriptModal
          script={currentScript}
          isLoading={isGenerating}
          onClose={() => { setShowScript(false); setCurrentScript(null); setScriptIdea(null); }}
          onRegenerate={() => { if (scriptIdea) generateScriptForIdea(scriptIdea); }}
        />
      )}
    </div>
  );
};

export default SwipeScreen;
