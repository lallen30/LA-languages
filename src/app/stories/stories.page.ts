import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonSegment, IonSegmentButton, IonFab, IonFabButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonChip, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
  IonInput, IonSelect, IonSelectOption,
  AlertController, ActionSheetController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, bookOutline, folderOutline, createOutline, trashOutline,
  ellipsisVertical, chevronForward, timeOutline, schoolOutline, closeOutline, sparklesOutline,
  downloadOutline, cloudUploadOutline
} from 'ionicons/icons';
import { StoryService } from '../services/story.service';
import { Story, StoryCategory, WordCategory, StoryLevel } from '../models/story.model';
import { StorageService } from '../services/storage.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-stories',
  templateUrl: './stories.page.html',
  styleUrls: ['./stories.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonSegment, IonSegmentButton, IonFab, IonFabButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonChip, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
    IonInput, IonSelect, IonSelectOption,
    CommonModule, FormsModule, TranslatePipe
  ]
})
export class StoriesPage implements OnInit {
  categories: StoryCategory[] = [];
  wordCategories: WordCategory[] = [];
  stories: Story[] = [];
  selectedCategoryId: string = 'all';
  selectedLevel: string = 'all';
  isLoading = false;
  
  // Add Story Form state
  showAddStoryForm = false;
  newStory = {
    subject: '',
    level: 'beginner' as StoryLevel,
    categoryId: '',
    words: [] as string[],
    wordInput: ''
  };

  constructor(
    private storyService: StoryService,
    private storageService: StorageService,
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({folderOutline,addOutline,schoolOutline,timeOutline,ellipsisVertical,bookOutline,closeOutline,sparklesOutline,createOutline,trashOutline,chevronForward,downloadOutline,cloudUploadOutline});
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      this.categories = await this.storyService.getCategories();
      this.wordCategories = await this.storyService.getWordCategories();
      await this.loadStories();
    } finally {
      this.isLoading = false;
    }
  }

  async loadStories() {
    if (this.selectedCategoryId === 'all') {
      this.stories = await this.storyService.getStories();
    } else {
      this.stories = await this.storyService.getStoriesByCategory(this.selectedCategoryId);
    }
  }

  async onCategoryChange(event: any) {
    this.selectedCategoryId = event.detail.value;
    await this.loadStories();
  }

  onLevelChange(event: any) {
    this.selectedLevel = event.detail.value;
  }

  get filteredStories(): Story[] {
    if (this.selectedLevel === 'all') {
      return this.stories;
    }
    return this.stories.filter(s => s.level === this.selectedLevel);
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  // ============ CATEGORY MANAGEMENT ============

  async showAddCategoryDialog() {
    const alert = await this.alertController.create({
      header: 'New Story Category',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Category name' },
        { name: 'description', type: 'text', placeholder: 'Description (optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.name?.trim()) {
              await this.storyService.createCategory(data.name.trim(), data.description?.trim());
              await this.loadData();
              this.showToast('Category created');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showCategoryOptions(category: StoryCategory) {
    const actionSheet = await this.actionSheetController.create({
      header: category.name,
      buttons: [
        {
          text: 'View Stories',
          icon: 'book-outline',
          handler: () => {
            this.selectedCategoryId = category.id;
            this.loadStories();
          }
        },
        {
          text: 'Delete Category',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteCategory(category)
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async confirmDeleteCategory(category: StoryCategory) {
    const alert = await this.alertController.create({
      header: 'Delete Category',
      message: `Delete "${category.name}" and all its stories?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storyService.deleteCategory(category.id);
            if (this.selectedCategoryId === category.id) {
              this.selectedCategoryId = 'all';
            }
            await this.loadData();
            this.showToast('Category deleted');
          }
        }
      ]
    });
    await alert.present();
  }

  // ============ WORD CATEGORY MANAGEMENT ============

  async showAddWordCategoryDialog() {
    const alert = await this.alertController.create({
      header: 'New Word Category',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Category name (e.g., "Travel Words")' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            if (data.name?.trim()) {
              await this.storyService.createWordCategory(data.name.trim());
              await this.loadData();
              this.showToast('Word category created');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showWordCategoryOptions(wordCategory: WordCategory) {
    const actionSheet = await this.actionSheetController.create({
      header: `${wordCategory.name} (${wordCategory.words.length} words)`,
      buttons: [
        {
          text: 'View/Edit Words',
          icon: 'create-outline',
          handler: () => this.openWordCategoryEdit(wordCategory)
        },
        {
          text: 'Use in New Story',
          icon: 'book-outline',
          handler: () => {
            this.newStory.words = [...wordCategory.words];
            this.showAddStoryForm = true;
          }
        },
        {
          text: 'Delete Category',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteWordCategory(wordCategory)
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async showWordCategoryWords(wordCategory: WordCategory) {
    const wordList = wordCategory.words.length > 0 
      ? wordCategory.words.join(', ') 
      : 'No words yet';
    
    const alert = await this.alertController.create({
      header: wordCategory.name,
      subHeader: `${wordCategory.words.length} words`,
      message: wordList,
      inputs: [
        { name: 'newWord', type: 'text', placeholder: 'Add new word' }
      ],
      buttons: [
        { text: 'Close', role: 'cancel' },
        {
          text: 'Add Word',
          handler: async (data) => {
            if (data.newWord?.trim()) {
              await this.storyService.addWordsToCategory(wordCategory.id, [data.newWord.trim()]);
              await this.loadData();
              this.showToast('Word added');
              return false; // Keep dialog open
            }
            return false;
          }
        }
      ]
    });
    await alert.present();
  }

  openWordCategoryEdit(wordCategory: WordCategory) {
    this.router.navigate(['/tabs/word-category-edit', wordCategory.id]);
  }

  async confirmDeleteWordCategory(wordCategory: WordCategory) {
    const alert = await this.alertController.create({
      header: 'Delete Word Category',
      message: `Delete "${wordCategory.name}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storyService.deleteWordCategory(wordCategory.id);
            await this.loadData();
            this.showToast('Word category deleted');
          }
        }
      ]
    });
    await alert.present();
  }

  // ============ STORY GENERATION ============

  openAddStoryForm() {
    this.newStory = {
      subject: '',
      level: 'beginner',
      categoryId: this.categories.length > 0 ? this.categories[0].id : '',
      words: [],
      wordInput: ''
    };
    this.showAddStoryForm = true;
  }

  closeAddStoryForm() {
    this.showAddStoryForm = false;
  }

  addWordToStory() {
    const word = this.newStory.wordInput.trim();
    if (word && !this.newStory.words.includes(word)) {
      this.newStory.words.push(word);
      this.newStory.wordInput = '';
    }
  }

  removeWordFromStory(word: string) {
    this.newStory.words = this.newStory.words.filter(w => w !== word);
  }

  addWordsFromCategory(wordCategory: WordCategory) {
    const newWords = wordCategory.words.filter(w => !this.newStory.words.includes(w));
    this.newStory.words = [...this.newStory.words, ...newWords];
    this.showToast(`Added ${newWords.length} words`);
  }

  async generateStory() {
    if (!this.newStory.subject.trim()) {
      this.showToast('Please enter a subject');
      return;
    }
    if (!this.newStory.categoryId) {
      this.showToast('Please select or create a category first');
      return;
    }
    if (this.newStory.words.length === 0) {
      this.showToast('Please add at least one word');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generating story with AI...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Get target language from settings
      const targetLanguage = await this.storageService.getSetting('targetLanguage', 'es-ES');

      const response = await this.storyService.generateStory({
        subject: this.newStory.subject,
        level: this.newStory.level,
        words: this.newStory.words,
        language: targetLanguage
      });

      // Save the story
      await this.storyService.saveStory({
        title: response.title,
        content: response.content,
        sentences: response.sentences,
        subject: this.newStory.subject,
        level: this.newStory.level,
        categoryId: this.newStory.categoryId,
        wordsUsed: this.newStory.words,
        language: targetLanguage
      });

      await loading.dismiss();
      this.showAddStoryForm = false;
      await this.loadData();
      this.showToast('Story generated successfully!');

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error generating story:', error);
      
      const alert = await this.alertController.create({
        header: 'Generation Failed',
        message: error.message || 'Failed to generate story. Please check your API key.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // ============ STORY ACTIONS ============

  openStory(story: Story) {
    this.router.navigate(['/tabs/story-detail', story.id]);
  }

  async showStoryOptions(story: Story, event: Event) {
    event.stopPropagation();
    
    const actionSheet = await this.actionSheetController.create({
      header: story.title,
      buttons: [
        {
          text: 'Read Story',
          icon: 'book-outline',
          handler: () => this.openStory(story)
        },
        {
          text: 'Export Story',
          icon: 'download-outline',
          handler: () => this.exportSingleStory(story)
        },
        {
          text: 'Delete Story',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.confirmDeleteStory(story)
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async confirmDeleteStory(story: Story) {
    const alert = await this.alertController.create({
      header: 'Delete Story',
      message: `Delete "${story.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storyService.deleteStory(story.id);
            await this.loadData();
            this.showToast('Story deleted');
          }
        }
      ]
    });
    await alert.present();
  }

  getLevelColor(level: StoryLevel): string {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  // ============ EXPORT/IMPORT ============

  /**
   * Export stories and categories based on current selection
   * If "All Stories" selected, exports everything
   * If a specific category selected, exports only that category's stories
   */
  async exportData() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      let exportData: any;

      if (this.selectedCategoryId === 'all') {
        // Export all data
        exportData = {
          version: '1.0',
          exportType: 'all',
          exportDate: new Date().toISOString(),
          storyCategories: this.categories,
          wordCategories: this.wordCategories,
          stories: this.stories
        };
      } else {
        // Export only selected category
        const selectedCategory = this.categories.find(c => c.id === this.selectedCategoryId);
        const categoryStories = this.stories.filter(s => s.categoryId === this.selectedCategoryId);
        
        // Get word categories used by these stories
        const usedWordCategoryIds = new Set<string>();
        // Note: Stories don't directly reference word categories, but we can include all for completeness
        
        exportData = {
          version: '1.0',
          exportType: 'category',
          exportDate: new Date().toISOString(),
          storyCategories: selectedCategory ? [selectedCategory] : [],
          wordCategories: this.wordCategories, // Include all word categories
          stories: categoryStories
        };
      }

      await loading.dismiss();

      // Create and download file
      const filename = this.selectedCategoryId === 'all' 
        ? `stories_export_${this.formatDateForFilename(new Date())}.json`
        : `stories_${this.categories.find(c => c.id === this.selectedCategoryId)?.name || 'category'}_${this.formatDateForFilename(new Date())}.json`;

      await this.downloadJson(exportData, filename);
      this.showToast(`Exported ${exportData.stories.length} stories`);

    } catch (error) {
      await loading.dismiss();
      console.error('Export error:', error);
      this.showToast('Export failed');
    }
  }

  /**
   * Export a single story with its category
   */
  async exportSingleStory(story: Story) {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Get the story's category
      const storyCategory = this.categories.find(c => c.id === story.categoryId);

      const exportData = {
        version: '1.0',
        exportType: 'single',
        exportDate: new Date().toISOString(),
        storyCategories: storyCategory ? [storyCategory] : [],
        wordCategories: [], // Single story export doesn't need word categories
        stories: [story]
      };

      await loading.dismiss();

      const filename = `story_${story.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}_${this.formatDateForFilename(new Date())}.json`;
      await this.downloadJson(exportData, filename);
      this.showToast('Story exported');

    } catch (error) {
      await loading.dismiss();
      console.error('Export error:', error);
      this.showToast('Export failed');
    }
  }

  /**
   * Import stories and categories from a JSON file
   */
  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      const loading = await this.loadingController.create({
        message: 'Importing...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.version || !importData.stories) {
          throw new Error('Invalid import file format');
        }

        let categoriesCreated = 0;
        let storiesImported = 0;
        const categoryIdMap = new Map<string, string>(); // Old ID -> New ID

        // Import story categories (create if not exist)
        if (importData.storyCategories && importData.storyCategories.length > 0) {
          for (const cat of importData.storyCategories) {
            // Check if category with same name exists
            const existingCat = this.categories.find(c => c.name === cat.name);
            if (existingCat) {
              categoryIdMap.set(cat.id, existingCat.id);
            } else {
              // Create new category
              const newCat = await this.storyService.createCategory(cat.name, cat.description);
              categoryIdMap.set(cat.id, newCat.id);
              categoriesCreated++;
            }
          }
        }

        // Import word categories (create if not exist)
        if (importData.wordCategories && importData.wordCategories.length > 0) {
          for (const wc of importData.wordCategories) {
            const existingWc = this.wordCategories.find(w => w.name === wc.name);
            if (!existingWc) {
              const newWc = await this.storyService.createWordCategory(wc.name);
              if (wc.words && wc.words.length > 0) {
                await this.storyService.addWordsToCategory(newWc.id, wc.words);
              }
            } else if (wc.words && wc.words.length > 0) {
              // Add any new words to existing category
              const newWords = wc.words.filter((w: string) => !existingWc.words.includes(w));
              if (newWords.length > 0) {
                await this.storyService.addWordsToCategory(existingWc.id, newWords);
              }
            }
          }
        }

        // Import stories
        if (importData.stories && importData.stories.length > 0) {
          for (const story of importData.stories) {
            // Map the category ID to the new/existing category
            const newCategoryId = categoryIdMap.get(story.categoryId) || story.categoryId;
            
            // Check if a story with same title already exists in the category
            const existingStories = await this.storyService.getStoriesByCategory(newCategoryId);
            const storyExists = existingStories.some(s => s.title === story.title);
            
            if (!storyExists) {
              await this.storyService.saveStory({
                title: story.title,
                content: story.content,
                sentences: story.sentences,
                subject: story.subject,
                level: story.level,
                categoryId: newCategoryId,
                wordsUsed: story.wordsUsed,
                language: story.language
              });
              storiesImported++;
            }
          }
        }

        await loading.dismiss();
        await this.loadData();
        
        let message = `Imported ${storiesImported} stories`;
        if (categoriesCreated > 0) {
          message += `, created ${categoriesCreated} categories`;
        }
        this.showToast(message);

      } catch (error: any) {
        await loading.dismiss();
        console.error('Import error:', error);
        
        const alert = await this.alertController.create({
          header: 'Import Failed',
          message: error.message || 'Failed to import file',
          buttons: ['OK']
        });
        await alert.present();
      }
    };

    input.click();
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private async downloadJson(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    // Use Web Share API if available (better for mobile)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Story Export',
          });
          return;
        }
      } catch (e) {
        // Fall through to download
      }
    }

    // Fallback to download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
