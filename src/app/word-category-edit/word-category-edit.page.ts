import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
  IonBackButton, IonList, IonItem, IonLabel, IonInput, IonItemSliding, IonItemOptions, IonItemOption,
  IonSpinner, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addOutline, trashOutline, createOutline, volumeMediumOutline
} from 'ionicons/icons';
import { StoryService } from '../services/story.service';
import { TtsService } from '../services/tts.service';
import { WordCategory } from '../models/story.model';

@Component({
  selector: 'app-word-category-edit',
  templateUrl: './word-category-edit.page.html',
  styleUrls: ['./word-category-edit.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
    IonBackButton, IonList, IonItem, IonLabel, IonInput, IonItemSliding, IonItemOptions, IonItemOption,
    IonSpinner, CommonModule, FormsModule
  ]
})
export class WordCategoryEditPage implements OnInit {
  wordCategory: WordCategory | null = null;
  isLoading = true;
  newWord = '';
  editingWordIndex: number | null = null;
  editingWordValue = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storyService: StoryService,
    private ttsService: TtsService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ addOutline, trashOutline, createOutline, volumeMediumOutline });
  }

  async ngOnInit() {
    const categoryId = this.route.snapshot.paramMap.get('id');
    if (categoryId) {
      await this.loadCategory(categoryId);
    }
  }

  async loadCategory(categoryId: string) {
    this.isLoading = true;
    try {
      const categories = await this.storyService.getWordCategories();
      this.wordCategory = categories.find(c => c.id === categoryId) || null;
    } finally {
      this.isLoading = false;
    }
  }

  async addWord() {
    if (!this.wordCategory || !this.newWord.trim()) return;

    const word = this.newWord.trim();
    if (this.wordCategory.words.includes(word)) {
      this.showToast('Word already exists');
      return;
    }

    await this.storyService.addWordsToCategory(this.wordCategory.id, [word]);
    this.wordCategory.words.push(word);
    this.newWord = '';
    this.showToast('Word added');
  }

  async deleteWord(word: string) {
    if (!this.wordCategory) return;

    const alert = await this.alertController.create({
      header: 'Delete Word',
      message: `Delete "${word}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storyService.removeWordFromCategory(this.wordCategory!.id, word);
            this.wordCategory!.words = this.wordCategory!.words.filter(w => w !== word);
            this.showToast('Word deleted');
          }
        }
      ]
    });
    await alert.present();
  }

  startEditWord(index: number) {
    this.editingWordIndex = index;
    this.editingWordValue = this.wordCategory!.words[index];
  }

  cancelEditWord() {
    this.editingWordIndex = null;
    this.editingWordValue = '';
  }

  async saveEditWord() {
    if (!this.wordCategory || this.editingWordIndex === null) return;

    const newValue = this.editingWordValue.trim();
    if (!newValue) {
      this.showToast('Word cannot be empty');
      return;
    }

    const oldWord = this.wordCategory.words[this.editingWordIndex];
    if (newValue === oldWord) {
      this.cancelEditWord();
      return;
    }

    if (this.wordCategory.words.includes(newValue)) {
      this.showToast('Word already exists');
      return;
    }

    // Update the word
    await this.storyService.removeWordFromCategory(this.wordCategory.id, oldWord);
    await this.storyService.addWordsToCategory(this.wordCategory.id, [newValue]);
    this.wordCategory.words[this.editingWordIndex] = newValue;
    
    this.cancelEditWord();
    this.showToast('Word updated');
  }

  async speakWord(word: string) {
    try {
      await this.ttsService.speak(word);
    } catch (error) {
      console.error('Error speaking word:', error);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
