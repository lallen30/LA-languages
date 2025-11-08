import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-data-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  templateUrl: './data-modal.component.html',
  styleUrls: ['./data-modal.component.scss']
})
export class DataModalComponent implements OnInit {
  @Input() exportData?: () => void;
  @Input() importData?: () => void;
  @Input() importMultipleDecks?: () => void;
  @Input() resetAllSettings?: () => void;
  @Input() resetAllData?: () => void;
  @Input() settings?: any;
  
  buttonBackground: string = '#3880ff';
  buttonText: string = '#ffffff';

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

  async handleResetSettings() {
    if (this.resetAllSettings) {
      await this.resetAllSettings();
    }
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
