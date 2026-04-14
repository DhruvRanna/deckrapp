import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6" onClick={() => navigate("/tutorial")}>
      <h1 className="font-condensed text-5xl tracking-tight">DECKR</h1>
      <p className="mt-4 text-lg font-semibold text-secondary-foreground">Swipe. Create. Go Viral.</p>
      <p className="mt-1 text-sm text-muted-foreground">Discover your next 30 days of content in 2 minutes.</p>

      <div className="mt-10 w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "hsl(200 80% 92%)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "hsl(200 80% 86%)", color: "hsl(200 60% 35%)" }}>YOUTUBE SHORTS</span>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "hsl(200 80% 86%)", color: "hsl(200 60% 35%)" }}>⚡ 97</span>
        </div>
        <h2 className="mt-4 text-lg font-bold italic leading-snug text-foreground">"I Made $47,000 in 30 Days Using One Viral Content Strategy"</h2>
        <p className="mt-2 text-sm italic text-muted-foreground">"Most creators post every day and go nowhere. Here's the one-video formula that changed everything for me."</p>
        <div className="mt-4 flex gap-2">
          {["Short Video", "60s", "Finance"].map(t => (
            <span key={t} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "hsl(200 60% 35% / 0.2)", backgroundColor: "hsl(200 80% 88%)", color: "hsl(200 60% 35%)" }}>{t}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground" style={{ borderColor: "hsl(200 60% 35% / 0.1)" }}>
          <span>Competition: Low</span>
          <span>Short Form</span>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">Tap anywhere to begin →</p>
    </div>
  );
};

export default WelcomeScreen;