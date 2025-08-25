import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-tts-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './tts-modal.component.html',
  styleUrls: ['./tts-modal.component.scss']
})
export class TtsModalComponent {
  @Input() isIOS = false;
  @Input() settings: any;
  @Input() availableLanguages: { code: string; name: string }[] = [];

  @Output() ttsLanguageChange = new EventEmitter<void>();
  @Output() ttsRateChange = new EventEmitter<void>();
  @Output() ttsPitchChange = new EventEmitter<void>();
  @Output() autoSpeakChange = new EventEmitter<void>();
  @Output() testTtsClick = new EventEmitter<void>();

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }
}
