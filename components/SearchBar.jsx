"use client";

import { useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";

export default function SearchBar({ onSearch, initialValue = "" }) {
  const [query, setQuery] = useState(initialValue);
  const [error, setError] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    
    if (!cleanQuery) {
      onSearch("");
      setError("");
      return;
    }

    if (!StrKey.isValidEd25519PublicKey(cleanQuery)) {
      setError("Invalid Stellar address");
      return;
    }

    setError("");
    onSearch(cleanQuery);
  };

  return (
    <div className="w-full mb-8">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-[#a3a3a3] group-focus-within:text-[#0a0a0a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (error) setError("");
          }}
          placeholder="Search wallet address (e.g. G...)"
          spellCheck={false}
          className={`w-full h-11 pl-10 pr-20 rounded-xl border bg-white text-sm font-mono placeholder-[#d4d4d4] focus:outline-none focus:ring-1 transition-all ${
            error 
              ? "border-red-200 focus:ring-red-500" 
              : "border-[#e5e5e5] focus:ring-[#0f172a] focus:border-transparent"
          }`}
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-8 px-4 rounded-lg bg-[#0f172a] text-white text-xs font-medium hover:bg-[#1e293b] transition-colors"
        >
          Search
        </button>
      </form>
      {error && <p className="mt-2 text-[11px] text-red-500 ml-1">{error}</p>}
    </div>
  );
}
