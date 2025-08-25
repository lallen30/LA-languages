import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  AlertController,
  ToastController,
  ModalController,
  PopoverController,
  IonContent,
  Platform
} from '@ionic/angular';
import { Router } from '@angular/router';

import { TtsModalComponent } from '../modals/tts/tts-modal.component';
import { AppearanceModalComponent } from '../modals/appearance/appearance-modal.component';
import { StudyModalComponent } from '../modals/study/study-modal.component';
import { ImagesModalComponent } from '../modals/images/images-modal.component';
import { DataModalComponent } from '../modals/data/data-modal.component';
import { AboutModalComponent } from '../modals/about/about-modal.component';
import { TestHelloModalComponent } from '../modals/test-hello.modal';

import { ColorPickerOverlayService } from '../services/color-picker-overlay.service';
import { TtsService } from '../services/tts.service';
import { ImageService } from '../services/image.service';
import { StorageService } from '../services/storage.service';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { addIcons } from 'ionicons';
import {
  language,
  colorPalette,
  school,
  server,
  informationCircle,
  image,
  close
} from 'ionicons/icons';

// Ensure ion-modal is defined when creating it programmatically
import { defineCustomElement as defineIonModal } from '@ionic/core/components/ion-modal';

// Register icons early
try {
  addIcons({
    language,
    'color-palette': colorPalette,
    school,
    server,
    'information-circle': informationCircle,
    image,
    close
  });
} catch {}

type ModalKey = 'tts' | 'appearance' | 'study' | 'images' | 'data' | 'about';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TtsModalComponent,
    AppearanceModalComponent,
    StudyModalComponent,
    ImagesModalComponent,
    DataModalComponent,
    AboutModalComponent,
    TestHelloModalComponent
  ]
})
export class SettingsPage implements OnInit, AfterViewInit {
  @ViewChild(IonContent, { read: ElementRef, static: true })
  contentEl!: ElementRef<HTMLElement>;

  
  presentingEl!: HTMLElement;

  // ---- STATE ----
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

  // Map modal keys to components (TS can see this field now)
  private readonly modalComponentMap: Record<ModalKey, any> = {
    // Use the real TTS modal component now that overlays are verified
    tts: TtsModalComponent,
    appearance: AppearanceModalComponent,
    study: StudyModalComponent,
    images: ImagesModalComponent,
    data: DataModalComponent,
    about: AboutModalComponent
  };

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
    private platform: Platform,
    private el: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  // Platform helpers
  get isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  ngOnInit() {
    try {
      addIcons({
        language,
        'color-palette': colorPalette,
        school,
        server,
        'information-circle': informationCircle,
        image,
        close
      });
    } catch {}
    // On some builds, ion-modal may not be registered until first use in templates.
    // We register it explicitly to allow programmatic creation/presentation for diagnostics.
    try {
      if (!customElements.get('ion-modal')) {
        defineIonModal();
        console.log('[Settings] ion-modal defined via defineCustomElement');
      }
    } catch (e) {
      console.warn('[Settings] Failed to define ion-modal via defineCustomElement', e);
    }
    this.loadSettings();
  }

  ngAfterViewInit() {
    // Prefer the router outlet for the iOS card presentation
    const closestOutlet =
    this.el.nativeElement.closest('ion-router-outlet') as HTMLElement | null;

  // Fallbacks if not found
  const firstOutlet = document.querySelector('ion-router-outlet') as HTMLElement | null;

  this.presentingEl =
    closestOutlet ??
    firstOutlet ??
    this.contentEl?.nativeElement ??
    document.body;
  }

  onModalDidPresent(key: ModalKey) {
    console.log('didPresent', key);
  }

  // ---------- MODALS: programmatic, iOS-safe ----------
  private buildProps(key: ModalKey): any {
    if (key === 'tts') {
      return {
        isIOS: this.isIOS,
        settings: this.settings,
        availableLanguages: this.availableLanguages,
        ttsLanguageChange: () => this.onTtsLanguageChange(),
        ttsRateChange: () => this.onTtsRateChange(),
        ttsPitchChange: () => this.onTtsPitchChange(),
        autoSpeakChange: () => this.onAutoSpeakChange()
      };
    }
    if (key === 'images') {
      return {
        isIOS: this.isIOS,
        settings: this.settings,
        imageQualities: this.imageQualities,
        cacheSize: this.getCacheSize(),
        clearCache: () => this.clearImageCache()
      };
    }
    if (key === 'data') {
      return {
        resetAllData: () => this.resetAllData(),
        exportData: () => this.exportData(),
        importData: () => this.importData()
      };
    }
    if (key === 'appearance') {
      return {
        isIOS: this.isIOS,
        settings: this.settings,
        currentColorScheme: this.currentColorScheme,
        presetColors: this.getPresetColors(),
        onColorChange: (k: string, e: any) => this.onColorChange(k, e),
        onHexInput: (k: string, e: any) => this.onHexInput(k, e),
        resetColors: () => this.resetColors(),
        previewColors: () => this.previewColors()
      };
    }
    if (key === 'study') {
      return {
        settings: this.settings,
        onStudyRemindersChange: () => this.onStudyRemindersChange(),
        onMaxCardsChange: () => this.onMaxCardsChange()
      };
    }
    if (key === 'about') {
      return {
        openHelp: this.openHelp.bind(this),
        openBuyMeCoffee: this.openBuyMeCoffee.bind(this)
      };
    }
    // Fallback (keeps TS happy even if the union expands later)
    return {};
  }

  async openModalKey(key: 'tts' | 'appearance' | 'study' | 'images' | 'data' | 'about') {
    try {
      console.log('[Settings] openModalKey start', key);
      const component = this.modalComponentMap[key];
      const componentProps = this.buildProps(key);

      // Force fullscreen presentation for all modals
      const forceFullscreen = true;
      if (forceFullscreen) {
        console.warn('[Settings] Forcing fullscreen modal presentation (no presentingElement)');
      }
      await this.tryPresentModal({ component, componentProps, usePresenting: this.isIOS && !forceFullscreen });
      console.log('[Settings] openModalKey done', key);
    } catch (e) {
      console.error('openModalKey failed', e);
      this.showToast('Unable to open modal', 'danger');
    }
  }

  private async openRawTestModal() {
    try {
      const hasIonModal = !!customElements.get('ion-modal');
      console.log('[Settings] customElements.has(ion-modal)=', hasIonModal);
      const raw = document.createElement('ion-modal') as HTMLIonModalElement & any;
      raw.style.zIndex = '9999';
      raw.backdropDismiss = true;
      raw.innerHTML = `
        <ion-header>
          <ion-toolbar>
            <ion-title>Raw Modal</ion-title>
            <ion-buttons slot="end"><ion-button id="raw-close">Close</ion-button></ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          If you can see this, Ionic overlays work. The issue is Angular component resolution.
        </ion-content>
      `;
      document.body.appendChild(raw);
      const closeBtn = raw.querySelector('#raw-close') as HTMLElement | null;
      closeBtn?.addEventListener('click', () => raw.dismiss());
      console.log('[Settings] presenting RAW ion-modal');
      await raw.present();
      console.log('[Settings] RAW ion-modal presented');
    } catch (e) {
      console.error('[Settings] RAW modal failed', e);
      await this.openAlertSmokeTest('RAW modal failed', JSON.stringify(e ?? {}, null, 2));
    }
  }

  private async openAlertSmokeTest(hdr: string, msg: string) {
    try {
      const alert = await this.alertController.create({
        header: hdr,
        message: msg,
        buttons: ['OK']
      });
      await alert.present();
      await alert.onDidDismiss();
    } catch (e) {
      console.error('[Settings] Alert overlay failed', e);
    }
  }
  
  private async tryPresentModal(opts: {
    component: any;
    componentProps: any;
    usePresenting: boolean;
  }) {
    // Build options
    const baseOpts: any = {
      component: opts.component,
      componentProps: opts.componentProps,
      showBackdrop: true,
      backdropDismiss: true,
      cssClass: 'modal-fullscreen'
    };
    if (opts.usePresenting && this.presentingEl) {
      baseOpts.presentingElement = this.presentingEl;
    }
  
    console.log('[Settings] creating modal with opts', { hasPresenting: !!baseOpts.presentingElement });
    const modal = await this.modalController.create(baseOpts);

    // Do NOT manually append the modal; Ionic handles DOM placement.
    // Appending to document.body can cause "<ion-modal> must be used inside ion-content" warnings on iOS.

    // Guard componentOnReady with a timeout to avoid hangs
    try {
      const cor = (modal as any).componentOnReady?.();
      if (cor && typeof cor.then === 'function') {
        await Promise.race([
          cor,
          new Promise((res) => setTimeout(res, 500))
        ]);
        console.log('[Settings] componentOnReady completed or timed out');
      }
    } catch (e) {
      console.warn('[Settings] componentOnReady threw; continuing to present', e);
    }
  
    // iOS sheet tweaks set directly on element to avoid typing/version issues
    const m = modal as any;
    m.swipeToClose = true;
    m.initialBreakpoint = 1;
    m.breakpoints = [0, 1];
  
    // TEMP: Present directly to verify present() runs on device
    console.log('[Settings] invoking modal.present() (direct)');
    try {
      await modal.present();
      console.log('[Settings] modal.present() resolved (direct)');
    } catch (e) {
      console.error('[Settings] modal.present() threw (direct)', e);
      throw e;
    }
    const ok = true;
  
    if (!ok && opts.usePresenting) {
      // Fallback: retry without presentingElement (fullscreen)
      console.warn('[Settings] Modal did not present with presentingElement; retrying fullscreen…');
      await modal.dismiss().catch(() => {});
      const fallback = await this.modalController.create({
        component: opts.component,
        componentProps: opts.componentProps,
        showBackdrop: true,
        backdropDismiss: true,
        cssClass: 'modal-fullscreen'
      });
      await (fallback as any).componentOnReady?.();
      const f = fallback as any;
      f.swipeToClose = true;
      f.initialBreakpoint = 1;
      f.breakpoints = [0, 1];
      if (!fallback.parentElement) document.body.appendChild(fallback);
      try {
        console.log('[Settings] invoking fallback.present() (direct)');
        await fallback.present();
        console.log('[Settings] fallback.present() resolved (direct)');
      } catch (e) {
        console.error('[Settings] fallback.present() threw (direct)', e);
      }
    }
  }
  
// Replace your presentWithWatchdog with this:
private async presentWithWatchdog(modal: HTMLIonModalElement, timeoutMs: number): Promise<boolean> {
  return new Promise<boolean>(async (resolve) => {
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      modal.removeEventListener('ionModalDidPresent', onPresented as any);
      resolve(ok);
    };

    const onPresented = () => done(true);
    modal.addEventListener('ionModalDidPresent', onPresented as any, { once: true });

    const timer = setTimeout(() => done(false), timeoutMs);

    try {
      console.log('[Settings] calling modal.present()');
      await modal.present();
      console.log('[Settings] modal.present() returned, waiting for ionModalDidPresent');
      // present() resolves when animation starts; we rely on ionModalDidPresent to confirm
    } catch (e) {
      console.error('modal.present() threw', e);
      done(false);
    }
  });
}


  async closeTopModal() {
    const top = await this.modalController.getTop();
    if (top) await top.dismiss();
  }

  // ---------- SETTINGS + HELPERS ----------
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

      await this.loadColorSchemes();
      this.applyDarkMode();
      this.switchColorScheme();

      this.ttsService.setLanguage(this.settings.ttsLanguage);
      this.ttsService.setRate(this.settings.ttsRate);
      this.ttsService.setPitch(this.settings.ttsPitch);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSetting(key: string, value: any) {
    try {
      await this.storageService.saveSetting(key, value);
      switch (key) {
        case 'darkMode':
          this.applyDarkMode();
          this.switchColorScheme();
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

  onDarkModeChange() { this.saveSetting('darkMode', this.settings.darkMode); }
  onTtsLanguageChange() { this.saveSetting('ttsLanguage', this.settings.ttsLanguage); }
  onTtsRateChange() { this.saveSetting('ttsRate', this.settings.ttsRate); }
  onTtsPitchChange() { this.saveSetting('ttsPitch', this.settings.ttsPitch); }
  onImageQualityChange() { this.saveSetting('imageQuality', this.settings.imageQuality); }
  onAutoSpeakChange() { this.saveSetting('autoSpeak', this.settings.autoSpeak); }
  onStudyRemindersChange() { this.saveSetting('studyReminders', this.settings.studyReminders); }
  onMaxCardsChange() { this.saveSetting('maxCardsPerSession', this.settings.maxCardsPerSession); }

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
        { text: 'Cancel', role: 'cancel' },
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
        { text: 'Cancel', role: 'cancel' },
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
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete Everything',
          role: 'destructive',
          handler: async () => {
            await this.storageService.clearAllData();
            await this.showToast('All data cleared');
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
        await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
        if (platform === 'ios') {
          await Share.share({ title: 'Export Data', text: 'Flashcards backup', url: uri });
        } else {
          await Share.share({ title: 'Export Data', text: 'Flashcards backup', files: [uri] });
        }
      } else {
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
            { text: 'Cancel', role: 'cancel' },
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

    for (const [key, value] of Object.entries(this.settings)) {
      await this.storageService.saveSetting(key, value);
    }

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

  // ---------- Color helpers ----------
  async loadColorSchemes() {
    try {
      const savedLight = await this.storageService.getSetting('lightColorScheme', null);
      if (savedLight) this.lightColorScheme = { ...this.lightColorScheme, ...savedLight };

      const savedDark = await this.storageService.getSetting('darkColorScheme', null);
      if (savedDark) this.darkColorScheme = { ...this.darkColorScheme, ...savedDark };
    } catch (error) {
      console.error('Error loading color schemes:', error);
    }
  }

  switchColorScheme() {
    this.currentColorScheme = this.settings.darkMode
      ? { ...this.darkColorScheme }
      : { ...this.lightColorScheme };
    this.applyColors();
  }

  onColorChange(colorKey: string, event: any) {
    const newColor = event.target.value;
    (this.currentColorScheme as any)[colorKey] = newColor;

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
    if (hexValue && !hexValue.startsWith('#')) {
      hexValue = '#' + hexValue;
      event.target.value = hexValue;
    }
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(hexValue)) {
      if (hexValue.length === 4) {
        hexValue = '#' + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2] + hexValue[3] + hexValue[3];
        event.target.value = hexValue;
      }
      (this.currentColorScheme as any)[colorKey] = hexValue;

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
    const root = document.documentElement;

    const primaryRgb = this.hexToRgb(this.currentColorScheme.primary);
    const secondaryRgb = this.hexToRgb(this.currentColorScheme.secondary);
    const tertiaryRgb = this.hexToRgb(this.currentColorScheme.tertiary);

    root.style.setProperty('--ion-color-primary', this.currentColorScheme.primary);
    root.style.setProperty('--ion-color-primary-rgb', primaryRgb);
    root.style.setProperty('--ion-color-primary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-primary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-primary-shade', this.darkenColor(this.currentColorScheme.primary, 0.12));
    root.style.setProperty('--ion-color-primary-tint', this.lightenColor(this.currentColorScheme.primary, 0.1));

    root.style.setProperty('--ion-color-secondary', this.currentColorScheme.secondary);
    root.style.setProperty('--ion-color-secondary-rgb', secondaryRgb);
    root.style.setProperty('--ion-color-secondary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-secondary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-secondary-shade', this.darkenColor(this.currentColorScheme.secondary, 0.12));
    root.style.setProperty('--ion-color-secondary-tint', this.lightenColor(this.currentColorScheme.secondary, 0.1));

    root.style.setProperty('--ion-color-tertiary', this.currentColorScheme.tertiary);
    root.style.setProperty('--ion-color-tertiary-rgb', tertiaryRgb);
    root.style.setProperty('--ion-color-tertiary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-tertiary-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-tertiary-shade', this.darkenColor(this.currentColorScheme.tertiary, 0.12));
    root.style.setProperty('--ion-color-tertiary-tint', this.lightenColor(this.currentColorScheme.tertiary, 0.1));

    root.style.setProperty('--ion-background-color', this.currentColorScheme.background);
    root.style.setProperty('--ion-background-color-rgb', this.hexToRgb(this.currentColorScheme.background));
    root.style.setProperty('--ion-card-background', this.currentColorScheme.cardBackground);
    root.style.setProperty('--ion-item-background', this.currentColorScheme.cardBackground);
    root.style.setProperty('--ion-toolbar-background', this.currentColorScheme.headerBackground);
    root.style.setProperty('--ion-tab-bar-background', this.currentColorScheme.footerBackground);

    root.style.setProperty('--app-footer-background', this.currentColorScheme.footerBackground);

    root.style.setProperty('--ion-text-color', this.currentColorScheme.textPrimary);
    root.style.setProperty('--ion-text-color-rgb', this.hexToRgb(this.currentColorScheme.textPrimary));

    root.style.setProperty('--ion-color-medium', this.currentColorScheme.textSecondary);
    root.style.setProperty('--ion-color-medium-rgb', this.hexToRgb(this.currentColorScheme.textSecondary));
    root.style.setProperty('--ion-color-medium-contrast', '#ffffff');
    root.style.setProperty('--ion-color-medium-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-medium-shade', this.darkenColor(this.currentColorScheme.textSecondary, 0.12));
    root.style.setProperty('--ion-color-medium-tint', this.lightenColor(this.currentColorScheme.textSecondary, 0.1));

    root.style.setProperty('--ion-toolbar-color', this.currentColorScheme.headerText);
    root.style.setProperty('--ion-tab-bar-color', this.currentColorScheme.footerText);

    root.style.setProperty('--app-card-text-color', this.currentColorScheme.cardText);
    root.style.setProperty('--app-footer-text-color', this.currentColorScheme.footerText);
    root.style.setProperty('--app-item-text-color', this.currentColorScheme.itemText);

    root.style.setProperty('--app-item-background', this.currentColorScheme.itemBackground);

    root.style.setProperty('--ion-color-button', this.currentColorScheme.buttonBackground);
    root.style.setProperty('--ion-color-button-rgb', this.hexToRgb(this.currentColorScheme.buttonBackground));
    root.style.setProperty('--ion-color-button-contrast', this.currentColorScheme.buttonText);
    root.style.setProperty('--ion-color-button-contrast-rgb', this.hexToRgb(this.currentColorScheme.buttonText));
    root.style.setProperty('--ion-color-button-shade', this.darkenColor(this.currentColorScheme.buttonBackground, 0.12));
    root.style.setProperty('--ion-color-button-tint', this.lightenColor(this.currentColorScheme.buttonBackground, 0.1));

    root.style.setProperty('--ion-color-danger', this.currentColorScheme.outlinedButtonColor);
    root.style.setProperty('--ion-color-danger-rgb', this.hexToRgb(this.currentColorScheme.outlinedButtonColor));
    root.style.setProperty('--ion-color-danger-contrast', '#ffffff');
    root.style.setProperty('--ion-color-danger-contrast-rgb', '255,255,255');
    root.style.setProperty('--ion-color-danger-shade', this.darkenColor(this.currentColorScheme.outlinedButtonColor, 0.12));
    root.style.setProperty('--ion-color-danger-tint', this.lightenColor(this.currentColorScheme.outlinedButtonColor, 0.1));

    root.style.setProperty('--review-hard-bg', this.currentColorScheme.hardButtonBackground);
    root.style.setProperty('--review-hard-text', this.currentColorScheme.hardButtonText);
    root.style.setProperty('--review-good-bg', this.currentColorScheme.goodButtonBackground);
    root.style.setProperty('--review-good-text', this.currentColorScheme.goodButtonText);
    root.style.setProperty('--review-easy-bg', this.currentColorScheme.easyButtonBackground);
    root.style.setProperty('--review-easy-text', this.currentColorScheme.easyButtonText);
    root.style.setProperty('--review-incorrect-bg', this.currentColorScheme.incorrectButtonBackground);
    root.style.setProperty('--review-incorrect-text', this.currentColorScheme.incorrectButtonText);
  }

  // Force immediate update of elements using CSS vars
  forceElementUpdate() {
    document.documentElement.offsetHeight;
    const moonIcons = document.querySelectorAll('ion-icon[name="moon"]');
    moonIcons.forEach(icon => {
      const svgs = icon.querySelectorAll('svg, svg path');
      svgs.forEach(svg => {
        (svg as HTMLElement).style.fill = this.currentColorScheme.primary;
        (svg as HTMLElement).style.color = this.currentColorScheme.primary;
      });
    });
    setTimeout(() => {
      if ((this as any).cdr) (this as any).cdr.detectChanges();
    }, 0);
  }

  hexToRgb(hex: string): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return '0,0,0';
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `${r},${g},${b}`;
  }

  darkenColor(hex: string, amount: number): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r = Math.max(0, Math.floor(parseInt(m[1], 16) * (1 - amount)));
    const g = Math.max(0, Math.floor(parseInt(m[2], 16) * (1 - amount)));
    const b = Math.max(0, Math.floor(parseInt(m[3], 16) * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  lightenColor(hex: string, amount: number): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r0 = parseInt(m[1], 16);
    const g0 = parseInt(m[2], 16);
    const b0 = parseInt(m[3], 16);
    const r = Math.min(255, Math.floor(r0 + (255 - r0) * amount));
    const g = Math.min(255, Math.floor(g0 + (255 - g0) * amount));
    const b = Math.min(255, Math.floor(b0 + (255 - b0) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  resetColors() {
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

  openHelp() { this.router.navigate(['/tabs/help']); }
  openBuyMeCoffee() { window.open('https://buymeacoffee.com/lallen30', '_blank'); }

  async openCustomColorPicker(colorKey: string, colorName: string, evt?: Event) {
    const currentColor = (this.currentColorScheme as any)[colorKey];
    try {
      const result = await this.colorPickerOverlayService.open(colorName, currentColor);
      if (result && result.saved && result.color) {
        const newColor = result.color;
        (this.currentColorScheme as any)[colorKey] = newColor;

        if (this.settings.darkMode) {
          (this.darkColorScheme as any)[colorKey] = newColor;
          this.saveSetting('darkColorScheme', this.darkColorScheme);
        } else {
          (this.lightColorScheme as any)[colorKey] = newColor;
          this.saveSetting('lightColorScheme', this.lightColorScheme);
        }

        this.applyColors();
        this.showToast(`${colorName} updated to ${newColor}`, 'success');
      } else if (Capacitor.getPlatform() === 'ios') {
        this.openNativeColorPickerWithSave(colorKey, colorName, currentColor);
      }
    } catch (error) {
      console.error('Error opening color picker:', error);
      if (Capacitor.getPlatform() === 'ios') {
        this.openNativeColorPickerWithSave(colorKey, colorName, currentColor);
        return;
      }
      this.showToast('Error opening color picker', 'danger');
    }
  }

  openNativeColorPickerWithSave(colorKey: string, colorName: string, currentColor: string) {
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor;
    colorInput.style.position = 'absolute';
    colorInput.style.left = '-9999px';
    document.body.appendChild(colorInput);

    colorInput.addEventListener('change', async () => {
      const selectedColor = colorInput.value;
      const confirmAlert = await this.alertController.create({
        header: colorName,
        message: `Selected color: ${selectedColor}`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
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

    colorInput.click();
  }

  triggerNativeColorPicker(colorKey: string, colorName: string) {
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
    return [
      '#3880ff', '#428cff', '#0066cc', '#1e90ff', '#4169e1',
      '#2dd36f', '#10dc60', '#00c851', '#4caf50', '#8bc34a',
      '#6a64ff', '#5260ff', '#9c27b0', '#673ab7', '#3f51b5',
      '#eb445a', '#f04141', '#e91e63', '#f44336', '#ff5722',
      '#ffc409', '#ffce00', '#ff9800', '#ff6f00', '#ff5722',
      '#2dd36f', '#00d4aa', '#009688', '#26a69a', '#4db6ac',
      '#92949c', '#666666', '#333333', '#1a1a1a', '#f8f9fa'
    ];
  }
}
