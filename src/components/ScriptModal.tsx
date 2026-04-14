import React, { useRef, useState } from "react";
import { X, Copy, Image, Hash, MessageSquare, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ScriptData {
  id: string;
  title: string;
  platform: string;
  hookText: string;
  bodyText: string;
  ctaText: string;
  deliveryTip: string;
  hashtags?: string[];
  thumbnailIdea?: string;
  captionIdea?: string;
  createdAt: string;
}

interface Props {
  script: ScriptData | null;
  isLoading?: boolean;
  onClose: () => void;
  onRegenerate?: () => void;
}

const ScriptModal: React.FC<Props> = ({ script, isLoading, onClose, onRegenerate }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const dy = e.touches[0].clientY - dragStart.current;
    if (dy > 0) setDragY(dy);
  };
  const handleTouchEnd = () => {
    if (dragY > 150) onClose();
    else setDragY(0);
    dragStart.current = null;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-foreground/40" onClick={onClose}>
      <div
        ref={contentRef}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-background px-6 pt-4 pb-8 transition-transform animate-slide-up"
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />

        <div className="flex items-center justify-between">
          <span className="rounded-full bg-script-light px-3 py-1 text-xs font-medium text-script">✨ AI Script</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading && !script ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-script border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Generating your script...</p>
            <p className="mt-1 text-xs text-muted-foreground">This may take a few seconds</p>
          </div>
        ) : script ? (
          <>
            <h2 className="mt-4 text-xl font-black italic">{script.title}</h2>
            <span className="mt-1 inline-block rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] font-semibold">{script.platform}</span>

            {/* HOOK */}
            <div className="mt-4 rounded-xl bg-skip-light p-4">
              <span className="rounded-full bg-skip/10 px-2 py-0.5 text-[10px] font-semibold text-skip">HOOK</span>
              <p className="mt-2 text-sm whitespace-pre-line">{script.hookText}</p>
              <div className="mt-3 rounded-lg bg-background/50 p-3">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">DELIVERY TIP</p>
                <p className="mt-1 text-xs text-muted-foreground">{script.deliveryTip}</p>
              </div>
            </div>

            {/* BODY */}
            <div className="mt-4 rounded-xl bg-trend p-4">
              <span className="rounded-full bg-trend-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-trend-foreground">BODY</span>
              <p className="mt-2 text-sm whitespace-pre-line">{script.bodyText}</p>
            </div>

            {/* CTA */}
            <div className="mt-4 rounded-xl bg-save-light p-4">
              <span className="rounded-full bg-save/10 px-2 py-0.5 text-[10px] font-semibold text-save">CTA</span>
              <p className="mt-2 text-sm">{script.ctaText}</p>
            </div>

            {/* HASHTAGS */}
            {script.hashtags && script.hashtags.length > 0 && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-script" />
                    <span className="text-xs font-bold">HASHTAGS</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(script.hashtags!.map(h => `#${h}`).join(" "), "Hashtags")}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {script.hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-script-light px-2.5 py-0.5 text-[11px] font-medium text-script">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* THUMBNAIL IDEA */}
            {script.thumbnailIdea && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold">THUMBNAIL IDEA</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{script.thumbnailIdea}</p>
              </div>
            )}

            {/* CAPTION / DESCRIPTION */}
            {script.captionIdea && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-save" />
                    <span className="text-xs font-bold">CAPTION / DESCRIPTION</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(script.captionIdea!, "Caption")}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{script.captionIdea}</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ScriptModal;
