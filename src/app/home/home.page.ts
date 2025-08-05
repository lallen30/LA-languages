import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Card, CardResponse } from '../models/card.model';
import { CardService } from '../services/card.service';
import { TtsService } from '../services/tts.service';
import { SessionStateService } from '../services/session-state.service';
import { Router } from '@angular/router';
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
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cardService: CardService,
    private ttsService: TtsService,
    private sessionStateService: SessionStateService,
    private router: Router
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

  ngOnInit() {
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

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;
  }

  async speak() {
    if (!this.currentCard) return;
    
    let textToSpeak = '';
    
    if (this.currentCard.type === 'fill-blank') {
      textToSpeak = this.isFlipped 
        ? this.currentCard.sentenceBack || ''
        : this.currentCard.sentenceFront || '';
    } else if (this.currentCard.type === 'picture-word') {
      textToSpeak = this.currentCard.spanishWord || '';
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
