import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AlertController, ActionSheetController, ModalController, LoadingController, ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../services/storage.service';
import { Card } from '../models/card.model';
import { Deck } from '../models/deck.model';
import { Router } from '@angular/router';
import { CardService } from '../services/card.service';
import { ImageService } from '../services/image.service';
import { addIcons } from 'ionicons';
import { 
  add, 
  addOutline,
  create, 
  createOutline, 
  trashOutline, 
  play,
  playOutline, 
  libraryOutline,
  imageOutline,
  closeCircle,
  close,
  language,
  checkmark,
  downloadOutline,
  cloudUploadOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-decks',
  templateUrl: './decks.page.html',
  styleUrls: ['./decks.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DecksPage implements OnInit {
  decks: Deck[] = [];
  filteredDecks: Deck[] = [];
  selectedLanguage: string = 'es-ES'; // Default to Spanish
  isLoading = false;
  
  languages = [
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'pt-PT', name: 'Portuguese' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'en-US', name: 'English' }
  ];
  
  deckColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  constructor(
    private storageService: StorageService,
    private cardService: CardService,
    private imageService: ImageService,
    private alertController: AlertController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Register all required icons for the Decks page
    addIcons({
      add,
      addOutline,
      create,
      createOutline,
      trashOutline,
      play,
      playOutline,
      libraryOutline,
      imageOutline,
      closeCircle,
      close,
      language,
      checkmark,
      downloadOutline,
      cloudUploadOutline
    });
  }

  async ngOnInit() {
    this.initializeDecksPage();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for card creation trigger from card management page
    window.addEventListener('triggerAddCard', (event: any) => {
      const deckId = event.detail?.deckId;
      if (deckId) {
        console.log('DEBUG: Received triggerAddCard event for deck:', deckId);
        this.handleAddCardFromManagement(deckId);
      }
    });
  }

  private async handleAddCardFromManagement(deckId: string) {
    // Find the deck and trigger the add card workflow
    const deck = this.filteredDecks.find((d: Deck) => d.id === deckId) || this.decks.find((d: Deck) => d.id === deckId);
    if (deck) {
      console.log('DEBUG: Triggering add card workflow for deck:', deck.name);
      await this.addCard(deck);
    } else {
      console.error('Deck not found for ID:', deckId);
    }
  }

  async initializeDecksPage() {
    // Expert-level initialization: ensure everything loads in correct order
    await this.ensureSampleDataExists();
    await this.loadCurrentLanguageAndFilter();
  }

  async ensureSampleDataExists() {
    // Check if we have any decks, if not create sample data
    const existingDecks = await this.storageService.getAllDecks();
    if (existingDecks.length === 0) {
      await this.createSampleData();
    }
  }

  async loadCurrentLanguageAndFilter() {
    // Expert-level method: load language and apply filtering in one atomic operation
    try {
      // Step 1: Get current language from storage (same key as Settings)
      this.selectedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
      
      // Step 2: Load all decks
      this.decks = await this.storageService.getAllDecks();
      
      // Step 2.5: Calculate card counts for each deck (CRITICAL for UI display)
      for (const deck of this.decks) {
        await this.updateDeckCardCounts(deck);
      }
      
      // Step 3: Apply language filtering immediately
      this.filteredDecks = this.decks.filter(deck => deck.language === this.selectedLanguage);
      
      // Step 4: Force UI update
      this.cdr.detectChanges();
      
      console.log('EXPERT SOLUTION - Language filtering applied:', {
        selectedLanguage: this.selectedLanguage,
        totalDecks: this.decks.length,
        filteredDecks: this.filteredDecks.length,
        filteredDeckNames: this.filteredDecks.map(d => d.name)
      });
    } catch (error) {
      console.error('Error in loadCurrentLanguageAndFilter:', error);
      // Fallback: show all decks
      this.filteredDecks = this.decks || [];
    }
  }

  async ionViewWillEnter() {
    // Expert-level approach: always refresh language and filter when entering page
    await this.loadCurrentLanguageAndFilter();
  }

  async simpleLanguageRefresh() {
    try {
      // Step 1: Get current language from storage
      this.selectedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
      
      // Step 2: Load all decks
      this.decks = await this.storageService.getAllDecks();
      
      // Step 3: Filter decks by language
      this.filteredDecks = this.decks.filter(deck => deck.language === this.selectedLanguage);
      
      // Step 4: Force UI update
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error in simpleLanguageRefresh:', error);
      // Fallback: show all decks if filtering fails
      this.filteredDecks = this.decks || [];
    }
  }

  async manualRefresh() {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    // Use the expert-level solution for manual refresh
    await this.loadCurrentLanguageAndFilter();
    console.log('=== MANUAL REFRESH COMPLETE ===');
  }

  async diagnoseLanguageFiltering() {
    console.log('\n=== DIAGNOSTIC START ===');
    
    // 1. Check what's in storage for language
    const storedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
    console.log('1. STORED LANGUAGE:', storedLanguage);
    
    // 2. Load all decks and see what we have
    const allDecks = await this.storageService.getAllDecks();
    console.log('2. ALL DECKS IN STORAGE:', allDecks.length);
    allDecks.forEach((deck, index) => {
      console.log(`   Deck ${index + 1}: "${deck.name}" - Language: "${deck.language}"`);
    });
    
    // 3. Set our properties
    this.selectedLanguage = storedLanguage;
    this.decks = allDecks;
    
    // 4. Try simple filtering
    console.log('3. FILTERING WITH LANGUAGE:', this.selectedLanguage);
    const filtered = allDecks.filter(deck => deck.language === this.selectedLanguage);
    console.log('4. FILTERED RESULT:', filtered.length, 'decks');
    filtered.forEach((deck, index) => {
      console.log(`   Filtered ${index + 1}: "${deck.name}" - Language: "${deck.language}"`);
    });
    
    // 5. Set filtered decks and force UI update
    this.filteredDecks = filtered;
    this.cdr.detectChanges();
    
    console.log('=== DIAGNOSTIC END ===\n');
  }

  async refreshLanguageAndDecks() {
    try {
      // Get current language from storage (same key as Settings page)
      this.selectedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
      
      // Load all decks
      await this.loadDecks();
      
      // Apply language filtering immediately
      this.applyLanguageFilter();
      
      // Force UI update
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error refreshing language and decks:', error);
    }
  }

  applyLanguageFilter() {
    console.log('=== APPLY LANGUAGE FILTER DEBUG ===');
    console.log('selectedLanguage:', this.selectedLanguage);
    console.log('Available decks:', this.decks.map(d => ({ name: d.name, language: d.language, cardCount: d.cardCount })));
    
    // Simple, direct filtering
    this.filteredDecks = this.decks.filter(deck => {
      const matches = deck.language === this.selectedLanguage;
      console.log(`Deck "${deck.name}" (${deck.language}) matches ${this.selectedLanguage}? ${matches}`);
      return matches;
    });
    
    console.log('Filtered decks result:', this.filteredDecks.map(d => ({ name: d.name, language: d.language, cardCount: d.cardCount })));
    console.log('=== END LANGUAGE FILTER DEBUG ===');
    
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('DEBUG: Change detection triggered');
    }, 0);
  }

  async loadSelectedLanguage() {
    console.log('=== LOADING LANGUAGE SETTING ===');
    
    // Use the same language setting as the Settings page (ttsLanguage)
    const savedLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
    console.log('Retrieved ttsLanguage from storage:', savedLanguage);
    console.log('Type of savedLanguage:', typeof savedLanguage);
    
    this.selectedLanguage = savedLanguage;
    console.log('selectedLanguage set to:', this.selectedLanguage);
    console.log('=== END LOADING LANGUAGE ===');
  }

  async updateDeckCardCounts(deck: Deck) {
    try {
      // Get all cards for this deck
      const cards = await this.storageService.getCardsByDeck(deck.id);
      
      // Calculate counts
      deck.cardCount = cards.length;
      deck.masteredCards = cards.filter(card => card.easeFactor >= 2.5 && card.repetitions >= 3).length;
      deck.newCards = cards.filter(card => card.isNew === true).length;
      deck.reviewCards = cards.filter(card => !card.isNew && card.easeFactor < 2.5).length;
      
      console.log(`DEBUG: Updated card counts for deck "${deck.name}": ${deck.cardCount} total, ${deck.masteredCards} mastered, ${deck.newCards} new, ${deck.reviewCards} review`);
    } catch (error) {
      console.error(`Error updating card counts for deck ${deck.name}:`, error);
      // Set default values if there's an error
      deck.cardCount = 0;
      deck.masteredCards = 0;
      deck.newCards = 0;
      deck.reviewCards = 0;
    }
  }

  async loadDecks() {
    try {
      this.isLoading = true;
      this.decks = await this.storageService.getAllDecks();
      
      // Calculate card counts for each deck
      for (const deck of this.decks) {
        await this.updateDeckCardCounts(deck);
      }
      
      console.log('DEBUG: Loaded decks with updated card counts:', this.decks.map(d => ({ name: d.name, cardCount: d.cardCount, masteredCards: d.masteredCards })));
      
      // Apply language filter to update the UI with the new card counts
      this.applyLanguageFilter();
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filterDecksByLanguage() {
    console.log('=== FILTERING DECKS ===');
    console.log('Current selectedLanguage:', this.selectedLanguage);
    console.log('Total decks available:', this.decks.length);
    console.log('All decks:', this.decks.map(d => ({ name: d.name, language: d.language })));
    
    const previousCount = this.filteredDecks.length;
    this.filteredDecks = this.decks.filter(deck => {
      const matches = deck.language === this.selectedLanguage;
      console.log(`Deck "${deck.name}" (${deck.language}) matches ${this.selectedLanguage}? ${matches}`);
      return matches;
    });
    
    console.log('Filtered decks result:', this.filteredDecks.length, 'decks');
    console.log('Filtered deck names:', this.filteredDecks.map(d => d.name));
    console.log('=== END FILTERING ===');
    
    // Only trigger change detection if the filtered results actually changed
    if (this.filteredDecks.length !== previousCount) {
      console.log('Filtered results changed, triggering change detection');
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }



  getDeckColor(index: number): string {
    return this.deckColors[index % this.deckColors.length];
  }

  async createNewDeck() {
    const alert = await this.alertController.create({
      header: 'Create New Deck',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Deck name'
        },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Description (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.name && data.name.trim()) {
              await this.createDeck(data.name.trim(), data.description?.trim() || '', this.selectedLanguage);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async createDeck(name: string, description: string, language: string) {
    const newDeck: Deck = {
      id: this.generateId(),
      name,
      description,
      language,
      color: this.getRandomColor(),
      cardCount: 0,
      newCards: 0,
      reviewCards: 0,
      masteredCards: 0,
      createdAt: new Date(),
      lastStudied: undefined
    };

    await this.storageService.saveDeck(newDeck);
    await this.loadDecks();
  }

  async startStudySession(deck: Deck) {
    await this.cardService.startSession(deck.id);
    this.router.navigate(['/tabs/home']);
  }

  async addCard(deck: Deck) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Choose Card Type',
      buttons: [
        {
          text: 'Fill in the Blank',
          icon: 'create',
          handler: () => {
            this.createFillBlankCard(deck);
          }
        },
        {
          text: 'Guess the Picture',
          icon: 'image',
          handler: () => {
            this.createPictureWordCard(deck);
          }
        },
        {
          text: 'Translate',
          icon: 'language',
          handler: () => {
            this.createTranslateCard(deck);
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

  async createFillBlankCard(deck: Deck) {
    const alert = await this.alertController.create({
      header: 'Create Fill-in-the-Blank Card',
      inputs: [
        {
          name: 'sentence',
          type: 'text',
          placeholder: 'Complete sentence (e.g., "El gato está en la mesa")'
        },
        {
          name: 'missingWord',
          type: 'text',
          placeholder: 'Missing word (e.g., "gato")'
        },
        {
          name: 'translation',
          type: 'text',
          placeholder: 'English translation'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.sentence && data.missingWord && data.translation) {
              await this.saveFillBlankCard(deck, data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async createPictureWordCard(deck: Deck) {
    const alert = await this.alertController.create({
      header: 'Create Picture Word Card',
      inputs: [
        {
          name: 'word',
          type: 'text',
          placeholder: 'Spanish word (e.g., "árbol")'
        },
        {
          name: 'translation',
          type: 'text',
          placeholder: 'English translation'
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
            if (data.word && data.translation) {
              await this.openImageSelectionModal(deck, data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async createTranslateCard(deck: Deck) {
    // Get the current language name for dynamic placeholder
    const currentLanguage = this.languages.find(lang => lang.code === this.selectedLanguage);
    const languageName = currentLanguage ? currentLanguage.name : 'Target language';
    
    const alert = await this.alertController.create({
      header: 'Create Translation Card',
      inputs: [
        {
          name: 'targetWord',
          type: 'text',
          placeholder: `${languageName} word (e.g., "casa")`
        },
        {
          name: 'englishWord',
          type: 'text',
          placeholder: 'English translation (e.g., "house")'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.targetWord && data.englishWord) {
              await this.saveTranslateCard(deck, data);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async saveFillBlankCard(deck: Deck, data: any) {
    const sentenceFront = data.sentence.replace(data.missingWord, '___');
    const sentenceBack = data.sentence.replace(data.missingWord, `**${data.missingWord}**`);
    
    const newCard: Card = {
      id: this.generateId(),
      deckId: deck.id,
      type: 'fill-blank',
      sentenceFront,
      sentenceBack,
      missingWord: data.missingWord,
      englishTranslation: data.translation,
      imageUrls: [],
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    await this.cardService.addCard(newCard);
    await this.loadDecks();
  }

  async saveTranslateCard(deck: Deck, data: any) {
    const newCard: Card = {
      id: this.generateId(),
      deckId: deck.id,
      type: 'translate',
      targetLanguageWord: data.targetWord,
      englishTranslation: data.englishWord,
      imageUrls: [],
      showTargetLanguageFirst: Math.random() > 0.5, // Randomly show either target language or English first
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    await this.cardService.addCard(newCard);
    await this.loadDecks();
  }

  async openImageSelectionModal(deck: Deck, data: any) {
    console.log('DEBUG: Opening image selection modal for:', data.word);
    
    const loading = await this.loadingController.create({
      message: 'Fetching images...'
    });
    await loading.present();

    try {
      // Fetch images for the modal
      const images = await this.imageService.fetchImages(data.word, 12);
      console.log('DEBUG: Fetched', images.length, 'images for selection modal');
      
      await loading.dismiss();

      // Import the modal component
      const { ImageSelectionModalComponent } = await import('../components/image-selection-modal/image-selection-modal.component');
      
      const modal = await this.modalController.create({
        component: ImageSelectionModalComponent,
        componentProps: {
          images: images,
          word: data.word,
          maxSelection: 9
        }
      });

      modal.onDidDismiss().then((result) => {
        if (result.data && result.data.selectedImages) {
          console.log('DEBUG: User selected', result.data.selectedImages.length, 'images');
          // Create the card with selected images
          this.createPictureWordCardWithImages(deck, data, result.data.selectedImages);
        }
      });

      await modal.present();
    } catch (error) {
      await loading.dismiss();
      console.error('Error opening image selection modal:', error);
    }
  }

  async createPictureWordCardWithImages(deck: Deck, data: any, selectedImages: string[]) {
    console.log('DEBUG: Creating picture word card with selected images:', selectedImages.length);
    
    const newCard: Card = {
      id: this.generateId(),
      deckId: deck.id,
      type: 'picture-word',
      spanishWord: data.word,
      englishTranslation: data.translation,
      imageUrls: selectedImages,
      showWordFirst: Math.random() > 0.5,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    try {
      console.log('DEBUG: Saving card with selected images...');
      await this.cardService.addCard(newCard);
      console.log('DEBUG: Card saved successfully, reloading decks...');
      await this.loadDecks();
      console.log('DEBUG: Decks reloaded successfully');
    } catch (error) {
      console.error('Error creating picture word card with selected images:', error);
    }
  }

  async savePictureWordCard(deck: Deck, data: any) {
    console.log('DEBUG: savePictureWordCard called with:', { deck: deck.name, data });
    
    const loading = await this.loadingController.create({
      message: 'Fetching images...'
    });
    await loading.present();

    try {
      console.log('DEBUG: Fetching images for word:', data.word);
      const images = await this.imageService.fetchImages(data.word, 6);
      console.log('DEBUG: Images fetched successfully:', images.length, 'images');
      
      const newCard: Card = {
        id: this.generateId(),
        deckId: deck.id,
        type: 'picture-word',
        spanishWord: data.word,
        englishTranslation: data.translation,
        imageUrls: images,
        showWordFirst: Math.random() > 0.5,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lastReviewed: new Date(),
        nextReview: new Date(),
        isNew: true,
        skipCount: 0
      };

      console.log('DEBUG: New card created:', newCard);
      console.log('DEBUG: Calling cardService.addCard...');
      await this.cardService.addCard(newCard);
      console.log('DEBUG: Card added successfully, reloading decks...');
      await this.loadDecks();
      console.log('DEBUG: Decks reloaded successfully');
    } catch (error) {
      console.error('Error creating picture word card:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    } finally {
      await loading.dismiss();
    }
  }

  async deleteDeck(deck: Deck) {
    const alert = await this.alertController.create({
      header: 'Delete Deck',
      message: `Are you sure you want to delete "${deck.name}"? This will also delete all cards in this deck.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storageService.deleteDeck(deck.id);
            await this.loadDecks();
          }
        }
      ]
    });

    await alert.present();
  }

  async manageCards(deck: Deck) {
    // Navigate to the card management page
    this.router.navigate(['/tabs/card-management', deck.id]);
  }

  async openDeckActions(deck: Deck) {
    const actionSheet = await this.actionSheetController.create({
      header: deck.name,
      buttons: [
        {
          text: 'Study',
          icon: 'play',
          handler: () => {
            this.startStudySession(deck);
          }
        },
        {
          text: 'Add Card',
          icon: 'add',
          handler: () => {
            this.addCard(deck);
          }
        },
        {
          text: 'Manage Cards',
          icon: 'library-outline',
          handler: () => {
            this.manageCards(deck);
          }
        },
        {
          text: 'Export Deck',
          icon: 'download-outline',
          handler: () => {
            this.exportDeck(deck);
          }
        },
        {
          text: 'Edit Deck',
          icon: 'create-outline',
          handler: () => {
            this.editDeck(deck);
          }
        },
        {
          text: 'Delete Deck',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteDeck(deck);
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

  async editDeck(deck: Deck) {
    const alert = await this.alertController.create({
      header: 'Edit Deck',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Deck name',
          value: deck.name
        },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Description',
          value: deck.description
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.name && data.name.trim()) {
              await this.updateDeck(deck, data.name.trim(), data.description?.trim() || '');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async updateDeck(deck: Deck, name: string, description: string) {
    const updatedDeck = {
      ...deck,
      name,
      description
    };

    await this.storageService.saveDeck(updatedDeck);
    await this.loadDecks();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getRandomColor(): string {
    return this.deckColors[Math.floor(Math.random() * this.deckColors.length)];
  }

  async createSampleData() {
    const existingDecks = await this.storageService.getAllDecks();
    console.log('Existing decks:', existingDecks);
    
    // Force recreation if any deck is missing language property
    let needsRecreation = false;
    for (const deck of existingDecks) {
      console.log(`Deck "${deck.name}" language:`, deck.language);
      if (!deck.language || deck.language === undefined || deck.language === null) {
        needsRecreation = true;
        console.log(`Deck "${deck.name}" is missing language property`);
      }
    }
    
    if (needsRecreation) {
      console.log('FORCING COMPLETE DECK RESET - deleting all existing decks...');
      // Delete all existing decks to force recreation with language properties
      for (const deck of existingDecks) {
        console.log('Deleting deck:', deck.name, 'ID:', deck.id);
        await this.storageService.deleteDeck(deck.id);
      }
      console.log('All legacy decks deleted, will create new ones with language properties');
    } else if (existingDecks.length > 0) {
      // If we already have decks with language properties, don't recreate
      console.log('All decks already have language properties, skipping creation');
      return;
    }

    // Create sample decks for different languages
    const sampleDecks = [
      {
        name: 'Spanish Basics',
        description: 'Essential Spanish phrases for beginners',
        language: 'es-ES',
        color: '#FF6B6B'
      },
      {
        name: 'French Essentials',
        description: 'Common French vocabulary',
        language: 'fr-FR',
        color: '#4ECDC4'
      },
      {
        name: 'German Fundamentals',
        description: 'Basic German words and phrases',
        language: 'de-DE',
        color: '#45B7D1'
      }
    ];

    for (const deckData of sampleDecks) {
      const deck: Deck = {
        id: this.generateId(),
        name: deckData.name,
        description: deckData.description,
        language: deckData.language,
        color: deckData.color,
        cardCount: 0,
        newCards: 0,
        reviewCards: 0,
        masteredCards: 0,
        createdAt: new Date(),
        lastStudied: undefined
      };

      await this.storageService.saveDeck(deck);
    }

    await this.loadDecks();
  }

  // New methods for icon buttons
  
  /**
   * Start studying a deck - navigate to home page with the selected deck
   */
  async startStudying(deck: Deck) {
    console.log('Starting study for deck:', deck.name);
    // Navigate to home page and pass the deck ID
    this.router.navigate(['/tabs/home'], { 
      queryParams: { deckId: deck.id } 
    });
  }

  /**
   * Show add card options - reuse existing showAddCardOptions method
   */
  async showAddCardOptions(deck: Deck) {
    console.log('Showing add card options for deck:', deck.name);
    // Reuse the existing openDeckActions method logic for adding cards
    await this.openAddCardActionSheet(deck);
  }

  /**
   * Navigate to card management page for the deck
   */
  async navigateToCardManagement(deck: Deck) {
    console.log('Navigating to card management for deck:', deck.name);
    this.router.navigate(['/tabs/card-management', deck.id]);
  }

  /**
   * Helper method to show add card action sheet
   */
  private async openAddCardActionSheet(deck: Deck) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Add Card Type',
      buttons: [
        {
          text: 'Fill in the Blank',
          icon: 'create-outline',
          handler: () => {
            this.createFillBlankCard(deck);
          }
        },
        {
          text: 'Picture Word',
          icon: 'image-outline',
          handler: () => {
            this.createPictureWordCard(deck);
          }
        },
        {
          text: 'Translate',
          icon: 'language',
          handler: () => {
            this.createTranslateCard(deck);
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

  /**
   * Export a specific deck with all its cards
   */
  async exportDeck(deck: Deck) {
    try {
      console.log('Exporting deck:', deck.name);
      
      // Get all cards for this deck
      const cards = await this.storageService.getCardsByDeck(deck.id);
      
      // Create export data structure
      const exportData = {
        deck: {
          name: deck.name,
          description: deck.description,
          language: deck.language,
          color: deck.color,
          createdAt: deck.createdAt
        },
        cards: cards,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deck-${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      // Show success message
      const toast = await this.toastController.create({
        message: `Deck "${deck.name}" exported successfully!`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      console.log('Deck exported successfully:', deck.name);
    } catch (error) {
      console.error('Error exporting deck:', error);
      
      const toast = await this.toastController.create({
        message: 'Export failed. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Import a deck from a JSON file
   */
  async importDeck() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data structure
        if (!importData.deck || !importData.cards || !Array.isArray(importData.cards)) {
          throw new Error('Invalid deck file format');
        }
        
        const alert = await this.alertController.create({
          header: 'Import Deck',
          message: `Import deck "${importData.deck.name}" with ${importData.cards.length} cards?`,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Import',
              handler: async () => {
                await this.performDeckImport(importData);
              }
            }
          ]
        });
        
        await alert.present();
      } catch (error) {
        console.error('Import failed:', error);
        
        const toast = await this.toastController.create({
          message: 'Import failed - invalid deck file',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    };
    
    input.click();
  }

  /**
   * Perform the actual deck import process
   */
  private async performDeckImport(importData: any) {
    try {
      console.log('Importing deck:', importData.deck.name);
      
      // Create new deck with imported data
      const newDeck: Deck = {
        id: this.generateId(),
        name: importData.deck.name,
        description: importData.deck.description || '',
        language: importData.deck.language || 'es-ES',
        color: importData.deck.color || '#FF6B6B',
        cardCount: 0,
        newCards: 0,
        reviewCards: 0,
        masteredCards: 0,
        createdAt: new Date(),
        lastStudied: undefined
      };
      
      // Save the deck
      await this.storageService.saveDeck(newDeck);
      console.log('Deck created:', newDeck.name);
      
      // Import all cards for this deck
      let importedCards = 0;
      for (const cardData of importData.cards) {
        const newCard: Card = {
          id: this.generateId(),
          deckId: newDeck.id,
          type: cardData.type,
          spanishWord: cardData.spanishWord,
          englishTranslation: cardData.englishTranslation,
          targetLanguageWord: cardData.targetLanguageWord,
          sentenceFront: cardData.sentenceFront,
          sentenceBack: cardData.sentenceBack,
          missingWord: cardData.missingWord,
          imageUrls: cardData.imageUrls || [],
          showWordFirst: cardData.showWordFirst,
          showTargetLanguageFirst: cardData.showTargetLanguageFirst,
          easeFactor: 2.5, // Reset learning progress
          interval: 1,
          repetitions: 0,
          lastReviewed: new Date(),
          nextReview: new Date(),
          isNew: true,
          skipCount: 0
        };
        
        await this.cardService.addCard(newCard);
        importedCards++;
      }
      
      // Reload decks to show the imported deck
      await this.loadDecks();
      
      // Show success message
      const toast = await this.toastController.create({
        message: `Deck "${newDeck.name}" imported with ${importedCards} cards!`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();
      
      console.log('Deck import completed:', newDeck.name, 'with', importedCards, 'cards');
    } catch (error) {
      console.error('Error during deck import:', error);
      
      const toast = await this.toastController.create({
        message: 'Import failed. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
