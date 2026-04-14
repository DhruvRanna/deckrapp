import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";

const NICHES = ["Finance", "Fitness", "Tech", "Fashion", "Food", "Travel", "Motivation", "Gaming", "Beauty", "Business", "Parenting", "Education", "Comedy", "Lifestyle", "Crypto", "Health"];

const NicheSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateNiches } = useApp();
  const [selected, setSelected] = useState<string[]>(user?.niches || []);
  const maxNiches = user?.plan.nichesAllowed || 1;

  const toggle = (n: string) => {
    setSelected(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < maxNiches ? [...prev, n] : prev);
  };

  const handleSave = async () => {
    await updateNiches(selected);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-xl">MY NICHES</h1>
      </div>
      <p className="px-4 mt-2 text-sm text-muted-foreground">Select up to {maxNiches} niche{maxNiches > 1 ? "s" : ""}</p>

      <div className="px-4 mt-4 flex flex-wrap gap-2">
        {NICHES.map(n => {
          const isSelected = selected.includes(n);
          const isLocked = !isSelected && selected.length >= maxNiches;
          return (
            <button key={n} onClick={() => toggle(n)} className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${isSelected ? "bg-foreground text-background" : isLocked ? "bg-muted/60 text-muted-foreground/40" : "bg-muted text-muted-foreground"}`}>
              {isLocked && <Lock className="h-3.5 w-3.5 text-amber-400" />}
              {n}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-6">
        <button onClick={handleSave} className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          Save Niches
        </button>
      </div>
    </div>
  );
};

export default NicheSettingsScreen;
