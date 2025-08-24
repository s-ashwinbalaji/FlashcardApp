// hooks/useSpacedRepetition.ts - SM-2 Algorithm Implementation

import { Card } from './useDatabase';

// Card interface already includes all SM-2 fields from useDatabase.ts
export type SpacedRepetitionCard = Card;

export enum ReviewQuality {
  BLACKOUT = 0,           // Complete blackout, no memory
  INCORRECT_REMEMBERED = 1, // Incorrect, but correct answer remembered
  INCORRECT_EASY = 2,      // Incorrect, but seemed easy to recall
  CORRECT_DIFFICULT = 3,   // Correct response with serious difficulty
  CORRECT_HESITATION = 4,  // Correct response after hesitation
  PERFECT = 5             // Perfect response
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Based on Piotr Wozniak's SuperMemo research from 1987
 * 
 * Core principle: Cards that are harder get shown more frequently,
 * cards that are easier get longer intervals between reviews.
 */
export class SM2SpacedRepetition {
  
  /**
   * Process a card review and calculate next review parameters
   * @param card - The card being reviewed
   * @param quality - User's assessment of recall quality (0-5)
   * @returns Updated card parameters
   */
  static processReview(card: SpacedRepetitionCard, quality: ReviewQuality): SpacedRepetitionCard {
    const now = new Date();
    let { repetitions, easiness_factor, interval } = card;

    // If quality >= 3, it's considered a successful recall
    if (quality >= ReviewQuality.CORRECT_DIFFICULT) {
      // Successful recall
      repetitions += 1;

      // Calculate new interval based on repetition number
      if (repetitions === 1) {
        interval = 1; // First review: 1 day
      } else if (repetitions === 2) {
        interval = 6; // Second review: 6 days
      } else {
        // Subsequent reviews: previous interval * easiness factor
        interval = Math.round(interval * easiness_factor);
      }
    } else {
      // Failed recall - reset repetitions and set short interval
      repetitions = 0;
      interval = 1;
    }

    // Update easiness factor based on quality
    // Formula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    const qualityFactor = (5 - quality);
    const adjustment = 0.1 - qualityFactor * (0.08 + qualityFactor * 0.02);
    easiness_factor += adjustment;

    // Constrain easiness factor between 1.3 and 2.5
    if (easiness_factor < 1.3) {
      easiness_factor = 1.3;
    }
    // Note: Research shows upper limit isn't necessary, but we cap at 3.0 for sanity
    if (easiness_factor > 3.0) {
      easiness_factor = 3.0;
    }

    // Calculate next review date
    const next_review = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      repetitions,
      easiness_factor: Math.round(easiness_factor * 100) / 100, // Round to 2 decimal places
      interval,
      next_review: next_review.toISOString(),
      last_reviewed: now.toISOString(),
      review_count: (card.review_count || 0) + 1
    };
  }

  /**
   * Initialize a new card with default SM-2 parameters
   */
  static initializeCard(card: Card): SpacedRepetitionCard {
    const now = new Date();
    
    return {
      ...card,
      repetitions: 0,
      easiness_factor: 2.5, // Default easiness factor
      interval: 1,          // Start with 1-day interval
      next_review: now.toISOString(), // Available for review immediately
      last_reviewed: null,
      review_count: 0
    };
  }

  /**
   * Get cards that are due for review
   */
  static getCardsForReview(cards: SpacedRepetitionCard[]): SpacedRepetitionCard[] {
    const now = new Date();
    
    return cards.filter(card => {
      if (!card.next_review) return true; // New cards are always due
      const nextReviewDate = new Date(card.next_review);
      return nextReviewDate <= now;
    });
  }

  /**
   * Get cards that are new (never reviewed)
   */
  static getNewCards(cards: SpacedRepetitionCard[]): SpacedRepetitionCard[] {
    return cards.filter(card => card.repetitions === 0 && !card.last_reviewed);
  }

  /**
   * Get statistics about the card collection
   */
  static getStatistics(cards: SpacedRepetitionCard[]): {
    total: number;
    new: number;
    learning: number; // Cards with repetitions < 2
    mature: number;   // Cards with repetitions >= 2
    due: number;
  } {
    const now = new Date();
    
    const stats = cards.reduce((acc, card) => {
      acc.total++;
      
      if (card.repetitions === 0 && !card.last_reviewed) {
        acc.new++;
      } else if (card.repetitions < 2) {
        acc.learning++;
      } else {
        acc.mature++;
      }

      // Check if due for review
      if (!card.next_review || new Date(card.next_review) <= now) {
        acc.due++;
      }

      return acc;
    }, {
      total: 0,
      new: 0,
      learning: 0,
      mature: 0,
      due: 0
    });

    return stats;
  }

  /**
   * Convert quality button press to ReviewQuality enum
   * Maps the 3-button system (Hard/Medium/Easy) to SM-2's 6-point scale
   */
  static mapButtonToQuality(button: 'hard' | 'medium' | 'easy', wasCorrect: boolean): ReviewQuality {
    if (!wasCorrect) {
      // If user got it wrong, map to failure grades
      return ReviewQuality.INCORRECT_EASY; // Quality 2
    }
    
    // If user got it right, map based on difficulty
    switch (button) {
      case 'hard':
        return ReviewQuality.CORRECT_DIFFICULT; // Quality 3
      case 'medium':
        return ReviewQuality.CORRECT_HESITATION; // Quality 4
      case 'easy':
        return ReviewQuality.PERFECT; // Quality 5
      default:
        return ReviewQuality.CORRECT_HESITATION;
    }
  }

  /**
   * Get the next review interval preview (for UI display)
   */
  static getIntervalPreview(card: SpacedRepetitionCard, quality: ReviewQuality): number {
    const tempCard = this.processReview(card, quality);
    return tempCard.interval;
  }

  /**
   * Format interval for display
   */
  static formatInterval(days: number): string {
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours}h`;
    } else if (days < 30) {
      return `${Math.round(days)}d`;
    } else if (days < 365) {
      const months = Math.round(days / 30.44);
      return `${months}mo`;
    } else {
      const years = Math.round(days / 365.25);
      return `${years}y`;
    }
  }
}

/**
 * Enhanced database hook with SM-2 integration
 */
export const useSpacedRepetitionDatabase = () => {
  // This would extend your existing useDatabase hook
  // with SM-2 specific methods
  
  const processCardReview = async (
    cardId: number, 
    quality: ReviewQuality
  ): Promise<void> => {
    // 1. Fetch current card data
    // 2. Process with SM-2 algorithm
    // 3. Update database with new scheduling parameters
    
    // Implementation would integrate with your existing SQLite database
    // updating the cards table with the new SM-2 parameters
  };

  const getCardsForStudy = async (deckId: number): Promise<SpacedRepetitionCard[]> => {
    // 1. Fetch cards from deck
    // 2. Filter for cards due for review
    // 3. Sort by priority (new cards first, then by due date)
    
    // Implementation would query your existing database
    // and return cards ready for study session
    
    // Placeholder return for now
    return [];
  };

  return {
    processCardReview,
    getCardsForStudy,
    // ... other methods
  };
};

/**
 * Usage example for your study screen:
 * 
 * const handleDifficultySelect = async (button: 'hard' | 'medium' | 'easy') => {
 *   const quality = SM2SpacedRepetition.mapButtonToQuality(button, true);
 *   const updatedCard = SM2SpacedRepetition.processReview(currentCard, quality);
 *   
 *   // Save to database
 *   await updateCardInDatabase(updatedCard);
 *   
 *   // Move to next card
 *   loadNextCard();
 * };
 */