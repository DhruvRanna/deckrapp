import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUp, ArrowLeft } from "lucide-react";

const slides = [
  { word: "SAVE", color: "text-save border-save", desc: "Swipe RIGHT to save\nan idea to your calendar", arrow: <ArrowRight className="h-6 w-6 text-muted-foreground" />, swipeDir: "right" as const },
  { word: "SCRIPT", color: "text-script border-script", desc: "Swipe UP to generate\na full script with AI", arrow: <ArrowUp className="h-6 w-6 text-muted-foreground" />, swipeDir: "up" as const },
  { word: "SKIP", color: "text-skip border-skip", desc: "Swipe LEFT to skip\nideas you don't like", arrow: <ArrowLeft className="h-6 w-6 text-muted-foreground" />, swipeDir: "left" as const },
];

const TutorialScreen: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [exiting, setExiting] = useState<{ x: number; y: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const advance = (dir: "left" | "right" | "up") => {
    const exitTarget = dir === "right" ? { x: 500, y: 0 } : dir === "left" ? { x: -500, y: 0 } : { x: 0, y: -600 };
    setExiting(exitTarget);
    setTimeout(() => {
      if (current < 2) {
        setCurrent(current + 1);
      } else {
        navigate("/auth");
        return;
      }
      setExiting(null);
      setDragDelta({ x: 0, y: 0 });
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !isDragging.current) return;
    setDragDelta({
      x: e.touches[0].clientX - touchStart.current.x,
      y: e.touches[0].clientY - touchStart.current.y,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !isDragging.current) return;
    isDragging.current = false;
    const { x, y } = dragDelta;
    const slide = slides[current];

    if (slide.swipeDir === "right" && x > 80) {
      advance("right");
    } else if (slide.swipeDir === "up" && y < -80) {
      advance("up");
    } else if (slide.swipeDir === "left" && x < -80) {
      advance("left");
    } else {
      setDragDelta({ x: 0, y: 0 });
    }
    touchStart.current = null;
  };

  // Mouse support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart.current || !isDragging.current) return;
    setDragDelta({
      x: e.clientX - touchStart.current.x,
      y: e.clientY - touchStart.current.y,
    });
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const { x, y } = dragDelta;
    const slide = slides[current];

    if (slide.swipeDir === "right" && x > 80) {
      advance("right");
    } else if (slide.swipeDir === "up" && y < -80) {
      advance("up");
    } else if (slide.swipeDir === "left" && x < -80) {
      advance("left");
    } else {
      setDragDelta({ x: 0, y: 0 });
    }
    touchStart.current = null;
  };

  const slide = slides[current];

  const tx = exiting ? exiting.x : dragDelta.x;
  const ty = exiting ? exiting.y : dragDelta.y;
  const rotation = tx * 0.05;
  const opacity = exiting ? 0 : 1;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs tracking-widest text-muted-foreground">{current + 1} OF 3</p>

      <div
        className="mt-8 w-full max-w-xs rounded-2xl bg-card p-10 shadow-sm"
        style={{
          transform: `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`,
          opacity,
          transition: exiting || (dragDelta.x === 0 && dragDelta.y === 0) ? "transform 0.3s ease-out, opacity 0.3s ease-out" : "none",
        }}
      >
        <div className={`mx-auto w-fit border-2 px-6 py-2 ${slide.color}`}>
          <span className="text-2xl font-black italic">{slide.word}</span>
        </div>
        <p className="mt-6 whitespace-pre-line text-center text-lg font-bold leading-snug">{slide.desc}</p>
        <div className="mt-4 flex justify-center">{slide.arrow}</div>
      </div>

      
    </div>
  );
};

export default TutorialScreen;
