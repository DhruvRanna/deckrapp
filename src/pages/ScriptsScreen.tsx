import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Trash2, Copy, Bookmark, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ScriptModal from "@/components/ScriptModal";

const ScriptsScreen: React.FC = () => {
  const { user, authUser, deleteIdea, deleteScript, canGenerateScript, refreshData } = useApp();
  const [tab, setTab] = useState<"saved" | "scripts">("saved");
  const [search, setSearch] = useState("");
  const [viewScript, setViewScript] = useState<any>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [regenerateIdea, setRegenerateIdea] = useState<any>(null);

  const savedIdeas = user?.savedIdeas || [];
  const scripts = user?.scripts || [];
  const scriptsRemaining = user ? (user.plan.scriptsPerMonth === Infinity ? "∞" : user.plan.scriptsPerMonth - user.scriptsThisMonth) : 0;

  const filteredSaved = savedIdeas.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
  const filteredScripts = scripts.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  const ideaHasScript = (ideaId: string) => scripts.some(s => s.ideaId === ideaId);
  const getScriptForIdea = (ideaId: string) => scripts.find(s => s.ideaId === ideaId);

  const handleGenerate = async (idea: any) => {
    if (!canGenerateScript()) {
      toast.error("Script limit reached. Upgrade your plan!");
      return;
    }
    setGenerating(idea.id);
    setViewScript(null);
    setRegenerateIdea(idea);
    setScriptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { title: idea.title, platform: idea.platform, hook: idea.hook, duration: idea.duration, niche: user?.niches[0] || "General" },
      });
      if (error) throw error;

      const { data: saved, error: saveErr } = await supabase.from("scripts").insert({
        user_id: authUser!.id, idea_id: idea.id, title: idea.title, platform: idea.platform,
        hook_text: data.hookText, body_text: data.bodyText, cta_text: data.ctaText, delivery_tip: data.deliveryTip,
      }).select().single();
      if (saveErr) throw saveErr;

      const newCount = (user?.scriptsThisMonth || 0) + 1;
      await supabase.from("profiles").update({ scripts_this_month: newCount }).eq("user_id", authUser!.id);

      await refreshData();
      setViewScript({
        id: saved.id, title: idea.title, platform: idea.platform,
        hookText: data.hookText, bodyText: data.bodyText, ctaText: data.ctaText,
        deliveryTip: data.deliveryTip, hashtags: data.hashtags, thumbnailIdea: data.thumbnailIdea,
        captionIdea: data.captionIdea, createdAt: saved.created_at,
      });
      toast.success("Script generated & saved!");
    } catch (err: unknown) {
      const parsed = await parseAiError(err);
      toast.error(parsed.message);
    } finally {
      setGenerating(null);
      setScriptLoading(false);
    }
  };

  const handleCopy = (script: any) => {
    const text = `${script.title}\n\n${script.hookText}\n\n${script.bodyText}\n\n${script.ctaText}`;
    navigator.clipboard.writeText(text);
    toast.success("Script copied!");
  };

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <div className="px-4 pt-4 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-condensed text-2xl">CONTENT LIBRARY</h1>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium">{savedIdeas.length + scripts.length}</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{scriptsRemaining} script{scriptsRemaining !== 1 ? "s" : ""} remaining this month</span>
      </div>

      <div className="mx-4 mt-3 flex overflow-hidden rounded-full bg-muted p-1 shrink-0">
        <button onClick={() => setTab("saved")} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold transition-all ${tab === "saved" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
          <Bookmark className="h-3 w-3" /> Saved ({savedIdeas.length})
        </button>
        <button onClick={() => setTab("scripts")} className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold transition-all ${tab === "scripts" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
          <FileText className="h-3 w-3" /> Scripts ({scripts.length})
        </button>
      </div>

      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 shrink-0">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {tab === "saved" && filteredSaved.map(idea => {
          const hasScript = ideaHasScript(idea.id);
          const existingScript = hasScript ? getScriptForIdea(idea.id) : null;
          return (
            <div key={idea.id} className="mt-3 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">{idea.platform}</span>
                <span className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <h4 className="mt-2 text-sm font-bold">{idea.title}</h4>
              <p className="mt-1 text-xs italic text-muted-foreground line-clamp-2">"{idea.hook}"</p>
              <div className="mt-2 flex gap-1.5">
                {idea.tags.slice(0, 3).map(t => <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px]">{t}</span>)}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {hasScript ? (
                  <button onClick={() => existingScript && setViewScript(existingScript)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-center text-xs font-semibold text-muted-foreground">
                    <Eye className="h-4 w-4" /> View Script
                  </button>
                ) : (
                  <button onClick={() => handleGenerate(idea)} disabled={generating === idea.id} className="flex-1 rounded-xl bg-foreground py-3 text-center text-xs font-semibold text-background">
                    {generating === idea.id ? "Generating..." : "⭐ Generate Script ⭐"}
                  </button>
                )}
                <button onClick={() => deleteIdea(idea.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}

        {tab === "scripts" && filteredScripts.map(script => (
          <div key={script.id} className="mt-3 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">{script.platform}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(script.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <h4 className="mt-2 text-sm font-bold">{script.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{script.hookText}</p>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => setViewScript(script)} className="flex-1 rounded-xl bg-muted py-3 text-center text-xs font-semibold text-muted-foreground">View Script</button>
              <button onClick={() => handleCopy(script)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border"><Copy className="h-4 w-4 text-muted-foreground" /></button>
              <button onClick={() => deleteScript(script.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </div>
        ))}

        {((tab === "saved" && filteredSaved.length === 0) || (tab === "scripts" && filteredScripts.length === 0)) && (
          <p className="mt-8 text-center text-sm text-muted-foreground">Nothing here yet</p>
        )}
      </div>

      {(viewScript || scriptLoading) && (
        <ScriptModal 
          script={viewScript} 
          isLoading={scriptLoading && !viewScript}
          onClose={() => { setViewScript(null); setScriptLoading(false); setRegenerateIdea(null); }}
          onRegenerate={() => { if (regenerateIdea) handleGenerate(regenerateIdea); }}
        />
      )}
      <BottomNav />
    </div>
  );
};

export default ScriptsScreen;
