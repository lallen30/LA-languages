import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { StorageService } from '../../services/storage.service';
import { TranslationService } from '../../services/translation.service';

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
    if (this.importData) {
      await this.importData();
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
      const url = this.importUrl.trim();
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
}
