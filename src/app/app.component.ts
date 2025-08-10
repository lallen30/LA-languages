import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private storageService: StorageService) {}

  async ngOnInit() {
    // Apply saved colors on app startup
    await this.initializeColors();
  }

  private async initializeColors() {
    try {
      // Load saved settings
      const darkMode = await this.storageService.getSetting('darkMode', false);
      const lightColorScheme = await this.storageService.getSetting('lightColorScheme', this.getDefaultLightColorScheme());
      const darkColorScheme = await this.storageService.getSetting('darkColorScheme', this.getDefaultDarkColorScheme());
      
      // Apply the appropriate color scheme
      const currentColorScheme = darkMode ? darkColorScheme : lightColorScheme;
      this.applyColors(currentColorScheme);
      
      console.log('DEBUG: Colors initialized on app startup');
    } catch (error) {
      console.error('Error initializing colors:', error);
    }
  }

  private applyColors(colorScheme: any) {
    const root = document.documentElement;
    
    // Primary colors with RGB variants
    const primaryRgb = this.hexToRgb(colorScheme.primary);
    const secondaryRgb = this.hexToRgb(colorScheme.secondary);
    const tertiaryRgb = this.hexToRgb(colorScheme.tertiary);
    
    // Primary color variants
    root.style.setProperty('--ion-color-primary', colorScheme.primary);
    root.style.setProperty('--ion-color-primary-rgb', primaryRgb);
    root.style.setProperty('--ion-color-primary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-primary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-primary-shade', this.darkenColor(colorScheme.primary, 0.12));
    root.style.setProperty('--ion-color-primary-tint', this.lightenColor(colorScheme.primary, 0.1));
    
    // Secondary color variants
    root.style.setProperty('--ion-color-secondary', colorScheme.secondary);
    root.style.setProperty('--ion-color-secondary-rgb', secondaryRgb);
    root.style.setProperty('--ion-color-secondary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-secondary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-secondary-shade', this.darkenColor(colorScheme.secondary, 0.12));
    root.style.setProperty('--ion-color-secondary-tint', this.lightenColor(colorScheme.secondary, 0.1));
    
    // Tertiary color variants
    root.style.setProperty('--ion-color-tertiary', colorScheme.tertiary);
    root.style.setProperty('--ion-color-tertiary-rgb', tertiaryRgb);
    root.style.setProperty('--ion-color-tertiary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-tertiary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-tertiary-shade', this.darkenColor(colorScheme.tertiary, 0.12));
    root.style.setProperty('--ion-color-tertiary-tint', this.lightenColor(colorScheme.tertiary, 0.1));
    
    // Background colors
    root.style.setProperty('--ion-background-color', colorScheme.background);
    root.style.setProperty('--ion-background-color-rgb', this.hexToRgb(colorScheme.background));
    root.style.setProperty('--ion-card-background', colorScheme.cardBackground);
    root.style.setProperty('--ion-item-background', colorScheme.cardBackground);
    root.style.setProperty('--ion-toolbar-background', colorScheme.headerBackground);
    root.style.setProperty('--ion-tab-bar-background', colorScheme.footerBackground);
    
    // Text colors
    root.style.setProperty('--ion-text-color', colorScheme.textPrimary);
    root.style.setProperty('--ion-text-color-rgb', this.hexToRgb(colorScheme.textPrimary));
    
    // Secondary text color
    root.style.setProperty('--ion-color-medium', colorScheme.textSecondary);
    root.style.setProperty('--ion-color-medium-rgb', this.hexToRgb(colorScheme.textSecondary));
    root.style.setProperty('--ion-color-medium-contrast', '#ffffff');
    root.style.setProperty('--ion-color-medium-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-medium-shade', this.darkenColor(colorScheme.textSecondary, 0.12));
    root.style.setProperty('--ion-color-medium-tint', this.lightenColor(colorScheme.textSecondary, 0.1));
    
    // Header and footer text colors
    root.style.setProperty('--ion-toolbar-color', colorScheme.headerText);
    root.style.setProperty('--ion-tab-bar-color', colorScheme.footerText);
    
    // Custom text color variables
    root.style.setProperty('--app-card-text-color', colorScheme.cardText);
    root.style.setProperty('--app-footer-background', colorScheme.footerBackground);
    root.style.setProperty('--app-footer-text-color', colorScheme.footerText);
    root.style.setProperty('--app-item-text-color', colorScheme.itemText);
    root.style.setProperty('--app-item-background', colorScheme.itemBackground);
    
    // Button colors
    root.style.setProperty('--ion-color-button', colorScheme.buttonBackground);
    root.style.setProperty('--ion-color-button-rgb', this.hexToRgb(colorScheme.buttonBackground));
    root.style.setProperty('--ion-color-button-contrast', colorScheme.buttonText);
    root.style.setProperty('--ion-color-button-contrast-rgb', this.hexToRgb(colorScheme.buttonText));
    root.style.setProperty('--ion-color-button-shade', this.darkenColor(colorScheme.buttonBackground, 0.12));
    root.style.setProperty('--ion-color-button-tint', this.lightenColor(colorScheme.buttonBackground, 0.1));
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0,0,0';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r},${g},${b}`;
  }

  private darkenColor(hex: string, amount: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = Math.max(0, parseInt(result[1], 16) - Math.round(255 * amount));
    const g = Math.max(0, parseInt(result[2], 16) - Math.round(255 * amount));
    const b = Math.max(0, parseInt(result[3], 16) - Math.round(255 * amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private lightenColor(hex: string, amount: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = Math.min(255, parseInt(result[1], 16) + Math.round(255 * amount));
    const g = Math.min(255, parseInt(result[2], 16) + Math.round(255 * amount));
    const b = Math.min(255, parseInt(result[3], 16) + Math.round(255 * amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private getDefaultLightColorScheme() {
    return {
      primary: '#0080ff',
      secondary: '#ff6b35',
      tertiary: '#7044ff',
      background: '#ffffff',
      cardBackground: '#f8f9fa',
      headerBackground: '#ffffff',
      footerBackground: '#ffffff',
      itemBackground: '#ffffff',
      buttonBackground: '#0080ff',
      textPrimary: '#000000',
      textSecondary: '#666666',
      headerText: '#000000',
      footerText: '#000000',
      cardText: '#000000',
      itemText: '#000000',
      buttonText: '#ffffff'
    };
  }

  private getDefaultDarkColorScheme() {
    return {
      primary: '#0080ff',
      secondary: '#ff6b35',
      tertiary: '#7044ff',
      background: '#000000',
      cardBackground: '#1a1a1a',
      headerBackground: '#1a1a1a',
      footerBackground: '#1a1a1a',
      itemBackground: '#1a1a1a',
      buttonBackground: '#0080ff',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      headerText: '#ffffff',
      footerText: '#ffffff',
      cardText: '#ffffff',
      itemText: '#ffffff',
      buttonText: '#ffffff'
    };
  }
}
