import { Component, EventEmitter, Output } from '@angular/core';
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
  @Output() exportDataClick = new EventEmitter<void>();
  @Output() importDataClick = new EventEmitter<void>();
  @Output() resetAllSettingsClick = new EventEmitter<void>();
  @Output() resetAllDataClick = new EventEmitter<void>();

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
