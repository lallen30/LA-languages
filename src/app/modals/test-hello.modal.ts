import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-test-hello-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>It works 🎉</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      This is a minimal modal. If you can see this on iOS, overlay plumbing is OK.
    </ion-content>
  `,
  imports: [CommonModule, IonicModule]
})
export class TestHelloModalComponent {
  constructor(private modalCtrl: ModalController) {}
  async close() { await this.modalCtrl.dismiss(); }
}
