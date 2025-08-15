import { Component, OnInit, NgZone } from '@angular/core';
import { IonicModule, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { addIcons } from 'ionicons';
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
  filteredDecks: any[] = [
    {
      id: '1',
      name: 'Spanish Basics',
      description: 'Essential Spanish phrases for beginners',
      cardCount: 25,
      masteredCards: 0,
      language: 'es-ES'
    }
  ];
  
  selectedLanguage = 'es-ES';
  isLoading = false;
  
  // Action sheet states
  isDeckActionSheetOpen = false;
  isAddCardActionSheetOpen = false;
  isCreateDeckActionSheetOpen = false;
  isImportActionSheetOpen = false;
  
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
    private storageService: StorageService
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

  ngOnInit() {
    console.log('DecksPage initialized');
    console.log('Filtered decks:', this.filteredDecks);
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
    // Use native confirm dialog for iOS compatibility
    const choice = confirm('Import Deck\n\nChoose import method:\n\nOK = Import from URL\nCancel = Import from Device');
    if (choice) {
      this.importFromUrl();
    } else {
      this.importDeck();
    }
  }

  async importDeck() {
    // Use native alert for iOS compatibility
    alert('Import from Device\n\nImport from device feature coming soon!');
  }

  async importFromUrl() {
    console.log('importFromUrl called');
    // Use native prompt for iOS compatibility
    const url = prompt('Import from URL\n\nEnter the URL of the deck JSON file:', 'https://example.com/deck.json');
    console.log('URL entered:', url);
    if (url && url.trim()) {
      await this.fetchDeckFromUrl(url.trim());
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

  importActionSheetButtons = [
    {
      text: 'Import from Device',
      icon: 'cloud-upload-outline',
      handler: () => {
        console.log('Import from Device button clicked');
        this.importDeck();
      }
    },
    {
      text: 'Import from URL',
      icon: 'download-outline',
      handler: () => {
        console.log('Import from URL button clicked');
        this.importFromUrl();
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

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
  addCardType(type: string) {
    const alert = this.alertController.create({
      header: 'Add Card',
      message: `${type} card creation feature coming soon!`,
      buttons: ['OK']
    });
    alert.then(a => a.present());
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
}
