import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageCache: Map<string, string[]> = new Map();
  private readonly UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with actual key
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Fetch images for a given word/term
   */
  async fetchImages(searchTerm: string, count: number = 3): Promise<string[]> {
    // Check cache first
    const cacheKey = `${searchTerm}_${count}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      // For demo purposes, using a mock implementation
      // In production, you would use Unsplash API or similar
      const images = await this.fetchFromGoogleImages(searchTerm, count);
      
      // Cache the results
      this.imageCache.set(cacheKey, images);
      this.saveCacheToStorage();
      
      return images;
    } catch (error) {
      console.error('Error fetching images:', error);
      return this.getFallbackImages(searchTerm, count);
    }
  }

  /**
   * Fetch images from Google Custom Search API with pagination support
   */
  private async fetchFromGoogleImages(searchTerm: string, count: number, startIndex: number = 1): Promise<string[]> {
    console.log(`Fetching ${count} images from Google Images for "${searchTerm}" starting at index ${startIndex}`);
    
    try {
      // Google Custom Search API configuration
      const API_KEY = 'AIzaSyBxnchh6HFEe9rp33DgPSdr2DfrJrRXLUA';
      const SEARCH_ENGINE_ID = '5274f266a7664491e';
      
      // Google Custom Search API is now configured and ready to use
      console.log('Using Google Custom Search API for image search');
      
      // Both API key and Search Engine ID are now configured, proceed with Google search
      
      const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchTerm)}&searchType=image&num=${Math.min(count, 10)}&start=${startIndex}&imgSize=medium&safe=active`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const imageUrls = data.items.map((item: any) => item.link).slice(0, count);
        console.log(`Found ${imageUrls.length} images from Google Images (page ${Math.ceil(startIndex / 10)})`);
        return imageUrls;
      } else {
        console.log('No images found from Google Images, using fallback');
        return this.getFallbackImages(searchTerm, count);
      }
    } catch (error) {
      console.error('Google Images API error:', error);
      return this.getFallbackImages(searchTerm, count);
    }
  }

  /**
   * Fetch more images for pagination (public method for modal to use)
   */
  async fetchMoreImages(searchTerm: string, count: number, currentImageCount: number): Promise<string[]> {
    console.log(`Fetching more images for "${searchTerm}", current count: ${currentImageCount}`);
    
    // Check curated images first (but skip if we already have some)
    if (currentImageCount === 0) {
      const curatedImages = this.getCuratedDemoImages(searchTerm, count);
      if (curatedImages.length > 0) {
        return curatedImages;
      }
    }
    
    // Calculate the next page start index for Google API
    const startIndex = Math.max(1, currentImageCount + 1);
    
    try {
      return await this.fetchFromGoogleImages(searchTerm, count, startIndex);
    } catch (error) {
      console.error('Error fetching more images:', error);
      return this.getFallbackImages(searchTerm, count);
    }
  }

  /**
   * Fetch images using curated demo images first for better user experience
   */
  private async fetchFromUnsplash(searchTerm: string, count: number): Promise<string[]> {
    console.log(`fetchFromUnsplash called with: "${searchTerm}"`);
    
    // For demo purposes, prioritize curated images for common terms
    const curatedImages = this.getCuratedDemoImages(searchTerm, count);
    console.log(`getCuratedDemoImages returned ${curatedImages.length} images`);
    
    if (curatedImages.length > 0) {
      console.log(`Using curated images for "${searchTerm}"`);
      return curatedImages;
    }

    console.log(`No curated images found for "${searchTerm}", trying Google Images`);
    
    try {
      // Try Google Images first, then fall back to Pixabay
      return await this.fetchFromGoogleImages(searchTerm, count);
    } catch (error) {
      console.error('Google Images API error:', error);
      return await this.fetchFromPixabay(searchTerm, count);
    }
  }

  /**
   * Fetch from Pixabay API (free alternative)
   */
  private async fetchFromPixabay(searchTerm: string, count: number): Promise<string[]> {
    // Using Pixabay's free API (no key required for basic usage)
    const response = await fetch(
      `https://pixabay.com/api/?key=9656065-a4094594c34f9ac14c7fc4c39&q=${encodeURIComponent(searchTerm)}&image_type=photo&category=all&per_page=${count}&safesearch=true`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Pixabay');
    }

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      return data.hits.map((hit: any) => hit.webformatURL);
    } else {
      throw new Error('No images found');
    }
  }

  /**
   * Get curated demo images that are more relevant to search terms
   */
  private getCuratedDemoImages(searchTerm: string, count: number): string[] {
    const term = searchTerm.toLowerCase().trim();
    console.log(`Looking for curated images for term: "${term}"`);
    
    // Curated image collections for common Spanish words and English translations
    const curatedImages: { [key: string]: string[] } = {
      // Animals
      'gato': [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=300&h=200&fit=crop'
      ],
      'cat': [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=300&h=200&fit=crop'
      ],
      'cats': [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=300&h=200&fit=crop'
      ],
      'perro': [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop'
      ],
      'dog': [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop'
      ],
      'casa': [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da02f2f?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=300&h=200&fit=crop'
      ],
      'house': [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1502005229762-cf1b2da02f2f?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=300&h=200&fit=crop'
      ],
      'arbol': [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1574263867128-b7d9b7c5d8b5?ixlib=rb-4.0.3&w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?ixlib=rb-4.0.3&w=300&h=200&fit=crop'
      ],
      'tree': [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1574263867128-b7d9b7c5d8b5?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&h=200&fit=crop'
      ]
    };
    
    // Check if we have curated images for this term
    if (curatedImages[term]) {
      console.log(`Found ${curatedImages[term].length} curated images for "${term}"`);
      const selectedImages = curatedImages[term].slice(0, count);
      console.log('Selected curated images:', selectedImages);
      return selectedImages;
    }
    
    console.log(`No curated images found for "${term}", using fallback`);
    // Fallback to placeholder images with better variety
    return this.getFallbackImages(searchTerm, count);
  }

  /**
   * Get fallback images when API fails
   */
  private getFallbackImages(searchTerm: string, count: number): string[] {
    console.log(`Creating ${count} fallback images for "${searchTerm}"`);
    const fallbackImages: string[] = [];
    
    // Use placeholder.com as a working alternative
    for (let i = 0; i < count; i++) {
      fallbackImages.push(`https://placeholder.com/300x200/cccccc/666666?text=${encodeURIComponent(searchTerm)}`);
    }
    
    console.log('Generated fallback images:', fallbackImages);
    return fallbackImages;
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
    localStorage.removeItem('flashcard_image_cache');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.imageCache.size;
  }

  /**
   * Save cache to local storage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: Array.from(this.imageCache.entries())
      };
      localStorage.setItem('flashcard_image_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving image cache:', error);
    }
  }

  /**
   * Load cache from local storage
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('flashcard_image_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        
        // Check if cache is still valid (not expired)
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          this.imageCache = new Map(parsed.data);
        } else {
          // Clear expired cache
          localStorage.removeItem('flashcard_image_cache');
        }
      }
    } catch (error) {
      console.error('Error loading image cache:', error);
    }
  }

  /**
   * Preload images to improve performance
   */
  preloadImages(imageUrls: string[]): Promise<void[]> {
    const promises = imageUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    });

    return Promise.all(promises);
  }
}
