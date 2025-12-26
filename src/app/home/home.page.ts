import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';
import { MenuService } from '../services/menu.service';
import { addIcons } from 'ionicons';
import { 
  library,
  folder,
  copy,
  play,
  menuOutline,
  menu
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class HomePage implements OnInit {

  constructor(
    private router: Router,
    private menuService: MenuService
  ) {
    // Register required icons
    addIcons({
      'library': library,
      'folder': folder,
      'copy': copy,
      'play': play,
      'menu-outline': menuOutline,
      'menu': menu
    });
  }

  openMenu() {
    console.log('openMenu called');
    this.menuService.open();
  }

  ngOnInit() {
    // Simple initialization for home page
  }



  goToDecks() {
    this.router.navigate(['/tabs/decks_backup']);
  }

  goToStories() {
    this.router.navigate(['/tabs/stories']);
  }

  goToStats() {
    this.router.navigate(['/tabs/stats']);
  }

  goToMap() {
    this.router.navigate(['/tabs/progression-map']);
  }

  goToSettings() {
    this.router.navigate(['/tabs/settings']);
  }

  goToHelp() {
    this.router.navigate(['/help']);
  }

}
