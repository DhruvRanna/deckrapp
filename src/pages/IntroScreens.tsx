import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Calendar as CalendarIcon, Mic, FileText, CheckCircle2 } from "lucide-react";

/* =========================================================
 * ScriptsIntroScreen — second onboarding screen
 * Shows an animated AI script being "typed" out
 * ========================================================= */

const SCRIPT_LINES = [
  { label: "HOOK", icon: Mic, text: "Stop scrolling — this changed my whole channel.", color: "hsl(0 75% 65%)", bg: "hsl(0 60% 95%)" },
  { label: "BODY", icon: FileText, text: "I tested 47 video formats for 30 days. Only 3 actually worked. Here's the playbook…", color: "hsl(262 52% 60%)", bg: "hsl(262 50% 95%)" },
  { label: "CTA",  icon: CheckCircle2, text: "Follow for the full 30-day breakdown tomorrow.", color: "hsl(145 63% 49%)", bg: "hsl(145 50% 94%)" },
];

export const ScriptsIntroScreen: React.FC = () => {
  const navigate = useNavigate();
  // Hook is always visible (fixed). Body & CTA animate in below it, then loop.
  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed(r => (r >= SCRIPT_LINES.length ? 1 : r + 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col bg-background px-6 pt-10 pb-8 overflow-hidden"
      style={{ height: "100dvh" }}
      onClick={() => navigate("/onboarding/calendar-intro")}
    >
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === 1 ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs tracking-widest text-muted-foreground">2 OF 3</p>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-script-light animate-scale-in">
          <Sparkles className="h-7 w-7 text-script" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold italic leading-tight">
          Full scripts in seconds.
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Swipe up on any idea — DECKR's AI writes the hook, body, and call-to-action for you.
        </p>
      </div>

      {/* Animated script preview */}
      <div className="mt-6 flex-1 min-h-0">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-script-light px-3 py-1 text-[10px] font-semibold tracking-wider text-script">
              AI SCRIPT
            </span>
            <span className="text-[10px] text-muted-foreground">~30s read</span>
          </div>

          <div className="mt-4 space-y-3">
            {SCRIPT_LINES.map((line, i) => {
              // First line (HOOK) is always fixed/visible. Others animate in.
              const isFixed = i === 0;
              const visible = isFixed || i < revealed;
              const Icon = line.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 transition-all duration-500 ease-out"
                  style={{
                    backgroundColor: line.bg,
                    opacity: visible ? 1 : 0,
                    transform: isFixed ? "none" : visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.96)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: line.color }} />
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: line.color }}>
                      {line.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate("/onboarding/calendar-intro"); }}
        className="mt-6 w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
      >
        Next →
      </button>
    </div>
  );
};

/* =========================================================
 * CalendarIntroScreen — third onboarding screen
 * Shows a mini animated calendar grid filling with ideas
 * ========================================================= */

const CAL_DAYS = Array.from({ length: 21 }, (_, i) => i);
const FILLED_INDEXES = [1, 2, 4, 7, 9, 12, 14, 16, 18];
const COLORS = ["bg-save", "bg-script", "bg-trend", "bg-viral"];
const COLOR_HEX = ["hsl(145 65% 42%)", "hsl(262 60% 58%)", "hsl(200 75% 50%)", "hsl(38 90% 50%)"];

const PREVIEW_IDEAS = [
  { title: "5 Morning Habits That Changed My Life", platform: "TikTok", time: "9:00 AM", tag: "Lifestyle" },
  { title: "I Tested 10 AI Tools — Only 2 Worked", platform: "YouTube Shorts", time: "12:00 PM", tag: "Tech" },
  { title: "POV: You Just Found Your Dream Niche", platform: "Reels", time: "6:00 PM", tag: "Story" },
  { title: "The 30-Day Posting Cadence That Wins", platform: "YouTube", time: "10:00 AM", tag: "Strategy" },
  { title: "Stop Posting Daily — Do This Instead", platform: "TikTok", time: "2:00 PM", tag: "Hot Take" },
  { title: "3 Hooks That Got Me 1M Views", platform: "Reels", time: "8:00 PM", tag: "Tutorial" },
  { title: "The Cheat Code To Going Viral in 2026", platform: "YouTube Shorts", time: "11:00 AM", tag: "Growth" },
  { title: "Why Your Reach Just Dropped (Fix It)", platform: "TikTok", time: "5:00 PM", tag: "Algorithm" },
  { title: "POV: 30 Days of Content in 1 Day", platform: "Reels", time: "7:00 PM", tag: "Workflow" },
];

export const CalendarIntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => (s >= FILLED_INDEXES.length ? 0 : s + 1));
    }, 600);
    return () => clearInterval(id);
  }, []);

  // Selected = the most recently filled date
  const selectedIdx = Math.max(0, Math.min(step - 1, FILLED_INDEXES.length - 1));
  const selectedDay = FILLED_INDEXES[selectedIdx];
  const selectedColor = COLOR_HEX[selectedIdx % COLOR_HEX.length];
  const selectedPreview = PREVIEW_IDEAS[selectedIdx % PREVIEW_IDEAS.length];

  return (
    <div
      className="flex flex-col bg-background px-6 pt-10 pb-8 overflow-hidden"
      style={{ height: "100dvh" }}
      onClick={() => navigate("/auth")}
    >
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === 2 ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs tracking-widest text-muted-foreground">3 OF 3</p>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-save-light animate-scale-in">
          <CalendarIcon className="h-7 w-7 text-save" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold italic leading-tight">
          Plan a month, in minutes.
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Saved ideas drop straight onto your calendar. Never wonder "what should I post?" again.
        </p>
      </div>

      {/* Animated mini-calendar */}
      <div className="mt-5 flex-1 min-h-0">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">This Month</span>
            <span className="text-[10px] text-muted-foreground">{FILLED_INDEXES.length} ideas planned</span>
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5 text-center text-[9px] font-semibold uppercase text-muted-foreground">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {CAL_DAYS.map((d) => {
              const filledIdx = FILLED_INDEXES.indexOf(d);
              const isFilled = filledIdx !== -1 && filledIdx < step;
              const isSelected = isFilled && d === selectedDay;
              const color = filledIdx !== -1 ? COLORS[filledIdx % COLORS.length] : "";
              return (
                <div
                  key={d}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold transition-all duration-500 ${
                    isFilled ? `${color} text-background` : "bg-muted text-muted-foreground"
                  } ${isSelected ? "ring-2 ring-foreground ring-offset-1 ring-offset-card" : ""}`}
                  style={{
                    transform: isFilled ? (isSelected ? "scale(1.08)" : "scale(1)") : "scale(0.92)",
                  }}
                >
                  {d + 1}
                  {isFilled && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-background" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview content for the selected/animated date */}
          <div
            key={selectedIdx}
            className="mt-3 rounded-xl border border-border p-3 animate-fade-in"
            style={{ backgroundColor: `${selectedColor.replace("hsl(", "hsl(").replace(")", " / 0.08)")}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-background"
                  style={{ backgroundColor: selectedColor }}
                >
                  {selectedDay + 1}
                </span>
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: selectedColor }}>
                  {selectedPreview.platform.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{selectedPreview.time}</span>
            </div>
            <p className="mt-2 text-sm font-bold leading-snug text-foreground">
              {selectedPreview.title}
            </p>
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ backgroundColor: `${selectedColor.replace(")", " / 0.15)")}`, color: selectedColor }}
            >
              {selectedPreview.tag}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate("/auth"); }}
        className="mt-4 w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
      >
        Get Started →
      </button>
    </div>
  );
};
