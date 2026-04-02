"use client";

import { reputationLabel } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";

export default function ReputationPanel({ address, score, loading, title = "Your Reputation" }) {
  const { connect } = useWallet();
  const { label, color } = reputationLabel(score ?? 0);

  if (!address) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted mb-3">{title}</p>
        <p className="text-xs text-muted-foreground">Connect your wallet or search for an address to view its on-chain reputation.</p>
        {!address && title === "Your Reputation" && (
          <button
            onClick={connect}
            className="mt-3 h-8 px-3 rounded-lg text-xs font-medium bg-accent border border-border text-accent-foreground hover:bg-accent-hover transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-3 w-24 bg-muted-bg rounded mb-4" />
        <div className="h-8 w-16 bg-muted-bg rounded mb-2" />
        <div className="h-2 w-32 bg-muted-bg rounded" />
      </div>
    );
  }

  const percent = Math.min((score / 1000) * 100, 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted mb-4">{title}</p>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-semibold tracking-tight" style={{ color }}>
          {score ?? 0}
        </span>
        <span className="text-sm text-muted-foreground mb-0.5">pts</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
          style={{ background: `${color}15`, color }}
        >
          {label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-muted-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <p className="text-[11px] text-[#d4d4d4] mt-1.5">{score} / 1000</p>

      <div className="mt-4 pt-4 border-t border-[#f5f5f5]">
        <p className="text-[11px] text-muted-foreground">Reputation is computed on-chain from review scores and engagement via Soroban contracts.</p>
      </div>
    </div>
  );
}
