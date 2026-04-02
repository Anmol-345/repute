"use client";

import { reputationLabel } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";

export default function ReputationPanel({ address, score, loading, title = "Your Reputation" }) {
  const { connect } = useWallet();
  const { label, color } = reputationLabel(score ?? 0);

  if (!address) {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
        <p className="text-xs font-medium text-[#737373] mb-3">{title}</p>
        <p className="text-xs text-[#a3a3a3]">Connect your wallet or search for an address to view its on-chain reputation.</p>
        {!address && title === "Your Reputation" && (
          <button
            onClick={connect}
            className="mt-3 h-8 px-3 rounded-lg text-xs font-medium bg-[#0f172a] text-white hover:bg-[#1e293b] transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 animate-pulse">
        <div className="h-3 w-24 bg-[#f5f5f5] rounded mb-4" />
        <div className="h-8 w-16 bg-[#f5f5f5] rounded mb-2" />
        <div className="h-2 w-32 bg-[#f5f5f5] rounded" />
      </div>
    );
  }

  const percent = Math.min((score / 1000) * 100, 100);

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-5">
      <p className="text-xs font-medium text-[#737373] mb-4">{title}</p>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-semibold tracking-tight" style={{ color }}>
          {score ?? 0}
        </span>
        <span className="text-sm text-[#a3a3a3] mb-0.5">pts</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
          style={{ background: `${color}15`, color }}
        >
          {label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[#f5f5f5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <p className="text-[11px] text-[#d4d4d4] mt-1.5">{score} / 1000</p>

      <div className="mt-4 pt-4 border-t border-[#f5f5f5]">
        <p className="text-[11px] text-[#a3a3a3]">Reputation is computed on-chain from review scores and engagement via Soroban contracts.</p>
      </div>
    </div>
  );
}
