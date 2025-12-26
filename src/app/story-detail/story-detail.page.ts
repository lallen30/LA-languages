import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
  IonChip, IonLabel, IonSpinner, IonProgressBar,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  playOutline, pauseOutline, stopOutline, volumeHighOutline,
  arrowBackOutline, schoolOutline, trashOutline, volumeMediumOutline, createOutline } from 'ionicons/icons';
import { StoryService } from '../services/story.service';
import { TtsService } from '../services/tts.service';
import { Story, StoryLevel } from '../models/story.model';

@Component({
  selector: 'app-story-detail',
  templateUrl: './story-detail.page.html',
  styleUrls: ['./story-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
    IonChip, IonLabel, IonSpinner, IonProgressBar,
    CommonModule, FormsModule
  ]
})
export class StoryDetailPage implements OnInit, OnDestroy {
  story: Story | null = null;
  isLoading = true;
  
  // TTS state
  isPlaying = false;
  isPaused = false;
  currentSentenceIndex = -1;
  readingProgress = 0;
  
  private audioElement: HTMLAudioElement | null = null;
  private sentenceQueue: string[] = [];
  private currentQueueIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storyService: StoryService,
    private ttsService: TtsService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({trashOutline,schoolOutline,playOutline,pauseOutline,stopOutline,volumeMediumOutline,volumeHighOutline,arrowBackOutline,createOutline});
  }

  async ngOnInit() {
    const storyId = this.route.snapshot.paramMap.get('id');
    if (storyId) {
      await this.loadStory(storyId);
    }
  }

  ngOnDestroy() {
    this.stopReading();
  }

  goBack() {
    this.stopReading();
    this.router.navigate(['/tabs/stories']);
  }

  async loadStory(id: string) {
    this.isLoading = true;
    try {
      this.story = await this.storyService.getStory(id);
      if (!this.story) {
        this.showToast('Story not found');
        this.router.navigate(['/tabs/stories']);
      }
    } finally {
      this.isLoading = false;
    }
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

  // ============ TTS READING ============

  async startReading() {
    if (!this.story || this.story.sentences.length === 0) {
      this.showToast('No sentences to read');
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.sentenceQueue = [...this.story.sentences];
    this.currentQueueIndex = 0;
    this.currentSentenceIndex = 0;
    
    await this.readNextSentence();
  }

  private async readNextSentence() {
    if (!this.isPlaying || this.currentQueueIndex >= this.sentenceQueue.length) {
      this.stopReading();
      return;
    }

    if (this.isPaused) {
      return;
    }

    this.currentSentenceIndex = this.currentQueueIndex;
    this.updateProgress();

    const sentence = this.sentenceQueue[this.currentQueueIndex];
    
    try {
      // Use TTS service to speak the sentence
      await this.ttsService.speak(sentence);
      
      // Wait a bit between sentences for natural pacing
      await this.delay(300);
      
      this.currentQueueIndex++;
      
      // Continue to next sentence
      if (this.isPlaying && !this.isPaused) {
        await this.readNextSentence();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      // Continue to next sentence even on error
      this.currentQueueIndex++;
      if (this.isPlaying && !this.isPaused) {
        await this.readNextSentence();
      }
    }
  }

  pauseReading() {
    this.isPaused = true;
    this.ttsService.stop();
  }

  resumeReading() {
    if (this.isPaused) {
      this.isPaused = false;
      this.readNextSentence();
    }
  }

  stopReading() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSentenceIndex = -1;
    this.currentQueueIndex = 0;
    this.readingProgress = 0;
    this.ttsService.stop();
  }

  private updateProgress() {
    if (this.story && this.story.sentences.length > 0) {
      this.readingProgress = (this.currentQueueIndex + 1) / this.story.sentences.length;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============ STORY ACTIONS ============

  async openEditStory() {
    if (!this.story) return;

    const alert = await this.alertController.create({
      header: 'Edit Story',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Story Title',
          value: this.story.title
        },
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Story Content',
          value: this.story.content,
          attributes: {
            rows: 8
          }
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
            if (!data.title?.trim()) {
              this.showToast('Title is required');
              return false;
            }
            if (!data.content?.trim()) {
              this.showToast('Content is required');
              return false;
            }
            await this.saveStoryEdits(data.title.trim(), data.content.trim());
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async saveStoryEdits(title: string, content: string) {
    if (!this.story) return;

    // Split content into sentences for TTS highlighting
    const sentences = this.splitIntoSentences(content);

    const updatedStory = await this.storyService.updateStory(this.story.id, {
      title,
      content,
      sentences
    });

    if (updatedStory) {
      this.story = updatedStory;
      this.showToast('Story updated');
    } else {
      this.showToast('Failed to update story');
    }
  }

  private splitIntoSentences(content: string): string[] {
    // Split by sentence-ending punctuation while keeping the punctuation
    return content
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async confirmDeleteStory() {
    if (!this.story) return;

    const alert = await this.alertController.create({
      header: 'Delete Story',
      message: `Delete "${this.story.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.storyService.deleteStory(this.story!.id);
            this.showToast('Story deleted');
            this.router.navigate(['/tabs/stories']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Speak a single word using TTS
   */
  async speakWord(word: string) {
    try {
      await this.ttsService.speak(word);
    } catch (error) {
      console.error('Error speaking word:', error);
    }
  }
}
