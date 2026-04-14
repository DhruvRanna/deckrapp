import React, { useState, useRef, useEffect, useCallback } from "react";
import { useApp, type ContentIdea } from "@/context/AppContext";
import { X, Star, Check, Zap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ScriptModal from "@/components/ScriptModal";

const CARD_COLORS: Record<string, string> = {
  save: "bg-save-light",
  script: "bg-script-light",
  skip: "bg-skip-light",
  trend: "bg-trend",
  viral: "bg-amber-50",
};

const SwipeScreen: React.FC = () => {
  const { user, authUser, saveIdea, incrementSwipe, canSwipe, canGenerateScript, refreshData } = useApp();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<(ContentIdea & { thumbnailIdea?: string })[]>([]);
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
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>("");

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

  const getFallbackIdeas = useCallback((): ContentIdea[] => {
    const niche = selectedNiche || user?.niches[0] || "General";
    const platform = user?.platforms[0] || "YOUTUBE SHORTS";
    return [
      { id: `f${Date.now()}1`, platform, title: `Top ${niche} Secrets Nobody Tells You`, hook: `Everyone in ${niche} is talking about this but nobody is doing it right.`, insight: "Contrarian take drives engagement", tags: ["QUICK TIP", "60S", "LOW COMPETITION"], duration: "60s", competition: "Low", viralScore: 91, color: "save" },
      { id: `f${Date.now()}2`, platform, title: `${niche} Hack That Actually Works in 2026`, hook: `I spent 6 months testing every ${niche} strategy. Only ONE worked.`, insight: "Personal journey + single takeaway = high saves", tags: ["SHORT VIDEO", "30S"], duration: "30s", competition: "Low", viralScore: 88, color: "script" },
      { id: `f${Date.now()}3`, platform, title: `Why 97% of People Fail at ${niche}`, hook: `97% of people make this mistake in ${niche}. Are you one of them?`, insight: "Stat-based hooks trigger curiosity gap", tags: ["TRENDING", "MEDIUM COMPETITION"], duration: "60s", competition: "Medium", viralScore: 85, color: "skip" },
      { id: `f${Date.now()}4`, platform, title: `${niche} Beginner to Expert in 30 Days`, hook: `From zero to expert in ${niche}. Here's the exact roadmap.`, insight: "Transformation stories perform well", tags: ["TUTORIAL", "LOW COMPETITION"], duration: "10min", competition: "Low", viralScore: 93, color: "viral" },
      { id: `f${Date.now()}5`, platform, title: `Stop Doing This in ${niche} Right Now!`, hook: `This common ${niche} advice is actually WRONG.`, insight: "Myth-busting content gets shares", tags: ["QUICK TIP", "30S"], duration: "30s", competition: "Low", viralScore: 90, color: "trend" },
    ];
  }, [selectedNiche, user?.niches, user?.platforms]);

  const loadIdeas = useCallback(async () => {
    if (!user || loadingRef.current) return;
    loadingRef.current = true;
    const niche = selectedNiche || user.niches[0] || "General";
    try {
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: { niches: [niche], platforms: user.platforms, count: 10 },
      });
      if (error) throw error;
      if (data?.ideas) setIdeas(prev => [...prev, ...data.ideas]);
    } catch {
      setIdeas(prev => prev.length < 3 ? [...prev, ...getFallbackIdeas()] : prev);
    } finally {
      loadingRef.current = false;
    }
  }, [user, selectedNiche, getFallbackIdeas]);

  useEffect(() => {
    if (user && !initialLoaded) {
      setInitialLoaded(true);
      setIdeas(getFallbackIdeas());
      loadIdeas();
    }
  }, [user, initialLoaded, getFallbackIdeas, loadIdeas]);

  // Reset ideas when niche changes
  const handleNicheChange = (niche: string) => {
    if (niche === selectedNiche) return;
    setSelectedNiche(niche);
    setIdeas([]);
    setCurrentIndex(0);
    loadingRef.current = false;
    // Will reload via effect below
  };

  useEffect(() => {
    if (selectedNiche && initialLoaded) {
      setIdeas(getFallbackIdeas());
      loadIdeas();
    }
  }, [selectedNiche]);

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
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate script");
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
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <h1 className="font-condensed text-xl">DECKR</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium">
            <Zap className="h-3 w-3" /> {swipesUsed}/{swipesMax}
          </span>
          <button onClick={() => navigate("/profile")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
            <User className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Niche tabs */}
      <div className="px-4 pb-2 shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
        {(user?.niches || ["General"]).map((niche) => (
          <button
            key={niche}
            onClick={() => handleNicheChange(niche)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
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
          <div className="mx-4 flex flex-1 min-h-0 items-center justify-center overflow-visible">
            <div className="relative w-full max-w-[22rem]" style={{ aspectRatio: "970 / 1385" }}>
              {nextIdea && (
                <div
                  className={`absolute inset-0 rounded-[1.6rem] ${CARD_COLORS[nextIdea.color] || "bg-trend"} scale-[0.965] opacity-65`}
                  style={{ boxShadow: "0 4px 20px -8px rgba(0,0,0,0.08)" }}
                />
              )}

              {idea && (
                <div
                  className={`relative flex flex-col rounded-[1.6rem] ${CARD_COLORS[idea.color] || "bg-trend"} px-5 pb-4 pt-4 h-full overflow-hidden ${animClass}`}
                  style={{
                    ...(!animClass
                      ? { transform: `translate(${dragDelta.x}px, ${dragDelta.y}px) rotate(${dragDelta.x * 0.05}deg)`, transition: dragDelta.x === 0 && dragDelta.y === 0 ? "transform 0.2s" : "none" }
                      : {}
                    ),
                    boxShadow: "0 4px 20px -8px rgba(0,0,0,0.1)",
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

                  {/* Platform + Viral Score */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1 rounded-full border border-foreground/10 bg-background/55 px-2.5 py-1 text-[10px] font-semibold">▶ {idea.platform}</span>
                    <span className="rounded-full border border-foreground/10 bg-background/55 px-2.5 py-1 text-[10px] font-semibold">{idea.viralScore}% 🔥</span>
                  </div>

                  <div className="mt-2.5 border-t border-foreground/10" />

                  {/* Title */}
                  <h2 className="mt-2.5 text-[1.35rem] font-black italic leading-[1.18] tracking-[-0.02em] text-foreground">{idea.title}</h2>

                  {/* Hook section */}
                  <div className="mt-3 rounded-xl border border-foreground/10 bg-background/30 px-3 py-2.5">
                    <p className="text-[10px] font-semibold tracking-[0.25em] text-save">HOOK</p>
                    <p className="mt-1 text-[0.82rem] italic leading-[1.35] text-foreground/80">"{idea.hook}"</p>
                  </div>

                  {/* Insight */}
                  <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-[1.4] text-muted-foreground">
                    <span>💡</span>
                    <span>{idea.insight}</span>
                  </p>

                  {/* Tags */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {idea.tags.slice(0, 3).map((chip) => (
                      <span key={chip} className="rounded-full border border-foreground/10 bg-background/30 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.04em]">
                        {chip}
                      </span>
                    ))}
                  </div>
                  
                  {/* Hashtags */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {getHashtags(idea).map((h) => (
                      <span key={h} className="rounded-full border border-save/20 bg-save-light px-2 py-0.5 text-[9px] font-medium text-save">
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Bottom metrics */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                    <div className="rounded-lg border border-foreground/10 bg-background/30 px-2 py-1.5">
                      <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground">BEST TIME</p>
                      <p className="mt-0.5 text-[11px] font-bold text-foreground">{idea.platform.includes("TIKTOK") ? "6–9 PM" : idea.platform.includes("YOUTUBE") ? "2–5 PM" : "11AM–1PM"}</p>
                    </div>
                    <div className="rounded-lg border border-foreground/10 bg-background/30 px-2 py-1.5">
                      <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground">REACH</p>
                      <p className="mt-0.5 text-[11px] font-bold text-foreground">{idea.viralScore >= 90 ? "50K+" : idea.viralScore >= 85 ? "10K+" : "5K+"}</p>
                    </div>
                    <div className="rounded-lg border border-foreground/10 bg-background/30 px-2 py-1.5">
                      <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground">DURATION</p>
                      <p className="mt-0.5 text-[11px] font-bold text-foreground">{idea.duration}</p>
                    </div>
                  </div>

                  {/* Viral Potential Bar */}
                  <div className="mt-2 rounded-lg border border-foreground/10 bg-background/30 px-2.5 py-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-semibold tracking-[0.1em] text-muted-foreground">VIRAL POTENTIAL</p>
                      <p className="text-[10px] font-bold text-save">{idea.viralScore}%</p>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-foreground/10">
                      <div className="h-full rounded-full bg-save" style={{ width: `${idea.viralScore}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {!idea && (
                <div className="flex items-center justify-center rounded-[1.6rem] bg-card shadow-card py-20">
                  <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    <p className="mt-4 text-sm text-muted-foreground">Loading content ideas...</p>
                  </div>
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

          {/* Action buttons - filled background style */}
          {idea && (
            <div className="flex items-center justify-center gap-5 py-3 shrink-0">
              <button onClick={() => doSwipe("left")} className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-skip/40 bg-skip/10">
                <X className="h-5 w-5 text-skip" />
              </button>
              <button onClick={() => doSwipe("up")} className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 border-script/40 bg-script/10">
                <Star className="h-6 w-6 text-script fill-script" />
              </button>
              <button onClick={() => doSwipe("right")} className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-save/40 bg-save/10">
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
