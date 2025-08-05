import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { TtsService } from '../services/tts.service';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SettingsPage implements OnInit {
  settings = {
    darkMode: false,
    ttsLanguage: 'es-ES',
    ttsRate: 1.0,
    ttsPitch: 1.0,
    imageQuality: 'medium',
    autoSpeak: false,
    studyReminders: true,
    maxCardsPerSession: 20
  };

  availableLanguages = [
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'pt-PT', name: 'Portuguese' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'en-US', name: 'English' }
  ];

  imageQualities = [
    { value: 'low', label: 'Low (faster loading)' },
    { value: 'medium', label: 'Medium (balanced)' },
    { value: 'high', label: 'High (best quality)' }
  ];

  constructor(
    private storageService: StorageService,
    private ttsService: TtsService,
    private imageService: ImageService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      this.settings.darkMode = await this.storageService.getSetting('darkMode', false);
      this.settings.ttsLanguage = await this.storageService.getSetting('ttsLanguage', 'es-ES');
      this.settings.ttsRate = await this.storageService.getSetting('ttsRate', 1.0);
      this.settings.ttsPitch = await this.storageService.getSetting('ttsPitch', 1.0);
      this.settings.imageQuality = await this.storageService.getSetting('imageQuality', 'medium');
      this.settings.autoSpeak = await this.storageService.getSetting('autoSpeak', false);
      this.settings.studyReminders = await this.storageService.getSetting('studyReminders', true);
      this.settings.maxCardsPerSession = await this.storageService.getSetting('maxCardsPerSession', 20);

      // Apply dark mode
      this.applyDarkMode();
      
      // Update TTS settings
      this.ttsService.setLanguage(this.settings.ttsLanguage);
      this.ttsService.setRate(this.settings.ttsRate);
      this.ttsService.setPitch(this.settings.ttsPitch);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSetting(key: string, value: any) {
    try {
      console.log(`=== SAVING SETTING: ${key} ===`);
      console.log('Key:', key, 'Value:', value, 'Type:', typeof value);
      await this.storageService.saveSetting(key, value);
      console.log('Setting saved successfully to storage');
      
      // Verify it was saved by reading it back
      const savedValue = await this.storageService.getSetting(key);
      console.log('Verification - value read back from storage:', savedValue);
      console.log(`=== END SAVING SETTING: ${key} ===`);
      
      // Apply changes immediately
      switch (key) {
        case 'darkMode':
          this.applyDarkMode();
          break;
        case 'ttsLanguage':
          this.ttsService.setLanguage(value);
          break;
        case 'ttsRate':
          this.ttsService.setRate(value);
          break;
        case 'ttsPitch':
          this.ttsService.setPitch(value);
          break;
      }
      
      await this.showToast('Setting saved');
    } catch (error) {
      console.error('Error saving setting:', error);
      await this.showToast('Error saving setting', 'danger');
    }
  }

  onDarkModeChange() {
    this.saveSetting('darkMode', this.settings.darkMode);
  }

  onTtsLanguageChange() {
    console.log('=== TTS LANGUAGE CHANGE ===');
    console.log('New ttsLanguage value:', this.settings.ttsLanguage);
    console.log('About to save ttsLanguage setting...');
    this.saveSetting('ttsLanguage', this.settings.ttsLanguage);
    console.log('=== END TTS LANGUAGE CHANGE ===');
  }

  onTtsRateChange() {
    this.saveSetting('ttsRate', this.settings.ttsRate);
  }

  onTtsPitchChange() {
    this.saveSetting('ttsPitch', this.settings.ttsPitch);
  }

  onImageQualityChange() {
    this.saveSetting('imageQuality', this.settings.imageQuality);
  }

  onAutoSpeakChange() {
    this.saveSetting('autoSpeak', this.settings.autoSpeak);
  }

  onStudyRemindersChange() {
    this.saveSetting('studyReminders', this.settings.studyReminders);
  }

  onMaxCardsChange() {
    this.saveSetting('maxCardsPerSession', this.settings.maxCardsPerSession);
  }

  async testTts() {
    try {
      const testText = this.settings.ttsLanguage.startsWith('es') 
        ? 'Hola, esto es una prueba de texto a voz'
        : 'Hello, this is a text-to-speech test';
      
      await this.ttsService.speak(testText);
    } catch (error) {
      console.error('TTS test failed:', error);
      await this.showToast('TTS test failed', 'danger');
    }
  }

  async clearImageCache() {
    const alert = await this.alertController.create({
      header: 'Clear Image Cache',
      message: 'This will clear all cached images. They will be re-downloaded when needed.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Clear',
          handler: async () => {
            this.imageService.clearCache();
            await this.showToast('Image cache cleared');
          }
        }
      ]
    });

    await alert.present();
  }

  async resetAllSettings() {
    const alert = await this.alertController.create({
      header: 'Reset Settings',
      message: 'This will reset all settings to their default values. Are you sure?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          role: 'destructive',
          handler: async () => {
            await this.performReset();
          }
        }
      ]
    });

    await alert.present();
  }

  async resetAllData() {
    const alert = await this.alertController.create({
      header: 'Reset All Data',
      message: 'This will delete ALL your decks, cards, and progress. This cannot be undone!',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete Everything',
          role: 'destructive',
          handler: async () => {
            await this.storageService.clearAllData();
            await this.showToast('All data cleared');
            // Reload the app or navigate to a fresh state
            window.location.reload();
          }
        }
      ]
    });

    await alert.present();
  }

  async exportData() {
    try {
      const data = await this.storageService.exportData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      await this.showToast('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      await this.showToast('Export failed', 'danger');
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const alert = await this.alertController.create({
          header: 'Import Data',
          message: 'This will replace all current data. Continue?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Import',
              handler: async () => {
                await this.storageService.importData(data);
                await this.showToast('Data imported successfully');
                window.location.reload();
              }
            }
          ]
        });
        
        await alert.present();
      } catch (error) {
        console.error('Import failed:', error);
        await this.showToast('Import failed - invalid file', 'danger');
      }
    };
    
    input.click();
  }

  private async performReset() {
    // Reset to default values
    this.settings = {
      darkMode: false,
      ttsLanguage: 'es-ES',
      ttsRate: 1.0,
      ttsPitch: 1.0,
      imageQuality: 'medium',
      autoSpeak: false,
      studyReminders: true,
      maxCardsPerSession: 20
    };

    // Save all defaults
    for (const [key, value] of Object.entries(this.settings)) {
      await this.storageService.saveSetting(key, value);
    }

    // Apply changes
    this.applyDarkMode();
    this.ttsService.setLanguage(this.settings.ttsLanguage);
    this.ttsService.setRate(this.settings.ttsRate);
    this.ttsService.setPitch(this.settings.ttsPitch);

    await this.showToast('Settings reset to defaults');
  }

  private applyDarkMode() {
    document.body.classList.toggle('dark', this.settings.darkMode);
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getCacheSize(): string {
    const size = this.imageService.getCacheSize();
    return `${size} images cached`;
  }
}
