import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-data-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './data-modal.component.html',
  styleUrls: ['./data-modal.component.scss']
})
export class DataModalComponent {
  @Input() exportData?: () => void;
  @Input() importData?: () => void;
  @Input() resetAllSettings?: () => void;
  @Input() resetAllData?: () => void;

  constructor(private modalCtrl: ModalController) {}

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
