import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Card, CardResponse } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { CardService } from '../services/card.service';
import { TtsService } from '../services/tts.service';
import { SessionStateService } from '../services/session-state.service';
import { StorageService } from '../services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  chevronBack,
  volumeHigh,
  refresh,
  checkmark,
  close,
  thumbsDown,
  thumbsUp,
  copy,
  library,
  folder,
  addCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit, OnDestroy {
  currentCard: Card | null = null;
  isFlipped = false;
  showTranslation = false;
  showAnswer = false;
  sessionProgress = { completed: 0, total: 0, percentage: 0 };
  isSessionActive = false;
  autoSpeakEnabled = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cardService: CardService,
    private ttsService: TtsService,
    private sessionStateService: SessionStateService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    // Register all required icons
    addIcons({
      'chevron-back': chevronBack,
      'volume-high': volumeHigh,
      'refresh': refresh,
      'checkmark': checkmark,
      'close': close,
      'thumbs-down': thumbsDown,
      'thumbs-up': thumbsUp,
      'copy': copy,
      'library': library,
      'folder': folder,
      'add-circle': addCircle
    });
  }

  async ngOnInit() {
    // Load auto-speak setting
    this.autoSpeakEnabled = await this.storageService.getSetting('autoSpeak', false);
    console.log('DEBUG: Loaded autoSpeakEnabled setting:', this.autoSpeakEnabled);

    // Handle query parameters for deck selection (from Study button)
    this.route.queryParams.subscribe(params => {
      if (params['deckId']) {
        console.log('Study button: Starting session for deckId:', params['deckId']);
        this.startStudySession(params['deckId']);
      }
    });

    // Subscribe to current card
    this.subscriptions.push(
      this.cardService.currentCard$.subscribe(card => {
        const wasSessionActive = this.isSessionActive;
        this.currentCard = card;
        this.isFlipped = false;
        this.showTranslation = false;
        this.updateSessionStatus();
        
        // Check if session just completed
        if (wasSessionActive && !this.isSessionActive && card === null) {
          this.handleSessionCompletion();
        }
      })
    );

    // Subscribe to session stats
    this.subscriptions.push(
      this.cardService.sessionStats$.subscribe(stats => {
        this.sessionProgress = this.cardService.getSessionProgress();
      })
    );



    this.updateSessionStatus();
  }

  async ionViewWillEnter() {
    // Refresh autoSpeak setting when user returns to this page (e.g., from Settings)
    const newAutoSpeakSetting = await this.storageService.getSetting('autoSpeak', false);
    if (newAutoSpeakSetting !== this.autoSpeakEnabled) {
      this.autoSpeakEnabled = newAutoSpeakSetting;
      console.log('DEBUG: AutoSpeak setting refreshed to:', this.autoSpeakEnabled);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async flipCard() {
    console.log('DEBUG: flipCard called, isFlipped before:', this.isFlipped);
    this.isFlipped = !this.isFlipped;
    console.log('DEBUG: flipCard - isFlipped after:', this.isFlipped);
    console.log('DEBUG: flipCard - autoSpeakEnabled:', this.autoSpeakEnabled);
    
    // Auto-play audio if enabled and card is flipped
    if (this.autoSpeakEnabled && this.isFlipped) {
      console.log('DEBUG: Auto-speak conditions met, will play audio in 300ms');
      // Small delay to allow flip animation to complete
      setTimeout(() => {
        console.log('DEBUG: Auto-speak timeout triggered, calling speak()');
        this.speak();
      }, 300);
    } else {
      console.log('DEBUG: Auto-speak conditions NOT met - autoSpeakEnabled:', this.autoSpeakEnabled, 'isFlipped:', this.isFlipped);
    }
  }

  async speak() {
    if (!this.currentCard) return;
    
    let textToSpeak = '';
    
    if (this.currentCard.type === 'fill-blank') {
      textToSpeak = this.isFlipped 
        ? this.currentCard.sentenceBack || ''
        : this.currentCard.sentenceFront || '';
      // Remove asterisks and replace underscores with longer pause
      textToSpeak = textToSpeak.replace(/\*\*/g, '').replace(/_+/g, '........................ ');
    } else if (this.currentCard.type === 'picture-word') {
      textToSpeak = this.currentCard.spanishWord || '';
    } else if (this.currentCard.type === 'translate') {
      // For translate cards, speak the target language word
      textToSpeak = this.currentCard.targetLanguageWord || '';
    }
    
    try {
      await this.ttsService.speak(textToSpeak);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }

  async markCorrect(difficulty: 'easy' | 'normal' | 'hard') {
    if (!this.currentCard) return;
    
    const response: CardResponse = {
      correct: true,
      difficulty
    };
    
    await this.cardService.processCardResponse(this.currentCard, response);
  }

  async markIncorrect() {
    if (!this.currentCard) return;
    
    const response: CardResponse = {
      correct: false,
      difficulty: 'hard' // Default to hard for incorrect responses
    };
    
    await this.cardService.processCardResponse(this.currentCard, response);
  }

  async handleSessionCompletion() {
    console.log('Session completed - showing completion summary');
    
    // Get final session stats
    const sessionStats = this.cardService.getSessionProgress();
    const finalStats = this.cardService.getCurrentSessionStats();
    
    // Clear the deckId parameter from URL
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
    
    // Show completion alert with stats and options
    const alert = await this.alertController.create({
      header: 'Study Session Complete! 🎉',
      subHeader: 'Session Summary:',

      message: `Session Summary:

• Cards studied: ${finalStats.completedCards}
• Correct answers: ${finalStats.correctCards}
• Incorrect answers: ${finalStats.incorrectCards}
• Accuracy: ${(finalStats.correctCards + finalStats.incorrectCards) > 0 ? Math.round((finalStats.correctCards / (finalStats.correctCards + finalStats.incorrectCards)) * 100) : 0}%`,
      buttons: [
        {
          text: 'Review Missed Cards',
          handler: () => {
            this.reviewMissedCards();
          }
        },
        {
          text: 'Study More Cards',
          handler: () => {
            this.studyMoreCards();
          }
        },
        {
          text: 'Finish',
          role: 'cancel',
          handler: () => {
            this.goToDecks();
          }
        }
      ]
    });

    await alert.present();
  }

  async reviewMissedCards() {
    console.log('Starting review of missed cards');
    
    // Check if there are missed cards available
    if (!this.cardService.hasMissedCards()) {
      const toast = await this.toastController.create({
        message: 'No missed cards available for review',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      this.goToDecks();
      return;
    }
    
    // Start missed cards review session
    try {
      await this.cardService.startMissedCardsReview();
      
      const toast = await this.toastController.create({
        message: `Starting review of ${this.cardService.getMissedCards().length} missed cards`,
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      
      console.log('Missed cards review session started successfully');
    } catch (error) {
      console.error('Error starting missed cards review:', error);
      
      const toast = await this.toastController.create({
        message: 'Error starting review session',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      this.goToDecks();
    }
  }

  async studyMoreCards() {
    // Get the current deck ID from the last session
    const currentDeckId = this.cardService.getCurrentDeckId();
    if (currentDeckId) {
      // Start a new session with the same deck
      await this.startStudySession(currentDeckId);
    } else {
      const toast = await this.toastController.create({
        message: 'Unable to continue - please select a deck to study',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      this.goToDecks();
    }
  }

  async showCopyCardOptions() {
    if (!this.currentCard) return;
    
    const actionSheet = await this.actionSheetController.create({
      header: 'Copy Card To Deck',
      buttons: [
        {
          text: 'Select Existing Deck',
          icon: 'folder',
          handler: () => {
            this.showDeckSelection();
          }
        },
        {
          text: 'Create New Deck',
          icon: 'add-circle',
          handler: () => {
            this.createNewDeckForCard();
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }

  async showDeckSelection() {
    if (!this.currentCard) return;
    
    // Get all decks
    const allDecks = await this.storageService.getAllDecks();
    const currentDeckId = this.currentCard.deckId;
    
    // Filter out the current deck
    const otherDecks = allDecks.filter((deck: Deck) => deck.id !== currentDeckId);
    
    if (otherDecks.length === 0) {
      const alert = await this.alertController.create({
        header: 'No Other Decks',
        message: 'You need to create another deck first before copying cards.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Deck',
      buttons: [
        ...otherDecks.map((deck: Deck) => ({
          text: deck.name,
          icon: 'library',
          handler: () => {
            this.copyCardToDeck(deck.id);
          }
        })),
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }

  async createNewDeckForCard() {
    if (!this.currentCard) return;
    
    const alert = await this.alertController.create({
      header: 'Create New Deck',
      inputs: [
        {
          name: 'deckName',
          type: 'text',
          placeholder: 'Enter deck name'
        },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Enter description (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create & Copy',
          handler: async (data: any) => {
            if (data.deckName.trim()) {
              const newDeckId = await this.createDeckAndCopyCard(data.deckName.trim(), data.description?.trim() || '');
              if (newDeckId) {
                const toast = await this.toastController.create({
                  message: `Card copied to new deck "${data.deckName}"`,
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
              }
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  async copyCardToDeck(targetDeckId: string) {
    if (!this.currentCard) return;
    
    try {
      // Create a copy of the card with new ID and deck
      const cardCopy = {
        ...this.currentCard,
        id: this.generateId(),
        deckId: targetDeckId,
        // Reset SRS data for the copy
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lastReviewed: new Date(),
        nextReview: new Date(),
        isNew: true,
        skipCount: 0
      };
      
      await this.cardService.addCard(cardCopy);
      
      const toast = await this.toastController.create({
        message: 'Card copied successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error copying card:', error);
      const toast = await this.toastController.create({
        message: 'Error copying card',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async createDeckAndCopyCard(deckName: string, description: string): Promise<string | null> {
    if (!this.currentCard) return null;
    
    try {
      // Create new deck with all required fields
      const newDeck: Deck = {
        id: this.generateId(),
        name: deckName,
        description: description,
        language: 'es', // Default to Spanish, could be made configurable
        cardCount: 0,
        createdAt: new Date(),
        masteredCards: 0,
        newCards: 0,
        reviewCards: 0,
        color: '#3880ff' // Default blue color
      };
      
      await this.storageService.saveDeck(newDeck);
      
      // Copy card to new deck
      await this.copyCardToDeck(newDeck.id);
      
      return newDeck.id;
    } catch (error) {
      console.error('Error creating deck and copying card:', error);
      const toast = await this.toastController.create({
        message: 'Error creating deck',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return null;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  endSession() {
    this.cardService.endSession();
    this.updateSessionStatus();
    // Hide tab bar when session ends
    this.sessionStateService.setSessionActive(false);
  }

  goToDecks() {
    this.router.navigate(['/tabs/decks']);
  }

  private updateSessionStatus() {
    this.isSessionActive = this.cardService.isSessionActive();
    this.sessionProgress = this.cardService.getSessionProgress();
    // Communicate session state to hide/show tab bar
    this.sessionStateService.setSessionActive(this.isSessionActive);
  }

  /**
   * Start a study session for a specific deck (called from Study button)
   */
  async startStudySession(deckId: string) {
    try {
      console.log('Starting study session for deck:', deckId);
      
      // Start the study session using the card service
      await this.cardService.startSession(deckId);
      
      // Update session status
      this.updateSessionStatus();
      
      console.log('Study session started successfully');
    } catch (error) {
      console.error('Error starting study session:', error);
    }
  }

  get highlightedBack(): string {
    if (!this.currentCard || this.currentCard.type !== 'fill-blank') return '';
    
    const sentence = this.currentCard.sentenceBack;
    const word = this.currentCard.missingWord;
    
    if (!sentence || !word) return '';
    
    return sentence.replace(
      new RegExp(`\\b${word}\\b`, 'gi'),
      `<strong class="highlighted-word">${word}</strong>`
    );
  }

  get remainingCards(): number {
    return this.cardService.getRemainingCards();
  }
}
