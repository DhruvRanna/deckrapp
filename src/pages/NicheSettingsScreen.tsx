import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Plus, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const NICHES = ["Finance", "Fitness", "Tech", "Fashion", "Food", "Travel", "Motivation", "Gaming", "Beauty", "Business", "Parenting", "Education", "Comedy", "Lifestyle", "Crypto", "Health"];

const NicheSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateNiches } = useApp();
  const [selected, setSelected] = useState<string[]>(user?.niches || []);
  const [customInput, setCustomInput] = useState("");
  const maxNiches = user?.plan.nichesAllowed || 1;
  const isUnlimited = maxNiches === Infinity;

  // Custom niches = anything user has that's not in the preset list
  const customNiches = selected.filter(n => !NICHES.includes(n));
  const allChips = [...NICHES, ...customNiches];

  const toggle = (n: string) => {
    setSelected(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (!isUnlimited && prev.length >= maxNiches) return prev;
      return [...prev, n];
    });
  };

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (v.length > 24) { toast.error("Niche must be 24 characters or less"); return; }
    const exists = allChips.some(n => n.toLowerCase() === v.toLowerCase());
    if (exists) { toast.error("Already in your list"); setCustomInput(""); return; }
    if (!isUnlimited && selected.length >= maxNiches) {
      toast.error(`Your plan allows only ${maxNiches} niche${maxNiches > 1 ? "s" : ""}. Upgrade for more.`);
      return;
    }
    const formatted = v.charAt(0).toUpperCase() + v.slice(1);
    setSelected(prev => [...prev, formatted]);
    setCustomInput("");
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
      <p className="px-4 mt-2 text-sm text-muted-foreground">
        Select up to {isUnlimited ? "unlimited" : maxNiches} niche{maxNiches > 1 || isUnlimited ? "s" : ""} ({selected.length}/{isUnlimited ? "∞" : maxNiches} used)
      </p>

      <div className="px-4 mt-4 flex flex-wrap gap-2">
        {allChips.map(n => {
          const isSelected = selected.includes(n);
          const isLocked = !isSelected && !isUnlimited && selected.length >= maxNiches;
          const isCustom = !NICHES.includes(n);
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                isSelected ? "bg-foreground text-background" : isLocked ? "bg-muted/60 text-muted-foreground/40" : "bg-muted text-muted-foreground"
              }`}
            >
              {isLocked && <Lock className="h-3.5 w-3.5 text-amber-400" />}
              {n}
              {isCustom && isSelected && <span className="ml-0.5 text-[10px] opacity-70">★</span>}
            </button>
          );
        })}
      </div>

      {/* Custom niche input */}
      <div className="px-4 mt-6">
        <p className="text-xs font-semibold text-muted-foreground mb-2">ADD CUSTOM NICHE</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. Vegan Cooking, AI Tools..."
            maxLength={24}
            className="flex-1 rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim() || (!isUnlimited && selected.length >= maxNiches)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {!isUnlimited && selected.length >= maxNiches && (
          <p className="mt-2 text-xs text-amber-500">
            Niche limit reached on your plan. <button onClick={() => navigate("/plans")} className="underline font-semibold">Upgrade</button> to add more.
          </p>
        )}
      </div>

      <div className="px-4 mt-6 pb-8">
        <button onClick={handleSave} className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          Save Niches
        </button>
      </div>
    </div>
  );
};

export default NicheSettingsScreen;
