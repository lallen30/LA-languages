import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss']
})
export class AboutModalComponent {
  @Output() helpClick = new EventEmitter<void>();
  @Output() buyCoffeeClick = new EventEmitter<void>();
}
