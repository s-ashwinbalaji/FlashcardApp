import { Card } from './useDatabase';

export interface ReviewResult {
  difficulty: number;
  nextReview: Date;
  reviewCount: number;
}

/**
 * Spaced repetition algorithm based on SM-2 (SuperMemo 2)
 * Quality scale: 1 (again) to 5 (easy)
 */
export function calculateSpacedRepetition(
  card: Card,
  quality: 1 | 2 | 3 | 4 | 5
): ReviewResult {
  const now = new Date();
  let { difficulty, review_count } = card;
  
  // Update difficulty based on quality (similar to easiness factor in SM-2)
  difficulty = Math.max(1.3, difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  
  // Round to 1 decimal place and clamp between 1 and 5
  difficulty = Math.round(Math.min(5, Math.max(1, difficulty)) * 10) / 10;
  
  let interval: number;
  
  if (quality < 3) {
    // If quality is poor (again/hard), reset to day 1
    interval = 1;
    review_count = 1;
  } else {
    // Increment review count
    review_count = review_count + 1;
    
    // Calculate interval based on review count and difficulty
    if (review_count === 1) {
      interval = 1; // First review: 1 day
    } else if (review_count === 2) {
      interval = 6; // Second review: 6 days
    } else {
      // Subsequent reviews: previous interval * difficulty factor
      const lastInterval = getDaysSinceLastReview(card) || 1;
      interval = Math.round(lastInterval * difficulty);
    }
  }
  
  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);
  
  return {
    difficulty: Math.round(difficulty),
    nextReview,
    reviewCount: review_count,
  };
}

function getDaysSinceLastReview(card: Card): number | null {
  if (!card.last_reviewed) return null;
  
  const lastReview = new Date(card.last_reviewed);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastReview.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export const QUALITY_LABELS = {
  1: { label: 'Again', color: '#FF3B30', description: 'Complete blackout' },
  2: { label: 'Hard', color: '#FF9500', description: 'Incorrect, but familiar' },
  3: { label: 'Good', color: '#007AFF', description: 'Correct with effort' },
  4: { label: 'Easy', color: '#34C759', description: 'Correct with hesitation' },
  5: { label: 'Perfect', color: '#30D158', description: 'Perfect response' },
} as const;
