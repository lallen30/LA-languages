import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss']
})
export class AboutModalComponent implements OnInit {
  @Input() openHelp?: () => void;
  @Input() openBuyMeCoffee?: () => void;
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

  async handleOpenHelp() {
    await this.close();
    if (this.openHelp) {
      this.openHelp();
    }
  }

  close() {
    return this.modalCtrl.dismiss();
  }
}
