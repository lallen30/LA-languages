import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { IonAlert, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tts-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, IonAlert, IonButton],
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

  // IonAlert state for language picker (button-based for tap-to-select-and-close)
  isLangAlertOpen = false;
  languageInputs: Array<never> = [];
  langButtons: Array<{ text: string; role?: string; handler?: () => boolean | void }> = []; // built per open

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  displayLanguage(code?: string): string | undefined {
    if (!code) return undefined;
    return this.availableLanguages.find(l => l.code === code)?.name;
  }

  private emitTtsLanguageChange(): void {
    const anyThis = this as any;
    const candidate = anyThis.ttsLanguageChange;
    if (candidate && typeof candidate.emit === 'function') {
      candidate.emit();
      return;
    }
    if (typeof candidate === 'function') {
      candidate();
      return;
    }
  }

  presentLanguagePicker() {
    this.langButtons = [
      ...this.availableLanguages.map(l => ({
        text: l.name,
        handler: () => {
          if (this.settings) {
            this.settings.ttsLanguage = l.code;
            this.emitTtsLanguageChange();
          }
          this.isLangAlertOpen = false;
          return true;
        }
      })),
      { text: 'Cancel', role: 'cancel' }
    ];
    this.isLangAlertOpen = true;
  }

  onLangAlertDidDismiss(ev: CustomEvent<any>) {
    // Ensure state is closed if dismissed via backdrop/cancel
    this.isLangAlertOpen = false;
  }
}
