import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ModalController, PopoverController, IonContent } from '@ionic/angular';
import { IonModal } from '@ionic/angular/standalone';
import { TtsModalComponent } from '../modals/tts/tts-modal.component';
import { AppearanceModalComponent } from '../modals/appearance/appearance-modal.component';
import { StudyModalComponent } from '../modals/study/study-modal.component';
import { ImagesModalComponent } from '../modals/images/images-modal.component';
import { DataModalComponent } from '../modals/data/data-modal.component';
import { AboutModalComponent } from '../modals/about/about-modal.component';
import { Router } from '@angular/router';
import { ColorPickerPopoverComponent } from '../components/color-picker-popover.component';
import { ColorPickerOverlayService } from '../services/color-picker-overlay.service';
import { TtsService } from '../services/tts.service';
import { ImageService } from '../services/image.service';
import { StorageService } from '../services/storage.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { addIcons } from 'ionicons';
import { language, colorPalette, school, server, informationCircle, image, close } from 'ionicons/icons';

// Register icons at module import time so they are available before first render
try {
  addIcons({
    'language': language,
    'color-palette': colorPalette,
    'school': school,
    'server': server,
    'information-circle': informationCircle,
    'image': image,
    'close': close,
  });
} catch {}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    IonModal,
    TtsModalComponent,
    AppearanceModalComponent,
    StudyModalComponent,
    ImagesModalComponent,
    DataModalComponent,
    AboutModalComponent,
  ]
})

export class SettingsPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent, { read: ElementRef, static: true }) contentEl!: ElementRef<HTMLElement>;
  // In Angular, template refs on web components resolve to ElementRef
  @ViewChild('ttsModal', { read: ElementRef, static: false }) ttsModalRef!: ElementRef<any>;
  @ViewChild('appearanceModal', { read: ElementRef, static: false }) appearanceModalRef!: ElementRef<any>;
  @ViewChild('studyModal', { read: ElementRef, static: false }) studyModalRef!: ElementRef<any>;
  @ViewChild('imagesModal', { read: ElementRef, static: false }) imagesModalRef!: ElementRef<any>;
  @ViewChild('dataModal', { read: ElementRef, static: false }) dataModalRef!: ElementRef<any>;
  @ViewChild('aboutModal', { read: ElementRef, static: false }) aboutModalRef!: ElementRef<any>;
  presentingEl!: HTMLElement;
  modals: {
    tts: boolean;
    appearance: boolean;
    study: boolean;
    images: boolean;
    data: boolean;
    about: boolean;
  } = {
    tts: false,
    appearance: false,
    study: false,
    images: false,
    data: false,
    about: false,
  };
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

  // Color schemes for light and dark modes
  lightColorScheme = {
    primary: '#3880ff',
    secondary: '#3dc2ff',
    tertiary: '#5260ff',
    background: '#ffffff',
    cardBackground: '#f8f9fa',
    headerBackground: '#ffffff',
    footerBackground: '#ffffff',
    itemBackground: '#ffffff',
    textPrimary: '#000000',
    textSecondary: '#666666',
    cardText: '#000000',
    headerText: '#000000',
    footerText: '#000000',
    itemText: '#000000',
    buttonBackground: '#3880ff',
    buttonText: '#ffffff',
    outlinedButtonColor: '#eb445a',
    // Flashcard Action Bar Colors
    hardButtonBackground: '#eb445a',
    hardButtonText: '#ffffff',
    goodButtonBackground: '#ffc409',
    goodButtonText: '#000000',
    easyButtonBackground: '#2dd36f',
    easyButtonText: '#ffffff',
    incorrectButtonBackground: '#ff4757',
    incorrectButtonText: '#ffffff'
  };

  darkColorScheme = {
    primary: '#428cff',
    secondary: '#50c8ff',
    tertiary: '#6370ff',
    background: '#121212',
    cardBackground: '#1e1e1e',
    headerBackground: '#1f1f1f',
    footerBackground: '#1f1f1f',
    itemBackground: '#1e1e1e',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    cardText: '#ffffff',
    headerText: '#ffffff',
    footerText: '#ffffff',
    itemText: '#ffffff',
    buttonBackground: '#428cff',
    buttonText: '#ffffff',
    outlinedButtonColor: '#d33447',
    // Flashcard Action Bar Colors (Dark Mode)
    hardButtonBackground: '#d33447',
    hardButtonText: '#ffffff',
    goodButtonBackground: '#e6b000',
    goodButtonText: '#000000',
    easyButtonBackground: '#28ba62',
    easyButtonText: '#ffffff',
    incorrectButtonBackground: '#d63031',
    incorrectButtonText: '#ffffff'
  };

  // Current active color scheme (switches based on dark mode)
  currentColorScheme = { ...this.lightColorScheme };

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
    private toastController: ToastController,
    private modalController: ModalController,
    private popoverController: PopoverController,
    private colorPickerOverlayService: ColorPickerOverlayService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Platform helpers
  get isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  

  ngOnInit() {
    // Register specific Ionicons used on this page to avoid runtime icon load warnings
    try {
      addIcons({
        'language': language,
        'color-palette': colorPalette,
        'school': school,
        'server': server,
        'information-circle': informationCircle,
        'image': image,
        'close': close,
      });
    } catch (e) {
      console.warn('Ionicons addIcons failed (possibly already registered):', e);
    }
    this.loadSettings();
  }

  ngAfterViewInit() {
    // Set presenting element after view init so the element exists
    this.presentingEl = this.contentEl?.nativeElement ?? document.body;
    // Diagnostics for modal refs
    console.log('Modal refs after view init:', {
      tts: this.ttsModalRef,
      appearance: this.appearanceModalRef,
      study: this.studyModalRef,
      images: this.imagesModalRef,
      data: this.dataModalRef,
      about: this.aboutModalRef,
    });
    // Verify custom element registration and upgrade
    const ce = (window as any).customElements?.get?.('ion-modal');
    console.log('customElements.get(\'ion-modal\') =>', ce);
    const firstModal: any = document.querySelector('ion-modal');
    console.log('First ion-modal element present:', !!firstModal, 'has present():', typeof firstModal?.present);
  }

  onModalDidPresent(key: 'tts' | 'appearance' | 'study' | 'images' | 'data' | 'about') {
    console.log('didPresent', key);
  }


  // New helpers for [isOpen] pattern
  openModalKey(key: 'tts' | 'appearance' | 'study' | 'images' | 'data' | 'about') {
    if (!(key in this.modals)) {
      console.error('openModalKey: unknown key', key);
      return;
    }
    this.modals[key] = true;
    console.log('openModalKey ->', key, this.modals);
    // Ensure change detection runs so the modal sees the new isOpen value
    this.cdr.detectChanges();
  }

  closeModalKey(key: 'tts' | 'appearance' | 'study' | 'images' | 'data' | 'about') {
    if (!(key in this.modals)) {
      console.error('closeModalKey: unknown key', key);
      return;
    }
    this.modals[key] = false;
    console.log('closeModalKey ->', key, this.modals);
    this.cdr.detectChanges();
  }

  async openModal(modalRef: any) {
    try {
      // Prefer passed ref; fallback to known ViewChilds if a string key is provided
      let ref: any = modalRef;
      if (typeof modalRef === 'string') {
        ref = (this as any)[modalRef];
      }
      const modalEl: any = ref?.el ?? ref?.nativeElement ?? ref;
      if (!modalEl || typeof modalEl.present !== 'function') {
        console.error('Open modal failed: invalid modalRef/modalEl', { ref, modalRef, modalElType: typeof modalEl, keys: Object.keys(modalEl || {}) });
        return;
      }
      await modalEl.present();
    } catch (e) {
      console.error('Open modal failed with error:', e);
      this.showToast('Unable to open modal', 'danger');
    }
  }

  async closeModal(modalRef: any) {
    try {
      let ref: any = modalRef;
      if (typeof modalRef === 'string') {
        ref = (this as any)[modalRef];
      }
      const modalEl: any = ref?.el ?? ref?.nativeElement ?? ref;
      if (!modalEl || typeof modalEl.dismiss !== 'function') {
        console.error('Close modal failed: invalid modalRef/modalEl', { ref, modalRef, modalElType: typeof modalEl, keys: Object.keys(modalEl || {}) });
        return;
      }
      await modalEl.dismiss();
    } catch (e) {
      console.error('Close modal failed with error:', e);
      this.showToast('Unable to close modal', 'danger');
    }
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

      // Load custom color schemes
      await this.loadColorSchemes();
      
      // Apply dark mode and colors
      this.applyDarkMode();
      this.switchColorScheme();
      
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
    this.applyDarkMode();
    this.switchColorScheme();
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
      const fileName = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;

      const platform = Capacitor.getPlatform();

      if (platform === 'ios' || platform === 'android') {
        // Write to Documents then share
        await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
        // iOS prefers url; Android supports files
        if (platform === 'ios') {
          await Share.share({
            title: 'Export Data',
            text: 'Flashcards backup',
            url: uri,
          });
        } else {
          await Share.share({
            title: 'Export Data',
            text: 'Flashcards backup',
            files: [uri],
          });
        }
      } else {
        // Web download
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
  
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

  // Color customization methods
  async loadColorSchemes() {
    try {
      // Load custom light mode colors
      const savedLightColors = await this.storageService.getSetting('lightColorScheme', null);
      if (savedLightColors) {
        this.lightColorScheme = { ...this.lightColorScheme, ...savedLightColors };
      }

      // Load custom dark mode colors
      const savedDarkColors = await this.storageService.getSetting('darkColorScheme', null);
      if (savedDarkColors) {
        this.darkColorScheme = { ...this.darkColorScheme, ...savedDarkColors };
      }
    } catch (error) {
      console.error('Error loading color schemes:', error);
    }
  }

  switchColorScheme() {
    // Switch between light and dark color schemes
    this.currentColorScheme = this.settings.darkMode 
      ? { ...this.darkColorScheme }
      : { ...this.lightColorScheme };
    
    console.log('DEBUG: Switched to', this.settings.darkMode ? 'dark' : 'light', 'color scheme');
    this.applyColors();
  }

  onColorChange(colorKey: string, event: any) {
    const newColor = event.target.value;
    (this.currentColorScheme as any)[colorKey] = newColor;
    
    // Update the appropriate mode's color scheme
    if (this.settings.darkMode) {
      (this.darkColorScheme as any)[colorKey] = newColor;
      this.saveSetting('darkColorScheme', this.darkColorScheme);
    } else {
      (this.lightColorScheme as any)[colorKey] = newColor;
      this.saveSetting('lightColorScheme', this.lightColorScheme);
    }
    
    this.applyColors();
  }

  onHexInput(colorKey: string, event: any) {
    let hexValue = event.target.value;
    
    // Auto-add # if missing
    if (hexValue && !hexValue.startsWith('#')) {
      hexValue = '#' + hexValue;
      event.target.value = hexValue;
    }
    
    // Validate hex color format (3 or 6 characters after #)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(hexValue)) {
      // Convert 3-digit hex to 6-digit
      if (hexValue.length === 4) {
        hexValue = '#' + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2] + hexValue[3] + hexValue[3];
        event.target.value = hexValue;
      }
      
      (this.currentColorScheme as any)[colorKey] = hexValue;
      
      // Update the appropriate mode's color scheme
      if (this.settings.darkMode) {
        (this.darkColorScheme as any)[colorKey] = hexValue;
        this.saveSetting('darkColorScheme', this.darkColorScheme);
      } else {
        (this.lightColorScheme as any)[colorKey] = hexValue;
        this.saveSetting('lightColorScheme', this.lightColorScheme);
      }
      
      this.applyColors();
    }
  }

  applyColors() {
    // Apply colors to CSS custom properties
    const root = document.documentElement;
    
    // Primary colors with RGB variants for transparency
    const primaryRgb = this.hexToRgb(this.currentColorScheme.primary);
    const secondaryRgb = this.hexToRgb(this.currentColorScheme.secondary);
    const tertiaryRgb = this.hexToRgb(this.currentColorScheme.tertiary);
    
    // Primary color variants
    root.style.setProperty('--ion-color-primary', this.currentColorScheme.primary);
    root.style.setProperty('--ion-color-primary-rgb', primaryRgb);
    root.style.setProperty('--ion-color-primary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-primary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-primary-shade', this.darkenColor(this.currentColorScheme.primary, 0.12));
    root.style.setProperty('--ion-color-primary-tint', this.lightenColor(this.currentColorScheme.primary, 0.1));
    
    // Debug: Log the primary color being applied
    console.log('DEBUG: Setting --ion-color-primary to:', this.currentColorScheme.primary);
    console.log('DEBUG: Current CSS variable value:', getComputedStyle(root).getPropertyValue('--ion-color-primary'));
    
    // Force immediate update of all primary-colored elements
    this.forceElementUpdate();
    
    // Secondary color variants
    root.style.setProperty('--ion-color-secondary', this.currentColorScheme.secondary);
    root.style.setProperty('--ion-color-secondary-rgb', secondaryRgb);
    root.style.setProperty('--ion-color-secondary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-secondary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-secondary-shade', this.darkenColor(this.currentColorScheme.secondary, 0.12));
    root.style.setProperty('--ion-color-secondary-tint', this.lightenColor(this.currentColorScheme.secondary, 0.1));
    
    // Tertiary color variants
    root.style.setProperty('--ion-color-tertiary', this.currentColorScheme.tertiary);
    root.style.setProperty('--ion-color-tertiary-rgb', tertiaryRgb);
    root.style.setProperty('--ion-color-tertiary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-tertiary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-tertiary-shade', this.darkenColor(this.currentColorScheme.tertiary, 0.12));
    root.style.setProperty('--ion-color-tertiary-tint', this.lightenColor(this.currentColorScheme.tertiary, 0.1));
    
    // Background colors
    root.style.setProperty('--ion-background-color', this.currentColorScheme.background);
    root.style.setProperty('--ion-background-color-rgb', this.hexToRgb(this.currentColorScheme.background));
    root.style.setProperty('--ion-card-background', this.currentColorScheme.cardBackground);
    root.style.setProperty('--ion-item-background', this.currentColorScheme.cardBackground);
    root.style.setProperty('--ion-toolbar-background', this.currentColorScheme.headerBackground);
    root.style.setProperty('--ion-tab-bar-background', this.currentColorScheme.footerBackground);
    
    // Custom footer background variable
    root.style.setProperty('--app-footer-background', this.currentColorScheme.footerBackground);
    
    // Text colors - map to proper Ionic text color variables
    root.style.setProperty('--ion-text-color', this.currentColorScheme.textPrimary);
    root.style.setProperty('--ion-text-color-rgb', this.hexToRgb(this.currentColorScheme.textPrimary));
    
    // Secondary text color - use a custom property that doesn't conflict with step variables
    root.style.setProperty('--ion-color-medium', this.currentColorScheme.textSecondary);
    root.style.setProperty('--ion-color-medium-rgb', this.hexToRgb(this.currentColorScheme.textSecondary));
    root.style.setProperty('--ion-color-medium-contrast', '#ffffff');
    root.style.setProperty('--ion-color-medium-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-medium-shade', this.darkenColor(this.currentColorScheme.textSecondary, 0.12));
    root.style.setProperty('--ion-color-medium-tint', this.lightenColor(this.currentColorScheme.textSecondary, 0.1));
    
    // Header text colors
    root.style.setProperty('--ion-toolbar-color', this.currentColorScheme.headerText);
    root.style.setProperty('--ion-tab-bar-color', this.currentColorScheme.footerText);
    
    // Custom text color variables
    root.style.setProperty('--app-card-text-color', this.currentColorScheme.cardText);
    root.style.setProperty('--app-footer-text-color', this.currentColorScheme.footerText);
    root.style.setProperty('--app-item-text-color', this.currentColorScheme.itemText);
    
    // Custom item background variable
    root.style.setProperty('--app-item-background', this.currentColorScheme.itemBackground);
    
    // Button colors - create custom button color variables
    root.style.setProperty('--ion-color-button', this.currentColorScheme.buttonBackground);
    root.style.setProperty('--ion-color-button-rgb', this.hexToRgb(this.currentColorScheme.buttonBackground));
    root.style.setProperty('--ion-color-button-contrast', this.currentColorScheme.buttonText);
    root.style.setProperty('--ion-color-button-contrast-rgb', this.hexToRgb(this.currentColorScheme.buttonText));
    root.style.setProperty('--ion-color-button-shade', this.darkenColor(this.currentColorScheme.buttonBackground, 0.12));
    root.style.setProperty('--ion-color-button-tint', this.lightenColor(this.currentColorScheme.buttonBackground, 0.1));
    
    // Outlined button color - for outline buttons like "Reset to Default"
    root.style.setProperty('--ion-color-danger', this.currentColorScheme.outlinedButtonColor);
    root.style.setProperty('--ion-color-danger-rgb', this.hexToRgb(this.currentColorScheme.outlinedButtonColor));
    root.style.setProperty('--ion-color-danger-contrast', '#ffffff');
    root.style.setProperty('--ion-color-danger-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-danger-shade', this.darkenColor(this.currentColorScheme.outlinedButtonColor, 0.12));
    root.style.setProperty('--ion-color-danger-tint', this.lightenColor(this.currentColorScheme.outlinedButtonColor, 0.1));
    
    // Flashcard Action Bar Colors - create custom CSS variables
    root.style.setProperty('--review-hard-bg', this.currentColorScheme.hardButtonBackground);
    root.style.setProperty('--review-hard-text', this.currentColorScheme.hardButtonText);
    root.style.setProperty('--review-good-bg', this.currentColorScheme.goodButtonBackground);
    root.style.setProperty('--review-good-text', this.currentColorScheme.goodButtonText);
    root.style.setProperty('--review-easy-bg', this.currentColorScheme.easyButtonBackground);
    root.style.setProperty('--review-easy-text', this.currentColorScheme.easyButtonText);
    root.style.setProperty('--review-incorrect-bg', this.currentColorScheme.incorrectButtonBackground);
    root.style.setProperty('--review-incorrect-text', this.currentColorScheme.incorrectButtonText);
    
    console.log('DEBUG: Applied comprehensive custom colors to CSS variables');
  }

  // Force immediate update of all elements that use CSS variables
  forceElementUpdate() {
    // Trigger a reflow to ensure CSS variable changes are applied immediately
    document.documentElement.offsetHeight;
    
    // Force update of all moon icons specifically
    const moonIcons = document.querySelectorAll('ion-icon[name="moon"]');
    moonIcons.forEach(icon => {
      const svgs = icon.querySelectorAll('svg, svg path');
      svgs.forEach(svg => {
        (svg as HTMLElement).style.fill = this.currentColorScheme.primary;
        (svg as HTMLElement).style.color = this.currentColorScheme.primary;
      });
    });
    
    // Also ensure Angular change detection runs
    setTimeout(() => {
      // Force Angular to check for changes
      if ((this as any).cdr) {
        (this as any).cdr.detectChanges();
      }
    }, 0);
  }

  // Helper method to convert hex to RGB
  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r},${g},${b}`;
    }
    return '0,0,0';
  }

  // Helper method to darken a color
  darkenColor(hex: string, amount: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = Math.max(0, Math.floor(parseInt(result[1], 16) * (1 - amount)));
      const g = Math.max(0, Math.floor(parseInt(result[2], 16) * (1 - amount)));
      const b = Math.max(0, Math.floor(parseInt(result[3], 16) * (1 - amount)));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return hex;
  }

  // Helper method to lighten a color
  lightenColor(hex: string, amount: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = Math.min(255, Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * amount));
      const g = Math.min(255, Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * amount));
      const b = Math.min(255, Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * amount));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return hex;
  }

  resetColors() {
    // Reset to default colors
    if (this.settings.darkMode) {
      this.darkColorScheme = {
        primary: '#428cff',
        secondary: '#50c8ff',
        tertiary: '#6370ff',
        background: '#121212',
        cardBackground: '#1e1e1e',
        headerBackground: '#1f1f1f',
        footerBackground: '#1f1f1f',
        itemBackground: '#1e1e1e',
        textPrimary: '#ffffff',
        textSecondary: '#b0b0b0',
        cardText: '#ffffff',
        headerText: '#ffffff',
        footerText: '#ffffff',
        itemText: '#ffffff',
        buttonBackground: '#428cff',
        buttonText: '#ffffff',
        outlinedButtonColor: '#d33447',
        // Flashcard Action Bar Colors (Dark Mode)
        hardButtonBackground: '#d33447',
        hardButtonText: '#ffffff',
        goodButtonBackground: '#e6b000',
        goodButtonText: '#000000',
        easyButtonBackground: '#28ba62',
        easyButtonText: '#ffffff',
        incorrectButtonBackground: '#d63031',
        incorrectButtonText: '#ffffff'
      };
      this.saveSetting('darkColorScheme', this.darkColorScheme);
    } else {
      this.lightColorScheme = {
        primary: '#3880ff',
        secondary: '#3dc2ff',
        tertiary: '#5260ff',
        background: '#ffffff',
        cardBackground: '#f8f9fa',
        headerBackground: '#ffffff',
        footerBackground: '#ffffff',
        itemBackground: '#ffffff',
        textPrimary: '#000000',
        textSecondary: '#666666',
        cardText: '#000000',
        headerText: '#000000',
        footerText: '#000000',
        itemText: '#000000',
        buttonBackground: '#3880ff',
        buttonText: '#ffffff',
        outlinedButtonColor: '#eb445a',
        // Flashcard Action Bar Colors
        hardButtonBackground: '#eb445a',
        hardButtonText: '#ffffff',
        goodButtonBackground: '#ffc409',
        goodButtonText: '#000000',
        easyButtonBackground: '#2dd36f',
        easyButtonText: '#ffffff',
        incorrectButtonBackground: '#ff4757',
        incorrectButtonText: '#ffffff'
      };
      this.saveSetting('lightColorScheme', this.lightColorScheme);
    }
    
    this.switchColorScheme();
    this.showToast('Colors reset to default!', 'success');
  }

  async previewColors() {
    this.applyColors();
    this.showToast('Color preview applied!', 'success');
  }

  

  openHelp() {
    this.router.navigate(['/tabs/help']);
  }

  openBuyMeCoffee() {
    window.open('https://buymeacoffee.com/lallen30', '_blank');
  }

  async openCustomColorPicker(colorKey: string, colorName: string, event?: Event) {
    const currentColor = (this.currentColorScheme as any)[colorKey];
    
    try {
      const result = await this.colorPickerOverlayService.open(colorName, currentColor);
      
      if (result && result.saved && result.color) {
        const newColor = result.color;
        (this.currentColorScheme as any)[colorKey] = newColor;
        
        // Update the appropriate mode's color scheme
        if (this.settings.darkMode) {
          (this.darkColorScheme as any)[colorKey] = newColor;
          this.saveSetting('darkColorScheme', this.darkColorScheme);
        } else {
          (this.lightColorScheme as any)[colorKey] = newColor;
          this.saveSetting('lightColorScheme', this.lightColorScheme);
        }
        
        // Apply colors immediately
        this.applyColors();
        this.showToast(`${colorName} updated to ${newColor}`, 'success');
      } else if (Capacitor.getPlatform() === 'ios') {
        // Fallback on iOS if overlay was cancelled or returned no result
        this.openNativeColorPickerWithSave(colorKey, colorName, currentColor);
      }
    } catch (error) {
      console.error('Error opening color picker:', error);
      // On iOS, fall back to native color input if overlay fails
      if (Capacitor.getPlatform() === 'ios') {
        this.openNativeColorPickerWithSave(colorKey, colorName, currentColor);
        return;
      }
      this.showToast('Error opening color picker', 'danger');
    }
  }

  openNativeColorPickerWithSave(colorKey: string, colorName: string, currentColor: string) {
    // Create temporary hidden color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor;
    colorInput.style.position = 'absolute';
    colorInput.style.left = '-9999px';
    document.body.appendChild(colorInput);

    colorInput.addEventListener('change', async () => {
      const selectedColor = colorInput.value;
      
      // Show confirmation alert with save button
      const confirmAlert = await this.alertController.create({
        header: colorName,
        message: `Selected color: ${selectedColor}`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Save',
            handler: () => {
              (this.currentColorScheme as any)[colorKey] = selectedColor;
              this.onColorChange(colorKey, { target: { value: selectedColor } });
              this.showToast(`${colorName} saved: ${selectedColor}`, 'success');
            }
          }
        ]
      });
      
      await confirmAlert.present();
      document.body.removeChild(colorInput);
    });

    // Trigger the color picker
    colorInput.click();
  }

  triggerNativeColorPicker(colorKey: string, colorName: string) {
    // Create a temporary color input
    const tempInput = document.createElement('input');
    tempInput.type = 'color';
    tempInput.value = (this.currentColorScheme as any)[colorKey];
    tempInput.style.opacity = '0';
    tempInput.style.position = 'absolute';
    tempInput.style.pointerEvents = 'none';
    document.body.appendChild(tempInput);

    tempInput.addEventListener('change', (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      (this.currentColorScheme as any)[colorKey] = newColor;
      this.onColorChange(colorKey, { target: { value: newColor } });
      this.showToast(`${colorName} updated to ${newColor}`, 'success');
      document.body.removeChild(tempInput);
    });

    tempInput.click();
  }

  getPresetColors(): string[] {
    // Curated preset colors for quick selection
    return [
      // Blues
      '#3880ff', '#428cff', '#0066cc', '#1e90ff', '#4169e1',
      // Greens  
      '#2dd36f', '#10dc60', '#00c851', '#4caf50', '#8bc34a',
      // Purples
      '#6a64ff', '#5260ff', '#9c27b0', '#673ab7', '#3f51b5',
      // Reds
      '#eb445a', '#f04141', '#e91e63', '#f44336', '#ff5722',
      // Oranges
      '#ffc409', '#ffce00', '#ff9800', '#ff6f00', '#ff5722',
      // Teals
      '#2dd36f', '#00d4aa', '#009688', '#26a69a', '#4db6ac',
      // Grays (for text/backgrounds)
      '#92949c', '#666666', '#333333', '#1a1a1a', '#f8f9fa'
    ];
  }
}
