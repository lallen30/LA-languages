import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Card, CardResponse } from '../models/card.model';
import { CardService } from '../services/card.service';
import { TtsService } from '../services/tts.service';
import { SessionStateService } from '../services/session-state.service';
import { StorageService } from '../services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBack, 
  language, 
  volumeHigh, 
  closeCircle, 
  refreshCircle, 
  checkmarkCircle,
  libraryOutline,
  play,
  add,
  create,
  createOutline,
  trashOutline
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
    private route: ActivatedRoute
  ) {
    // Register all required icons
    addIcons({
      arrowBack,
      language,
      volumeHigh,
      closeCircle,
      refreshCircle,
      checkmarkCircle,
      libraryOutline,
      play,
      add,
      create,
      createOutline,
      trashOutline
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
        this.currentCard = card;
        this.isFlipped = false;
        this.showTranslation = false;
        this.updateSessionStatus();
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

  async markCorrect(difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
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
      difficulty: 'normal'
    };
    
    await this.cardService.processCardResponse(this.currentCard, response);
  }

  markLater() {
    if (!this.currentCard) return;
    this.cardService.markCardLater(this.currentCard);
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
