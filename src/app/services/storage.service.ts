import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Card } from '../models/card.model';
import { Deck } from '../models/deck.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Card operations
  async saveCard(card: Card): Promise<void> {
    await this.ensureStorage();
    const cards = await this.getAllCards();
    const existingIndex = cards.findIndex(c => c.id === card.id);
    
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }
    
    await this._storage?.set('cards', cards);
  }

  async updateCard(card: Card): Promise<void> {
    await this.saveCard(card);
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.ensureStorage();
    const cards = await this.getAllCards();
    const filteredCards = cards.filter(c => c.id !== cardId);
    await this._storage?.set('cards', filteredCards);
  }

  async getAllCards(): Promise<Card[]> {
    await this.ensureStorage();
    return await this._storage?.get('cards') || [];
  }

  async getCardsByDeck(deckId: string): Promise<Card[]> {
    const cards = await this.getAllCards();
    return cards.filter(card => card.deckId === deckId);
  }

  async getCard(cardId: string): Promise<Card | null> {
    const cards = await this.getAllCards();
    return cards.find(card => card.id === cardId) || null;
  }

  // Deck operations
  async saveDeck(deck: Deck): Promise<void> {
    await this.ensureStorage();
    const decks = await this.getAllDecks();
    const existingIndex = decks.findIndex(d => d.id === deck.id);
    
    if (existingIndex >= 0) {
      decks[existingIndex] = deck;
    } else {
      decks.push(deck);
    }
    
    await this._storage?.set('decks', decks);
  }

  async updateDeck(deck: Deck): Promise<void> {
    await this.saveDeck(deck);
  }

  async deleteDeck(deckId: string): Promise<void> {
    await this.ensureStorage();
    const decks = await this.getAllDecks();
    const filteredDecks = decks.filter(d => d.id !== deckId);
    await this._storage?.set('decks', filteredDecks);
    
    // Also delete all cards in this deck
    const cards = await this.getAllCards();
    const filteredCards = cards.filter(c => c.deckId !== deckId);
    await this._storage?.set('cards', filteredCards);
  }

  async getAllDecks(): Promise<Deck[]> {
    await this.ensureStorage();
    return await this._storage?.get('decks') || [];
  }

  async getDeck(deckId: string): Promise<Deck | null> {
    const decks = await this.getAllDecks();
    return decks.find(deck => deck.id === deckId) || null;
  }

  // Settings operations
  async saveSetting(key: string, value: any): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set(`setting_${key}`, value);
  }

  async getSetting(key: string, defaultValue?: any): Promise<any> {
    await this.ensureStorage();
    const value = await this._storage?.get(`setting_${key}`);
    return value !== null ? value : defaultValue;
  }

  // Statistics operations
  async saveStats(stats: any): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('user_stats', stats);
  }

  async getStats(): Promise<any> {
    await this.ensureStorage();
    return await this._storage?.get('user_stats') || {
      totalReviews: 0,
      streak: 0,
      lastReviewDate: null,
      masteredCards: 0
    };
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.ensureStorage();
    await this._storage?.clear();
  }

  async exportData(): Promise<any> {
    await this.ensureStorage();
    const cards = await this.getAllCards();
    const decks = await this.getAllDecks();
    const stats = await this.getStats();
    
    return {
      cards,
      decks,
      stats,
      exportDate: new Date().toISOString()
    };
  }

  async importData(data: any): Promise<void> {
    await this.ensureStorage();
    
    if (data.cards) {
      await this._storage?.set('cards', data.cards);
    }
    
    if (data.decks) {
      await this._storage?.set('decks', data.decks);
    }
    
    if (data.stats) {
      await this._storage?.set('user_stats', data.stats);
    }
  }

  private async ensureStorage(): Promise<void> {
    if (!this._storage) {
      await this.init();
    }
  }
}
