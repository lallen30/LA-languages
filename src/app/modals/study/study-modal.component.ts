import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-study-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
  templateUrl: './study-modal.component.html',
  styleUrls: ['./study-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StudyModalComponent {
  @Input() settings: any;
  @Output() maxCardsChange = new EventEmitter<void>();
  @Output() pictureWordDisplayChange = new EventEmitter<void>();

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
