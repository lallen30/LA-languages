import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Deck, DeckStats } from '../models/deck.model';
import { Card } from '../models/card.model';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
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

  constructor(private storageService: StorageService) {}

  async ngOnInit() {
    await this.loadStats();
  }

  async ionViewWillEnter() {
    await this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      // Load user stats
      this.userStats = await this.storageService.getStats();
      
      // Load deck stats
      const decks = await this.storageService.getAllDecks();
      this.deckStats = [];
      
      for (const deck of decks) {
        const cards = await this.storageService.getCardsByDeck(deck.id);
        const deckWithStats = {
          ...deck,
          ...this.calculateDeckStats(cards)
        };
        this.deckStats.push(deckWithStats);
      }
      
      // Update overall user stats
      await this.updateUserStats();
      
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateDeckStats(cards: Card[]): DeckStats {
    const totalCards = cards.length;
    const newCards = cards.filter(c => c.isNew).length;
    const masteredCards = cards.filter(c => !c.isNew && c.repetitions >= 3).length;
    const reviewCards = cards.filter(c => !c.isNew && c.nextReview <= new Date()).length;
    
    const completionPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
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
    if (!this.userStats.lastReviewDate) return 'Never';
    
    const lastReview = new Date(this.userStats.lastReviewDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastReview.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  async resetStats() {
    // This would show a confirmation dialog in a real app
    const confirmed = confirm('Are you sure you want to reset all statistics? This cannot be undone.');
    
    if (confirmed) {
      await this.storageService.saveStats({
        totalReviews: 0,
        streak: 0,
        lastReviewDate: null,
        masteredCards: 0
      });
      await this.loadStats();
    }
  }
}
