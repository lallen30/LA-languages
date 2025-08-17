import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonSpinner, IonItem, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle, imageOutline, search } from 'ionicons/icons';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-image-selection',
  templateUrl: './image-selection.page.html',
  styleUrls: ['./image-selection.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonSpinner, IonItem, IonInput, CommonModule, FormsModule]
})
export class ImageSelectionPage implements OnInit {
  searchTerm: string = '';
  images: any[] = [];
  selectedImages: string[] = [];
  loading: boolean = false;
  isSearching: boolean = false;
  searchTimeout: any;
  maxSelection: number = 4;

  constructor(private router: Router, private imageService: ImageService) {
    addIcons({ arrowBack, checkmarkCircle, imageOutline, search });
  }

  deckId: string = '';
  cardData: any = null;

  ngOnInit() {
    // Clear previous selections and images
    this.selectedImages = [];
    this.images = [];
    
    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.searchTerm = navigation.extras.state['searchTerm'] || '';
      this.images = navigation.extras.state['images'] || [];
      this.deckId = navigation.extras.state['deckId'] || '';
      this.cardData = navigation.extras.state['cardData'] || null;
      console.log('📱 Image selection page loaded with:', this.searchTerm, this.images.length, 'images');
    }
  }

  selectImage(imageUrl: string) {
    console.log('📱 selectImage called with:', imageUrl);
    console.log('📱 Current selectedImages before:', this.selectedImages);
    
    const index = this.selectedImages.indexOf(imageUrl);
    
    if (index > -1) {
      // Remove if already selected
      this.selectedImages.splice(index, 1);
      console.log('📱 Deselected image:', imageUrl);
    } else if (this.selectedImages.length < this.maxSelection) {
      // Add if not at max selection
      this.selectedImages.push(imageUrl);
      console.log('📱 Selected image:', imageUrl);
    } else {
      console.log('📱 Maximum selection reached:', this.maxSelection);
    }
    
    console.log('📱 Currently selected:', this.selectedImages.length, 'images:', this.selectedImages);
  }

  isImageSelected(imageUrl: string): boolean {
    return this.selectedImages.includes(imageUrl);
  }

  canSelectMore(): boolean {
    return this.selectedImages.length < this.maxSelection;
  }

  confirm() {
    try {
      if (this.selectedImages.length > 0) {
        console.log('📱 Confirming image selection:', this.selectedImages.length, 'images');
        console.log('📱 Current properties:', {
          searchTerm: this.searchTerm,
          deckId: this.deckId,
          cardData: this.cardData,
          selectedImagesCount: this.selectedImages.length
        });
        
        const navigationState = {
          selectedImages: this.selectedImages,
          searchTerm: this.searchTerm,
          deckId: this.deckId || '1', // Default to deck 1 if missing
          action: 'createPictureWordCard'
        };
        
        console.log('📱 Navigation state:', navigationState);
        
        // Navigate back with selected images and card creation data
        this.router.navigate(['/tabs/decks_backup'], {
          state: navigationState
        }).then(success => {
          console.log('📱 Navigation success:', success);
        }).catch(error => {
          console.error('📱 Navigation error:', error);
        });
      } else {
        console.log('📱 No images selected, cannot confirm');
      }
    } catch (error) {
      console.error('📱 Error in confirm method:', error);
    }
  }

  cancel() {
    console.log('📱 Cancelling image selection');
    this.router.navigate(['/tabs/decks_backup']);
  }

  onSearchChange() {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search to avoid too many API calls
    this.searchTimeout = setTimeout(async () => {
      await this.performSearch();
    }, 500);
  }

  async performSearch() {
    if (!this.searchTerm.trim()) {
      this.images = [];
      return;
    }

    console.log('🔍 Searching for images with term:', this.searchTerm);
    this.isSearching = true;
    
    try {
      const searchResults = await this.imageService.fetchImages(this.searchTerm.trim(), 12);
      this.images = searchResults;
      console.log('🔍 Found', this.images.length, 'images for:', this.searchTerm);
      console.log('🔍 First few image URLs:', this.images.slice(0, 3));
      
      // Clear selected images that are not in the new results
      this.selectedImages = this.selectedImages.filter(selected => 
        this.images.includes(selected)
      );
    } catch (error) {
      console.error('Error searching for images:', error);
      this.images = [];
    } finally {
      this.isSearching = false;
    }
  }
}
