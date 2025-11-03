import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ColorPickerOverlayService } from '../../services/color-picker-overlay.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-appearance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './appearance-modal.component.html',
  styleUrls: ['./appearance-modal.component.scss']
})
export class AppearanceModalComponent implements OnInit {
  @Input() settings: any;
  @Output() darkModeChange = new EventEmitter<void>();
  @Output() resetColorsClick = new EventEmitter<void>();
  @Output() previewColorsClick = new EventEmitter<void>();

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
    hardButtonBackground: '#d33447',
    hardButtonText: '#ffffff',
    goodButtonBackground: '#e6b000',
    goodButtonText: '#000000',
    easyButtonBackground: '#28ba62',
    easyButtonText: '#ffffff',
    incorrectButtonBackground: '#d63031',
    incorrectButtonText: '#ffffff'
  };

  currentColorScheme = { ...this.lightColorScheme };

  constructor(
    private modalCtrl: ModalController,
    private colorPickerOverlayService: ColorPickerOverlayService,
    private storageService: StorageService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    console.log('=== APPEARANCE MODAL ngOnInit ===');
    console.log('Initial settings:', this.settings);
    
    // Ensure settings object exists
    if (!this.settings) {
      console.warn('Settings object was undefined, creating default');
      this.settings = {
        darkMode: false,
        ttsLanguage: 'es-ES',
        ttsRate: 1.0,
        ttsPitch: 1.0,
        autoSpeak: false,
        studyReminders: true,
        maxCardsPerSession: 20
      };
    }
    
    console.log('Settings after check:', this.settings);
    console.log('Dark mode value:', this.settings.darkMode);
    
    await this.loadColorSchemes();
    this.switchColorScheme();
    
    console.log('=== APPEARANCE MODAL ngOnInit COMPLETE ===');
  }

  async loadColorSchemes() {
    try {
      const savedLightColors = await this.storageService.getSetting('lightColorScheme', null);
      if (savedLightColors) {
        this.lightColorScheme = { ...this.lightColorScheme, ...savedLightColors };
      }

      const savedDarkColors = await this.storageService.getSetting('darkColorScheme', null);
      if (savedDarkColors) {
        this.darkColorScheme = { ...this.darkColorScheme, ...savedDarkColors };
      }
    } catch (error) {
      console.error('Error loading color schemes:', error);
    }
  }

  switchColorScheme() {
    this.currentColorScheme = this.settings.darkMode 
      ? { ...this.darkColorScheme }
      : { ...this.lightColorScheme };
    console.log('DEBUG: Switched to', this.settings.darkMode ? 'dark' : 'light', 'color scheme');
  }

  async onDarkModeChange() {
    console.log('=== DARK MODE CHANGE ===');
    console.log('New dark mode value:', this.settings.darkMode);
    console.log('Settings object:', this.settings);
    
    // Save the dark mode setting
    await this.storageService.saveSetting('darkMode', this.settings.darkMode);
    console.log('Dark mode saved to storage');
    
    // Apply dark mode to body
    document.body.classList.toggle('dark', this.settings.darkMode);
    console.log('Body class toggled');
    
    // Switch color scheme and apply
    this.switchColorScheme();
    this.applyColors();
    console.log('Colors applied');
    
    // Emit the change event
    this.darkModeChange.emit();
    console.log('Change event emitted');
    
    await this.showToast(
      `Dark mode ${this.settings.darkMode ? 'enabled' : 'disabled'}`,
      'success'
    );
    console.log('=== DARK MODE CHANGE COMPLETE ===');
  }

  async openCustomColorPicker(colorKey: string, colorName: string, event?: Event) {
    const currentColor = (this.currentColorScheme as any)[colorKey];
    
    try {
      const result = await this.colorPickerOverlayService.open(colorName, currentColor);
      
      if (result.saved && result.color) {
        const newColor = result.color;
        (this.currentColorScheme as any)[colorKey] = newColor;
        
        // Update the appropriate mode's color scheme
        if (this.settings.darkMode) {
          (this.darkColorScheme as any)[colorKey] = newColor;
          await this.storageService.saveSetting('darkColorScheme', this.darkColorScheme);
        } else {
          (this.lightColorScheme as any)[colorKey] = newColor;
          await this.storageService.saveSetting('lightColorScheme', this.lightColorScheme);
        }
        
        // Apply colors immediately
        this.applyColors();
        await this.showToast(`${colorName} updated to ${newColor}`, 'success');
      }
    } catch (error) {
      console.error('Error opening color picker:', error);
      await this.showToast('Error opening color picker', 'danger');
    }
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
        hardButtonBackground: '#d33447',
        hardButtonText: '#ffffff',
        goodButtonBackground: '#e6b000',
        goodButtonText: '#000000',
        easyButtonBackground: '#28ba62',
        easyButtonText: '#ffffff',
        incorrectButtonBackground: '#d63031',
        incorrectButtonText: '#ffffff'
      };
      this.storageService.saveSetting('darkColorScheme', this.darkColorScheme);
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
        hardButtonBackground: '#eb445a',
        hardButtonText: '#ffffff',
        goodButtonBackground: '#ffc409',
        goodButtonText: '#000000',
        easyButtonBackground: '#2dd36f',
        easyButtonText: '#ffffff',
        incorrectButtonBackground: '#ff4757',
        incorrectButtonText: '#ffffff'
      };
      this.storageService.saveSetting('lightColorScheme', this.lightColorScheme);
    }
    
    this.switchColorScheme();
    this.showToast('Colors reset to default!', 'success');
  }

  applyColors() {
    // Ensure dark mode class is applied to body
    document.body.classList.toggle('dark', this.settings.darkMode);
    
    const root = document.documentElement;
    
    // Primary colors with RGB variants
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
    root.style.setProperty('--app-footer-background', this.currentColorScheme.footerBackground);
    
    // Text colors
    root.style.setProperty('--ion-text-color', this.currentColorScheme.textPrimary);
    root.style.setProperty('--ion-text-color-rgb', this.hexToRgb(this.currentColorScheme.textPrimary));
    root.style.setProperty('--ion-color-medium', this.currentColorScheme.textSecondary);
    root.style.setProperty('--ion-color-medium-rgb', this.hexToRgb(this.currentColorScheme.textSecondary));
    root.style.setProperty('--ion-toolbar-color', this.currentColorScheme.headerText);
    root.style.setProperty('--ion-tab-bar-color', this.currentColorScheme.footerText);
    root.style.setProperty('--app-card-text-color', this.currentColorScheme.cardText);
    root.style.setProperty('--app-footer-text-color', this.currentColorScheme.footerText);
    root.style.setProperty('--app-item-text-color', this.currentColorScheme.itemText);
    root.style.setProperty('--app-item-background', this.currentColorScheme.itemBackground);
    
    // Button colors
    root.style.setProperty('--ion-color-button', this.currentColorScheme.buttonBackground);
    root.style.setProperty('--ion-color-button-rgb', this.hexToRgb(this.currentColorScheme.buttonBackground));
    root.style.setProperty('--ion-color-button-contrast', this.currentColorScheme.buttonText);
    root.style.setProperty('--ion-color-button-contrast-rgb', this.hexToRgb(this.currentColorScheme.buttonText));
    
    // Flashcard Action Bar Colors
    root.style.setProperty('--review-hard-bg', this.currentColorScheme.hardButtonBackground);
    root.style.setProperty('--review-hard-text', this.currentColorScheme.hardButtonText);
    root.style.setProperty('--review-good-bg', this.currentColorScheme.goodButtonBackground);
    root.style.setProperty('--review-good-text', this.currentColorScheme.goodButtonText);
    root.style.setProperty('--review-easy-bg', this.currentColorScheme.easyButtonBackground);
    root.style.setProperty('--review-easy-text', this.currentColorScheme.easyButtonText);
    root.style.setProperty('--review-incorrect-bg', this.currentColorScheme.incorrectButtonBackground);
    root.style.setProperty('--review-incorrect-text', this.currentColorScheme.incorrectButtonText);
    
    console.log('DEBUG: Applied colors from appearance modal');
  }

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

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
