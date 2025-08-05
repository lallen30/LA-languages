import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ImageService } from '../../services/image.service';

// Add Math to global scope for template
declare global {
  interface Window {
    Math: typeof Math;
  }
}

// Make Math available in template
(window as any).Math = Math;

@Component({
  selector: 'app-image-selection-modal',
  templateUrl: './image-selection-modal.component.html',
  styleUrls: ['./image-selection-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ImageSelectionModalComponent implements OnInit {
  @Input() images: string[] = [];
  @Input() word: string = '';
  @Input() maxSelection: number = 6;
  
  selectedImages: string[] = [];
  searchTerm: string = '';
  displayedImages: string[] = [];
  isSearching: boolean = false;
  isLoadingMore: boolean = false;
  searchTimeout: any;

  constructor(
    private modalController: ModalController,
    private imageService: ImageService
  ) {}

  ngOnInit() {
    // Initialize search term with the word and fetch fresh images
    console.log(`=== IMAGE MODAL DEBUG ===`);
    console.log(`Modal initialized with word parameter: "${this.word}"`);
    console.log(`Modal received ${this.images.length} pre-fetched images:`, this.images);
    
    this.searchTerm = this.word;
    console.log(`Search term set to: "${this.searchTerm}"`);
    
    // Use the pre-fetched images initially, but allow search to fetch fresh ones
    this.displayedImages = [...this.images];
    
    // Fetch fresh images using our improved curated system
    console.log(`About to call searchImages() with term: "${this.searchTerm}"`);
    this.searchImages();
  }

  toggleImageSelection(imageUrl: string) {
    const index = this.selectedImages.indexOf(imageUrl);
    
    if (index > -1) {
      // Remove if already selected
      this.selectedImages.splice(index, 1);
    } else {
      // Add if not selected and under max limit
      if (this.selectedImages.length < this.maxSelection) {
        this.selectedImages.push(imageUrl);
      }
    }
  }

  isImageSelected(imageUrl: string): boolean {
    return this.selectedImages.includes(imageUrl);
  }

  getSelectionNumber(imageUrl: string): number {
    const index = this.selectedImages.indexOf(imageUrl);
    return index > -1 ? index + 1 : 0;
  }

  canSelectMore(): boolean {
    return this.selectedImages.length < this.maxSelection;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  confirm() {
    this.modalController.dismiss({
      selectedImages: this.selectedImages
    });
  }

  selectAll() {
    // Select up to maxSelection images
    this.selectedImages = this.displayedImages.slice(0, this.maxSelection);
  }

  clearAll() {
    this.selectedImages = [];
  }

  async refreshImages() {
    console.log('Refreshing images for:', this.searchTerm);
    await this.searchImages();
  }

  resetSearch() {
    this.searchTerm = this.word;
    this.displayedImages = [...this.images];
  }

  async searchImages() {
    if (!this.searchTerm.trim()) {
      this.displayedImages = [...this.images];
      return;
    }

    console.log(`Searching for images with term: "${this.searchTerm}"`);
    console.log('Clearing image cache to ensure fresh results...');
    
    // Clear cache to ensure we get fresh images with updated curated collection and fallback URLs
    this.imageService.clearCache();
    
    this.isSearching = true;
    
    try {
      const newImages = await this.imageService.fetchImages(this.searchTerm, 12);
      console.log(`Found ${newImages.length} images for "${this.searchTerm}"`);
      this.displayedImages = newImages;
    } catch (error) {
      console.error('Error searching for images:', error);
      // Fallback to original images
      this.displayedImages = [...this.images];
    } finally {
      this.isSearching = false;
    }
  }

  async loadMoreImages() {
    if (this.isLoadingMore) {
      return; // Prevent multiple simultaneous requests
    }

    console.log(`Loading more images for "${this.searchTerm}"`);
    this.isLoadingMore = true;

    try {
      const currentCount = this.displayedImages.length;
      const moreImages = await this.imageService.fetchMoreImages(this.searchTerm, 12, currentCount);
      
      if (moreImages.length > 0) {
        // Add new images to the existing ones
        this.displayedImages = [...this.displayedImages, ...moreImages];
        console.log(`Added ${moreImages.length} more images. Total: ${this.displayedImages.length}`);
      } else {
        console.log('No more images available');
      }
    } catch (error) {
      console.error('Error loading more images:', error);
    } finally {
      this.isLoadingMore = false;
    }
  }

  async onSearchChange() {
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
      this.displayedImages = [];
      return;
    }

    this.isSearching = true;
    
    try {
      const searchResults = await this.imageService.fetchImages(this.searchTerm.trim(), 12);
      this.displayedImages = searchResults;
      
      // Clear selected images that are no longer in the results
      this.selectedImages = this.selectedImages.filter(selected => 
        this.displayedImages.includes(selected)
      );
    } catch (error) {
      console.error('Error searching for images:', error);
      this.displayedImages = [];
    } finally {
      this.isSearching = false;
    }
  }

  async refreshSearch() {
    await this.performSearch();
  }

  resetToOriginalWord() {
    this.searchTerm = this.word;
    this.displayedImages = [...this.images];
    // Clear selections that aren't in original images
    this.selectedImages = this.selectedImages.filter(selected => 
      this.images.includes(selected)
    );
  }

  trackByImage(index: number, imageUrl: string): string {
    return imageUrl;
  }

  // Make Math available in template
  Math = Math;
}
