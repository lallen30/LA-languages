import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  repeat,
  school,
  informationCircle,
  checkmarkCircle,
  settings,
  bulb,
  star,
  time,
  trendingUp,
  refresh,
  analytics,
  volumeHigh,
  library,
  create,
  rocket,
  heart
} from 'ionicons/icons';

// Register all icons used in the help page
addIcons({
  'arrow-back': arrowBack,
  'repeat': repeat,
  'school': school,
  'information-circle': informationCircle,
  'checkmark-circle': checkmarkCircle,
  'settings': settings,
  'bulb': bulb,
  'star': star,
  'time': time,
  'trending-up': trendingUp,
  'refresh': refresh,
  'analytics': analytics,
  'volume-high': volumeHigh,
  'library': library,
  'create': create,
  'rocket': rocket,
  'heart': heart
});

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HelpPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['/tabs/settings']);
  }

}
