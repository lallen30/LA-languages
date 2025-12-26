import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Deck, DeckStats } from '../models/deck.model';
import { Card } from '../models/card.model';
import { StorageService } from '../services/storage.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';
import { MenuService } from '../services/menu.service';
import { addIcons } from 'ionicons';
import { menuOutline, menu } from 'ionicons/icons';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class StatsPage implements OnInit {
  userStats = {
    totalReviews: 0,
    streak: 0,
    lastReviewDate: null as Date | null,
    masteredCards: 0,
    totalCards: 0,
    accuracy: 0
  };

  deckStats: (Deck & DeckStats)[] = [];
  isLoading = false;

  constructor(
    private storageService: StorageService,
    private translationService: TranslationService,
    private menuService: MenuService
  ) {
    addIcons({ menuOutline, menu });
  }

  openMenu() {
    console.log('openMenu called from Stats');
    this.menuService.open();
  }

  async ngOnInit() {
    // Don't load stats here to avoid double loading
  }

  async ionViewWillEnter() {
    // Load stats when the view is about to enter
    await this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      // Load user stats
      this.userStats = await this.storageService.getStats();
      
      // Get selected language from settings (same as Decks page)
      const selectedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
      console.log('DEBUG: Stats page filtering by language:', selectedLanguage);
      
      // Load all decks and filter by language
      const allDecks = await this.storageService.getAllDecks();
      console.log('DEBUG: Total decks before filtering:', allDecks.length);
      
      // Map language codes to language names (same as Decks page)
      const languageMap: { [key: string]: string } = {
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'pt-PT': 'Portuguese',
        'it-IT': 'Italian',
        'en-US': 'English'
      };
      const languageName = languageMap[selectedLanguage];
      console.log('DEBUG: Looking for language name:', languageName, 'or code:', selectedLanguage);
      
      // Filter by selected language and remove duplicates
      const uniqueDecks = this.removeDuplicateDecks(allDecks);
      // Match by language name OR language code (same logic as Decks page)
      const filteredDecks = uniqueDecks.filter(deck => 
        deck.language === languageName || deck.language === selectedLanguage
      );
      console.log('DEBUG: Decks after deduplication:', uniqueDecks.length);
      console.log('DEBUG: Decks after language filtering:', filteredDecks.length);
      
      // Clear existing deck stats to prevent duplicates
      this.deckStats = [];
      
      for (const deck of filteredDecks) {
        const cards = await this.storageService.getCardsByDeck(deck.id);
        const deckWithStats = {
          ...deck,
          ...this.calculateDeckStats(cards)
        };
        this.deckStats.push(deckWithStats);
      }
      
      // Update overall user stats (only for selected language)
      await this.updateUserStats();
      
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private removeDuplicateDecks(decks: Deck[]): Deck[] {
    // Remove duplicates based on deck ID
    const uniqueDecksMap = new Map<string, Deck>();
    
    for (const deck of decks) {
      if (!uniqueDecksMap.has(deck.id)) {
        uniqueDecksMap.set(deck.id, deck);
      } else {
        console.log('DEBUG: Removing duplicate deck:', deck.name, 'ID:', deck.id);
      }
    }
    
    return Array.from(uniqueDecksMap.values());
  }

  private calculateDeckStats(cards: Card[]): DeckStats {
    const totalCards = cards.length;
    const newCards = cards.filter(c => c.isNew).length;
    const masteredCards = cards.filter(c => !c.isNew && c.repetitions >= 3).length;
    const reviewCards = cards.filter(c => !c.isNew && c.nextReview <= new Date()).length;
    
    // Calculate completion percentage based on cards that have been studied at least once
    // This provides more meaningful progress for users who are just starting
    const studiedCards = cards.filter(c => !c.isNew || c.repetitions > 0).length;
    const completionPercentage = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 0;
    
    const easeFactors = cards.filter(c => !c.isNew).map(c => c.easeFactor);
    const averageEaseFactor = easeFactors.length > 0 
      ? Math.round((easeFactors.reduce((sum, ef) => sum + ef, 0) / easeFactors.length) * 100) / 100
      : 2.5;

    return {
      totalCards,
      newCards,
      reviewCards,
      masteredCards,
      completionPercentage,
      averageEaseFactor,
      streak: 0 // TODO: Calculate actual streak
    };
  }

  private async updateUserStats() {
    const allCards = await this.storageService.getAllCards();
    
    this.userStats.totalCards = allCards.length;
    this.userStats.masteredCards = allCards.filter(c => !c.isNew && c.repetitions >= 3).length;
    
    // Calculate accuracy (simplified)
    const reviewedCards = allCards.filter(c => !c.isNew);
    if (reviewedCards.length > 0) {
      const successfulCards = reviewedCards.filter(c => c.repetitions > 0).length;
      this.userStats.accuracy = Math.round((successfulCards / reviewedCards.length) * 100);
    }
    
    // Update streak calculation
    this.userStats.streak = await this.calculateStreak();
    
    // Save updated stats
    await this.storageService.saveStats(this.userStats);
  }

  private async calculateStreak(): Promise<number> {
    // Simplified streak calculation
    // In a real app, you'd track daily study sessions
    const stats = await this.storageService.getStats();
    const lastReview = stats.lastReviewDate ? new Date(stats.lastReviewDate) : null;
    
    if (!lastReview) return 0;
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastReview.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If last review was today or yesterday, maintain streak
    if (diffDays <= 1) {
      return stats.streak || 1;
    } else {
      return 0; // Streak broken
    }
  }

  getStreakIcon(): string {
    if (this.userStats.streak >= 30) return 'flame';
    if (this.userStats.streak >= 7) return 'trophy';
    if (this.userStats.streak >= 3) return 'star';
    return 'checkmark-circle';
  }

  getStreakColor(): string {
    if (this.userStats.streak >= 30) return 'danger';
    if (this.userStats.streak >= 7) return 'warning';
    if (this.userStats.streak >= 3) return 'success';
    return 'primary';
  }

  getAccuracyColor(): string {
    if (this.userStats.accuracy >= 80) return 'success';
    if (this.userStats.accuracy >= 60) return 'warning';
    return 'danger';
  }

  formatLastReview(): string {
    if (!this.userStats.lastReviewDate) return this.translationService.t('decks.never');
    
    const lastReview = new Date(this.userStats.lastReviewDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastReview.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return this.translationService.t('decks.today');
    if (diffDays === 1) return this.translationService.t('decks.yesterday');
    return `${diffDays} ${this.translationService.t('stats.days')} ${this.translationService.t('decks.daysAgo').replace('days ', '').replace('jours ', '').replace('Tage ', '').replace('giorni ', '').replace('dias ', '')}`;
  }

  async resetStats() {
    // This would show a confirmation dialog in a real app
    const confirmed = confirm(this.translationService.t('stats.resetConfirm'));
    
    if (confirmed) {
      // Reset user stats
      await this.storageService.saveStats({
        totalReviews: 0,
        streak: 0,
        lastReviewDate: null,
        masteredCards: 0
      });
      
      // Reset all card progress (repetitions, isNew, etc.)
      await this.storageService.resetAllCardProgress();
      
      // Reload stats to reflect the changes
      await this.loadStats();
    }
  }
}
