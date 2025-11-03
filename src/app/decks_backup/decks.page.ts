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
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
  // Edit Deck modal state
  showEditDeckModal = false;
  editDeckName = '';
  editDeckDescription = '';
  // Prevent selectedDeck from being cleared by action sheet dismissal while editing
  private lockSelectedDeck = false;
  
  // Action sheet states
  isDeckActionSheetOpen = false;
  isAddCardActionSheetOpen = false;
  isCreateDeckActionSheetOpen = false;
  isImportActionSheetOpen = false;
  
  // Custom modal states
  showImportModal = false;
  showUrlInputModal = false;
  importUrl = '';
  showStatsModal = false;
  // Delete Deck modal
  showDeleteDeckModal = false;
  deckToDelete: any = null;
  // Create Deck modal
  showCreateDeckModal = false;
  newDeckName = '';
  newDeckDescription = '';
  statsDeckName = '';
  statsTotal = 0;
  statsMastered = 0;
  statsRemaining = 0;
  statsProgress = 0;
  
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

  async ionViewWillEnter() {
    console.log('📱 DecksPage ionViewWillEnter - reloading deck counts');
    
    // Reload the selected language from settings
    await this.loadSelectedLanguage();
    
    // Reload card counts for all decks to ensure UI is up to date
    for (const deck of this.filteredDecks) {
      const cards = await this.storageService.getCardsByDeck(deck.id);
      deck.cardCount = cards.length;
      console.log(`📚 Refreshed deck "${deck.name}" - ${cards.length} cards`);
    }
    
    // Trigger change detection by creating new array reference
    this.filteredDecks = [...this.filteredDecks];
    
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

  async loadSelectedLanguage() {
    // Load the ttsLanguage setting from storage
    const ttsLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
    console.log('📚 Loaded ttsLanguage from settings:', ttsLanguage);
    
    // Only update if language changed
    if (this.selectedLanguage !== ttsLanguage) {
      this.selectedLanguage = ttsLanguage;
      console.log('📚 Language changed to:', this.selectedLanguage);
      
      // Reload decks from storage and filter by language
      await this.loadAndFilterDecks();
    }
  }

  async loadAndFilterDecks() {
    try {
      // Load all decks from storage
      const storedDecks = await this.storageService.getAllDecks();
      console.log('📚 Loaded all decks from storage:', storedDecks);
      
      this.decks = storedDecks || [];
      
      // Filter decks by selected language
      this.filteredDecks = this.decks.filter(deck => {
        // Map language codes to language names
        const languageMap: { [key: string]: string } = {
          'es-ES': 'Spanish',
          'fr-FR': 'French',
          'de-DE': 'German',
          'pt-PT': 'Portuguese',
          'it-IT': 'Italian',
          'en-US': 'English'
        };
        
        const languageName = languageMap[this.selectedLanguage];
        console.log(`📚 Checking deck "${deck.name}" with language "${deck.language}" against selected "${languageName}"`);
        
        return deck.language === languageName;
      });
      
      console.log('📚 Filtered decks for language', this.selectedLanguage, ':', this.filteredDecks);
      
      // Update card counts for filtered decks
      for (const deck of this.filteredDecks) {
        const cards = await this.storageService.getCardsByDeck(deck.id);
        deck.cardCount = cards.length;
      }
    } catch (error) {
      console.error('📚 Error loading and filtering decks:', error);
      this.decks = [];
      this.filteredDecks = [];
    }
  }

  async initializeDecksPage() {
    console.log('DecksPage initialized');
    
    try {
      // Load the selected language first
      await this.loadSelectedLanguage();
      
      // Load real decks from storage
      const storedDecks = await this.storageService.getAllDecks();
      console.log('📚 Loaded decks from storage:', storedDecks);
      
      if (storedDecks && storedDecks.length > 0) {
        // Use real decks from storage and filter by language
        this.decks = storedDecks;
        await this.loadAndFilterDecks();
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
        // Filter the default deck by language
        await this.loadAndFilterDecks();
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

  async getShowWordFirstSetting(): Promise<boolean> {
    const setting = await this.storageService.getSetting('pictureWordDisplay', 'images-first');
    if (setting === 'word-first') {
      return true;
    } else if (setting === 'images-first') {
      return false;
    } else {
      // random
      return Math.random() > 0.5;
    }
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
    console.log('🔄 Refreshing decks and card counts...');
    
    try {
      // Reload card counts for all decks
      for (const deck of this.filteredDecks) {
        const cards = await this.storageService.getCardsByDeck(deck.id);
        deck.cardCount = cards.length;
        console.log(`🔄 Deck "${deck.name}" - ${cards.length} cards`);
      }
      
      // Trigger change detection
      this.filteredDecks = [...this.filteredDecks];
      
      this.showToast('Decks refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing decks:', error);
      this.showToast('Error refreshing decks');
    } finally {
      this.isLoading = false;
    }
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
  }

  closeUrlInputModal() {
    this.showUrlInputModal = false;
    this.importUrl = '';
  }

  async importFromDevice() {
    console.log('importFromDevice called');
    this.showImportModal = false;
    
    // Show warning alert
    const alert = await this.alertController.create({
      header: 'Warning',
      message: 'Importing will replace all existing decks for the current language. Do you want to continue?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Import cancelled by user');
          }
        },
        {
          text: 'Continue',
          handler: async () => {
            await this.importDeck();
          }
        }
      ]
    });
    
    await alert.present();
  }

  async executeUrlImport() {
    console.log('executeUrlImport called with URL:', this.importUrl);
    if (this.importUrl && this.importUrl.trim()) {
      const urlToImport = this.importUrl.trim();
      this.closeUrlInputModal();
      
      // Show warning alert
      const alert = await this.alertController.create({
        header: 'Warning',
        message: 'Importing will replace all existing decks for the current language. Do you want to continue?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Import cancelled by user');
            }
          },
          {
            text: 'Continue',
            handler: async () => {
              await this.downloadAndImportDeck(urlToImport);
            }
          }
        ]
      });
      
      await alert.present();
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
    this.router.navigate(['/tabs/flashcards'], { 
      queryParams: { deckId: deck.id }
    });
  }

  async editDeck(deck: any) {
    // Open custom modal instead of alert
    // Ensure action sheet is closed so it doesn't block interactions under iOS
    this.lockSelectedDeck = true; // keep selection through action sheet dismissal
    this.isDeckActionSheetOpen = false;
    this.selectedDeck = deck;
    this.editDeckName = deck?.name || '';
    this.editDeckDescription = deck?.description || '';
    this.showEditDeckModal = true;
  }

  closeEditDeckModal() {
    this.showEditDeckModal = false;
    this.lockSelectedDeck = false;
  }

  async saveEditedDeck() {
    console.log('📝 saveEditedDeck clicked');
    if (!this.selectedDeck) {
      console.warn('No selectedDeck when saving');
      return;
    }
    const name = (this.editDeckName || '').trim();
    if (!name) {
      this.showToast('Please enter a deck name');
      return;
    }
    // Apply changes
    this.selectedDeck.name = name;
    this.selectedDeck.description = this.editDeckDescription || '';

    // Persist (best-effort)
    try {
      await this.storageService.saveDeck(this.selectedDeck);
    } catch (e) {
      console.warn('saveDeck failed (non-fatal for UI):', e);
    }

    // Trigger UI change detection by rebinding array
    const idx = this.filteredDecks.findIndex((d: any) => d.id === this.selectedDeck.id);
    if (idx > -1) {
      // Replace with a shallow clone to update reference
      this.filteredDecks[idx] = { ...this.selectedDeck };
      this.filteredDecks = [...this.filteredDecks];
    }

    this.showToast('Deck updated successfully!');
    this.showEditDeckModal = false;
    this.lockSelectedDeck = false;
  }

  async exportDeck(deck: Deck) {
    try {
      console.log('Exporting deck:', deck.name);

      // Get all cards for this deck
      const cards = await this.storageService.getCardsByDeck(deck.id);

      // Create export data structure matching original implementation
      const exportData = {
        deck: {
          name: deck.name,
          description: deck.description,
          language: (deck as any).language || this.selectedLanguage,
          color: (deck as any).color,
          createdAt: deck.createdAt
        },
        cards: cards,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const safeName = deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const datePart = new Date().toISOString().split('T')[0];
      const fileName = `deck-${safeName}-${datePart}.json`;

      if (Capacitor.getPlatform() === 'web') {
        // Web: trigger anchor download
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Native (iOS/Android): write file and present share sheet
        await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        // Get a URI suitable for sharing
        const uriResult = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });

        // Present share sheet using files array (recommended for iOS local files)
        await Share.share({
          title: 'Export Deck',
          text: `Deck: ${deck.name}`,
          files: [uriResult.uri],
          dialogTitle: 'Share deck JSON'
        });
      }

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

  async viewStats(deck: any) {
    if (!deck) return;
    const total = deck.cardCount || 0;
    const mastered = deck.masteredCards || 0;
    const remaining = Math.max(total - mastered, 0);
    const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;

    // Populate modal fields
    this.statsDeckName = deck.name;
    this.statsTotal = total;
    this.statsMastered = mastered;
    this.statsRemaining = remaining;
    this.statsProgress = progress;

    // Close any action sheet under iOS and show modal
    this.isDeckActionSheetOpen = false;
    this.showStatsModal = true;
  }

  closeStatsModal() {
    this.showStatsModal = false;
  }

  async deleteDeck(deck: any) {
    // Close action sheet first to avoid iOS presentation conflicts
    this.isDeckActionSheetOpen = false;
    this.deckToDelete = deck;
    // Defer opening custom modal so it isn't stacked under the sheet
    setTimeout(() => {
      this.showDeleteDeckModal = true;
    }, 250);
  }

  closeDeleteDeckModal() {
    this.showDeleteDeckModal = false;
    this.deckToDelete = null;
  }

  async confirmDeleteDeck() {
    if (!this.deckToDelete) {
      this.closeDeleteDeckModal();
      return;
    }
    const deck = this.deckToDelete;
    try {
      // Persist deletion (also removes cards for this deck)
      await this.storageService.deleteDeck(deck.id);

      // Update UI arrays (reassign to trigger change detection)
      this.decks = this.decks.filter((d: any) => d.id !== deck.id);
      this.filteredDecks = this.filteredDecks.filter((d: any) => d.id !== deck.id);

      // Clear selection
      if (this.selectedDeck && this.selectedDeck.id === deck.id) {
        this.selectedDeck = null;
      }

      this.showToast('Deck deleted successfully!');
    } catch (e) {
      console.error('Failed to delete deck:', e);
      this.showToast('Failed to delete deck. Please try again.');
    } finally {
      this.closeDeleteDeckModal();
    }
  }

  // Create Deck - Custom Modal version
  openCreateDeckModal() {
    console.log('📦 Opening Create Deck modal');
    this.newDeckName = '';
    this.newDeckDescription = '';
    this.showCreateDeckModal = true;
  }

  closeCreateDeckModal() {
    this.showCreateDeckModal = false;
  }

  async saveNewDeck() {
    const name = (this.newDeckName || '').trim();
    if (!name) {
      this.showToast('Please enter a deck name');
      return;
    }

    const id = Date.now().toString();
    
    // Map language code to language name
    const languageMap: { [key: string]: string } = {
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'pt-PT': 'Portuguese',
      'it-IT': 'Italian',
      'en-US': 'English'
    };
    
    const languageName = languageMap[this.selectedLanguage] || 'Spanish';
    
    const newDeck: any = {
      id,
      name,
      description: this.newDeckDescription || '',
      language: languageName,
      cardCount: 0,
      masteredCards: 0,
      createdAt: new Date(),
      color: this.getDeckColor(id)
    };

    try {
      await this.storageService.saveDeck(newDeck);
    } catch (e) {
      console.warn('saveDeck failed (non-fatal):', e);
    }

    this.decks = [...this.decks, newDeck];
    // Only add to filteredDecks if it matches the current language
    if (newDeck.language === languageName) {
      this.filteredDecks = [...this.filteredDecks, newDeck];
    }
    this.showCreateDeckModal = false;
    this.showToast('Deck created successfully!');
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
      text: 'Add Card',
      icon: 'add-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.openAddCardActionSheet(this.selectedDeck);
        }
      }
    },
    {
      text: 'Manage Cards',
      icon: 'library-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.navigateToCardManagement(this.selectedDeck);
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
      text: 'Export Deck',
      icon: 'download-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.exportDeck(this.selectedDeck);
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
        // Close sheet and defer to avoid presenting over action sheet on iOS
        console.log('🟢 Create New Deck action tapped');
        this.isCreateDeckActionSheetOpen = false;
        setTimeout(() => this.ngZone.run(() => this.openCreateDeckModal()), 400);
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
      // Only clear when we're not in an operation that needs the selection
      if (!this.lockSelectedDeck) {
        this.selectedDeck = null;
      }
    }
  }

  openAddCardActionSheet(deck: any) {
    this.lockSelectedDeck = true; // Lock selection during card creation
    this.selectedDeck = deck;
    this.isAddCardActionSheetOpen = true;
  }

  setAddCardActionSheetOpen(isOpen: boolean) {
    this.isAddCardActionSheetOpen = isOpen;
    if (!isOpen && !this.lockSelectedDeck) {
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
      this.lockSelectedDeck = false; // Unlock if failed
      return;
    }

    console.log('Creating card of type:', type);
    try {
      if (type === 'fill-blank') {
        await this.createFillBlankCard(this.selectedDeck);
      } else if (type === 'picture') {
        await this.createPictureWordCard(this.selectedDeck);
      } else if (type === 'translate') {
        await this.createTranslateCard(this.selectedDeck);
      }
    } finally {
      // Always unlock after operation completes
      this.lockSelectedDeck = false;
      this.selectedDeck = null;
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
          await this.saveFillBlankCard(sentence, missingWord, translation);
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
    if (!this.selectedDeck) {
      console.error('❌ No selectedDeck when trying to save fill-blank card');
      return;
    }
    
    console.log('📝 Creating fill-blank card for deck:', this.selectedDeck.name, 'ID:', this.selectedDeck.id);
    
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

    console.log('💾 Attempting to save fill-blank card:', newCard);
    console.log('💾 Card will be saved to deckId:', newCard.deckId);
    
    try {
      await this.storageService.saveCard(newCard);
      console.log('💾 Fill-blank card saved successfully to storage');
      
      // Verify the card was saved by retrieving actual count from storage
      const savedCards = await this.storageService.getCardsByDeck(this.selectedDeck.id);
      console.log('💾 Verification - Cards in deck after save:', savedCards.length);
      console.log('💾 All cards in deck:', savedCards.map(c => ({ id: c.id, type: c.type })));
      
      // Update deck card count in UI by finding and updating the deck in filteredDecks
      console.log('📚 Looking for deck in filteredDecks. Current filteredDecks:', this.filteredDecks.map(d => ({ id: d.id, name: d.name, count: d.cardCount })));
      const deckToUpdate = this.filteredDecks.find(d => d.id === this.selectedDeck.id);
      if (deckToUpdate) {
        const oldCount = deckToUpdate.cardCount;
        deckToUpdate.cardCount = savedCards.length;
        console.log(`📚 Updated deck "${deckToUpdate.name}" card count from ${oldCount} to ${savedCards.length}`);
        
        // Force change detection by creating new array reference
        this.filteredDecks = [...this.filteredDecks];
        console.log('📚 Triggered change detection with new array reference');
      } else {
        console.error('❌ Could not find deck in filteredDecks with ID:', this.selectedDeck.id);
      }
      
      this.showToast('Fill-in-the-blank card created successfully!');
      console.log('✅ Fill-blank card saved:', newCard);
    } catch (saveError) {
      console.error('💾 Failed to save fill-blank card:', saveError);
      this.showToast('Error saving card. Please try again.');
    }
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

      const showWordFirst = await this.getShowWordFirstSetting();
      
      const newCard = {
        id: `card_${Date.now()}`,
        deckId: deckId,
        type: 'picture-word' as CardType,
        spanishWord: word,
        englishTranslation: translation,
        imageUrls: imageUrls.slice(0, 4),
        showWordFirst: showWordFirst,
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
    const showWordFirst = await this.getShowWordFirstSetting();
    
    const newCard = {
      id: `card_${Date.now()}`,
      deckId: deck.id,
      type: 'picture-word' as CardType,
      spanishWord: data.word,
      englishTranslation: data.translation,
      imageUrls: imageUrls,
      showWordFirst: showWordFirst,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      lastReviewed: new Date(),
      nextReview: new Date(),
      isNew: true,
      skipCount: 0
    };

    console.log('💾 Attempting to save picture-word card:', newCard);
    try {
      await this.storageService.saveCard(newCard);
      console.log('💾 Picture-word card saved successfully to storage');
      
      // Verify the card was saved by retrieving actual count from storage
      const savedCards = await this.storageService.getCardsByDeck(deck.id);
      console.log('💾 Verification - Cards in deck after save:', savedCards.length);
      
      // Update deck card count in UI by finding and updating the deck in filteredDecks
      const deckToUpdate = this.filteredDecks.find(d => d.id === deck.id);
      if (deckToUpdate) {
        deckToUpdate.cardCount = savedCards.length;
        console.log(`📚 Updated deck "${deckToUpdate.name}" card count to ${savedCards.length}`);
      }
      
      this.showToast('Picture word card created successfully!');
      console.log('✅ Picture-word card saved:', newCard);
    } catch (saveError) {
      console.error('💾 Failed to save picture-word card:', saveError);
      this.showToast('Error saving card. Please try again.');
    }
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

    console.log('💾 Attempting to save translate card:', newCard);
    try {
      await this.storageService.saveCard(newCard);
      console.log('💾 Translate card saved successfully to storage');
      
      // Verify the card was saved by retrieving actual count from storage
      const savedCards = await this.storageService.getCardsByDeck(deck.id);
      console.log('💾 Verification - Cards in deck after save:', savedCards.length);
      
      // Update deck card count in UI by finding and updating the deck in filteredDecks
      const deckToUpdate = this.filteredDecks.find(d => d.id === deck.id);
      if (deckToUpdate) {
        deckToUpdate.cardCount = savedCards.length;
        console.log(`📚 Updated deck "${deckToUpdate.name}" card count to ${savedCards.length}`);
      }
      
      this.showToast('Translation card created successfully!');
      console.log('✅ Translate card saved:', newCard);
    } catch (saveError) {
      console.error('💾 Failed to save translate card:', saveError);
      this.showToast('Error saving card. Please try again.');
    }
  }

  async createDeck() {
    console.log('➕ createDeck invoked');
    // Ensure the create deck action sheet is closed (iOS layering issue)
    this.isCreateDeckActionSheetOpen = false;

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
          handler: async (data) => {
            const name = (data.name || '').trim();
            if (!name) return;

            const id = Date.now().toString();
            const newDeck: any = {
              id,
              name,
              description: data.description || '',
              language: this.selectedLanguage,
              cardCount: 0,
              masteredCards: 0,
              createdAt: new Date(),
              color: this.getDeckColor(id)
            };

            try {
              await this.storageService.saveDeck(newDeck);
            } catch (e) {
              console.warn('saveDeck failed (non-fatal):', e);
            }

            // Update UI arrays with new references to trigger change detection
            this.decks = [...this.decks, newDeck];
            this.filteredDecks = [...this.filteredDecks, newDeck];
            this.showToast('Deck created successfully!');
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
          placeholder: 'https://example.com/deck.json',
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
