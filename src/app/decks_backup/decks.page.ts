import { Component, OnInit, NgZone } from '@angular/core';
import { IonicModule, ActionSheetController, AlertController, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { ImageService } from '../services/image.service';
import { addIcons } from 'ionicons';
import { Deck } from '../models/deck.model';
import { CardType } from '../models/card.model';
import { 
  add, 
  refresh, 
  download, 
  ellipsisVertical, 
  play, 
  create, 
  trash, 
  statsChart,
  library,
  cloudUploadOutline,
  playOutline,
  addOutline,
  libraryOutline,
  closeOutline,
  createOutline,
  trashOutline,
  downloadOutline,
  close
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
  filteredDecks: any[] = [];
  
  selectedLanguage = 'es-ES';
  isLoading = false;
  
  // Action sheet states
  isDeckActionSheetOpen = false;
  isAddCardActionSheetOpen = false;
  isCreateDeckActionSheetOpen = false;
  isImportActionSheetOpen = false;
  
  // Custom modal states
  showImportModal = false;
  showUrlInputModal = false;
  importUrl = '';
  
  // Selected deck for actions
  selectedDeck: any = null;
  
  languages = [
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' }
  ];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private storageService: StorageService,
    private imageService: ImageService
  ) {
    // Register required icons
    addIcons({
      add,
      refresh,
      download,
      ellipsisVertical,
      play,
      create,
      trash,
      statsChart,
      library,
      cloudUploadOutline,
      playOutline,
      addOutline,
      libraryOutline,
      closeOutline,
      createOutline,
      trashOutline,
      downloadOutline,
      close
    });
  }

  async ngOnInit() {
    await this.initializeDecksPage();
    this.checkForReturnedData();
  }

  ionViewWillEnter() {
    console.log('📱 DecksPage ionViewWillEnter - checking for returned data');
    this.checkForReturnedData();
  }

  checkForReturnedData() {
    // Check if returning from image selection with selected images
    const navigation = this.router.getCurrentNavigation();
    console.log('📱 Checking navigation state:', navigation?.extras?.state);
    
    // Also check history state as fallback
    const historyState = history.state;
    console.log('📱 Checking history state:', historyState);
    
    let state = navigation?.extras?.state || historyState;
    
    if (state?.['action'] === 'createPictureWordCard') {
      const selectedImages = state['selectedImages'];
      const searchTerm = state['searchTerm'];
      const deckId = state['deckId'];
      const cardData = state['cardData']; // Extract the card data containing translation
      
      console.log('📱 Returned from image selection with:', selectedImages?.length, 'images for term:', searchTerm);
      console.log('📱 Card data from navigation:', cardData);
      
      if (selectedImages && selectedImages.length > 0 && searchTerm && deckId) {
        const translation = cardData?.translation || '';
        this.createPictureWordCardWithImages(searchTerm, selectedImages, deckId, translation);
        
        // Clear the state to prevent duplicate processing
        history.replaceState(null, '', window.location.href);
      }
    }
  }

  async initializeDecksPage() {
    console.log('DecksPage initialized');
    
    try {
      // Load real decks from storage
      const storedDecks = await this.storageService.getAllDecks();
      console.log('📚 Loaded decks from storage:', storedDecks);
      
      if (storedDecks && storedDecks.length > 0) {
        // Use real decks from storage
        this.decks = storedDecks;
        this.filteredDecks = [...storedDecks];
        
        // Update card counts for each deck
        for (const deck of this.filteredDecks) {
          const cards = await this.storageService.getCardsByDeck(deck.id);
          deck.cardCount = cards.length;
          console.log(`📚 Deck "${deck.name}" has ${cards.length} cards`);
        }
      } else {
        // Fallback to mock data if no decks exist
        console.log('📚 No decks found, creating default deck');
        const defaultDeck: Deck = {
          id: '1',
          name: 'Spanish Basics',
          description: 'Essential Spanish phrases for beginners',
          language: 'Spanish',
          cardCount: 0,
          createdAt: new Date(),
          masteredCards: 0,
          newCards: 0,
          reviewCards: 0,
          color: '#3880ff'
        };
        
        // Save the default deck to storage
        await this.storageService.saveDeck(defaultDeck);
        
        // Update card count for default deck
        const cards = await this.storageService.getCardsByDeck(defaultDeck.id);
        defaultDeck.cardCount = cards.length;
        
        this.decks = [defaultDeck];
        this.filteredDecks = [defaultDeck];
      }
      
      console.log('📚 Final filtered decks:', this.filteredDecks);
    } catch (error) {
      console.error('📚 Error loading decks:', error);
      // Fallback to empty array on error
      this.decks = [];
      this.filteredDecks = [];
    }
  }

  // Utility methods
  trackByDeckId(index: number, deck: any): string {
    return deck.id;
  }

  getDeckColor(deckId: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    let hash = 0;
    for (let i = 0; i < deckId.length; i++) {
      const char = deckId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  }

  onLanguageChange(event: any) {
    this.selectedLanguage = event.detail.value;
  }

  // Header button actions
  async refreshDecks() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.showToast('Decks refreshed successfully!');
    }, 1500);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  // Import functionality
  showImportOptions() {
    console.log('showImportOptions called');
    this.showImportModal = true;
  }

  closeImportModal() {
    this.showImportModal = false;
  }

  showUrlInput() {
    console.log('showUrlInput called');
    this.showImportModal = false;
    this.showUrlInputModal = true;
    this.importUrl = 'https://example.com/deck.json';
  }

  closeUrlInputModal() {
    this.showUrlInputModal = false;
    this.importUrl = '';
  }

  async importFromDevice() {
    console.log('importFromDevice called');
    this.showImportModal = false;
    await this.importDeck();
  }

  async executeUrlImport() {
    console.log('executeUrlImport called with URL:', this.importUrl);
    if (this.importUrl && this.importUrl.trim()) {
      const urlToImport = this.importUrl.trim();
      this.closeUrlInputModal();
      await this.downloadAndImportDeck(urlToImport);
    } else {
      console.log('No URL provided for import');
    }
  }

  async fetchDeckFromUrl(url: string) {
    try {
      this.isLoading = true;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const deckData = await response.json();
      
      // Validate deck structure
      if (!deckData.name || !Array.isArray(deckData.cards)) {
        throw new Error('Invalid deck format. Expected JSON with "name" and "cards" array.');
      }
      
      // Create new deck from imported data
      const newDeck = {
        id: Date.now().toString(),
        name: deckData.name,
        description: deckData.description || 'Imported deck',
        cardCount: deckData.cards.length,
        masteredCards: 0,
        language: deckData.language || this.selectedLanguage,
        cards: deckData.cards
      };
      
      this.filteredDecks.push(newDeck);
      this.isLoading = false;
      this.showToast(`Successfully imported "${newDeck.name}" with ${newDeck.cardCount} cards!`);
      
    } catch (error) {
      this.isLoading = false;
      // Use native alert for iOS compatibility
      alert(`Import Failed\n\nFailed to import deck: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Deck actions
  async startSession(deck: any) {
    console.log('Study button: Starting session for deckId:', deck.id);
    this.router.navigate(['/tabs/home'], { 
      queryParams: { deckId: deck.id }
    });
  }

  async editDeck(deck: any) {
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
          type: 'textarea',
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
          handler: (data) => {
            if (data.name && data.name.trim()) {
              deck.name = data.name.trim();
              deck.description = data.description || '';
              this.showToast('Deck updated successfully!');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async viewStats(deck: any) {
    const progress = deck.cardCount > 0 ? Math.round((deck.masteredCards / deck.cardCount) * 100) : 0;
    const alert = await this.alertController.create({
      header: 'Deck Statistics',
      message: `
        <strong>${deck.name}</strong><br><br>
        Total Cards: ${deck.cardCount}<br>
        Mastered: ${deck.masteredCards}<br>
        Remaining: ${deck.cardCount - deck.masteredCards}<br>
        Progress: ${progress}%
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async deleteDeck(deck: any) {
    const alert = await this.alertController.create({
      header: 'Delete Deck',
      message: `Are you sure you want to delete "${deck.name}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            const index = this.filteredDecks.indexOf(deck);
            if (index > -1) {
              this.filteredDecks.splice(index, 1);
              this.showToast('Deck deleted successfully!');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Action sheet button configurations
  deckActionSheetButtons = [
    {
      text: 'Study Deck',
      icon: 'play-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.startSession(this.selectedDeck);
        }
      }
    },
    {
      text: 'Edit Deck',
      icon: 'create-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.editDeck(this.selectedDeck);
        }
      }
    },
    {
      text: 'View Statistics',
      icon: 'stats-chart',
      handler: () => {
        if (this.selectedDeck) {
          this.viewStats(this.selectedDeck);
        }
      }
    },
    {
      text: 'Delete Deck',
      icon: 'trash-outline',
      role: 'destructive',
      handler: () => {
        if (this.selectedDeck) {
          this.deleteDeck(this.selectedDeck);
        }
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  addCardActionSheetButtons = [
    {
      text: 'Fill in the Blank',
      icon: 'create-outline',
      handler: () => {
        this.addCardType('fill-blank');
      }
    },
    {
      text: 'Picture Word',
      icon: 'add-outline',
      handler: () => {
        this.addCardType('picture');
      }
    },
    {
      text: 'Translate',
      icon: 'library-outline',
      handler: () => {
        this.addCardType('translate');
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  createDeckActionSheetButtons = [
    {
      text: 'Create New Deck',
      icon: 'add-outline',
      handler: () => {
        this.createDeck();
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  // Removed importActionSheetButtons - using custom modals instead

  // Action sheet control methods
  openDeckActionSheet(deck: any) {
    this.selectedDeck = deck;
    this.isDeckActionSheetOpen = true;
  }

  setDeckActionSheetOpen(isOpen: boolean) {
    this.isDeckActionSheetOpen = isOpen;
    if (!isOpen) {
      this.selectedDeck = null;
    }
  }

  openAddCardActionSheet(deck: any) {
    this.selectedDeck = deck;
    this.isAddCardActionSheetOpen = true;
  }

  setAddCardActionSheetOpen(isOpen: boolean) {
    this.isAddCardActionSheetOpen = isOpen;
    if (!isOpen) {
      this.selectedDeck = null;
    }
  }

  openCreateDeckActionSheet() {
    this.isCreateDeckActionSheetOpen = true;
  }

  setCreateDeckActionSheetOpen(isOpen: boolean) {
    this.isCreateDeckActionSheetOpen = isOpen;
  }

  setImportActionSheetOpen(isOpen: boolean) {
    this.isImportActionSheetOpen = isOpen;
  }

  // Additional methods for card management
  async addCardType(type: string) {
    console.log('addCardType called with type:', type);
    console.log('selectedDeck:', this.selectedDeck);
    
    if (!this.selectedDeck) {
      console.log('No deck selected for adding card');
      return;
    }

    console.log('Creating card of type:', type);
    if (type === 'fill-blank') {
      await this.createFillBlankCard(this.selectedDeck);
    } else if (type === 'picture') {
      await this.createPictureWordCard(this.selectedDeck);
    } else if (type === 'translate') {
      await this.createTranslateCard(this.selectedDeck);
    }
  }

  async createFillBlankCard(deck: any) {
    if (!this.selectedDeck) {
      console.log('No deck selected');
      return;
    }

    console.log('createFillBlankCard called for deck:', this.selectedDeck.name);
    
    // Use native prompts directly for iOS compatibility
    const sentence = prompt('Complete sentence (e.g., "El gato está en la mesa"):');
    if (sentence) {
      const missingWord = prompt('Missing word (e.g., "gato"):');
      if (missingWord) {
        const translation = prompt('English translation:');
        if (translation) {
          this.saveFillBlankCard(sentence, missingWord, translation);
        }
      }
    }
  }

  async createPictureWordCard(deck: any) {
    console.log('createPictureWordCard called for deck:', deck.name);
    
    // Use native prompts directly for iOS compatibility
    const word = prompt('Enter Spanish word (e.g., "árbol"):');
    if (word) {
      const translation = prompt('Enter English translation:');
      if (translation) {
        await this.openImageSelectionModal(deck, { word, translation });
      }
    }
  }

  async createTranslateCard(deck: any) {
    console.log('createTranslateCard called for deck:', deck.name);
    
    // Use native prompts directly for iOS compatibility
    const targetWord = prompt('Enter Spanish word (e.g., "casa"):');
    if (targetWord) {
      const englishWord = prompt('Enter English translation (e.g., "house"):');
      if (englishWord) {
        await this.saveTranslateCard(deck, { targetWord, englishWord });
      }
    }
  }

  async saveFillBlankCard(sentence: string, missingWord: string, translation: string) {
    if (!this.selectedDeck) return;
    
    const sentenceFront = sentence.replace(missingWord, '___');
    const sentenceBack = sentence.replace(missingWord, `**${missingWord}**`);
    
    const newCard = {
      id: `card_${Date.now()}`,
      deckId: this.selectedDeck.id,
      type: 'fill-blank' as CardType,
      sentenceFront,
      sentenceBack,
      missingWord: missingWord,
      englishTranslation: translation,
      imageUrls: [],
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    await this.storageService.saveCard(newCard);
    
    // Update deck card count
    this.selectedDeck.cardCount = (this.selectedDeck.cardCount || 0) + 1;
    this.showToast('Fill-in-the-blank card created successfully!');
    console.log('Fill-blank card saved:', newCard);
  }


  async openImageSelectionModal(deck: any, data: any) {
    console.log('Opening native image selection for:', data.word);

    try {
      // Fetch images
      console.log('Fetching images...');
      const images = await this.imageService.fetchImages(data.word, 12);
      console.log('Fetched', images.length, 'images for selection');

      // Navigate to image selection page
      console.log('📱 Navigating to image selection page for:', data.word);
      this.router.navigate(['/tabs/image-selection'], {
        state: {
          searchTerm: data.word,
          images: images,
          deckId: deck.id,
          cardData: data
        }
      });
    } catch (error) {
      console.error('Error fetching images:', error);
      // Fallback to creating card without images
      this.savePictureWordCard(deck, data, []);
    }
  }


  async createPictureWordCardWithImages(word: string, imageUrls: string[], deckId: string, translation: string = '') {
    try {
      const deck = this.decks.find(d => d.id === deckId);
      if (!deck) {
        console.error('Deck not found:', deckId);
        return;
      }

      const newCard = {
        id: `card_${Date.now()}`,
        deckId: deckId,
        type: 'picture-word' as CardType,
        spanishWord: word,
        englishTranslation: translation,
        imageUrls: imageUrls.slice(0, 4),
        showWordFirst: Math.random() > 0.5,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lastReviewed: new Date(),
        nextReview: new Date(),
        isNew: true,
        skipCount: 0
      };

      // Save card using storage service
      console.log('💾 Attempting to save card:', newCard);
      try {
        await this.storageService.saveCard(newCard);
        console.log('💾 Card saved successfully to storage');
        
        // Verify the card was saved by retrieving it
        const savedCards = await this.storageService.getCardsByDeck(deckId);
        console.log('💾 Verification - Cards in deck after save:', savedCards.length);
        
        // Update deck card count in UI
        const deckToUpdate = this.filteredDecks.find(d => d.id === deckId);
        if (deckToUpdate) {
          deckToUpdate.cardCount = savedCards.length;
          console.log(`📚 Updated deck "${deckToUpdate.name}" card count to ${savedCards.length}`);
        }
        
        this.showToast(`Picture Word card created with ${imageUrls.length} images!`);
        console.log('✅ Picture Word card created with', imageUrls.length, 'images:', word);
      } catch (saveError) {
        console.error('💾 Failed to save card:', saveError);
        this.showToast('Error saving card. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating picture word card with selected images:', error);
    }
  }

  async savePictureWordCard(deck: any, data: any, imageUrls: string[] = []) {
    const newCard = {
      id: `card_${Date.now()}`,
      deckId: deck.id,
      type: 'picture-word' as CardType,
      spanishWord: data.word,
      englishTranslation: data.translation,
      imageUrls: imageUrls,
      showWordFirst: Math.random() > 0.5,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    await this.storageService.saveCard(newCard);
    
    // Update deck card count
    deck.cardCount = (deck.cardCount || 0) + 1;
    this.showToast('Picture word card created successfully!');
  }

  async saveTranslateCard(deck: any, data: any) {
    const newCard = {
      id: `card_${Date.now()}`,
      deckId: deck.id,
      type: 'translate' as CardType,
      targetLanguageWord: data.targetWord,
      englishTranslation: data.englishWord,
      showTargetLanguageFirst: Math.random() < 0.5,
      imageUrls: [],
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    await this.storageService.saveCard(newCard);
    
    // Update deck card count
    deck.cardCount = (deck.cardCount || 0) + 1;
    this.showToast('Translation card created successfully!');
  }

  async createDeck() {
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
          type: 'textarea',
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
          handler: (data) => {
            if (data.name && data.name.trim()) {
              const newDeck = {
                id: Date.now().toString(),
                name: data.name.trim(),
                description: data.description || '',
                cardCount: 0,
                masteredCards: 0,
                language: this.selectedLanguage
              };
              this.filteredDecks.push(newDeck);
              this.showToast('Deck created successfully!');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Import a deck from a JSON file (simplified version)
   */
  async importDeck() {
    console.log('importDeck method called');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event: any) => {
      console.log('File input change event triggered');
      const file = event.target.files[0];
      if (!file) {
        console.log('No file selected');
        return;
      }
      console.log('File selected:', file.name, file.size, 'bytes');
      
      try {
        const text = await file.text();
        console.log('File content:', text.substring(0, 200) + '...');
        
        const importData = JSON.parse(text);
        console.log('Parsed import data:', importData);
        
        // Simple validation - check if we have either a direct name or deck object with name
        if (!importData.name && (!importData.deck || !importData.deck.name)) {
          console.error('Validation failed - importData:', importData);
          throw new Error('Invalid deck file format - missing deck name');
        }
        
        // Create simplified deck object
        const deckName = importData.name || importData.deck?.name || 'Imported Deck';
        const cardCount = importData.cards ? importData.cards.length : 0;
        
        console.log('Creating deck:', deckName, 'with', cardCount, 'cards');
        
        const newDeck = {
          id: Date.now().toString(),
          name: deckName,
          description: importData.description || importData.deck?.description || 'Imported deck',
          cardCount: cardCount,
          masteredCards: 0,
          language: importData.language || importData.deck?.language || this.selectedLanguage
        };
        
        console.log('New deck object:', newDeck);
        console.log('Current filteredDecks before push:', this.filteredDecks);
        
        this.filteredDecks.push(newDeck);
        
        console.log('Current filteredDecks after push:', this.filteredDecks);
        
        this.showToast(`Successfully imported "${deckName}" with ${cardCount} cards!`);
        
      } catch (error) {
        console.error('Import failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', errorMessage);
        this.showToast(`Import failed: ${errorMessage}`);
      }
    };
    
    console.log('About to trigger file input click');
    input.click();
    console.log('File input click triggered');
  }

  /**
   * Import from URL (simplified version)
   */
  async importFromUrl() {
    const alert = await this.alertController.create({
      header: 'Import from URL',
      message: 'Enter the URL to a deck JSON file:',
      inputs: [
        {
          name: 'url',
          type: 'url',
          placeholder: 'https://example.com/deck.json'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Import',
          handler: async (data) => {
            console.log('Import button clicked with data:', data);
            if (data.url && data.url.trim()) {
              console.log('Starting URL import for:', data.url.trim());
              await this.downloadAndImportDeck(data.url.trim());
            } else {
              console.log('No URL provided in alert data');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Download and import deck from URL (simplified version)
   */
  async downloadAndImportDeck(url: string) {
    console.log('downloadAndImportDeck called with URL:', url);
    
    // Skip loading controller on iOS - it causes the function to hang
    console.log('Skipping loading controller, proceeding directly to fetch...');

    try {
      console.log('Starting fetch request to:', url);
      const response = await fetch(url);
      console.log('Fetch response received:', response.status, response.statusText, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      console.log('Response OK, getting response text...');
      const responseText = await response.text();
      console.log('Response text received, length:', responseText.length);
      console.log('Response text preview:', responseText.substring(0, 200));
      
      console.log('Parsing JSON...');
      const importData = JSON.parse(responseText);
      console.log('JSON parsed successfully:', importData);
      
      // Simple validation - check if we have either a direct name or deck object with name
      if (!importData.name && (!importData.deck || !importData.deck.name)) {
        console.log('Validation failed - no deck name found');
        throw new Error('Invalid deck format - missing deck name');
      }

      console.log('Validation passed, creating deck object...');

      // Create simplified deck object
      const deckName = importData.name || importData.deck?.name || 'Imported Deck';
      const cardCount = importData.cards ? importData.cards.length : 0;
      
      const newDeck = {
        id: Date.now().toString(),
        name: deckName,
        description: importData.description || importData.deck?.description || 'Imported deck',
        cardCount: cardCount,
        masteredCards: 0,
        language: importData.language || importData.deck?.language || this.selectedLanguage
      };
      
      console.log('Adding new deck to filteredDecks:', newDeck);
      console.log('Current filteredDecks before:', this.filteredDecks);
      
      this.filteredDecks.push(newDeck);
      
      console.log('Current filteredDecks after:', this.filteredDecks);
      
      this.showToast(`Successfully imported "${deckName}" with ${cardCount} cards!`);

    } catch (error) {
      console.error('URL import failed:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      const alert = await this.alertController.create({
        header: 'Import Failed',
        message: `Failed to download or parse deck from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }
  
    /**
     * Navigate to card management page for the deck
     */
    async navigateToCardManagement(deck: Deck) {
      console.log('Navigating to card management for deck:', deck.name);
      this.router.navigate(['/tabs/card-management', deck.id]);
    }

    /**
     * Create sample cards for the mock deck so Study button works
     */
    async createSampleCardsForMockDeck() {
      const now = new Date();
      const sampleCards = [
        {
          id: 'card1',
          deckId: '1',
          type: 'fill-blank' as CardType,
          sentenceFront: 'Hola, ¿cómo ___?',
          sentenceBack: 'Hola, ¿cómo **estás**?',
          missingWord: 'estás',
          englishTranslation: 'Hello, how are you?',
          imageUrls: [],
          isNew: true,
          repetitions: 0,
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: now,
          skipCount: 0,
          nextReview: now
        },
        {
          id: 'card2',
          deckId: '1',
          type: 'fill-blank' as CardType,
          sentenceFront: 'Me ___ Juan.',
          sentenceBack: 'Me **llamo** Juan.',
          missingWord: 'llamo',
          englishTranslation: 'My name is Juan.',
          imageUrls: [],
          isNew: true,
          repetitions: 0,
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: now,
          skipCount: 0,
          nextReview: now
        },
        {
          id: 'card3',
          deckId: '1',
          type: 'fill-blank' as CardType,
          sentenceFront: '¿Dónde ___ el baño?',
          sentenceBack: '¿Dónde **está** el baño?',
          missingWord: 'está',
          englishTranslation: 'Where is the bathroom?',
          imageUrls: [],
          isNew: true,
          repetitions: 0,
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: now,
          skipCount: 0,
          nextReview: now
        }
      ];

      // Store the sample cards using the correct StorageService methods
      for (const card of sampleCards) {
        await this.storageService.saveCard(card);
      }
      
      console.log('Created sample cards for mock deck');
    }
}
