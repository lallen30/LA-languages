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
    const stats = await this._storage?.get('user_stats') || {
      totalReviews: 0,
      streak: 0,
      lastReviewDate: null,
      masteredCards: 0,
      todayReviews: 0,
      todayDate: null
    };
    
    // Reset today's reviews if it's a new day
    const today = new Date().toDateString();
    if (stats.todayDate !== today) {
      stats.todayReviews = 0;
      stats.todayDate = today;
    }
    
    return stats;
  }

  async incrementReviewCount(): Promise<void> {
    await this.ensureStorage();
    const stats = await this.getStats();
    const today = new Date().toDateString();
    
    // Increment total reviews
    stats.totalReviews = (stats.totalReviews || 0) + 1;
    
    // Increment today's reviews (reset if new day)
    if (stats.todayDate !== today) {
      stats.todayReviews = 1;
      stats.todayDate = today;
    } else {
      stats.todayReviews = (stats.todayReviews || 0) + 1;
    }
    
    // Update last review date
    stats.lastReviewDate = new Date().toISOString();
    
    await this.saveStats(stats);
  }

  async resetAllCardProgress(): Promise<void> {
    await this.ensureStorage();
    const cards = await this.getAllCards();
    
    // Reset progress for all cards
    const resetCards = cards.map(card => ({
      ...card,
      isNew: true,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      lastReviewed: new Date(),
      nextReview: new Date(),
      skipCount: 0
    }));
    
    await this._storage?.set('cards', resetCards);
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
    
    // Get all settings
    const settings: Record<string, any> = {};
    const settingKeys = [
      'darkMode', 'nativeLanguage', 'ttsLanguage', 'spanishDialect', 
      'spanishVoiceGender', 'spanishVoiceName', 'ttsRate', 'ttsPitch',
      'autoSpeak', 'autoSpeakOnLoad', 'studyReminders', 'maxCardsPerSession',
      'pictureWordDisplay', 'lightColorScheme', 'darkColorScheme'
    ];
    for (const key of settingKeys) {
      const value = await this._storage?.get(`setting_${key}`);
      if (value !== null && value !== undefined) {
        settings[key] = value;
      }
    }
    
    // Get story data
    const stories = await this._storage?.get('stories') || [];
    const storyCategories = await this._storage?.get('storyCategories') || [];
    const wordCategories = await this._storage?.get('wordCategories') || [];
    
    return {
      version: '2.0',
      cards,
      decks,
      stats,
      settings,
      stories,
      storyCategories,
      wordCategories,
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
    
    // Import settings (v2.0 format)
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await this._storage?.set(`setting_${key}`, value);
      }
    }
    
    // Import story data
    if (data.stories) {
      await this._storage?.set('stories', data.stories);
    }
    
    if (data.storyCategories) {
      await this._storage?.set('storyCategories', data.storyCategories);
    }
    
    if (data.wordCategories) {
      await this._storage?.set('wordCategories', data.wordCategories);
    }
  }

  async importMultipleDecks(data: any): Promise<void> {
    console.log('StorageService.importMultipleDecks called');
    console.log('Data received - cards:', data.cards?.length, 'decks:', data.decks?.length);
    
    await this.ensureStorage();
    console.log('Storage ensured');
    
    // Get existing data
    const existingCards = await this._storage?.get('cards') || [];
    const existingDecks = await this._storage?.get('decks') || [];
    console.log('Existing data - cards:', existingCards.length, 'decks:', existingDecks.length);
    
    // Merge new cards with existing (avoid duplicates by ID)
    if (data.cards) {
      const existingCardIds = new Set(existingCards.map((c: any) => c.id));
      const newCards = data.cards.filter((c: any) => !existingCardIds.has(c.id));
      console.log('New cards to add (after dedup):', newCards.length);
      const mergedCards = [...existingCards, ...newCards];
      await this._storage?.set('cards', mergedCards);
      console.log('Cards saved, total:', mergedCards.length);
    }
    
    // Merge new decks with existing (update if same ID but different language, otherwise skip)
    if (data.decks) {
      const existingDeckMap = new Map(existingDecks.map((d: any) => [d.id, d]));
      console.log('Existing deck IDs:', Array.from(existingDeckMap.keys()));
      console.log('Incoming deck IDs:', data.decks.map((d: any) => d.id));
      
      let addedCount = 0;
      let updatedCount = 0;
      
      for (const newDeck of data.decks) {
        const existingDeck = existingDeckMap.get(newDeck.id) as any;
        if (existingDeck) {
          // Check if it's a different language - if so, add as new deck with modified ID
          if (existingDeck.language !== newDeck.language) {
            const langSuffix = (newDeck.language || 'unknown').replace('-', '_');
            const newId = `${newDeck.id}_${langSuffix}`;
            console.log(`Deck "${newDeck.name}" (${newDeck.id}) exists with different language - creating new ID: ${newId}`);
            existingDeckMap.set(newId, { ...newDeck, id: newId });
            addedCount++;
          } else {
            console.log(`Deck "${newDeck.name}" (${newDeck.id}) already exists with same language - skipping`);
          }
        } else {
          console.log(`Adding new deck "${newDeck.name}" (${newDeck.id})`);
          existingDeckMap.set(newDeck.id, newDeck);
          addedCount++;
        }
      }
      
      const mergedDecks = Array.from(existingDeckMap.values());
      await this._storage?.set('decks', mergedDecks);
      console.log(`Decks saved - added: ${addedCount}, updated: ${updatedCount}, total: ${mergedDecks.length}`);
    }
    
    console.log('importMultipleDecks complete');
  }

  private async ensureStorage(): Promise<void> {
    if (!this._storage) {
      await this.init();
    }
  }

  // Generic get/set for any data type
  async get(key: string): Promise<any> {
    await this.ensureStorage();
    return await this._storage?.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set(key, value);
  }
}
