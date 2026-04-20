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
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRevealed(r => (r >= SCRIPT_LINES.length ? 0 : r + 1));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-background px-6 pt-10 pb-8"
      onClick={() => navigate("/onboarding/calendar-intro")}
    >
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === 1 ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs tracking-widest text-muted-foreground">2 OF 3</p>

      <div className="mt-10 flex flex-col items-center text-center">
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
      <div className="mt-8 flex-1">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-card-soft">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-script-light px-3 py-1 text-[10px] font-semibold tracking-wider text-script">
              AI SCRIPT
            </span>
            <span className="text-[10px] text-muted-foreground">~30s read</span>
          </div>

          <div className="mt-4 space-y-3">
            {SCRIPT_LINES.map((line, i) => {
              const visible = i < revealed;
              const Icon = line.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 transition-all duration-500"
                  style={{
                    backgroundColor: line.bg,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
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

export const CalendarIntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => (s >= FILLED_INDEXES.length ? 0 : s + 1));
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col bg-background px-6 pt-10 pb-8"
      onClick={() => navigate("/auth")}
    >
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === 2 ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-xs tracking-widest text-muted-foreground">3 OF 3</p>

      <div className="mt-10 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-save-light animate-scale-in">
          <CalendarIcon className="h-7 w-7 text-save" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold italic leading-tight">
          Plan a month, in minutes.
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Saved ideas drop straight onto your calendar. Never wonder "what should I post?" again.
        </p>
      </div>

      {/* Animated mini-calendar */}
      <div className="mt-8 flex-1">
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-card-soft">
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
              const color = filledIdx !== -1 ? COLORS[filledIdx % COLORS.length] : "";
              return (
                <div
                  key={d}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-semibold transition-all duration-500 ${
                    isFilled ? `${color} text-background scale-100` : "bg-muted text-muted-foreground scale-95"
                  }`}
                  style={{
                    transform: isFilled ? "scale(1)" : "scale(0.92)",
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

          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-viral animate-pulse" />
              <span className="text-[11px] font-semibold">Today's Post</span>
            </div>
            <span className="text-[10px] text-muted-foreground">2:00 PM · TikTok</span>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); navigate("/auth"); }}
        className="mt-6 w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background"
      >
        Get Started →
      </button>
    </div>
  );
};
