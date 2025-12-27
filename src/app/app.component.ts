import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonApp, IonRouterOutlet, IonIcon, IonButton, ModalController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { homeOutline, libraryOutline, statsChartOutline, settingsOutline, menuOutline, closeOutline, mapOutline, informationCircleOutline } from 'ionicons/icons';
import { StorageService } from './services/storage.service';
import { AboutModalComponent } from './modals/about/about-modal.component';
import { MenuService } from './services/menu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonApp, IonRouterOutlet, IonIcon, IonButton, CommonModule
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  private menuSubscription?: Subscription;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private menuService: MenuService,
    private modalController: ModalController
  ) {
    addIcons({ homeOutline, libraryOutline, statsChartOutline, settingsOutline, menuOutline, closeOutline, mapOutline, informationCircleOutline });
  }

  closeMenu() {
    this.menuService.close();
  }

  navigateTo(path: string) {
    this.closeMenu();
    this.router.navigate([path]);
  }

  async openAbout() {
    this.closeMenu();
    const modal = await this.modalController.create({
      component: AboutModalComponent,
      componentProps: {
        openHelp: () => this.router.navigate(['/tabs/help']),
        openBuyMeCoffee: () => window.open('https://paypal.me/lallen300', '_blank')
      }
    });
    await modal.present();
  }

  async ngOnInit() {
    // Subscribe to menu state
    this.menuSubscription = this.menuService.menuOpen$.subscribe(isOpen => {
      this.isMenuOpen = isOpen;
    });
    
    // Apply saved colors on app startup
    await this.initializeColors();
  }

  ngOnDestroy() {
    this.menuSubscription?.unsubscribe();
  }

  private async initializeColors() {
    try {
      // Load saved settings
      const themeMode = await this.storageService.getSetting('themeMode', 'system');
      const lightColorScheme = await this.storageService.getSetting('lightColorScheme', this.getDefaultLightColorScheme());
      const darkColorScheme = await this.storageService.getSetting('darkColorScheme', this.getDefaultDarkColorScheme());
      
      // Determine if dark mode should be active based on theme mode
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        // System mode - check system preference
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      // Save the resolved darkMode setting
      await this.storageService.saveSetting('darkMode', isDark);
      
      // Apply dark mode class to body
      document.body.classList.toggle('dark', isDark);
      
      // Apply the appropriate color scheme
      const currentColorScheme = isDark ? darkColorScheme : lightColorScheme;
      this.applyColors(currentColorScheme);
      
      // Listen for system theme changes if in system mode
      if (themeMode === 'system') {
        this.setupSystemThemeListener();
      }
      
      console.log('DEBUG: Colors initialized on app startup, theme mode:', themeMode, 'isDark:', isDark);
    } catch (error) {
      console.error('Error initializing colors:', error);
    }
  }

  private setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', async (e) => {
      // Check if still in system mode
      const themeMode = await this.storageService.getSetting('themeMode', 'system');
      if (themeMode === 'system') {
        const isDark = e.matches;
        await this.storageService.saveSetting('darkMode', isDark);
        document.body.classList.toggle('dark', isDark);
        
        const lightColorScheme = await this.storageService.getSetting('lightColorScheme', this.getDefaultLightColorScheme());
        const darkColorScheme = await this.storageService.getSetting('darkColorScheme', this.getDefaultDarkColorScheme());
        const currentColorScheme = isDark ? darkColorScheme : lightColorScheme;
        this.applyColors(currentColorScheme);
        
        console.log('DEBUG: System theme changed, isDark:', isDark);
      }
    });
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
      primary: '#74D105',
      secondary: '#ff6b35',
      tertiary: '#7044ff',
      background: '#ffffff',
      cardBackground: '#f8f9fa',
      headerBackground: '#ffffff',
      footerBackground: '#ffffff',
      menuBackground: '#ffffff',
      menuText: '#74D105',
      itemBackground: '#ffffff',
      buttonBackground: '#0080ff',
      textPrimary: '#000000',
      textSecondary: '#666666',
      headerText: '#74D105',
      footerText: '#74D105',
      cardText: '#000000',
      itemText: '#000000',
      buttonText: '#ffffff'
    };
  }

  private getDefaultDarkColorScheme() {
    return {
      primary: '#74D105',
      secondary: '#ff6b35',
      tertiary: '#7044ff',
      background: '#000000',
      cardBackground: '#1a1a1a',
      headerBackground: '#1a1a1a',
      footerBackground: '#1a1a1a',
      menuBackground: '#2d2d2d',
      menuText: '#74D105',
      itemBackground: '#1a1a1a',
      buttonBackground: '#0080ff',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      headerText: '#74D105',
      footerText: '#74D105',
      cardText: '#ffffff',
      itemText: '#ffffff',
      buttonText: '#ffffff'
    };
  }
}
