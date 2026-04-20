import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type CardData = {
  platform: string;
  score: number;
  title: string;
  hook: string;
  tags: string[];
  competition: string;
  format: string;
  bg: string;       // soft tint
  pill: string;     // pill bg
  pillText: string; // pill text color
  border: string;
};

const CARDS: CardData[] = [
  {
    platform: "YOUTUBE SHORTS",
    score: 97,
    title: '"I Made $47,000 in 30 Days Using One Viral Content Strategy"',
    hook: '"Most creators post every day and go nowhere. Here\'s the one-video formula that changed everything for me."',
    tags: ["Short Video", "60s", "Finance"],
    competition: "Low",
    format: "Short Form",
    bg: "hsl(200 80% 92%)",
    pill: "hsl(200 80% 86%)",
    pillText: "hsl(200 60% 35%)",
    border: "hsl(200 60% 35% / 0.2)",
  },
  {
    platform: "TIKTOK",
    score: 92,
    title: '"3 AI Tools That Replaced My $2,000/mo Editor"',
    hook: '"I fired my whole editing team and my views actually went up. Here\'s exactly what I use."',
    tags: ["Listicle", "45s", "Tech"],
    competition: "Medium",
    format: "Hot Take",
    bg: "hsl(145 50% 92%)",
    pill: "hsl(145 50% 84%)",
    pillText: "hsl(145 60% 28%)",
    border: "hsl(145 60% 28% / 0.2)",
  },
  {
    platform: "INSTAGRAM REELS",
    score: 89,
    title: '"POV: You Just Discovered The Cheat Code To Going Viral"',
    hook: '"Stop posting random content. This 3-step framework printed me 12M views last month."',
    tags: ["POV", "30s", "Lifestyle"],
    competition: "High",
    format: "Story-Time",
    bg: "hsl(262 50% 93%)",
    pill: "hsl(262 50% 86%)",
    pillText: "hsl(262 52% 40%)",
    border: "hsl(262 52% 40% / 0.2)",
  },
  {
    platform: "YOUTUBE",
    score: 95,
    title: '"The Posting Schedule That Beats The Algorithm In 2026"',
    hook: '"Forget daily uploads. This counter-intuitive cadence is what every top creator quietly does."',
    tags: ["Tutorial", "8min", "Business"],
    competition: "Low",
    format: "Long Form",
    bg: "hsl(35 85% 90%)",
    pill: "hsl(35 85% 82%)",
    pillText: "hsl(25 75% 35%)",
    border: "hsl(25 75% 35% / 0.2)",
  },
];

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  // Auto-advance cards every 2.8s
  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % CARDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10"
      onClick={() => navigate("/onboarding/scripts-intro")}
    >
      <h1 className="font-condensed text-5xl tracking-tight animate-fade-in">DECKR</h1>
      <p className="mt-4 text-lg font-semibold text-secondary-foreground animate-fade-in">Swipe. Create. Go Viral.</p>
      <p className="mt-1 text-center text-sm text-muted-foreground animate-fade-in">
        Discover your next 30 days of content in 2 minutes.
      </p>

      {/* Card stack */}
      <div className="relative mt-10 h-[340px] w-full max-w-sm">
        {CARDS.map((c, i) => {
          const offset = (i - active + CARDS.length) % CARDS.length;
          // Show top 3 in stack; rest hidden
          const isTop = offset === 0;
          const isMid = offset === 1;
          const isBack = offset === 2;
          const visible = isTop || isMid || isBack;

          const translateY = isTop ? 0 : isMid ? 14 : 28;
          const scale = isTop ? 1 : isMid ? 0.95 : 0.9;
          const opacity = !visible ? 0 : isTop ? 1 : isMid ? 0.85 : 0.55;
          const rotate = isTop ? 0 : isMid ? -2 : 2;
          const z = isTop ? 30 : isMid ? 20 : 10;

          return (
            <div
              key={i}
              className="absolute inset-0 rounded-2xl p-6"
              style={{
                backgroundColor: c.bg,
                transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
                zIndex: z,
                pointerEvents: isTop ? "auto" : "none",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)",
                transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider"
                  style={{ backgroundColor: c.pill, color: c.pillText }}
                >
                  {c.platform}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: c.pill, color: c.pillText }}
                >
                  ⚡ {c.score}
                </span>
              </div>
              <h2 className="mt-4 text-base font-bold italic leading-snug text-foreground line-clamp-3">
                {c.title}
              </h2>
              <p className="mt-2 text-xs italic text-muted-foreground line-clamp-2">{c.hook}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags.map(t => (
                  <span
                    key={t}
                    className="rounded-full border px-3 py-1 text-[10px]"
                    style={{ borderColor: c.border, backgroundColor: c.pill, color: c.pillText }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] text-muted-foreground"
                style={{ borderColor: c.border }}
              >
                <span>Competition: {c.competition}</span>
                <span>{c.format}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center gap-1.5">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setActive(i); }}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`}
            aria-label={`Show card ${i + 1}`}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground animate-fade-in">Tap anywhere to begin →</p>
    </div>
  );
};

export default WelcomeScreen;
