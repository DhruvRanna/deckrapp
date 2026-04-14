import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, ArrowRight, Download, Trash2, Calendar as CalIcon, Clock, Flame, Pin } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const COLOR_MAP: Record<string, string> = {
  save: "bg-save-light border-save/30",
  script: "bg-script-light border-script/30",
  skip: "bg-skip-light border-skip/30",
  trend: "bg-trend border-amber-200",
  viral: "bg-amber-50 border-amber-200",
};

const CalendarScreen: React.FC = () => {
  const { user, deleteIdea, scheduleIdea } = useApp();
  const [view, setView] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("deckr_pinned") || "[]")); } catch { return new Set(); }
  });

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("deckr_pinned", JSON.stringify([...next]));
      toast.success(next.has(id) ? "Idea pinned!" : "Unpinned");
      return next;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const savedIdeas = user?.savedIdeas || [];
  const unscheduled = savedIdeas.filter(i => !i.scheduledDate);
  const scheduled = savedIdeas.filter(i => i.scheduledDate);

  const monthName = currentDate.toLocaleString("default", { month: "long" }).toUpperCase();

  const getIdeasForDate = (dateStr: string) => scheduled.filter(s => s.scheduledDate === dateStr);
  const selectedIdeas = selectedDate ? getIdeasForDate(selectedDate) : [];

  const goNext = () => {
    if (view === "Monthly") setCurrentDate(new Date(year, month + 1, 1));
    else if (view === "Weekly") setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };
  const goPrev = () => {
    if (view === "Monthly") setCurrentDate(new Date(year, month - 1, 1));
    else if (view === "Weekly") setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };

  const handleSchedule = (ideaId: string, date: string) => {
    scheduleIdea(ideaId, date);
    toast.success("Idea scheduled!");
  };

  const handleDownload = () => {
    const lines = ["DECKR Content Calendar\n"];
    scheduled.forEach(i => lines.push(`${i.scheduledDate} | ${i.platform} | ${i.title}`));
    unscheduled.forEach(i => lines.push(`Unscheduled | ${i.platform} | ${i.title}`));
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "deckr-content-plan.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar downloaded!");
  };

  const totalScheduled = scheduled.length;
  const thisWeekCount = scheduled.filter(s => {
    if (!s.scheduledDate) return false;
    const d = new Date(s.scheduledDate);
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
    return d >= weekStart && d < weekEnd;
  }).length;

  // Daily view date
  const dailyDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const dailyIdeas = getIdeasForDate(dailyDateStr);

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="px-4 pt-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-condensed text-xl">CALENDAR</h1>
          <button onClick={handleDownload} className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-save-light p-2.5 text-center">
            <p className="text-lg font-bold text-save">{totalScheduled}</p>
            <p className="text-[10px] text-muted-foreground">Scheduled</p>
          </div>
          <div className="rounded-xl bg-script-light p-2.5 text-center">
            <p className="text-lg font-bold text-script">{thisWeekCount}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </div>
          <div className="rounded-xl bg-skip-light p-2.5 text-center">
            <p className="text-lg font-bold text-skip">{unscheduled.length}</p>
            <p className="text-[10px] text-muted-foreground">Unplanned</p>
          </div>
        </div>

        {/* Nav */}
        <div className="mt-2 flex items-center justify-between">
          <button onClick={goPrev} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <h2 className="font-condensed text-base">
            {view === "Daily"
              ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
              : `${monthName} ${year}`}
          </h2>
          <button onClick={goNext} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* View toggle - 3 options */}
        <div className="mt-2 flex overflow-hidden rounded-full bg-muted p-0.5">
          {(["Monthly", "Weekly", "Daily"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 rounded-full py-1.5 text-[11px] font-semibold transition-all ${view === v ? "bg-foreground text-background" : "text-muted-foreground"}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {view === "Monthly" && (
          <div className="pt-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground font-semibold">
              {DAYS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayIdeas = getIdeasForDate(dateStr);
                const hasEvent = dayIdeas.length > 0;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex h-10 flex-col items-center justify-center rounded-xl text-sm transition-all ${isSelected ? "bg-foreground text-background" : isToday ? "border-2 border-foreground font-bold" : "bg-muted/40 hover:bg-muted"}`}
                  >
                    {day}
                    {hasEvent && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayIdeas.slice(0, 3).map((_, idx) => (
                          <div key={idx} className={`h-1 w-1 rounded-full ${isSelected ? "bg-background" : "bg-save"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "Weekly" && (
          <div className="pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(year, month, currentDate.getDate() - currentDate.getDay() + i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasEvent = getIdeasForDate(dateStr).length > 0;
                const dayName = d.toLocaleString("default", { weekday: "short" }).toUpperCase();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex min-w-[44px] flex-1 flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 transition-all ${isSelected ? "bg-foreground text-background" : isToday ? "bg-save-light border-2 border-save" : "bg-muted"}`}
                  >
                    <span className="text-[9px] font-medium">{dayName}</span>
                    <span className="text-base font-bold">{d.getDate()}</span>
                    {hasEvent && <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-background" : "bg-save"}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "Daily" && (
          <div className="pt-3">
            <h3 className="text-sm font-bold">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            {dailyIdeas.length > 0 ? (
              dailyIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onDelete={() => deleteIdea(idea.id)} isPinned={pinnedIds.has(idea.id)} onPin={() => togglePin(idea.id)} />
              ))
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No content planned for this day</p>
                {unscheduled.length > 0 && (
                  <p className="mt-1 text-xs text-save">Schedule an idea below ↓</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected date ideas (Monthly/Weekly) */}
        {selectedDate && view !== "Daily" && (
          <div className="mt-3">
            <h3 className="text-sm font-bold">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </h3>
            {selectedIdeas.length > 0 ? (
              selectedIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onDelete={() => deleteIdea(idea.id)} isPinned={pinnedIds.has(idea.id)} onPin={() => togglePin(idea.id)} />
              ))
            ) : (
              <div className="mt-2 rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No content planned for this day</p>
                {unscheduled.length > 0 && <p className="mt-1 text-xs text-save">Schedule an idea from below ↓</p>}
              </div>
            )}
          </div>
        )}

        {/* Upcoming */}
        {scheduled.length > 0 && !selectedDate && view !== "Daily" && (
          <div className="pt-3">
            <h3 className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Upcoming</h3>
            {scheduled.filter(s => s.scheduledDate && s.scheduledDate >= todayStr).sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || "")).slice(0, 5).map(idea => (
              <IdeaCard key={idea.id} idea={idea} onDelete={() => deleteIdea(idea.id)} showDate isPinned={pinnedIds.has(idea.id)} onPin={() => togglePin(idea.id)} />
            ))}
          </div>
        )}

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div className="pt-3">
            <h3 className="text-sm font-bold">Unscheduled Ideas</h3>
            <p className="text-xs text-muted-foreground">{unscheduled.length} idea{unscheduled.length > 1 ? "s" : ""} waiting to be planned</p>
            {unscheduled.map(idea => (
              <IdeaCard
                key={idea.id} idea={idea} onDelete={() => deleteIdea(idea.id)}
                onSchedule={selectedDate ? () => handleSchedule(idea.id, selectedDate) : view === "Daily" ? () => handleSchedule(idea.id, dailyDateStr) : undefined}
                scheduleDateLabel={selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : view === "Daily" ? currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined}
                isPinned={pinnedIds.has(idea.id)} onPin={() => togglePin(idea.id)}
              />
            ))}
          </div>
        )}

        {savedIdeas.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-4 pt-12">
            <div className="text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm font-bold">No saved ideas yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Swipe right on ideas to save them here!</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const IdeaCard: React.FC<{
  idea: any;
  onDelete: () => void;
  onSchedule?: () => void;
  scheduleDateLabel?: string;
  showDate?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
}> = ({ idea, onDelete, onSchedule, scheduleDateLabel, showDate, isPinned, onPin }) => (
  <div className={`mt-2 rounded-2xl border p-3 ${COLOR_MAP[idea.color] || "bg-muted border-border"}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-foreground/10 bg-background/60 px-2 py-0.5 text-[10px] font-semibold">{idea.platform}</span>
        {showDate && idea.scheduledDate && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(idea.scheduledDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-save"><Flame className="h-3 w-3" /> {idea.viralScore}%</span>
        {onPin && (
          <button onClick={onPin}><Pin className={`h-3.5 w-3.5 ${isPinned ? "text-save fill-save" : "text-muted-foreground"}`} /></button>
        )}
        <button onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
    </div>
    <h4 className="mt-1.5 text-sm font-bold italic">{idea.title}</h4>
    <p className="mt-1 text-[11px] italic text-muted-foreground line-clamp-2">"{idea.hook}"</p>
    {onSchedule && (
      <button onClick={onSchedule} className="mt-2 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-[10px] font-semibold text-background">
        <CalIcon className="h-3 w-3" /> Schedule {scheduleDateLabel ? `for ${scheduleDateLabel}` : ""}
      </button>
    )}
  </div>
);

export default CalendarScreen;
