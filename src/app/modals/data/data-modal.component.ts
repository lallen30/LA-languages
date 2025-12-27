import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { StorageService } from '../../services/storage.service';
import { TranslationService } from '../../services/translation.service';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-data-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
  templateUrl: './data-modal.component.html',
  styleUrls: ['./data-modal.component.scss']
})
export class DataModalComponent implements OnInit {
  @Input() exportData?: () => void;
  @Input() importData?: () => void;
  @Input() importMultipleDecks?: () => void;
  @Input() importMultipleDecksFromUrl?: () => void;
  @Input() downloadAndImportMultipleDecks?: (url: string) => Promise<void>;
  @Input() performResetSettings?: () => void;
  @Input() resetAllData?: () => void;
  @Input() settings?: any;
  
  buttonBackground: string = '#3880ff';
  buttonText: string = '#ffffff';
  
  // URL input state
  showUrlInput: boolean = false;
  importUrl: string = '';
  
  // Import options popup state
  showImportOptions: boolean = false;
  importOptionsUrl: string = '';
  
  // Loading state
  isImporting: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private storageService: StorageService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translationService: TranslationService
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

  async handleExportData() {
    if (this.exportData) {
      await this.exportData();
    }
  }

  async handleImportData() {
    // Show the import options popup instead of directly importing
    this.showImportOptions = true;
    this.importOptionsUrl = '';
  }
  
  cancelImportOptions() {
    this.showImportOptions = false;
    this.importOptionsUrl = '';
  }
  
  async importFromLocalFile() {
    this.showImportOptions = false;
    this.isImporting = true;
    try {
      if (this.importData) {
        await this.importData();
      }
    } finally {
      this.isImporting = false;
    }
  }
  
  async importFromUrl() {
    if (!this.importOptionsUrl || !this.importOptionsUrl.trim()) {
      const toast = await this.toastController.create({
        message: this.translationService.t('settings.pleaseEnterUrl') || 'Please enter a URL',
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }
    
    this.showImportOptions = false;
    this.isImporting = true;
    let url = this.importOptionsUrl.trim();
    
    // Convert Google Drive sharing URL to direct download URL
    url = this.convertToDirectDownloadUrl(url);
    console.log('Fetching from URL:', url);
    
    try {
      // Use CapacitorHttp for native requests (bypasses CORS)
      const response = await CapacitorHttp.get({
        url: url,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('HTTP response status:', response.status);
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the response data
      let importData;
      if (typeof response.data === 'string') {
        importData = JSON.parse(response.data);
      } else {
        importData = response.data;
      }
      
      console.log('Import data parsed successfully');
      console.log('Settings in import data:', importData.settings);
      console.log('lightColorScheme:', importData.settings?.lightColorScheme);
      console.log('darkColorScheme:', importData.settings?.darkColorScheme);
      
      // Import the data using storage service
      await this.storageService.importData(importData);
      
      console.log('[Import] Import successful, scheduling reload BEFORE toast...');
      
      // Schedule reload FIRST before any async operations that might interrupt
      window.setTimeout(() => {
        console.log('[Import] Executing reload now...');
        window.location.reload();
      }, 2000);
      
      console.log('[Import] Reload scheduled, now showing toast...');
      
      const toast = await this.toastController.create({
        message: this.translationService.t('settings.dataImported') || 'Data imported successfully. Reloading...',
        duration: 1800,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      
      console.log('[Import] Toast shown, waiting for reload...');
    } catch (error) {
      console.error('URL import failed:', error);
      const toast = await this.toastController.create({
        message: `${this.translationService.t('settings.importFailed') || 'Import failed'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      this.isImporting = false;
    }
  }

  async handleImportMultipleDecks() {
    if (this.importMultipleDecks) {
      await this.importMultipleDecks();
    }
  }

  async handleImportMultipleDecksFromUrl() {
    console.log('handleImportMultipleDecksFromUrl called');
    console.log('importMultipleDecksFromUrl function exists:', !!this.importMultipleDecksFromUrl);
    if (this.importMultipleDecksFromUrl) {
      await this.importMultipleDecksFromUrl();
    } else {
      console.error('importMultipleDecksFromUrl function not provided to modal');
    }
  }

  showUrlInputSection() {
    console.log('showUrlInputSection called');
    this.showUrlInput = true;
    this.importUrl = '';
  }

  cancelUrlInput() {
    console.log('cancelUrlInput called');
    this.showUrlInput = false;
    this.importUrl = '';
  }

  async submitUrlImport() {
    console.log('submitUrlImport called with URL:', this.importUrl);
    if (this.importUrl && this.importUrl.trim() && this.downloadAndImportMultipleDecks) {
      // Convert Google Drive URL if needed
      const url = this.convertToDirectDownloadUrl(this.importUrl.trim());
      this.showUrlInput = false;
      await this.downloadAndImportMultipleDecks(url);
    }
  }

  async handleResetSettings() {
    console.log('handleResetSettings called');
    // Close the modal first, then trigger the reset from settings page
    await this.modalCtrl.dismiss({ action: 'resetSettings' });
  }

  async handleResetData() {
    if (this.resetAllData) {
      await this.resetAllData();
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }

  /**
   * Convert Google Drive sharing URL to direct download URL
   * Supports formats:
   * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   * - https://drive.google.com/file/d/FILE_ID/view
   * - https://drive.google.com/open?id=FILE_ID
   */
  private convertToDirectDownloadUrl(url: string): string {
    // Check for Google Drive file URL format: /file/d/FILE_ID/
    const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      console.log('Converted Google Drive URL, file ID:', fileId);
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // Check for Google Drive open URL format: /open?id=FILE_ID
    const openIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch) {
      const fileId = openIdMatch[1];
      console.log('Converted Google Drive open URL, file ID:', fileId);
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // Return original URL if not a Google Drive link
    return url;
  }
}
