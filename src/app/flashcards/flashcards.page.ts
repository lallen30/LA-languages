import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController, AlertController, ToastController, Platform } from '@ionic/angular';
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
  addCircle,
  languageOutline,
  language,
  bookmarkOutline
} from 'ionicons/icons';
import { StoryService } from '../services/story.service';
import { WordCategory } from '../models/story.model';

@Component({
  selector: 'app-flashcards',
  templateUrl: './flashcards.page.html',
  styleUrls: ['./flashcards.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class FlashcardsPage implements OnInit, OnDestroy {
  currentCard: Card | null = null;
  isFlipped = false;
  showTranslation = false;
  showAnswer = false;
  showReviewButtons = false;
  sessionStats = {
    correct: 0,
    incorrect: 0,
    total: 0
  };
  sessionProgress = { completed: 0, total: 0, percentage: 0 };
  isSessionActive = false;
  currentCardNumber = 1;
  totalCardsInSession = 0;
  autoSpeakEnabled = false;
  autoSpeakOnLoadEnabled = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    public cardService: CardService,
    private ttsService: TtsService,
    private sessionStateService: SessionStateService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController,
    private platform: Platform,
    private storyService: StoryService
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
      'add-circle': addCircle,
      'language-outline': languageOutline,
      'language': language,
      'bookmark-outline': bookmarkOutline
    });
  }

  async ngOnInit() {
    // Load auto-speak settings
    this.autoSpeakEnabled = await this.storageService.getSetting('autoSpeak', false);
    this.autoSpeakOnLoadEnabled = await this.storageService.getSetting('autoSpeakOnLoad', false);
    console.log('DEBUG: Loaded autoSpeakEnabled setting:', this.autoSpeakEnabled);
    console.log('DEBUG: Loaded autoSpeakOnLoadEnabled setting:', this.autoSpeakOnLoadEnabled);

    // Handle query parameters for deck selection (from Study button)
    this.route.queryParams.subscribe(params => {
      if (params['deckId']) {
        console.log('Study button: Starting session for deckId:', params['deckId']);
        this.startStudySession(params['deckId']);
      }
    });
    
    // Also check storage for pending deck ID (more reliable on Android)
    this.checkPendingStudySession();
    
    // Stop the endless debug loop
    console.log('=== INITIAL BUTTON STATE ===');
    console.log('currentCard exists:', !!this.currentCard);
    console.log('isSessionActive:', this.isSessionActive);
    console.log('showAnswer:', this.showAnswer);

    // Subscribe to current card
    this.subscriptions.push(
      this.cardService.currentCard$.subscribe(async card => {
        try {
          const wasSessionActive = this.isSessionActive;
          this.currentCard = card;
          this.isFlipped = false;
          this.showTranslation = false;
          this.showReviewButtons = !!card;
          this.updateSessionStatus();
          
          // Auto-speak on card load if enabled (check storage directly for latest value)
          if (card) {
            try {
              const autoSpeakOnLoad = await this.storageService.getSetting('autoSpeakOnLoad', false);
              if (autoSpeakOnLoad) {
                console.log('DEBUG: Auto-speak on load enabled, playing audio');
                setTimeout(() => {
                  this.speak().catch(e => console.error('Auto-speak error:', e));
                }, 300);
              } else {
                console.log('DEBUG: Auto-speak on load disabled, skipping audio');
              }
            } catch (e) {
              console.error('Error checking auto-speak setting:', e);
            }
          }
          
          // Check if session just completed
          if (wasSessionActive && !this.isSessionActive && card === null) {
            this.handleSessionCompletion();
          }
        } catch (error) {
          console.error('Error in currentCard subscription:', error);
        }
      })
    );

    // Subscribe to session stats
    this.subscriptions.push(
      this.cardService.sessionStats$.subscribe(stats => {
        this.sessionProgress = this.cardService.getSessionProgress();
        this.currentCardNumber = this.sessionProgress.completed + 1;
        this.totalCardsInSession = this.cardService.getTotalCardsInSession();
      })
    );



    this.updateSessionStatus();

    // Attach global input debug listeners
    try {
      this.attachGlobalInputDebuggers();
    } catch (err) {
      console.warn('Failed to attach global input debug listeners', err);
    }
  }

  async ionViewWillEnter() {
    console.log('🔄 ionViewWillEnter called');
    
    // Refresh autoSpeak settings when user returns to this page (e.g., from Settings)
    const newAutoSpeakSetting = await this.storageService.getSetting('autoSpeak', false);
    if (newAutoSpeakSetting !== this.autoSpeakEnabled) {
      this.autoSpeakEnabled = newAutoSpeakSetting;
      console.log('DEBUG: AutoSpeak on flip setting refreshed to:', this.autoSpeakEnabled);
    }
    
    const newAutoSpeakOnLoadSetting = await this.storageService.getSetting('autoSpeakOnLoad', false);
    if (newAutoSpeakOnLoadSetting !== this.autoSpeakOnLoadEnabled) {
      this.autoSpeakOnLoadEnabled = newAutoSpeakOnLoadSetting;
      console.log('DEBUG: AutoSpeak on load setting refreshed to:', this.autoSpeakOnLoadEnabled);
    }
    
    // Check for pending study session (important for navigation from Decks page)
    await this.checkPendingStudySession();
    
    // Update session status
    this.updateSessionStatus();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.detachGlobalInputDebuggers();
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
    console.log('=== markCorrect START ===');
    console.log('markCorrect called with difficulty:', difficulty);
    console.log('Current card exists:', !!this.currentCard);
    console.log('Current card ID:', this.currentCard?.id);
    
    if (!this.currentCard) {
      console.log('ERROR: No current card available');
      return;
    }

    console.log('Creating response object...');
    const response: CardResponse = {
      correct: true,
      difficulty: difficulty
    };
    console.log('Response object created:', response);

    console.log('Calling cardService.processCardResponse...');
    await this.cardService.processCardResponse(this.currentCard, response);
    console.log('=== markCorrect END ===');
  }

  async markIncorrect() {
    console.log('=== markIncorrect START ===');
    console.log('markIncorrect called');
    console.log('Current card exists:', !!this.currentCard);
    console.log('Current card ID:', this.currentCard?.id);
    
    if (!this.currentCard) {
      console.log('ERROR: No current card available');
      return;
    }
    
    console.log('Creating response object...');
    const response: CardResponse = {
      correct: false,
      difficulty: 'hard' // Default to hard for incorrect responses
    };
    
    console.log('Processing incorrect response:', response);
    await this.cardService.processCardResponse(this.currentCard, response);
    console.log('=== markIncorrect END ===');
  }

  async handleSessionCompletion() {
    console.log('Session completed - showing completion summary');
    
    // Get final session stats
    const sessionStats = this.cardService.getSessionProgress();
    const finalStats = this.cardService.getCurrentSessionStats();
    
    // Clear the deckId parameter from URL
    this.router.navigate(['/tabs/flashcards'], { replaceUrl: true });
    
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

  async openCardActions() {
    if (!this.currentCard) return;
    
    let headerText = '';
    if (this.currentCard.type === 'translate') {
      headerText = this.currentCard.targetLanguageWord || 'Card';
    } else if (this.currentCard.type === 'picture-word') {
      headerText = this.currentCard.spanishWord || 'Card';
    } else if (this.currentCard.type === 'fill-blank') {
      headerText = this.currentCard.missingWord || 'Card';
    }
    
    const actionSheet = await this.actionSheetController.create({
      header: headerText,
      buttons: [
        {
          text: 'Edit Card',
          icon: 'create-outline',
          handler: () => {
            this.editCurrentCard();
          }
        },
        {
          text: 'Delete Card',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteCurrentCard();
          }
        },
        {
          text: 'Reset Progress',
          icon: 'refresh-outline',
          handler: () => {
            this.resetCurrentCardProgress();
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

  async editCurrentCard() {
    if (!this.currentCard) return;
    
    let inputs: any[] = [];
    
    if (this.currentCard.type === 'translate') {
      inputs = [
        {
          name: 'targetLanguageWord',
          type: 'text',
          placeholder: 'Target Language Word',
          value: this.currentCard.targetLanguageWord
        },
        {
          name: 'englishTranslation',
          type: 'textarea',
          placeholder: 'English Translation',
          value: this.currentCard.englishTranslation
        }
      ];
    } else if (this.currentCard.type === 'fill-blank') {
      inputs = [
        {
          name: 'sentenceFront',
          type: 'textarea',
          placeholder: 'Sentence with blank (use ____ for blank)',
          value: this.currentCard.sentenceFront
        },
        {
          name: 'missingWord',
          type: 'text',
          placeholder: 'Missing word',
          value: this.currentCard.missingWord
        },
        {
          name: 'sentenceBack',
          type: 'textarea',
          placeholder: 'Complete sentence',
          value: this.currentCard.sentenceBack
        }
      ];
    } else if (this.currentCard.type === 'picture-word') {
      inputs = [
        {
          name: 'spanishWord',
          type: 'text',
          placeholder: 'Spanish Word',
          value: this.currentCard.spanishWord
        },
        {
          name: 'englishTranslation',
          type: 'textarea',
          placeholder: 'English Translation',
          value: this.currentCard.englishTranslation
        }
      ];
    }

    const alert = await this.alertController.create({
      header: 'Edit Card',
      inputs: inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            await this.saveCardEdits(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async saveCardEdits(data: any) {
    if (!this.currentCard) return;
    
    const updatedCard = { ...this.currentCard };
    
    if (this.currentCard.type === 'translate') {
      if (data.targetLanguageWord) updatedCard.targetLanguageWord = data.targetLanguageWord;
      if (data.englishTranslation) updatedCard.englishTranslation = data.englishTranslation;
    } else if (this.currentCard.type === 'fill-blank') {
      if (data.sentenceFront) updatedCard.sentenceFront = data.sentenceFront;
      if (data.missingWord) updatedCard.missingWord = data.missingWord;
      if (data.sentenceBack) updatedCard.sentenceBack = data.sentenceBack;
    } else if (this.currentCard.type === 'picture-word') {
      if (data.spanishWord) updatedCard.spanishWord = data.spanishWord;
      if (data.englishTranslation) updatedCard.englishTranslation = data.englishTranslation;
    }
    
    await this.storageService.updateCard(updatedCard);
    this.currentCard = updatedCard;
    
    const toast = await this.toastController.create({
      message: 'Card updated successfully',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async deleteCurrentCard() {
    if (!this.currentCard) return;
    
    const alert = await this.alertController.create({
      header: 'Delete Card',
      message: 'Are you sure you want to delete this card?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storageService.deleteCard(this.currentCard!.id);
            
            const toast = await this.toastController.create({
              message: 'Card deleted',
              duration: 2000,
              position: 'bottom'
            });
            await toast.present();
            
            // Reload the session to get the next card
            const currentDeckId = this.cardService.getCurrentDeckId();
            if (currentDeckId && this.remainingCards > 0) {
              // Process as if user answered to move to next card
              const response: CardResponse = { correct: true, difficulty: 'easy' };
              await this.cardService.processCardResponse(this.currentCard!, response);
            } else {
              // No more cards, end session
              this.endSession();
              this.goToDecks();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async resetCurrentCardProgress() {
    if (!this.currentCard) return;
    
    const alert = await this.alertController.create({
      header: 'Reset Progress',
      message: 'Reset learning progress for this card?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: async () => {
            this.currentCard!.isNew = true;
            this.currentCard!.repetitions = 0;
            this.currentCard!.easeFactor = 2.5;
            this.currentCard!.interval = 1;
            this.currentCard!.nextReview = new Date();
            
            await this.storageService.updateCard(this.currentCard!);
            
            const toast = await this.toastController.create({
              message: 'Card progress reset',
              duration: 2000,
              position: 'bottom'
            });
            await toast.present();
          }
        }
      ]
    });

    await alert.present();
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
    // End the session and restore tab bar
    this.cardService.endSession();
    this.updateSessionStatus();
    this.sessionStateService.setSessionActive(false);
    
    // Navigate to decks page (decks_backup)
    this.router.navigate(['/tabs/decks_backup']);
  }

  private updateSessionStatus() {
    this.isSessionActive = this.cardService.isSessionActive();
    this.sessionProgress = this.cardService.getSessionProgress();
    console.log('📊 Session progress updated:', this.sessionProgress);
    // Communicate session state to hide/show tab bar
    this.sessionStateService.setSessionActive(this.isSessionActive);
  }

  /**
   * Start a study session for a specific deck (called from Study button)
   */
  async startStudySession(deckId: string) {
    try {
      console.log('🚀 Starting study session for deck:', deckId);
      
      // Get max cards per session from settings
      const maxCards = await this.storageService.getSetting('maxCardsPerSession', 20);
      console.log('🚀 Max cards per session from settings:', maxCards);
      
      // Debug: Check cards in storage before starting session
      const cardsInStorage = await this.storageService.getCardsByDeck(deckId);
      console.log('🚀 Cards found in storage for this deck:', cardsInStorage.length);
      if (cardsInStorage.length > 0) {
        console.log('🚀 First card sample:', JSON.stringify(cardsInStorage[0]));
      }
      
      // Start the study session using the card service with the max cards setting
      await this.cardService.startSession(deckId, maxCards);
      
      // Update session status immediately after session starts
      this.updateSessionStatus();
      
      console.log('🚀 Session active after start:', this.isSessionActive);
      console.log('🚀 Current card after start:', this.currentCard);
      
      // Update card counter values - use getTotalCardsInSession for reliable total
      const progress = this.cardService.getSessionProgress();
      this.currentCardNumber = progress.completed + 1;
      this.totalCardsInSession = this.cardService.getTotalCardsInSession();
      
      console.log('🚀 Study session started successfully - total cards:', this.totalCardsInSession);
    } catch (error) {
      console.error('🚀 Error starting study session:', error);
    }
  }

  /**
   * Check storage for pending study session (more reliable on Android than query params)
   */
  async checkPendingStudySession() {
    const pendingDeckId = await this.storageService.getSetting('pendingStudyDeckId', null);
    console.log('🔍 Checking for pending study session, deckId:', pendingDeckId);
    
    if (pendingDeckId) {
      // Clear the pending deck ID immediately to prevent re-triggering
      await this.storageService.saveSetting('pendingStudyDeckId', null);
      console.log('🔍 Found pending deck ID, starting session:', pendingDeckId);
      this.startStudySession(pendingDeckId);
    }
  }

  get highlightedBack(): string {
    if (!this.currentCard || this.currentCard.type !== 'fill-blank') return '';
    
    let sentence = this.currentCard.sentenceBack;
    const word = this.currentCard.missingWord;
    
    if (!sentence) return '';
    
    // Convert **word** markdown to bold HTML
    sentence = sentence.replace(/\*\*([^*]+)\*\*/g, '<strong class="highlighted-word">$1</strong>');
    
    // If no markdown was found but we have a missing word, highlight it
    if (!sentence.includes('highlighted-word') && word) {
      sentence = sentence.replace(
        new RegExp(`\\b${word}\\b`, 'gi'),
        `<strong class="highlighted-word">${word}</strong>`
      );
    }
    
    return sentence;
  }

  get remainingCards(): number {
    return this.cardService.getRemainingCards();
  }

  async translateText() {
    console.log('=== translateText() called ===');
    console.log('currentCard:', this.currentCard);
    console.log('showTranslation before:', this.showTranslation);
    
    if (!this.currentCard) {
      console.log('ERROR: No current card');
      return;
    }
    
    console.log('Card type:', this.currentCard.type);
    console.log('Card englishTranslation:', this.currentCard.englishTranslation);
    console.log('Card targetLanguageWord:', this.currentCard.targetLanguageWord);
    console.log('Card spanishWord:', this.currentCard.spanishWord);
    
    // Check if card has translation data
    const hasTranslation = this.currentCard.englishTranslation || this.currentCard.targetLanguageWord;
    console.log('hasTranslation:', hasTranslation);
    
    if (!hasTranslation) {
      console.log('ERROR: No translation data available');
      const toast = await this.toastController.create({
        message: 'No translation available for this card',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    // Toggle the translation display inline
    this.showTranslation = !this.showTranslation;
    console.log('showTranslation after toggle:', this.showTranslation);
    
    // Show feedback to user
    const message = this.showTranslation ? 'Translation shown' : 'Translation hidden';
    console.log('Toast message:', message);
    
    const toast = await this.toastController.create({
      message: message,
      duration: 1500,
      position: 'bottom'
    });
    await toast.present();
    
    console.log('=== translateText() completed ===');
  }

  testButtonClick(action: string) {
    console.log('=== BUTTON CLICKED ===');
    console.log('Action:', action);
    console.log('Method called successfully!');
    
    switch(action) {
      case 'easy':
        console.log('Calling markCorrect(easy)');
        this.markCorrect('easy');
        break;
      case 'good':
        console.log('Calling markCorrect(normal)');
        this.markCorrect('normal');
        break;
      case 'hard':
        console.log('Calling markCorrect(hard)');
        this.markCorrect('hard');
        break;
      case 'incorrect':
        console.log('Calling markIncorrect()');
        this.markIncorrect();
        break;
    }
  }

  debugButtonClick(action: string, event?: Event) {
    console.log('=== DEBUG BUTTON CLICK START ===');
    console.log('Action:', action);
    console.log('Event type:', event?.type || 'no event');
    console.log('Current card exists:', !!this.currentCard);
    console.log('Current card ID:', this.currentCard?.id);
    console.log('showAnswer:', this.showAnswer);
    console.log('isSessionActive:', this.isSessionActive);
    console.log('Event timestamp:', new Date().toISOString());
    console.log('User agent:', navigator.userAgent);
    console.log('Platform:', this.platform.platforms());
    
    // Add visual feedback immediately
    const target = event?.target as HTMLElement;
    if (target) {
      console.log('Target element:', target.tagName, target.className);
      target.style.backgroundColor = '#ff0000';
      setTimeout(() => {
        target.style.backgroundColor = '';
      }, 200);
    }
    
    // Prevent event bubbling and default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Add haptic feedback for iOS
    if (this.platform.is('ios')) {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light });
      });
    }
    
    console.log('About to call action method...');
    switch(action) {
      case 'easy':
        console.log('Calling markCorrect(easy)');
        this.markCorrect('easy');
        break;
      case 'good':
        console.log('Calling markCorrect(normal)');
        this.markCorrect('normal');
        break;
      case 'hard':
        console.log('Calling markCorrect(hard)');
        this.markCorrect('hard');
        break;
      case 'incorrect':
        console.log('Calling markIncorrect()');
        this.markIncorrect();
        break;
      default:
        console.log('Unknown action:', action);
    }
    console.log('=== DEBUG BUTTON CLICK END ===');
  }

  // TEMP: debug handler to verify bar receives taps
  debugBarClick(event: Event) {
    console.log('=== REVIEW BAR CLICK ===');
    const target = event?.target as HTMLElement | null;
    console.log('Target:', target?.tagName, target?.className);
  }

  // === Global touch/click debugging ===
  private boundTouchStart?: (e: TouchEvent) => void;
  private boundClick?: (e: MouseEvent) => void;

  private attachGlobalInputDebuggers() {
    this.boundTouchStart = (e: TouchEvent) => {
      const t = e.touches && e.touches[0];
      const el = e.target as HTMLElement | null;
      console.log('[[GLOBAL TOUCHSTART]]', t?.clientX, t?.clientY, 'target:', el?.tagName, el?.className);
    };
    this.boundClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      console.log('[[GLOBAL CLICK]]', e.clientX, e.clientY, 'target:', el?.tagName, el?.className);
    };
    document.addEventListener('touchstart', this.boundTouchStart, { capture: true });
    document.addEventListener('click', this.boundClick, { capture: true });
  }

  private detachGlobalInputDebuggers() {
    if (this.boundTouchStart) {
      document.removeEventListener('touchstart', this.boundTouchStart, { capture: true } as any);
      this.boundTouchStart = undefined;
    }
    if (this.boundClick) {
      document.removeEventListener('click', this.boundClick, { capture: true } as any);
      this.boundClick = undefined;
    }
  }

  /**
   * Add the current card's word to a story word category
   */
  async addWordToStoryCategory() {
    if (!this.currentCard) {
      return;
    }

    // Extract word from current card based on card type
    let word = '';
    if (this.currentCard.type === 'fill-blank' && this.currentCard.missingWord) {
      word = this.currentCard.missingWord;
    } else if (this.currentCard.type === 'picture-word' && this.currentCard.spanishWord) {
      word = this.currentCard.spanishWord;
    } else if (this.currentCard.type === 'translate' && this.currentCard.targetLanguageWord) {
      word = this.currentCard.targetLanguageWord;
    }

    if (!word) {
      const toast = await this.toastController.create({
        message: 'No word found on this card',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    // Get existing word categories
    const wordCategories = await this.storyService.getWordCategories();

    if (wordCategories.length === 0) {
      // No categories exist - prompt to create one
      const alert = await this.alertController.create({
        header: 'New Word Category',
        inputs: [
          { name: 'categoryName', type: 'text', placeholder: 'Category name' }
        ],
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Create & Add', role: 'confirm' }
        ]
      });
      await alert.present();
      
      const result = await alert.onDidDismiss();
      if (result.role === 'confirm' && result.data?.values?.categoryName?.trim()) {
        const categoryName = result.data.values.categoryName.trim();
        const newCategory = await this.storyService.createWordCategory(categoryName);
        await this.storyService.addWordsToCategory(newCategory.id, [word]);
        const toast = await this.toastController.create({
          message: `Added "${word}" to "${newCategory.name}"`,
          duration: 2000,
          position: 'bottom'
        });
        await toast.present();
      }
    } else {
      // Let user choose a category using action sheet
      const buttons: any[] = wordCategories.map(cat => ({
        text: `${cat.name} (${cat.words.length} words)`,
        data: { categoryId: cat.id, categoryName: cat.name }
      }));

      buttons.push({
        text: 'Create New Category',
        data: { createNew: true }
      });

      buttons.push({ text: 'Cancel', role: 'cancel' });

      const actionSheet = await this.actionSheetController.create({
        header: `Add "${word}" to category`,
        buttons: buttons
      });
      await actionSheet.present();
      
      const result = await actionSheet.onDidDismiss();
      
      if (result.role === 'cancel' || !result.data) {
        return;
      }
      
      if (result.data.createNew) {
        // Show create category alert
        const alert = await this.alertController.create({
          header: 'New Word Category',
          inputs: [
            { name: 'categoryName', type: 'text', placeholder: 'Category name' }
          ],
          buttons: [
            { text: 'Cancel', role: 'cancel' },
            { text: 'Create & Add', role: 'confirm' }
          ]
        });
        await alert.present();
        
        const alertResult = await alert.onDidDismiss();
        if (alertResult.role === 'confirm' && alertResult.data?.values?.categoryName?.trim()) {
          const categoryName = alertResult.data.values.categoryName.trim();
          const newCategory = await this.storyService.createWordCategory(categoryName);
          await this.storyService.addWordsToCategory(newCategory.id, [word]);
          const toast = await this.toastController.create({
            message: `Added "${word}" to "${newCategory.name}"`,
            duration: 2000,
            position: 'bottom'
          });
          await toast.present();
        }
      } else if (result.data.categoryId) {
        // Add to existing category
        await this.storyService.addWordsToCategory(result.data.categoryId, [word]);
        const toast = await this.toastController.create({
          message: `Added "${word}" to "${result.data.categoryName}"`,
          duration: 2000,
          position: 'bottom'
        });
        await toast.present();
      }
    }
  }
}
