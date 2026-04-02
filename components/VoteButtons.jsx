"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { voteOnReview, getUserVote } from "@/lib/contract";

export default function VoteButtons({ review, onVoted }) {
  const { address } = useWallet();
  const [loading, setLoading] = useState(null);
  const [voted, setVoted] = useState(null);
  const [counts, setCounts] = useState({
    up: review.upvotes,
    down: review.downvotes,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkVote() {
      if (!address) return;
      const status = await getUserVote({ voter: address, reviewId: review.id });
      setVoted(status);
    }
    checkVote();
  }, [address, review.id]);

  async function handleVote(direction) {
    if (!address || voted || loading) return;
    setLoading(direction);
    setError("");
    try {
      await voteOnReview({ reviewId: review.id, voter: address, direction });
      setVoted(direction);
      setCounts((prev) => ({
        ...prev,
        [direction === "up" ? "up" : "down"]:
          prev[direction === "up" ? "up" : "down"] + 1,
      }));
      onVoted?.();
    } catch (err) {
      setError(err.message ?? "Vote failed.");
    } finally {
      setLoading(null);
    }
  }

  const isUpvoted = voted === "up";
  const isDownvoted = voted === "down";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-background border border-[#f0f0f0]">
        <VoteBtn
          direction="up"
          count={counts.up}
          active={voted === "up" || voted === "voted"}
          loading={loading === "up"}
          disabled={!address || !!voted}
          onClick={() => handleVote("up")}
        />
        <VoteBtn
          direction="down"
          count={counts.down}
          active={voted === "down"}
          loading={loading === "down"}
          disabled={!address || !!voted}
          onClick={() => handleVote("down")}
        />
      </div>
      {error && <span className="text-[10px] text-red-500 font-medium px-2">{error}</span>}
      {voted && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] text-[10px] font-bold uppercase tracking-wider">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Locked
        </span>
      )}
    </div>
  );
}

function VoteBtn({ direction, count, active, loading, disabled, onClick }) {
  const isUp = direction === "up";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={isUp ? "Upvote" : "Downvote"}
      className={`flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium border transition-all ${
        active
          ? isUp
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-red-50 border-red-200 text-red-600"
          : "bg-card border-border text-muted hover:border-border-strong hover:text-foreground"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={isUp ? "" : "rotate-180"}>
          <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
        </svg>
      )}
      <span>{count}</span>
    </button>
  );
}
