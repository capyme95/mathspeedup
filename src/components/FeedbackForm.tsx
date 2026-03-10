'use client';

import { useState } from 'react';

interface FeedbackFormProps {
  /** Optional class name for the container */
  className?: string;
}

/**
 * In‑app feedback form that submits a rating (1‑5 stars) and an optional comment
 * to the Supabase `user_feedback` table. Uses the same environment variables as
 * the rest of the dashboard.
 */
export default function FeedbackForm({ className = '' }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const submitFeedback = async () => {
    if (rating === null) {
      setError('Please select a rating (1‑5 stars)');
      return;
    }
    setSubmitting(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError('Feedback system is not configured.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${url}/rest/v1/user_feedback`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          // user_id will be automatically filled by RLS (auth.uid())
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setSubmitted(true);
      setRating(null);
      setComment('');
      // Collapse after successful submission
      setTimeout(() => setExpanded(false), 1500);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Could not send feedback. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-4 border border-green-700/30 bg-green-950/20 rounded-lg ${className}`}>
        <p className="text-green-400 font-medium">Thank you! Your feedback has been recorded.</p>
        <p className="text-green-300/70 text-sm mt-1">
          Your input helps improve the learning experience.
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-zinc-800 bg-black/40 rounded-lg overflow-hidden ${className}`}>
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/60 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <span className="font-medium text-white">Give Feedback</span>
        </div>
        <span className="text-zinc-500 text-sm">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {expanded && (
        <div className="p-5 border-t border-zinc-800">
          <h4 className="text-lg font-bold text-white mb-3">How is your experience?</h4>
          <p className="text-zinc-400 text-sm mb-5">
            Rate the dashboard (1‑5 stars) and add any comments. Your feedback is anonymous and
            helps us improve the learning tools.
          </p>

          {/* Star rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Rating <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition
                    ${rating === star
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'border-zinc-700 bg-zinc-900/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              Optional comment
            </label>
            <textarea
              className="w-full p-3 bg-black/60 border border-zinc-700 rounded text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50"
              rows={3}
              placeholder="What do you like? What could be better?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-700/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded text-sm font-medium hover:bg-zinc-900/60 transition"
              onClick={() => setExpanded(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] rounded text-sm font-medium hover:bg-[#D4AF37]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={submitFeedback}
              disabled={submitting || rating === null}
            >
              {submitting ? 'Sending…' : 'Submit Feedback'}
            </button>
          </div>

          <p className="text-xs text-zinc-600 mt-4">
            Your rating and comment are stored securely and are only visible to you and the
            development team.
          </p>
        </div>
      )}
    </div>
  );
}