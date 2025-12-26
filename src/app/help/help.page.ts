import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
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
  heart,
  checkmark,
  thumbsUp,
  thumbsDown,
  close,
  sparkles,
  albums,
  book,
  cloudDownload,
  warning,
  cloudUpload
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
  'heart': heart,
  'checkmark': checkmark,
  'thumbs-up': thumbsUp,
  'thumbs-down': thumbsDown,
  'close': close,
  'sparkles': sparkles,
  'albums': albums,
  'book': book,
  'cloud-download': cloudDownload,
  'warning': warning,
  'cloud-upload': cloudUpload
});

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HelpPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

  goBack() {
    this.navCtrl.back();
  }

}
