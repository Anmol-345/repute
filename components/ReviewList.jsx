"use client";

import ReviewCard from "./ReviewCard";

export default function ReviewList({ reviews, loading, onVoted, onReviewClick }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#e5e5e5] bg-white p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f5]" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-[#f5f5f5] rounded" />
                <div className="h-2.5 w-20 bg-[#f5f5f5] rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#f5f5f5] rounded" />
              <div className="h-3 w-5/6 bg-[#f5f5f5] rounded" />
              <div className="h-3 w-3/4 bg-[#f5f5f5] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e5e5] p-10 text-center">
        <p className="text-sm text-[#a3a3a3]">No reviews yet.</p>
        <p className="text-xs text-[#d4d4d4] mt-1">Be the first to leave a review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} onVoted={onVoted} onReviewClick={onReviewClick} />
      ))}
    </div>
  );
}
