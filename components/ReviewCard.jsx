"use client";

import VoteButtons from "./VoteButtons";
import { shortenAddress, formatTimestamp, scoreLabel } from "@/lib/utils";

const SCORE_COLORS = {
  1: { dot: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  2: { dot: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  3: { dot: "#eab308", bg: "#fefce8", text: "#a16207" },
  4: { dot: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  5: { dot: "#10b981", bg: "#ecfdf5", text: "#047857" },
};

export default function ReviewCard({ review, onVoted, onReviewClick }) {
  const palette = SCORE_COLORS[review.score] ?? SCORE_COLORS[3];

  return (
    <article className="rounded-xl border border-border bg-card p-5 sm:p-6 hover:border-border-strong transition-all hover:shadow-sm group">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-3 group-hover:-space-x-1 transition-all">
            <Identicon address={review.author} label="Author" />
            <Identicon address={review.subject} label="Subject" className="border-2 border-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Subject</span>
              <button 
                onClick={() => onReviewClick?.(review.subject)}
                className="text-xs font-mono font-medium text-foreground truncate hover:text-accent-blue hover:underline transition-colors"
              >
                {shortenAddress(review.subject, 6)}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">By</span>
              <button 
                onClick={() => onReviewClick?.(review.author)}
                className="text-[11px] font-mono text-muted truncate hover:text-accent-blue hover:underline transition-colors"
              >
                {shortenAddress(review.author, 4)}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-medium"
            style={{ backgroundColor: palette.bg, color: palette.text }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: palette.dot }}
            />
            {review.score}/5 · {scoreLabel(review.score)}
          </span>
          <time className="text-[11px] text-muted-foreground font-medium">{formatTimestamp(review.timestamp)}</time>
        </div>
      </div>

      <p className="text-sm text-[#3f3f46] leading-relaxed mb-4">{review.content}</p>

      <VoteButtons review={review} onVoted={onVoted} />
    </article>
  );
}

function Identicon({ address, className = "" }) {
  const hue = address
    ? address.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 200;

  return (
    <div
      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-mono font-bold ${className}`}
      style={{
        background: `hsl(${hue}, 40%, 94%)`,
        color: `hsl(${hue}, 50%, 40%)`,
      }}
    >
      {address ? address.slice(1, 3) : "??"}
    </div>
  );
}
