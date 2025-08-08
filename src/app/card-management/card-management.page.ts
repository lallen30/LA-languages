import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ActionSheetController, ModalController, LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Card } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { StorageService } from '../services/storage.service';
import { CardService } from '../services/card.service';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-card-management',
  templateUrl: './card-management.page.html',
  styleUrls: ['./card-management.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CardManagementPage implements OnInit {
  deck: Deck | null = null;
  cards: Card[] = [];
  filteredCards: Card[] = [];
  searchTerm: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private cardService: CardService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private imageService: ImageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const deckId = this.route.snapshot.paramMap.get('deckId');
    if (deckId) {
      await this.loadDeckAndCards(deckId);
    }
  }

  async ionViewWillEnter() {
    // Refresh data every time the page is entered
    const deckId = this.route.snapshot.paramMap.get('deckId');
    if (deckId) {
      await this.loadDeckAndCards(deckId);
    }
  }

  async loadDeckAndCards(deckId: string) {
    try {
      console.log('DEBUG: Loading deck and cards for deckId:', deckId);
      
      // Load deck
      const decks = await this.storageService.getAllDecks();
      this.deck = decks.find((d: Deck) => d.id === deckId) || null;
      
      if (!this.deck) {
        console.error('Deck not found');
        this.router.navigate(['/tabs/decks']);
        return;
      }

      // Load cards - create completely new array references for change detection
      const freshCards = await this.storageService.getCardsByDeck(deckId);
      this.cards = [...freshCards]; // Create new array reference
      this.filteredCards = [...this.cards]; // Create new filtered array reference
      
      console.log('DEBUG: Loaded', this.cards.length, 'cards, filtered to', this.filteredCards.length);
    } catch (error) {
      console.error('Error loading deck and cards:', error);
    }
  }

  filterCards() {
    if (!this.searchTerm.trim()) {
      this.filteredCards = [...this.cards];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCards = this.cards.filter(card => {
        // Search in different fields based on card type
        if (card.type === 'translate') {
          return card.targetLanguageWord?.toLowerCase().includes(term) ||
                 card.englishTranslation?.toLowerCase().includes(term);
        } else if (card.type === 'picture-word') {
          return card.spanishWord?.toLowerCase().includes(term) ||
                 card.englishTranslation?.toLowerCase().includes(term);
        } else if (card.type === 'fill-blank') {
          return card.missingWord?.toLowerCase().includes(term) ||
                 card.sentenceFront?.toLowerCase().includes(term) ||
                 card.sentenceBack?.toLowerCase().includes(term);
        }
        return false;
      });
    }
  }

  async openCardActions(card: Card) {
    let headerText = '';
    if (card.type === 'translate') {
      headerText = card.targetLanguageWord || 'Translate Card';
    } else if (card.type === 'picture-word') {
      headerText = card.spanishWord || 'Picture Card';
    } else if (card.type === 'fill-blank') {
      headerText = card.missingWord || 'Fill-in-the-Blank Card';
    }
    
    const actionSheet = await this.actionSheetController.create({
      header: headerText,
      buttons: [
        {
          text: 'Edit Card',
          icon: 'create-outline',
          handler: () => {
            this.editCard(card);
          }
        },
        {
          text: 'Delete Card',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteCard(card);
          }
        },
        {
          text: 'Reset Progress',
          icon: 'refresh-outline',
          handler: () => {
            this.resetCardProgress(card);
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

  async editCard(card: Card) {
    let inputs: any[] = [];
    let buttonText = 'Save';
    
    // Configure inputs based on card type
    if (card.type === 'translate') {
      inputs = [
        {
          name: 'targetLanguageWord',
          type: 'text',
          placeholder: 'Target Language Word',
          value: card.targetLanguageWord
        },
        {
          name: 'englishTranslation',
          type: 'text',
          placeholder: 'English Translation',
          value: card.englishTranslation
        }
      ];
    } else if (card.type === 'fill-blank') {
      inputs = [
        {
          name: 'sentenceFront',
          type: 'text',
          placeholder: 'Sentence with blank (use ____ for blank)',
          value: card.sentenceFront
        },
        {
          name: 'missingWord',
          type: 'text',
          placeholder: 'Missing word',
          value: card.missingWord
        },
        {
          name: 'sentenceBack',
          type: 'text',
          placeholder: 'Complete sentence',
          value: card.sentenceBack
        }
      ];
    } else if (card.type === 'picture-word') {
      inputs = [
        {
          name: 'spanishWord',
          type: 'text',
          placeholder: 'Spanish Word',
          value: card.spanishWord
        },
        {
          name: 'englishTranslation',
          type: 'text',
          placeholder: 'English Translation',
          value: card.englishTranslation
        }
      ];
      buttonText = 'Next'; // Picture cards need image selection
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
          text: buttonText,
          handler: async (data) => {
            if (card.type === 'translate') {
              if (data.targetLanguageWord && data.englishTranslation) {
                await this.updateTranslateCard(card, data);
              }
            } else if (card.type === 'fill-blank') {
              if (data.sentenceFront && data.missingWord && data.sentenceBack) {
                await this.updateFillBlankCard(card, data);
              }
            } else if (card.type === 'picture-word') {
              if (data.spanishWord && data.englishTranslation) {
                // Update the card data temporarily
                const updatedCardData = {
                  ...card,
                  spanishWord: data.spanishWord,
                  englishTranslation: data.englishTranslation
                };
                // Open image selection modal for editing
                await this.openImageSelectionForEdit(updatedCardData);
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openImageSelectionForEdit(cardData: Card) {
    console.log('DEBUG: Opening image selection modal for editing card:', cardData.spanishWord);
    
    const loading = await this.loadingController.create({
      message: 'Fetching images...'
    });
    await loading.present();

    try {
      // Fetch images for the modal
      const images = await this.imageService.fetchImages(cardData.spanishWord || '', 12);
      console.log('DEBUG: Fetched', images.length, 'images for editing modal');
      
      await loading.dismiss();

      // Import the modal component
      const { ImageSelectionModalComponent } = await import('../components/image-selection-modal/image-selection-modal.component');
      
      const modal = await this.modalController.create({
        component: ImageSelectionModalComponent,
        componentProps: {
          images: images,
          word: cardData.spanishWord,
          maxSelection: 9,
          selectedImages: cardData.imageUrls || [] // Pre-select existing images
        }
      });

      modal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.selectedImages) {
          console.log('DEBUG: User selected', result.data.selectedImages.length, 'images for editing');
          // Update the card with new data and selected images
          await this.updateCardWithNewImages(cardData, result.data.selectedImages);
        }
      });

      await modal.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Error opening image selection modal for editing:', error);
    }
  }

  async updateCardWithNewImages(cardData: Card, selectedImages: string[]) {
    try {
      console.log('DEBUG: Updating picture-word card with text and image changes');
      console.log('DEBUG: Text changes - Spanish:', cardData.spanishWord, 'English:', cardData.englishTranslation);
      console.log('DEBUG: Image changes:', selectedImages.length, 'images selected');
      
      // Create updated card object with both text and image changes
      const updatedCard: Card = {
        ...cardData,
        imageUrls: selectedImages // Update images
        // Text fields (spanishWord, englishTranslation) are already in cardData
      };
      
      console.log('DEBUG: Final updated card object:', updatedCard);
      
      await this.storageService.updateCard(updatedCard);
      console.log('DEBUG: Picture-word card updated successfully with all changes');
      
      // EXPERT SOLUTION: Direct object mutation for immediate UI update
      const cardIndex = this.cards.findIndex(c => c.id === updatedCard.id);
      if (cardIndex !== -1) {
        // Directly mutate the existing card object properties
        Object.assign(this.cards[cardIndex], updatedCard);
        
        // Update filtered cards if present
        const filteredIndex = this.filteredCards.findIndex(c => c.id === updatedCard.id);
        if (filteredIndex !== -1) {
          Object.assign(this.filteredCards[filteredIndex], updatedCard);
        }
        
        // Force change detection
        this.cdr.detectChanges();
        
        console.log('DEBUG: Picture-word card updated directly in UI - immediate refresh');
      } else {
        console.log('DEBUG: Card not found in arrays, reloading');
        await this.loadDeckAndCards(this.deck!.id);
      }
    } catch (error) {
      console.error('Error updating picture-word card with new images:', error);
    }
  }

  async deleteCard(card: Card) {
    const alert = await this.alertController.create({
      header: 'Delete Card',
      message: `Are you sure you want to delete "${card.spanishWord}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storageService.deleteCard(card.id);
            await this.loadDeckAndCards(this.deck!.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async resetCardProgress(card: Card) {
    const alert = await this.alertController.create({
      header: 'Reset Progress',
      message: `Reset learning progress for "${card.spanishWord}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: async () => {
            // Reset SRS data
            card.isNew = true;
            card.repetitions = 0;
            card.easeFactor = 2.5;
            card.interval = 1;
            card.nextReview = new Date();
            
            await this.storageService.updateCard(card);
            await this.loadDeckAndCards(this.deck!.id);
          }
        }
      ]
    });

    await alert.present();
  }

  async addCard() {
    if (!this.deck) {
      console.error('No deck available for adding cards');
      return;
    }

    // Navigate back to decks page and trigger card creation for this deck
    this.router.navigate(['/tabs/decks']).then(() => {
      // Use a small delay to ensure navigation is complete
      setTimeout(() => {
        // Trigger the card creation workflow by dispatching a custom event
        // or by using a service to communicate between components
        this.triggerCardCreation();
      }, 100);
    });
  }

  private triggerCardCreation() {
    // Create a custom event to trigger card creation in the decks page
    const event = new CustomEvent('triggerAddCard', {
      detail: { deckId: this.deck?.id }
    });
    window.dispatchEvent(event);
  }

  goBack() {
    this.router.navigate(['/tabs/decks']);
  }

  getCardStatusText(card: Card): string {
    if (card.isNew) return 'New';
    if (card.repetitions >= 3 && card.easeFactor >= 2.5) return 'Mastered';
    return 'Learning';
  }

  getCardStatusColor(card: Card): string {
    if (card.isNew) return 'primary';
    if (card.repetitions >= 3 && card.easeFactor >= 2.5) return 'success';
    return 'warning';
  }

  async updateTranslateCard(card: Card, data: any) {
    try {
      console.log('DEBUG: Original card object:', card);
      console.log('DEBUG: Original card.targetLanguageWord:', card.targetLanguageWord);
      console.log('DEBUG: Original card.englishTranslation:', card.englishTranslation);
      
      // EXPERT SOLUTION: Use JSON serialization to force enumerable properties
      // First, create a plain object with all the data
      const cardData = {
        id: card.id,
        deckId: card.deckId,
        type: card.type,
        sentenceFront: card.sentenceFront,
        missingWord: card.missingWord,
        sentenceBack: card.sentenceBack,
        spanishWord: card.spanishWord,
        targetLanguageWord: data.targetLanguageWord,
        englishTranslation: data.englishTranslation,
        imageUrls: card.imageUrls || [],
        showWordFirst: card.showWordFirst,
        showTargetLanguageFirst: card.showTargetLanguageFirst,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        lastReviewed: card.lastReviewed,
        nextReview: card.nextReview,
        isNew: card.isNew,
        skipCount: card.skipCount
      };
      
      // Force serialization to make all properties enumerable
      const updatedCard: Card = JSON.parse(JSON.stringify(cardData));
      
      console.log('DEBUG: After JSON serialization:', updatedCard);
      
      console.log('DEBUG: After explicit assignment:', updatedCard);
      
      console.log('DEBUG: Updating translate card with data:', data);
      console.log('DEBUG: Full updatedCard object being saved:', updatedCard);
      console.log('DEBUG: updatedCard.targetLanguageWord:', updatedCard.targetLanguageWord);
      console.log('DEBUG: updatedCard.englishTranslation:', updatedCard.englishTranslation);
      
      await this.storageService.updateCard(updatedCard);
      
      // Immediately check what was actually saved
      const savedCard = await this.storageService.getCard(updatedCard.id);
      console.log('DEBUG: Card immediately after save:', savedCard);
      
      // EXPERT SOLUTION: Direct object mutation for immediate UI update
      const cardIndex = this.cards.findIndex(c => c.id === updatedCard.id);
      if (cardIndex !== -1) {
        // Directly mutate the existing card object properties
        Object.assign(this.cards[cardIndex], updatedCard);
        
        // Update filtered cards if present
        const filteredIndex = this.filteredCards.findIndex(c => c.id === updatedCard.id);
        if (filteredIndex !== -1) {
          Object.assign(this.filteredCards[filteredIndex], updatedCard);
        }
        
        // Force change detection
        this.cdr.detectChanges();
        
        console.log('DEBUG: Card mutated directly in UI - immediate refresh');
        console.log('DEBUG: Updated card:', this.cards[cardIndex]);
        
        // Clear focus to prevent accessibility warnings
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else {
        console.log('DEBUG: Card not found, reloading arrays');
        await this.loadDeckAndCards(this.deck!.id);
      }
      
      const toast = await this.loadingController.create({
        message: 'Card updated successfully!',
        duration: 2000
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating translate card:', error);
    }
  }

  async updateFillBlankCard(card: Card, data: any) {
    try {
      const updatedCard = {
        ...card,
        sentenceFront: data.sentenceFront,
        missingWord: data.missingWord,
        sentenceBack: data.sentenceBack
      };
      
      console.log('DEBUG: Updating fill-blank card with data:', data);
      await this.storageService.updateCard(updatedCard);
      
      // Force complete refresh by clearing arrays first
      this.cards = [];
      this.filteredCards = [];
      
      // Small delay to ensure arrays are cleared
      setTimeout(async () => {
        await this.loadDeckAndCards(this.deck!.id);
        console.log('DEBUG: Cards reloaded, new count:', this.cards.length);
        console.log('DEBUG: First card data:', this.cards[0]);
      }, 100);
      
      const toast = await this.loadingController.create({
        message: 'Card updated successfully!',
        duration: 2000
      });
      await toast.present();
    } catch (error) {
      console.error('Error updating fill-blank card:', error);
    }
  }
}
