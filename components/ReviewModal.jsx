"use client";

import { useEffect } from "react";
import { formatTimestamp, scoreLabel, shortenAddress } from "@/lib/utils";
import { X } from "lucide-react";

const SCORE_COLORS = {
  1: { dot: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  2: { dot: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  3: { dot: "#eab308", bg: "#fefce8", text: "#a16207" },
  4: { dot: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  5: { dot: "#10b981", bg: "#ecfdf5", text: "#047857" },
};

function Identicon({ address, className = "" }) {
  const hue = address
    ? address.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 200;

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-mono font-bold ${className}`}
      style={{
        background: `hsl(${hue}, 40%, 94%)`,
        color: `hsl(${hue}, 50%, 40%)`,
      }}
    >
      {address ? address.slice(1, 3) : "??"}
    </div>
  );
}

export default function ReviewModal({ review, isOpen, onClose, onReviewClick }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !review) return null;

  const palette = SCORE_COLORS[review.score] ?? SCORE_COLORS[3];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-medium shrink-0"
              style={{ backgroundColor: palette.bg, color: palette.text }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: palette.dot }}
              />
              {review.score}/5
            </span>
            <span className="text-sm font-medium text-muted-foreground">{scoreLabel(review.score)}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted-bg text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 flex flex-col md:flex-row gap-6">
          
          {/* Post Content on Left */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Review Content</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{review.content}</p>
            </div>
            
            <p className="text-xs text-muted-foreground font-medium text-right mt-6">
              Posted {formatTimestamp(review.timestamp)}
            </p>
          </div>

          {/* Subject & Author on Right */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4 bg-muted-bg p-4 rounded-lg border border-border h-fit">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Identicon address={review.subject} className="w-10 h-10 text-sm border border-border/10" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Subject</p>
                  <p className="text-sm font-mono font-medium text-foreground truncate">{shortenAddress(review.subject, 10)}</p>
                </div>
              </div>
              <button 
                onClick={() => { onClose(); onReviewClick?.(review.subject); }}
                className="w-full h-8 px-3 rounded-lg text-xs font-medium bg-accent border border-border text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Review Subject
              </button>
            </div>
            
            <div className="w-full h-px bg-border" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Identicon address={review.author} className="w-10 h-10 text-sm border border-border/10" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Author</p>
                  <p className="text-sm font-mono text-muted truncate">{shortenAddress(review.author, 10)}</p>
                </div>
              </div>
              <button 
                onClick={() => { onClose(); onReviewClick?.(review.author); }}
                className="w-full h-8 px-3 rounded-lg text-xs font-medium bg-background border border-border text-foreground hover:bg-muted-bg transition-colors"
              >
                Review Author
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
