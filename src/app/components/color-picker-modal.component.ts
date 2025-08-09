import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-color-picker-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ colorName }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="color-picker-container">
        <div class="color-inputs">
          <input 
            type="color" 
            [(ngModel)]="selectedColor" 
            (input)="onColorChange()"
            class="color-picker-input">
          <ion-input 
            [(ngModel)]="selectedColor" 
            (ionInput)="onTextChange($event)"
            placeholder="#000000" 
            maxlength="7"
            class="color-text-input">
          </ion-input>
        </div>
        
        <div class="color-preview">
          <div 
            class="preview-square" 
            [style.background-color]="selectedColor">
          </div>
          <span class="hex-value">{{ selectedColor }}</span>
        </div>
      </div>
    </ion-content>
    
    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button fill="solid" (click)="save()">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .color-picker-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
      padding: 20px;
    }
    
    .color-inputs {
      display: flex;
      align-items: center;
      gap: 15px;
      width: 100%;
      max-width: 300px;
    }
    
    .color-picker-input {
      width: 60px;
      height: 40px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    
    .color-text-input {
      flex: 1;
      font-family: monospace;
    }
    
    .color-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .preview-square {
      width: 80px;
      height: 80px;
      border: 2px solid var(--ion-color-light);
      border-radius: 12px;
      background-image: 
        linear-gradient(45deg, #ccc 25%, transparent 25%), 
        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #ccc 75%), 
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }
    
    .hex-value {
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ColorPickerModalComponent {
  @Input() colorName: string = '';
  @Input() currentColor: string = '#000000';
  
  selectedColor: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.selectedColor = this.currentColor;
  }

  onColorChange() {
    // Color picker changed, selectedColor is already updated by ngModel
  }

  onTextChange(event: any) {
    let newColor = event.detail.value;
    if (!newColor.startsWith('#')) {
      newColor = '#' + newColor;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      this.selectedColor = newColor;
    }
  }

  save() {
    this.modalController.dismiss({
      color: this.selectedColor
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
