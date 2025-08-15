import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonActionSheet, IonButton } from '@ionic/angular/standalone';
import {
  IonAvatar,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

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
  downloadOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-test',
  templateUrl: 'test.page.html',
  styleUrls: ['test.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonAvatar,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    IonActionSheet,
    IonButton
  ],
})
export class TestPage implements OnInit {
  // Decks data - expanded for full functionality
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
  isDeckActionSheetOpen: boolean = false;
  isAddCardActionSheetOpen: boolean = false;
  isCreateDeckActionSheetOpen: boolean = false;
  isImportActionSheetOpen: boolean = false;
  
  // Selected deck for actions
  selectedDeck: any = null;
  
  languages = [
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' }
  ];

  constructor(private router: Router, private ngZone: NgZone) {
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
      downloadOutline
    });
  }

  ngOnInit() {
    // Initialize any startup logic here
  }
  
  // Action sheet button configurations
  public deckActionSheetButtons = [
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
      text: 'Add Cards',
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
          this.manageCards(this.selectedDeck);
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
      text: 'Edit Deck',
      icon: 'create-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.editDeck(this.selectedDeck);
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

  // Deck action methods
  openDeckActionSheet(deck: any) {
    this.selectedDeck = deck;
    this.isDeckActionSheetOpen = true;
  }
  
  startSession(deck: any) {
    console.log('Starting session for:', deck.name);
    // Navigate to study session
    this.router.navigate(['/tabs/home'], { 
      queryParams: { deckId: deck.id, startSession: true } 
    });
  }
  
  manageCards(deck: any) {
    console.log('Managing cards for:', deck.name);
    this.router.navigate(['/tabs/card-management', deck.id]);
  }
  
  viewStats(deck: any) {
    console.log('Viewing stats for:', deck.name);
    // Show stats in alert or navigate to stats page
    alert(`Stats for ${deck.name}:\nCards: ${deck.cardCount}\nMastered: ${deck.masteredCards}`);
  }
  
  exportDeck(deck: any) {
    console.log('Exporting deck:', deck.name);
    // Implement deck export functionality
    alert(`Exporting ${deck.name}...`);
  }
  
  editDeck(deck: any) {
    console.log('Editing deck:', deck.name);
    // Show edit modal
    alert(`Edit functionality for ${deck.name} - to be implemented`);
  }
  
  deleteDeck(deck: any) {
    console.log('Deleting deck:', deck.name);
    // Show confirmation and delete
    if (confirm(`Are you sure you want to delete "${deck.name}"?`)) {
      this.filteredDecks = this.filteredDecks.filter(d => d.id !== deck.id);
      alert(`${deck.name} has been deleted.`);
    }
  }
  
  openAddCardActionSheet(deck: any) {
    this.selectedDeck = deck;
    this.isAddCardActionSheetOpen = true;
  }

  // Add Card Action Sheet buttons
  public addCardActionSheetButtons = [
    {
      text: 'Create New Card',
      icon: 'create-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.createNewCard(this.selectedDeck);
        }
      }
    },
    {
      text: 'Import from File',
      icon: 'cloud-upload-outline',
      handler: () => {
        if (this.selectedDeck) {
          this.importCards(this.selectedDeck);
        }
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  // Create Deck Action Sheet buttons
  public createDeckActionSheetButtons = [
    {
      text: 'Create Empty Deck',
      icon: 'add-outline',
      handler: () => {
        this.createEmptyDeck();
      }
    },
    {
      text: 'Import Deck',
      icon: 'download-outline',
      handler: () => {
        this.openImportActionSheet();
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  // Import Action Sheet buttons
  public importActionSheetButtons = [
    {
      text: 'Import from File',
      icon: 'cloud-upload-outline',
      handler: () => {
        this.importFromFile();
      }
    },
    {
      text: 'Import from URL',
      icon: 'download-outline',
      handler: () => {
        this.importFromUrl();
      }
    },
    {
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel'
    }
  ];

  // Additional methods
  createNewCard(deck: any) {
    console.log('Creating new card for:', deck.name);
    alert(`Create new card for ${deck.name} - to be implemented`);
  }

  importCards(deck: any) {
    console.log('Importing cards for:', deck.name);
    alert(`Import cards for ${deck.name} - to be implemented`);
  }

  createEmptyDeck() {
    console.log('Creating empty deck');
    const deckName = prompt('Enter deck name:');
    if (deckName) {
      const newDeck = {
        id: Date.now().toString(),
        name: deckName,
        description: 'New deck',
        cardCount: 0,
        masteredCards: 0,
        language: this.selectedLanguage
      };
      this.filteredDecks.push(newDeck);
      alert(`Created deck: ${deckName}`);
    }
  }

  openImportActionSheet() {
    this.isImportActionSheetOpen = true;
  }

  importFromFile() {
    console.log('Importing from file');
    alert('Import from file - to be implemented');
  }

  importFromUrl() {
    console.log('Importing from URL');
    alert('Import from URL - to be implemented');
  }

  openCreateDeckActionSheet() {
    this.isCreateDeckActionSheetOpen = true;
  }

  // Header action methods
  refreshDecks() {
    console.log('Refreshing decks');
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      alert('Decks refreshed!');
    }, 1000);
  }

  // Language filter method
  filterByLanguage(language: string) {
    this.selectedLanguage = language;
    console.log('Filtering by language:', language);
    // In a real app, this would filter the decks array
  }

  // Additional action sheet state
  isAddCardOpen = false;
  
  setAddCardOpen(isOpen: boolean) {
    this.isAddCardOpen = isOpen;
  }

}
