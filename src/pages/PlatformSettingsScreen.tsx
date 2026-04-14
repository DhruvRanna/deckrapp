import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

const PLATFORMS = ["TikTok", "YouTube", "Instagram", "YouTube Shorts", "LinkedIn", "Twitter/X"];

const PlatformSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updatePlatforms } = useApp();
  const [selected, setSelected] = useState<string[]>(user?.platforms || []);

  const toggle = (p: string) => {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    await updatePlatforms(selected);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-xl">MY PLATFORMS</h1>
      </div>
      <p className="mt-1 px-4 text-sm text-muted-foreground">Choose the platforms you create content for</p>

      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => toggle(p)}
            className={`rounded-2xl border-2 px-4 py-4 text-sm font-semibold transition-all ${
              selected.includes(p)
                ? "border-save bg-save/10 text-foreground"
                : "border-border bg-muted text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="px-4 mt-6">
        <button
          onClick={handleSave}
          disabled={selected.length === 0}
          className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PlatformSettingsScreen;
