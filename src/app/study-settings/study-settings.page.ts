import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle } from 'ionicons/icons';

// Register icons
addIcons({ 
  'arrow-back': arrowBack,
  'checkmark-circle': checkmarkCircle
});

@Component({
  selector: 'app-study-settings',
  templateUrl: './study-settings.page.html',
  styleUrls: ['./study-settings.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class StudySettingsPage implements OnInit {
  maxCards: number = 20;
  pictureWordDisplay: 'images-first' | 'word-first' | 'random' = 'images-first';

  constructor(
    private navCtrl: NavController,
    private storageService: StorageService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.maxCards = await this.storageService.getSetting('maxCardsPerSession', 20);
    this.pictureWordDisplay = await this.storageService.getSetting('pictureWordDisplay', 'images-first');
  }

  goBack() {
    this.navCtrl.back();
  }

  selectDisplay(value: 'images-first' | 'word-first' | 'random') {
    this.pictureWordDisplay = value;
  }

  async save() {
    if (this.maxCards >= 5 && this.maxCards <= 500) {
      await this.storageService.saveSetting('maxCardsPerSession', this.maxCards);
      await this.storageService.saveSetting('pictureWordDisplay', this.pictureWordDisplay);
      const toast = await this.toastController.create({
        message: 'Study settings saved',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      this.goBack();
    } else {
      const toast = await this.toastController.create({
        message: 'Please enter a value between 5 and 500',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    }
  }
}
