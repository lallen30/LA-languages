import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Card, CardResponse } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { SrsService } from './srs.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private sessionQueue: Card[] = [];
  private currentDeckId: string | null = null;
  private missedCards: Card[] = []; // Track cards marked as "I don't know"
  private studiedCardIds: Set<string> = new Set(); // Track unique cards studied
  private currentCardSubject = new BehaviorSubject<Card | null>(null);
  private currentSessionSubject = new BehaviorSubject<Card[]>([]);
  private sessionStatsSubject = new BehaviorSubject<any>({
    totalCards: 0,
    completedCards: 0,
    correctCards: 0,
    incorrectCards: 0
  });

  public currentSession$ = this.currentSessionSubject.asObservable();
  public currentCard$ = this.currentCardSubject.asObservable();
  public sessionStats$ = this.sessionStatsSubject.asObservable();
  
  // Observable for session progress - derived from sessionStats$
  public sessionProgress$ = this.sessionStatsSubject.asObservable().pipe(
    tap(stats => console.log('📊 sessionProgress$ emitting:', stats)),
    map(stats => ({
      completed: stats.completedCards || 0,
      total: stats.totalCards || 0,
      percentage: stats.totalCards > 0 ? Math.round((stats.completedCards / stats.totalCards) * 100) : 0
    })),
    tap(progress => console.log('📊 sessionProgress$ mapped:', progress))
  );

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
    
    // Track current deck ID
    this.currentDeckId = deckId;
    
    // Clear missed cards from previous session when starting a new regular session
    this.clearMissedCards();
  
  // Clear studied cards set for accurate unique card counting
  this.studiedCardIds.clear();
    
    const rawCards = await this.storageService.getCardsByDeck(deckId);
    console.log('Total cards found for deck:', rawCards.length);
    
    // Normalize cards - ensure isNew is properly set and dates are Date objects
    const cards = rawCards.map(c => ({
      ...c,
      isNew: c.isNew === true || c.isNew === undefined || c.repetitions === 0,
      nextReview: c.nextReview ? new Date(c.nextReview) : new Date(),
      lastReviewed: c.lastReviewed ? new Date(c.lastReviewed) : new Date()
    }));
    
    console.log('Card details:', cards.map(c => ({ id: c.id, missingWord: c.missingWord, deckId: c.deckId, isNew: c.isNew })));
    
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
    
    // Initialize session stats
    this.sessionStatsSubject.next({
      totalCards: this.sessionQueue.length,
      completedCards: 0,
      correctCards: 0,
      incorrectCards: 0
    });
    
    this.currentSessionSubject.next([...this.sessionQueue]);
    
    // Show the first card without removing it from queue yet
    if (this.sessionQueue.length > 0) {
      this.currentCardSubject.next(this.sessionQueue[0]);
    }
  }

  /**
   * Move to next card in session
   */
  nextCard(): Card | null {
    // Remove the current card (which has been answered)
    if (this.sessionQueue.length > 0) {
      this.sessionQueue.shift();
    }
    
    // Show the next card if available
    const nextCard = this.sessionQueue.length > 0 ? this.sessionQueue[0] : null;
    this.currentCardSubject.next(nextCard);
    this.currentSessionSubject.next([...this.sessionQueue]);
    
    console.log('Next card called. Remaining cards:', this.sessionQueue.length);
    if (nextCard) {
      console.log('Showing next card:', nextCard.spanishWord);
    } else {
      console.log('No more cards - session complete');
    }
    
    return nextCard;
  }

  /**
   * Process card response and update SRS
   */
  async processCardResponse(card: Card, response: CardResponse): Promise<void> {
    const updatedCard = this.srsService.updateCard(card, response);
    await this.storageService.updateCard(updatedCard);
    
    // Track missed cards for review feature
    if (!response.correct) {
      // Add to missed cards if not already there
      const alreadyMissed = this.missedCards.find(c => c.id === updatedCard.id);
      if (!alreadyMissed) {
        this.missedCards.push({ ...updatedCard });
        console.log(`Added "${updatedCard.spanishWord}" to missed cards for review`);
      }
    }
    
    // Determine if card should reappear in session based on response
    const shouldReappearInSession = this.shouldCardReappearInSession(response);
    
    if (shouldReappearInSession) {
      // Re-add card to session queue for additional practice
      const reappearanceDelay = this.getReappearanceDelay(response);
      this.scheduleCardReappearance(updatedCard, reappearanceDelay);
      
      console.log(`Card "${updatedCard.spanishWord}" will reappear in ${reappearanceDelay} cards due to ${response.difficulty} response`);
    }
    
    // Track unique cards studied
    this.studiedCardIds.add(card.id);
    
    // Update session stats to reflect completed card
    const currentStats = this.sessionStatsSubject.value;
    this.sessionStatsSubject.next({
      ...currentStats,
      completedCards: this.studiedCardIds.size, // Count unique cards, not total responses
      correctCards: response.correct ? currentStats.correctCards + 1 : currentStats.correctCards,
      incorrectCards: !response.correct ? currentStats.incorrectCards + 1 : currentStats.incorrectCards,
      totalCards: currentStats.totalCards || this.sessionQueue.length + currentStats.completedCards + 1
    });
    
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
   * Get total cards in current session (directly from queue + completed)
   */
  getTotalCardsInSession(): number {
    const stats = this.sessionStatsSubject.value;
    return stats.totalCards || (this.sessionQueue.length + stats.completedCards);
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
   * Determine if a card should reappear in the current session based on response
   */
  private shouldCardReappearInSession(response: CardResponse): boolean {
    // Incorrect cards should always reappear
    if (!response.correct) {
      return true;
    }
    
    // Hard cards should reappear for additional practice
    if (response.difficulty === 'hard') {
      return true;
    }
    
    // Easy and good cards are done for this session
    return false;
  }

  /**
   * Get the delay (in number of cards) before a card reappears
   */
  private getReappearanceDelay(response: CardResponse): number {
    if (!response.correct) {
      // Incorrect cards reappear soon for immediate reinforcement
      return Math.min(3, Math.floor(this.sessionQueue.length / 4));
    }
    
    if (response.difficulty === 'hard') {
      // Hard cards reappear later in the session
      return Math.min(8, Math.floor(this.sessionQueue.length / 2));
    }
    
    return 0; // Should not be called for easy/good cards
  }

  /**
   * Schedule a card to reappear in the session queue
   */
  private scheduleCardReappearance(card: Card, delay: number): void {
    // Calculate insertion position based on delay
    const insertPosition = Math.min(delay, this.sessionQueue.length);
    
    // Insert the card back into the queue at the calculated position
    this.sessionQueue.splice(insertPosition, 0, { ...card });
    
    // Update the session queue observable
    this.currentSessionSubject.next([...this.sessionQueue]);
  }

  /**
   * Get remaining cards in session
   */
  getRemainingCards(): number {
    return this.sessionQueue.length;
  }

  /**
   * Get current deck ID from active session
   */
  getCurrentDeckId(): string | null {
    if (this.sessionQueue.length > 0) {
      return this.sessionQueue[0].deckId;
    }
    return this.currentDeckId;
  }

  /**
   * Get current session stats (public accessor)
   */
  getCurrentSessionStats() {
    return this.sessionStatsSubject.value;
  }

  /**
   * Get missed cards from last session
   */
  getMissedCards(): Card[] {
    return [...this.missedCards];
  }

  /**
   * Check if there are missed cards available for review
   */
  hasMissedCards(): boolean {
    return this.missedCards.length > 0;
  }

  /**
   * Start a review session with missed cards only
   */
  async startMissedCardsReview(): Promise<void> {
    console.log('=== MISSED CARDS REVIEW SESSION ===');
    console.log('Starting review session with missed cards:', this.missedCards.length);
    
    if (this.missedCards.length === 0) {
      console.log('No missed cards available for review');
      return;
    }
    
    // Use missed cards as the session queue
    this.sessionQueue = [...this.missedCards];
    
    // Clear studied cards set for accurate unique card counting in review session
    this.studiedCardIds.clear();
    
    // Initialize session stats
    this.sessionStatsSubject.next({
      totalCards: this.sessionQueue.length,
      completedCards: 0,
      correctCards: 0,
      incorrectCards: 0
    });
    
    this.currentSessionSubject.next([...this.sessionQueue]);
    
    // Show the first card without removing it from queue yet
    if (this.sessionQueue.length > 0) {
      this.currentCardSubject.next(this.sessionQueue[0]);
    }
    
    console.log('Missed cards review session started with', this.sessionQueue.length, 'cards');
  }

  /**
   * Clear missed cards (called when starting a new regular session)
   */
  private clearMissedCards(): void {
    this.missedCards = [];
    console.log('Cleared missed cards for new session');
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
