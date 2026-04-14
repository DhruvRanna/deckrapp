import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";

const NICHES = ["Finance", "Fitness", "Tech", "Fashion", "Food", "Travel", "Motivation", "Gaming", "Beauty", "Business", "Parenting", "Education", "Comedy", "Lifestyle", "Crypto", "Health"];
const PLATFORMS = ["TikTok", "YouTube", "Instagram", "YouTube Shorts", "LinkedIn", "Twitter/X"];
const FREQUENCIES = [
  { label: "Daily", sub: "7 days/week" },
  { label: "3-4x per week", sub: "Most creators" },
  { label: "1-2x per week", sub: "Consistent pace" },
  { label: "Just starting", sub: "Building a habit" },
];

const OnboardingScreen: React.FC<{ step: "niche" | "platform" | "frequency" }> = ({ step }) => {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useApp();
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedFreq, setSelectedFreq] = useState("");
  const [customNiche, setCustomNiche] = useState("");

  const maxNiches = user?.plan.nichesAllowed ?? 1;

  const toggleNiche = (n: string) => {
    setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < maxNiches ? [...prev, n] : prev);
  };
  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const isStepValid = step === "niche" ? (selectedNiches.length > 0 || customNiche.trim().length > 0) : step === "platform" ? selectedPlatforms.length > 0 : !!selectedFreq;

  const handleNext = async () => {
    if (step === "niche") {
      const niches = customNiche.trim() ? [...selectedNiches, customNiche.trim()] : selectedNiches;
      if (niches.length === 0) return;
      navigate("/onboarding/platform", { state: { niches } });
    } else if (step === "platform") {
      if (selectedPlatforms.length === 0) return;
      navigate("/onboarding/frequency", { state: { platforms: selectedPlatforms } });
    } else {
      if (!selectedFreq) return;
      const niches = selectedNiches.length ? selectedNiches : ["Food"];
      const platforms = selectedPlatforms.length ? selectedPlatforms : ["YouTube Shorts"];
      await completeOnboarding(niches, platforms, selectedFreq);
      navigate("/swipe");
    }
  };

  const dots = step === "niche" ? 0 : step === "platform" ? 1 : 2;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-24 pt-6">
      <div className="flex items-center gap-4">
        {step !== "niche" && (
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-1 items-center justify-center gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === dots ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
          ))}
        </div>
        {step !== "niche" && <div className="w-10" />}
      </div>

      <h1 className="mt-6 text-3xl font-extrabold italic leading-tight">
        {step === "niche" ? "What do you create?" : step === "platform" ? "Where do you post?" : "How often do you post?"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === "niche" ? `Pick ${maxNiches} niche${maxNiches > 1 ? "s" : ""} — upgrade for more` : step === "platform" ? "Select all that apply" : "This helps us tailor your ideas"}
      </p>

      <div className="mt-6 flex-1">
        {step === "niche" && (
          <>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => {
                const isSelected = selectedNiches.includes(n);
                const isLocked = !isSelected && selectedNiches.length >= maxNiches;
                return (
                  <button
                    key={n}
                    onClick={() => toggleNiche(n)}
                    disabled={isLocked && !isSelected}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-foreground text-background"
                        : isLocked
                          ? "bg-muted/60 text-muted-foreground/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isLocked && <Lock className="h-3.5 w-3.5 text-amber-400" />}
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 border-b border-border">
              <input className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" placeholder="Add a custom niche..." value={customNiche} onChange={e => setCustomNiche(e.target.value)} />
            </div>
          </>
        )}
        {step === "platform" && (
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => togglePlatform(p)} className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${selectedPlatforms.includes(p) ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>{p}</button>
            ))}
          </div>
        )}
        {step === "frequency" && (
          <div className="space-y-3">
            {FREQUENCIES.map(f => (
              <button key={f.label} onClick={() => setSelectedFreq(f.label)} className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all ${selectedFreq === f.label ? "bg-foreground text-background" : "bg-muted"}`}>
                <span className="font-semibold">{f.label}</span>
                <span className={`text-sm ${selectedFreq === f.label ? "text-background/70" : "text-muted-foreground"}`}>{f.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-background p-4">
        <button
          onClick={handleNext}
          className={`w-full rounded-2xl py-4 text-sm font-semibold transition-all ${
            isStepValid
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {step === "frequency" ? "Generate My Ideas →" : "Next →"}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
