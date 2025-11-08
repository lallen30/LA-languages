import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-tts-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
  templateUrl: './tts-modal.component.html',
  styleUrls: ['./tts-modal.component.scss']
})
export class TtsModalComponent implements OnInit {
  @Input() isIOS = false;
  @Input() settings: any;
  @Input() availableLanguages: { code: string; name: string }[] = [];
  
  buttonBackground: string = '#3880ff';
  buttonText: string = '#ffffff';

  @Output() nativeLanguageChange = new EventEmitter<void>();
  @Output() ttsLanguageChange = new EventEmitter<void>();
  @Output() ttsRateChange = new EventEmitter<void>();
  @Output() ttsPitchChange = new EventEmitter<void>();
  @Output() autoSpeakChange = new EventEmitter<void>();
  @Output() testTtsClick = new EventEmitter<void>();

  // IonAlert state for language pickers (button-based for tap-to-select-and-close)
  isNativeLangAlertOpen = false;
  isTargetLangAlertOpen = false;
  languageInputs: Array<never> = [];
  nativeLangButtons: Array<{ text: string; role?: string; handler?: () => boolean | void }> = [];
  targetLangButtons: Array<{ text: string; role?: string; handler?: () => boolean | void }> = [];

  constructor(
    private modalCtrl: ModalController,
    private storageService: StorageService
  ) {}
  
  async ngOnInit() {
    await this.loadColorScheme();
  }
  
  async loadColorScheme() {
    try {
      const darkMode = this.settings?.darkMode || false;
      const lightColorScheme = await this.storageService.getSetting('lightColorScheme', {});
      const darkColorScheme = await this.storageService.getSetting('darkColorScheme', {});
      
      const colorScheme = darkMode ? darkColorScheme : lightColorScheme;
      
      this.buttonBackground = colorScheme.buttonBackground || '#3880ff';
      this.buttonText = colorScheme.buttonText || '#ffffff';
    } catch (error) {
      console.error('Failed to load color scheme:', error);
    }
  }
  
  getButtonStyle() {
    return {
      '--background': this.buttonBackground,
      '--color': this.buttonText
    };
  }

  close() {
    this.modalCtrl.dismiss();
  }

  displayLanguage(code?: string): string | undefined {
    if (!code) return undefined;
    return this.availableLanguages.find(l => l.code === code)?.name;
  }

  private emitNativeLanguageChange(): void {
    const anyThis = this as any;
    const candidate = anyThis.nativeLanguageChange;
    if (candidate && typeof candidate.emit === 'function') {
      candidate.emit();
      return;
    }
    if (typeof candidate === 'function') {
      candidate();
      return;
    }
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

  presentNativeLanguagePicker() {
    this.nativeLangButtons = [
      ...this.availableLanguages.map(l => ({
        text: l.name,
        handler: () => {
          if (this.settings) {
            this.settings.nativeLanguage = l.code;
            this.emitNativeLanguageChange();
          }
          this.isNativeLangAlertOpen = false;
          return true;
        }
      })),
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isNativeLangAlertOpen = true;
  }

  presentTargetLanguagePicker() {
    this.targetLangButtons = [
      ...this.availableLanguages.map(l => ({
        text: l.name,
        handler: () => {
          if (this.settings) {
            this.settings.ttsLanguage = l.code;
            this.emitTtsLanguageChange();
          }
          this.isTargetLangAlertOpen = false;
          return true;
        }
      })),
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isTargetLangAlertOpen = true;
  }

  onNativeLangAlertDidDismiss(ev: CustomEvent<any>) {
    this.isNativeLangAlertOpen = false;
  }

  onTargetLangAlertDidDismiss(ev: CustomEvent<any>) {
    this.isTargetLangAlertOpen = false;
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
