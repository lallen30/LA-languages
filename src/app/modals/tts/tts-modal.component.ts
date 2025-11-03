import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-tts-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './tts-modal.component.html',
  styleUrls: ['./tts-modal.component.scss']
})
export class TtsModalComponent {
  @Input() isIOS = false;
  @Input() settings: any;
  @Input() availableLanguages: { code: string; name: string }[] = [];

  @Output() ttsLanguageChange = new EventEmitter<void>();
  @Output() ttsRateChange = new EventEmitter<void>();
  @Output() ttsPitchChange = new EventEmitter<void>();
  @Output() autoSpeakChange = new EventEmitter<void>();
  @Output() testTtsClick = new EventEmitter<void>();

  // IonAlert state for language picker (button-based for tap-to-select-and-close)
  isLangAlertOpen = false;
  languageInputs: Array<never> = [];
  langButtons: Array<{ text: string; role?: string; handler?: () => boolean | void }> = []; // built per open

  constructor(
    private modalCtrl: ModalController,
    private storageService: StorageService
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  displayLanguage(code?: string): string | undefined {
    if (!code) return undefined;
    return this.availableLanguages.find(l => l.code === code)?.name;
  }

  private emitTtsLanguageChange(): void {
    const anyThis = this as any;
    const candidate = anyThis.ttsLanguageChange;
    if (candidate && typeof candidate.emit === 'function') {
      candidate.emit();
      return;
    }
    if (typeof candidate === 'function') {
      candidate();
      return;
    }
  }

  presentLanguagePicker() {
    this.langButtons = [
      ...this.availableLanguages.map(l => ({
        text: l.name,
        handler: () => {
          if (this.settings) {
            this.settings.ttsLanguage = l.code;
            this.emitTtsLanguageChange();
          }
          this.isLangAlertOpen = false;
          return true;
        }
      })),
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isLangAlertOpen = true;
  }

  onLangAlertDidDismiss(ev: CustomEvent<any>) {
    // Ensure state is closed if dismissed via backdrop/cancel
    this.isLangAlertOpen = false;
  }

  async onAutoSpeakToggle(newValue: boolean) {
    console.log('TTS Modal: Auto-speak toggled to:', newValue);
    this.settings.autoSpeak = newValue;
    
    // Save directly to storage (like appearance modal does)
    try {
      await this.storageService.saveSetting('autoSpeak', newValue);
      console.log('TTS Modal: Auto-speak saved to storage successfully');
    } catch (error) {
      console.error('TTS Modal: Failed to save autoSpeak setting:', error);
    }
    
    // Still emit for any listeners (optional)
    this.autoSpeakChange.emit();
  }
}
