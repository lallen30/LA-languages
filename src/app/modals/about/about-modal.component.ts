import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss']
})
export class AboutModalComponent {
  @Input() openHelp?: () => void;
  @Input() openBuyMeCoffee?: () => void;

  constructor(private modalCtrl: ModalController) {}

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
