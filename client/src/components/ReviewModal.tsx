"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send } from "lucide-react";
import { authFetch, getStoredUser } from "../lib/apiClient";
import { formatTicketNumber } from "../lib/ticketFormatter";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketGlobalId: string;
  ticket_number?: number;
  assignedTo: string;
  department: string;
  onReviewSubmitted: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  ticketId,
  ticketGlobalId,
  assignedTo,
  department,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    const user = getStoredUser();
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await authFetch(`/api/reviews/${ticketId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
          reviewer: user.username,
          reviewer_role: user.role,
          assigned_to: assignedTo,
          department,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onReviewSubmitted();
        onClose();
        setRating(0);
        setComment("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit review");
      }
    } catch (err) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setError("");
  };

  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Review & Confirm Finish
                    </h2>
                    <p className="text-green-100 text-sm mt-1">
                      {ticket_number ? formatTicketNumber(ticket_number) : `Ticket #${ticketGlobalId}`}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-600 text-sm mb-4">
                    How would you rate the IT support you received for this ticket?
                  </p>
                  
                  {/* Star Rating */}
                  <div className="flex gap-2 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={handleStarLeave}
                        className="transition-transform hover:scale-110 active:scale-95"
                        disabled={isSubmitting}
                      >
                        <Star
                          size={36}
                          className={
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-center text-sm text-gray-500">
                    {rating > 0 && (
                      <span className="font-semibold text-green-600">
                        {rating} star{rating !== 1 ? "s" : ""}
                      </span>
                    )}
                    {rating === 0 && "Select a rating"}
                  </p>
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with the IT support..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Submit Review & Finish
                    </>
                  )}
                </button>

                {/* Info */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  Your review helps us improve our IT services
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
