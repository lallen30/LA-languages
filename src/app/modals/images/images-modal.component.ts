import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-images-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './images-modal.component.html',
  styleUrls: ['./images-modal.component.scss']
})
export class ImagesModalComponent {
  @Input() isIOS = false;
  @Input() settings: any;
  @Input() imageQualities: { value: string; label: string }[] = [];
  @Input() cacheSize = '';

  @Output() imageQualityChange = new EventEmitter<void>();
  @Output() clearImageCacheClick = new EventEmitter<void>();
}
