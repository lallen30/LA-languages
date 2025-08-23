import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-appearance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './appearance-modal.component.html',
  styleUrls: ['./appearance-modal.component.scss']
})
export class AppearanceModalComponent {
  @Input() settings: any;
  @Output() darkModeChange = new EventEmitter<void>();
  @Output() resetColorsClick = new EventEmitter<void>();
  @Output() previewColorsClick = new EventEmitter<void>();
}
