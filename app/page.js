"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { fetchReviews, fetchReviewsByWallet, submitReview, fetchReputation } from "@/lib/contract";
import Navbar from "@/components/Navbar";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import ReputationPanel from "@/components/ReputationPanel";
import SearchBar from "@/components/SearchBar";

function App() {
  const { address } = useWallet();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  const [userReputation, setUserReputation] = useState(null);
  const [userReputationLoading, setUserReputationLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedReputation, setSearchedReputation] = useState(null);
  const [searchedReputationLoading, setSearchedReputationLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("reviews");
  const [formInitialSubject, setFormInitialSubject] = useState("");

  const loadData = useCallback(async (currentAddress, searchAddress) => {
    setReviewsLoading(true);
    try {
      // If there is a search query, fetch specifically for that wallet
      // Otherwise fetch all reviews (the global feed)
      let data;
      if (searchAddress) {
        data = await fetchReviewsByWallet(currentAddress, searchAddress);
      } else {
        data = await fetchReviews(currentAddress);
      }
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const loadUserReputation = useCallback(async (addr) => {
    if (!addr) return;
    setUserReputationLoading(true);
    try {
      const score = await fetchReputation(addr, addr);
      setUserReputation(score);
    } catch (err) {
      console.error("Failed to load user reputation:", err);
    } finally {
      setUserReputationLoading(false);
    }
  }, []);

  const loadSearchedReputation = useCallback(async (caller, target) => {
    if (!target) {
      setSearchedReputation(null);
      return;
    }
    setSearchedReputationLoading(true);
    try {
      const score = await fetchReputation(caller, target);
      setSearchedReputation(score);
    } catch (err) {
      console.error("Failed to load searched reputation:", err);
    } finally {
      setSearchedReputationLoading(false);
    }
  }, []);

  // Initial load or handle wallet connection
  useEffect(() => {
    if (address) {
      loadData(address, searchQuery);
      loadUserReputation(address);
      if (searchQuery) loadSearchedReputation(address, searchQuery);
    } else {
      setReviews([]);
      setReviewsLoading(false);
      setUserReputation(null);
      setSearchedReputation(null);
    }
  }, [address, searchQuery, loadData, loadUserReputation, loadSearchedReputation]);

  async function handleSubmit(data) {
    await submitReview(data);
    // Reload data after submission
    await loadData(address, searchQuery);
    if (address) loadUserReputation(address);
    if (searchQuery) loadSearchedReputation(address, searchQuery);
  }

  const handleSearch = (query) => {
    setSearchQuery(query);
    setActiveTab("reviews");
  };

  const handleReviewClick = (wallet) => {
    setFormInitialSubject(wallet);
    setActiveTab("submit");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar reputation={userReputation} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Wallet Reputation System
          </h1>
          <p className="text-base text-muted max-w-2xl mx-auto lg:mx-0">
            On-chain trust scores and reviews for Stellar wallet addresses. Built on Soroban for verified accountability.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} initialValue={searchQuery} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-6 border-b border-border">
              {["reviews", "submit"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`h-10 px-4 text-sm font-semibold capitalize border-b-2 -mb-px transition-all ${
                    activeTab === tab
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "reviews" 
                    ? searchQuery 
                      ? "Filtered Reviews" 
                      : `Global Feed (${reviews.length})` 
                    : "Post Review"}
                </button>
              ))}
            </div>

            {activeTab === "submit" ? (
              <ReviewForm 
                initialSubject={formInitialSubject}
                onSubmit={async (data) => { 
                  await handleSubmit(data); 
                  setActiveTab("reviews"); 
                  setFormInitialSubject(""); 
                }} 
              />
            ) : !address ? (
              <WalletPrompt />
            ) : (
              <div className="space-y-6">
                {searchQuery && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-muted font-medium italic">
                      Showing reviews for: <span className="font-mono text-foreground">{searchQuery}</span>
                    </p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-accent-blue hover:underline font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                )}
                <ReviewList
                  reviews={reviews}
                  loading={reviewsLoading}
                  onVoted={() => loadData(address, searchQuery)}
                  onReviewClick={handleReviewClick}
                />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {searchQuery && (
              <ReputationPanel
                address={searchQuery}
                score={searchedReputation}
                loading={searchedReputationLoading}
                title="Reputation of This Wallet"
              />
            )}
            
            <ReputationPanel
              address={address}
              score={userReputation}
              loading={userReputationLoading}
              title="Your Reputation"
            />
            
            <StatsCard reviews={reviews} isFiltered={!!searchQuery} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-sm font-bold text-foreground">Repute</p>
            <p className="text-xs text-muted-foreground">© 2026 Decentralized Reputation Protocol</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted-bg text-[11px] font-bold text-muted">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            STALLAR TESTNET · SOROBAN ACTIVE
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatsCard({ reviews, isFiltered }) {
  const avgScore =
    reviews.length
      ? (reviews.reduce((a, r) => a + Number(r.score), 0) / reviews.length).toFixed(1)
      : "—";

  const totalVotes = reviews.reduce((a, r) => a + Number(r.upvotes) + Number(r.downvotes), 0);
  const uniqueAuthors = new Set(reviews.map((r) => r.author)).size;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">{isFiltered ? "Search Result Stats" : "Global Network Stats"}</p>
      <div className="space-y-4">
        <Stat label="Total Reviews" value={reviews.length} />
        <Stat label="Avg. Score" value={avgScore} />
        <Stat label="Total Votes" value={totalVotes} />
        <Stat label="Unique Authors" value={uniqueAuthors} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function WalletPrompt() {
  const { connect, connecting } = useWallet();
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-12 text-center bg-card">
      <div className="w-12 h-12 bg-muted-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9l-6 6m0-6l6 6" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">Authorization Required</h3>
      <p className="text-sm text-muted mb-6 max-w-xs mx-auto">Please connect your Freighter wallet to access the reputation ledger.</p>
      <button
        onClick={connect}
        disabled={connecting}
        className="h-10 px-6 rounded-lg text-sm font-bold bg-accent border border-border text-accent-foreground hover:bg-accent-hover transition-all disabled:opacity-50"
      >
        {connecting ? "Connecting Ledger…" : "Connect Freighter"}
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <WalletProvider>
      <App />
    </WalletProvider>
  );
}
