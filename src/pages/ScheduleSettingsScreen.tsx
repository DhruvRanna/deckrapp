import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

const FREQUENCIES = [
  { label: "Daily", sub: "7 days/week" },
  { label: "3-4x per week", sub: "Most creators" },
  { label: "1-2x per week", sub: "Consistent pace" },
  { label: "Just starting", sub: "Building a habit" },
];

const ScheduleSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updatePostingFrequency } = useApp();
  const [selected, setSelected] = useState(user?.postingFrequency || "");

  const handleSave = async () => {
    await updatePostingFrequency(selected);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-condensed text-xl">POSTING SCHEDULE</h1>
      </div>
      <p className="px-4 mt-2 text-sm text-muted-foreground">How often do you post?</p>

      <div className="px-4 mt-4 space-y-3">
        {FREQUENCIES.map(f => (
          <button key={f.label} onClick={() => setSelected(f.label)} className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all ${selected === f.label ? "bg-foreground text-background" : "bg-muted"}`}>
            <span className="font-semibold">{f.label}</span>
            <span className={`text-sm ${selected === f.label ? "text-background/70" : "text-muted-foreground"}`}>{f.sub}</span>
          </button>
        ))}
      </div>

      <div className="px-4 mt-6">
        <button onClick={handleSave} className="w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
          Save Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleSettingsScreen;
