import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { StorageService } from '../../services/storage.service';
import { TtsService } from '../../services/tts.service';
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
  isDialectPickerOpen = false;
  isGenderPickerOpen = false;
  isVoicePickerOpen = false;
  languageInputs: Array<never> = [];
  nativeLangButtons: Array<{ text: string; role?: string; handler?: () => boolean | void | Promise<boolean> }> = [];
  targetLangButtons: Array<{ text: string; role?: string; handler?: () => boolean | void | Promise<boolean> }> = [];
  dialectButtons: Array<{ text: string; role?: string; handler?: () => boolean | void | Promise<boolean> }> = [];
  genderButtons: Array<{ text: string; role?: string; handler?: () => boolean | void | Promise<boolean> }> = [];
  voiceButtons: Array<{ text: string; role?: string; handler?: () => boolean | void | Promise<boolean> }> = [];

  // Spanish voice options
  spanishVoices = {
    'es-ES': {
      male: [
        { name: 'es-ES-Neural2-B', displayName: 'Neural2-B (Male)' },
        { name: 'es-ES-Neural2-F', displayName: 'Neural2-F (Male)' }
      ],
      female: [
        { name: 'es-ES-Neural2-A', displayName: 'Neural2-A (Female)' },
        { name: 'es-ES-Neural2-C', displayName: 'Neural2-C (Female)' },
        { name: 'es-ES-Neural2-D', displayName: 'Neural2-D (Female)' },
        { name: 'es-ES-Neural2-E', displayName: 'Neural2-E (Female)' }
      ]
    },
    'es-US': {
      male: [
        { name: 'es-US-Neural2-B', displayName: 'Neural2-B (Male)' },
        { name: 'es-US-Neural2-C', displayName: 'Neural2-C (Male)' },
        { name: 'es-US-Studio-B', displayName: 'Studio-B (Male, Natural)' }
      ],
      female: [
        { name: 'es-US-Neural2-A', displayName: 'Neural2-A (Female)' }
      ]
    }
  };

  constructor(
    private modalCtrl: ModalController,
    private storageService: StorageService,
    private ttsService: TtsService
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
    console.log('TTS Modal: Opening native language picker');
    console.log('TTS Modal: Available languages:', this.availableLanguages);
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
    console.log('TTS Modal: Native lang buttons:', this.nativeLangButtons.length);
    this.isNativeLangAlertOpen = true;
    console.log('TTS Modal: Alert open flag set to true');
  }

  presentTargetLanguagePicker() {
    console.log('TTS Modal: Opening target language picker');
    console.log('TTS Modal: Available languages:', this.availableLanguages);
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
    console.log('TTS Modal: Target lang buttons:', this.targetLangButtons.length);
    this.isTargetLangAlertOpen = true;
    console.log('TTS Modal: Alert open flag set to true');
  }

  onNativeLangAlertDidDismiss(ev: CustomEvent<any>) {
    this.isNativeLangAlertOpen = false;
  }

  onTargetLangAlertDidDismiss(ev: CustomEvent<any>) {
    this.isTargetLangAlertOpen = false;
  }

  formatRate = (value: number) => {
    return `${value.toFixed(1)}x`;
  };

  private ratePreviewTimeout: any = null;

  async onTtsRateChange() {
    console.log('TTS Modal: Speech rate changed to:', this.settings.ttsRate);
    
    // Update TTS service directly
    this.ttsService.setRate(this.settings.ttsRate);
    
    // Save directly to storage
    try {
      await this.storageService.saveSetting('ttsRate', this.settings.ttsRate);
      console.log('TTS Modal: Speech rate saved to storage successfully');
      // Emit for any listeners
      this.ttsRateChange.emit();
    } catch (error) {
      console.error('TTS Modal: Failed to save ttsRate setting:', error);
    }
    
    // Debounce the voice preview to avoid playing on every slider tick
    // This is outside try/catch so it always runs
    if (this.ratePreviewTimeout) {
      clearTimeout(this.ratePreviewTimeout);
    }
    this.ratePreviewTimeout = setTimeout(() => {
      console.log('TTS Modal: Debounce timeout fired, calling playRatePreview');
      this.playRatePreview();
    }, 500); // Wait 500ms after user stops sliding
  }

  /**
   * Play a preview of the current speech rate
   */
  private async playRatePreview() {
    const dialect = this.settings?.spanishDialect || 'es-ES';
    const voiceName = this.settings?.spanishVoiceName || 'es-ES-Neural2-B';
    const sampleText = this.getVoiceSampleText(dialect);
    
    console.log('TTS Modal: Playing rate preview at', this.settings.ttsRate, 'x speed');
    
    try {
      await this.ttsService.speakWithVoice(sampleText, dialect, voiceName);
    } catch (error) {
      console.error('TTS Modal: Failed to play rate preview:', error);
    }
  }

  async onAutoSpeakToggle(newValue: boolean) {
    console.log('TTS Modal: Auto-speak on flip toggled to:', newValue);
    this.settings.autoSpeak = newValue;
    
    // Save directly to storage (like appearance modal does)
    try {
      await this.storageService.saveSetting('autoSpeak', newValue);
      console.log('TTS Modal: Auto-speak on flip saved to storage successfully');
    } catch (error) {
      console.error('TTS Modal: Failed to save autoSpeak setting:', error);
    }
    
    // Still emit for any listeners (optional)
    this.autoSpeakChange.emit();
  }

  async onAutoSpeakOnLoadToggle(newValue: boolean) {
    console.log('TTS Modal: Auto-speak on load toggled to:', newValue);
    this.settings.autoSpeakOnLoad = newValue;
    
    // Save directly to storage
    try {
      await this.storageService.saveSetting('autoSpeakOnLoad', newValue);
      console.log('TTS Modal: Auto-speak on load saved to storage successfully');
    } catch (error) {
      console.error('TTS Modal: Failed to save autoSpeakOnLoad setting:', error);
    }
  }

  // Spanish voice selection methods
  isSpanishSelected(): boolean {
    return this.settings?.ttsLanguage?.startsWith('es-') || false;
  }

  getDialectName(dialect: string): string {
    if (dialect === 'es-ES') return 'Spain';
    if (dialect === 'es-US') return 'US / Latin America';
    return 'Unknown';
  }

  getVoiceDisplayName(voiceName: string): string {
    for (const dialect of Object.values(this.spanishVoices)) {
      for (const gender of Object.values(dialect)) {
        const voice = gender.find(v => v.name === voiceName);
        if (voice) return voice.displayName;
      }
    }
    return voiceName || 'Default';
  }

  presentSpanishDialectPicker() {
    this.dialectButtons = [
      {
        text: 'Spain (es-ES)',
        handler: async () => {
          if (this.settings) {
            this.settings.spanishDialect = 'es-ES';
            await this.storageService.saveSetting('spanishDialect', 'es-ES');
            // Update voice to match new dialect
            this.updateVoiceForDialect('es-ES');
          }
          this.isDialectPickerOpen = false;
          return true;
        }
      },
      {
        text: 'US / Latin America (es-US)',
        handler: async () => {
          if (this.settings) {
            this.settings.spanishDialect = 'es-US';
            await this.storageService.saveSetting('spanishDialect', 'es-US');
            // Update voice to match new dialect
            this.updateVoiceForDialect('es-US');
          }
          this.isDialectPickerOpen = false;
          return true;
        }
      },
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isDialectPickerOpen = true;
  }

  presentVoiceGenderPicker() {
    this.genderButtons = [
      {
        text: 'Male',
        handler: async () => {
          if (this.settings) {
            this.settings.spanishVoiceGender = 'male';
            await this.storageService.saveSetting('spanishVoiceGender', 'male');
            // Update voice to match new gender
            this.updateVoiceForGender('male');
          }
          this.isGenderPickerOpen = false;
          return true;
        }
      },
      {
        text: 'Female',
        handler: async () => {
          if (this.settings) {
            this.settings.spanishVoiceGender = 'female';
            await this.storageService.saveSetting('spanishVoiceGender', 'female');
            // Update voice to match new gender
            this.updateVoiceForGender('female');
          }
          this.isGenderPickerOpen = false;
          return true;
        }
      },
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isGenderPickerOpen = true;
  }

  presentVoicePicker() {
    const dialect = this.settings?.spanishDialect || 'es-ES';
    const gender = this.settings?.spanishVoiceGender || 'male';
    const voices = this.spanishVoices[dialect as 'es-ES' | 'es-US'][gender as 'male' | 'female'];

    this.voiceButtons = [
      ...voices.map(voice => ({
        text: voice.displayName,
        handler: async () => {
          if (this.settings) {
            this.settings.spanishVoiceName = voice.name;
            await this.storageService.saveSetting('spanishVoiceName', voice.name);
            this.emitTtsLanguageChange();
            // Play a preview of the selected voice
            this.playVoicePreview(voice.name, dialect);
          }
          this.isVoicePickerOpen = false;
          return true;
        }
      })),
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isVoicePickerOpen = true;
  }

  /**
   * Play a preview of the selected voice
   */
  private async playVoicePreview(voiceName: string, languageCode: string) {
    const sampleText = this.getVoiceSampleText(languageCode);
    console.log('TTS Modal: Playing voice preview for', voiceName, 'with text:', sampleText);
    
    try {
      // Use the TTS service to speak the sample text with the selected voice
      await this.ttsService.speakWithVoice(sampleText, languageCode, voiceName);
    } catch (error) {
      console.error('TTS Modal: Failed to play voice preview:', error);
    }
  }

  /**
   * Get a sample text for voice preview based on language
   */
  private getVoiceSampleText(languageCode: string): string {
    if (languageCode.startsWith('es-')) {
      return 'Hola, ¿cómo estás?';
    } else if (languageCode.startsWith('fr-')) {
      return 'Bonjour, comment allez-vous?';
    } else if (languageCode.startsWith('de-')) {
      return 'Hallo, wie geht es Ihnen?';
    } else if (languageCode.startsWith('it-')) {
      return 'Ciao, come stai?';
    } else if (languageCode.startsWith('pt-')) {
      return 'Olá, como você está?';
    } else {
      return 'Hello, how are you?';
    }
  }

  private async updateVoiceForDialect(dialect: 'es-ES' | 'es-US') {
    const gender = this.settings?.spanishVoiceGender || 'male';
    const voices = this.spanishVoices[dialect][gender as 'male' | 'female'];
    if (voices.length > 0) {
      this.settings.spanishVoiceName = voices[0].name;
      await this.storageService.saveSetting('spanishVoiceName', voices[0].name);
      this.emitTtsLanguageChange();
    }
  }

  private async updateVoiceForGender(gender: 'male' | 'female') {
    const dialect = this.settings?.spanishDialect || 'es-ES';
    const voices = this.spanishVoices[dialect as 'es-ES' | 'es-US'][gender];
    if (voices.length > 0) {
      this.settings.spanishVoiceName = voices[0].name;
      await this.storageService.saveSetting('spanishVoiceName', voices[0].name);
      this.emitTtsLanguageChange();
    }
  }
}
