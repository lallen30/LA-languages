import { Component, OnInit } from '@angular/core';
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
    private imageService: ImageService
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
      // Load deck
      const decks = await this.storageService.getAllDecks();
      this.deck = decks.find((d: Deck) => d.id === deckId) || null;
      
      if (!this.deck) {
        console.error('Deck not found');
        this.router.navigate(['/tabs/decks']);
        return;
      }

      // Load cards
      this.cards = await this.storageService.getCardsByDeck(deckId);
      this.filteredCards = [...this.cards];
    } catch (error) {
      console.error('Error loading deck and cards:', error);
    }
  }

  filterCards() {
    if (!this.searchTerm.trim()) {
      this.filteredCards = [...this.cards];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCards = this.cards.filter(card => 
        card.spanishWord?.toLowerCase().includes(term) ||
        card.englishTranslation?.toLowerCase().includes(term)
      );
    }
  }

  async openCardActions(card: Card) {
    const actionSheet = await this.actionSheetController.create({
      header: card.spanishWord,
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
    const alert = await this.alertController.create({
      header: 'Edit Card',
      inputs: [
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
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Next',
          handler: async (data) => {
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
      console.log('DEBUG: Updating card with new images:', selectedImages.length);
      
      // Update the card with new data and images
      cardData.imageUrls = selectedImages;
      
      await this.storageService.updateCard(cardData);
      console.log('DEBUG: Card updated successfully, reloading cards...');
      
      // Reload the cards list
      await this.loadDeckAndCards(this.deck!.id);
      console.log('DEBUG: Cards reloaded successfully');
    } catch (error) {
      console.error('Error updating card with new images:', error);
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
}
