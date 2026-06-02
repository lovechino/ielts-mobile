/**
 * SM-2 Algorithm Implementation for Spaced Repetition
 */

export interface SRSStats {
  interval: number;
  ease_factor: number;
  next_review_at: number;
  status: 'learning' | 'mastered';
}

/**
 * Calculates next review based on SM-2 algorithm
 * @param grade 0-5 (0: total blackout, 5: perfect response)
 * @param currentInterval Current interval in days
 * @param currentEaseFactor Current ease factor (default 2.5)
 */
export const calculateNextReview = (
  grade: number,
  currentInterval: number,
  currentEaseFactor: number
): SRSStats => {
  let nextInterval: number;
  let nextEaseFactor: number;

  if (grade >= 3) {
    // Correct response
    if (currentInterval === 0) {
      nextInterval = 1;
    } else if (currentInterval === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * currentEaseFactor);
    }
    
    // Adjust ease factor
    nextEaseFactor = currentEaseFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  } else {
    // Incorrect response
    nextInterval = 1;
    nextEaseFactor = currentEaseFactor;
  }

  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  // Calculate timestamp
  const nextReviewAt = Math.floor(Date.now() / 1000) + nextInterval * 24 * 60 * 60;

  // Determine status: If interval is more than 21 days, consider it 'mastered'
  const status = nextInterval > 21 ? 'mastered' : 'learning';

  return {
    interval: nextInterval,
    ease_factor: nextEaseFactor,
    next_review_at: nextReviewAt,
    status,
  };
};
