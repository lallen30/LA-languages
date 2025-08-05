import { Injectable } from '@angular/core';
import { Card, CardResponse } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class SrsService {

  constructor() { }

  /**
   * SM-2 Algorithm implementation for spaced repetition
   * Updates card based on user response
   */
  updateCard(card: Card, response: CardResponse): Card {
    const updatedCard = { ...card };
    
    if (response.correct) {
      updatedCard.repetitions++;
      
      // Calculate new ease factor based on difficulty
      let qualityFactor = 5; // Default for 'easy'
      if (response.difficulty === 'normal') qualityFactor = 4;
      if (response.difficulty === 'hard') qualityFactor = 3;
      
      updatedCard.easeFactor = Math.max(1.3, 
        updatedCard.easeFactor + (0.1 - (5 - qualityFactor) * (0.08 + (5 - qualityFactor) * 0.02))
      );
      
      // Calculate new interval
      if (updatedCard.repetitions === 1) {
        updatedCard.interval = 1;
      } else if (updatedCard.repetitions === 2) {
        updatedCard.interval = 6;
      } else {
        updatedCard.interval = Math.round(updatedCard.interval * updatedCard.easeFactor);
      }
      
      updatedCard.isNew = false;
    } else {
      // Reset on failure
      updatedCard.repetitions = 0;
      updatedCard.interval = 1;
      updatedCard.easeFactor = Math.max(1.3, updatedCard.easeFactor - 0.2);
      updatedCard.isNew = false;
    }
    
    updatedCard.lastReviewed = new Date();
    updatedCard.nextReview = this.calculateNextReview(updatedCard.interval);
    updatedCard.skipCount = 0; // Reset skip count after review
    
    return updatedCard;
  }

  /**
   * Calculate next review date based on interval
   */
  private calculateNextReview(intervalDays: number): Date {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);
    return nextReview;
  }

  /**
   * Check if card is due for review
   */
  isCardDue(card: Card): boolean {
    const now = new Date();
    return card.nextReview <= now;
  }

  /**
   * Get cards due for review from a deck
   */
  getDueCards(cards: Card[]): Card[] {
    const now = new Date();
    // Exclude new cards to prevent double-counting (new cards are handled separately)
    return cards.filter(card => !card.isNew && card.nextReview <= now);
  }

  /**
   * Get new cards that haven't been studied yet
   */
  getNewCards(cards: Card[]): Card[] {
    return cards.filter(card => card.isNew);
  }

  /**
   * Create a new card with default SRS values
   */
  createNewCard(cardData: Partial<Card>): Card {
    const now = new Date();
    return {
      id: this.generateId(),
      type: cardData.type || 'fill-blank',
      sentenceFront: cardData.sentenceFront,
      missingWord: cardData.missingWord,
      sentenceBack: cardData.sentenceBack,
      spanishWord: cardData.spanishWord,
      englishTranslation: cardData.englishTranslation,
      imageUrls: cardData.imageUrls || [],
      showWordFirst: cardData.showWordFirst,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: now,
      skipCount: 0,
      deckId: cardData.deckId || '',
      nextReview: now,
      isNew: true
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
