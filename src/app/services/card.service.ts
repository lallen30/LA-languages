import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card, CardResponse } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { SrsService } from './srs.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private sessionQueue: Card[] = [];
  private currentSessionSubject = new BehaviorSubject<Card[]>([]);
  private currentCardSubject = new BehaviorSubject<Card | null>(null);
  private sessionStatsSubject = new BehaviorSubject<any>({
    totalCards: 0,
    completedCards: 0,
    correctCards: 0,
    incorrectCards: 0
  });

  public currentSession$ = this.currentSessionSubject.asObservable();
  public currentCard$ = this.currentCardSubject.asObservable();
  public sessionStats$ = this.sessionStatsSubject.asObservable();

  constructor(
    private srsService: SrsService,
    private storageService: StorageService
  ) {}

  /**
   * Start a new study session for a deck
   */
  async startSession(deckId: string, maxCards: number = 20): Promise<void> {
    console.log('=== STUDY SESSION DEBUG ===');
    console.log('Starting session for deckId:', deckId);
    console.log('Max cards requested:', maxCards);
    
    const cards = await this.storageService.getCardsByDeck(deckId);
    console.log('Total cards found for deck:', cards.length);
    console.log('Card details:', cards.map(c => ({ id: c.id, spanishWord: c.spanishWord, missingWord: c.missingWord, deckId: c.deckId })));
    
    // Get due cards and new cards
    const dueCards = this.srsService.getDueCards(cards);
    const newCards = this.srsService.getNewCards(cards).slice(0, Math.max(0, maxCards - dueCards.length));
    
    console.log('Due cards:', dueCards.length);
    console.log('New cards selected:', newCards.length);
    
    // Combine and shuffle
    this.sessionQueue = this.shuffleArray([...dueCards, ...newCards]).slice(0, maxCards);
    
    console.log('Final session queue length:', this.sessionQueue.length);
    console.log('Session queue cards:', this.sessionQueue.map(c => ({ spanishWord: c.spanishWord, missingWord: c.missingWord, id: c.id })));
    console.log('=== END STUDY SESSION DEBUG ===');
    
    this.currentSessionSubject.next([...this.sessionQueue]);
    this.updateSessionStats();
    this.nextCard();
  }

  /**
   * Get the next card in the session
   */
  nextCard(): Card | null {
    const card = this.sessionQueue.shift();
    this.currentCardSubject.next(card || null);
    this.currentSessionSubject.next([...this.sessionQueue]);
    return card || null;
  }

  /**
   * Process card response and update SRS
   */
  async processCardResponse(card: Card, response: CardResponse): Promise<void> {
    const updatedCard = this.srsService.updateCard(card, response);
    await this.storageService.updateCard(updatedCard);
    
    this.updateSessionStats();
    
    // Move to next card
    this.nextCard();
  }

  /**
   * Mark card for later (skip but re-queue)
   */
  markCardLater(card: Card): void {
    card.skipCount = (card.skipCount || 0) + 1;
    
    // Check if card has been skipped too many times
    if (card.skipCount >= 3) {
      // Show warning and handle accordingly
      this.handleFrequentlySkippedCard(card);
    } else {
      // Re-insert card randomly in next 3-10 positions
      const insertIndex = Math.min(
        this.sessionQueue.length,
        Math.floor(Math.random() * 7) + 3
      );
      this.sessionQueue.splice(insertIndex, 0, card);
    }
    
    this.currentSessionSubject.next([...this.sessionQueue]);
    this.nextCard();
  }

  /**
   * Handle cards that have been skipped frequently
   */
  private handleFrequentlySkippedCard(card: Card): void {
    // For now, just add to end of queue
    // In a full implementation, you might show a dialog asking user what to do
    this.sessionQueue.push(card);
  }

  /**
   * Get current session progress
   */
  getSessionProgress(): { completed: number; total: number; percentage: number } {
    const stats = this.sessionStatsSubject.value;
    const total = stats.totalCards;
    const completed = stats.completedCards;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * End current session
   */
  endSession(): void {
    this.sessionQueue = [];
    this.currentSessionSubject.next([]);
    this.currentCardSubject.next(null);
    this.resetSessionStats();
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.sessionQueue.length > 0 || this.currentCardSubject.value !== null;
  }

  /**
   * Get remaining cards in session
   */
  getRemainingCards(): number {
    return this.sessionQueue.length;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(): void {
    const currentStats = this.sessionStatsSubject.value;
    const totalCards = currentStats.totalCards || this.sessionQueue.length + currentStats.completedCards;
    
    this.sessionStatsSubject.next({
      ...currentStats,
      totalCards
    });
  }

  /**
   * Reset session statistics
   */
  private resetSessionStats(): void {
    this.sessionStatsSubject.next({
      totalCards: 0,
      completedCards: 0,
      correctCards: 0,
      incorrectCards: 0
    });
  }

  /**
   * Add a new card
   */
  async addCard(cardData: Partial<Card>): Promise<Card> {
    const newCard = this.srsService.createNewCard(cardData);
    await this.storageService.saveCard(newCard);
    return newCard;
  }

  /**
   * Update an existing card
   */
  async updateCard(card: Card): Promise<void> {
    await this.storageService.updateCard(card);
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: string): Promise<void> {
    await this.storageService.deleteCard(cardId);
  }

  /**
   * Get all cards for a deck
   */
  async getCardsByDeck(deckId: string): Promise<Card[]> {
    return await this.storageService.getCardsByDeck(deckId);
  }
}
