"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet";
import { scoreLabel } from "@/lib/utils";

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

export default function ReviewForm({ onSubmit, initialSubject = "" }) {
  const { address } = useWallet();
  const [subject, setSubject] = useState(initialSubject || address || "");
  const [score, setScore] = useState(0);

  // Sync subject with initialSubject if it changes
  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  // Update subject when wallet connects if it was empty
  useEffect(() => {
    if (address && !subject) {
      setSubject(address);
    }
  }, [address, subject]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = address && subject.trim() && score > 0 && content.trim().length >= 20;

  async function handleSubmit(e) {
    e.preventDefault();
    const finalSubject = subject.trim() || address;
    if (!address || !finalSubject || score === 0 || content.trim().length < 20) {
      setError("Please fill in all fields correctly (min 20 chars for review).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ author: address, subject: finalSubject, score, content: content.trim() });
      setSubject("");
      setScore(0);
      setContent("");
    } catch (err) {
      setError(err.message ?? "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-muted">Recipient Address (Subject)</label>
          {address && subject !== address && (
            <button
              type="button"
              onClick={() => setSubject(address)}
              className="text-[10px] text-accent-blue hover:underline"
            >
              Use my address
            </button>
          )}
        </div>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="G…"
          spellCheck={false}
          disabled={!address || loading}
          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm font-mono placeholder-[#d4d4d4] focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent transition disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-2">Score</label>
        <div className="flex gap-2">
          {SCORE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              disabled={!address || loading}
              className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-all ${
                score === s
                  ? "bg-accent text-accent-foreground border-[#0f172a]"
                  : "bg-card text-muted border-border hover:border-border-strong hover:text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {s}
            </button>
          ))}
        </div>
        {score > 0 && (
          <p className="mt-1.5 text-xs text-muted">
            {score}/5 — {scoreLabel(score)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your experience working with this address…"
          rows={4}
          disabled={!address || loading}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder-[#d4d4d4] focus:outline-none focus:ring-1 focus:ring-accent focus:border-transparent resize-none transition disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-[#d4d4d4] text-right">{content.length} / min 20</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!address && (
        <p className="text-xs text-muted">Connect your wallet to submit a review.</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full h-9 rounded-lg text-sm font-medium bg-accent border border-border text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
