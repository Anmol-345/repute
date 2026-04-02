"use client";

import { useWallet } from "@/lib/wallet";
import { shortenAddress } from "@/lib/utils";
import { useState } from "react";

export default function Navbar({ reputation }) {
  const { address, connecting, connect, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-[#fafafa]/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#0f172a] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4" stroke="white" strokeWidth="1.5" />
              <path d="M6 3v3l2 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">Repute</span>
          <span className="hidden sm:inline text-xs text-[#737373] font-mono ml-1">/ Stellar</span>
        </div>

        <div className="flex items-center gap-3">
          {address && reputation !== null && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#737373]">
              <span className="font-mono">{reputation}</span>
              <span>pts</span>
            </div>
          )}

          {!address ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="h-8 px-3.5 rounded-lg text-sm font-medium bg-[#0f172a] text-white hover:bg-[#1e293b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="h-8 px-3 rounded-lg text-sm font-mono text-[#0a0a0a] border border-[#e5e5e5] bg-white hover:border-[#d4d4d4] hover:bg-[#f5f5f5] transition-all flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                {shortenAddress(address)}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-lg border border-[#e5e5e5] bg-white shadow-md py-1 z-50">
                  <button
                    onClick={() => { disconnect(); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
