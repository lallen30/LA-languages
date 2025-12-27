import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, lockClosed, checkmarkCircle, menu } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { MenuService } from '../services/menu.service';
import { TranslatePipe } from '../pipes/translate.pipe';

export interface Level {
  id: number;
  title: string;
  image: string;
  cardsRequired: number;
  cumulativeCards: number;
  position: 'left' | 'right';
}

export type LevelStatus = 'locked' | 'current' | 'completed';

@Component({
  selector: 'app-progression-map',
  templateUrl: './progression-map.page.html',
  styleUrls: ['./progression-map.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons,
    IonButton,
    IonIcon,
    CommonModule, 
    FormsModule,
    TranslatePipe
  ]
})
export class ProgressionMapPage implements OnInit {
  totalMasteredCards = 0;
  currentLevel = 1;
  isDarkMode = false;
  
  levels: Level[] = [
    { id: 1, title: 'The Journey Begins', image: 'assets/images/level_1.png', cardsRequired: 25, cumulativeCards: 25, position: 'left' },
    { id: 2, title: 'A Wonderful Oasis', image: 'assets/images/level_2.png', cardsRequired: 50, cumulativeCards: 75, position: 'right' },
    { id: 3, title: 'Building Your World', image: 'assets/images/level_3.png', cardsRequired: 100, cumulativeCards: 175, position: 'left' },
    { id: 4, title: 'Into the Universe', image: 'assets/images/level_4.png', cardsRequired: 175, cumulativeCards: 350, position: 'right' },
    { id: 5, title: 'Hardened by Lava', image: 'assets/images/level_5.png', cardsRequired: 250, cumulativeCards: 600, position: 'left' },
    { id: 6, title: 'Resistance of a Crystal', image: 'assets/images/level_6.png', cardsRequired: 350, cumulativeCards: 950, position: 'right' },
    { id: 7, title: 'Unstoppable Knowledge', image: 'assets/images/level_7.png', cardsRequired: 500, cumulativeCards: 1450, position: 'left' },
    { id: 8, title: 'FluentFlip Attainment', image: 'assets/images/level_8.png', cardsRequired: 550, cumulativeCards: 2000, position: 'right' }
  ];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private menuService: MenuService
  ) {
    addIcons({menu,lockClosed,checkmarkCircle,arrowBack});
  }

  openMenu() {
    this.menuService.open();
  }

  async ngOnInit() {
    this.checkDarkMode();
    await this.loadMasteredCards();
  }

  async ionViewWillEnter() {
    this.checkDarkMode();
    await this.loadMasteredCards();
  }

  checkDarkMode() {
    this.isDarkMode = document.body.classList.contains('dark');
  }

  async loadMasteredCards() {
    const cards = await this.storageService.getAllCards();
    // Count mastered cards: not new AND has 3+ successful repetitions
    this.totalMasteredCards = cards.filter(c => !c.isNew && c.repetitions >= 3).length;
    this.calculateCurrentLevel();
  }

  calculateCurrentLevel() {
    this.currentLevel = 1;
    for (const level of this.levels) {
      if (this.totalMasteredCards >= level.cumulativeCards) {
        this.currentLevel = level.id + 1;
      } else {
        break;
      }
    }
    // Cap at level 8
    if (this.currentLevel > 8) {
      this.currentLevel = 8;
    }
  }

  getLevelStatus(level: Level): LevelStatus {
    if (this.totalMasteredCards >= level.cumulativeCards) {
      return 'completed';
    } else if (level.id === this.currentLevel || 
               (level.id === 1 && this.totalMasteredCards < level.cumulativeCards)) {
      return 'current';
    } else {
      return 'locked';
    }
  }

  getLevelProgress(level: Level): number {
    const status = this.getLevelStatus(level);
    if (status === 'completed') return 100;
    if (status === 'locked') return 0;
    
    // Calculate progress within current level
    const previousCumulative = level.id === 1 ? 0 : this.levels[level.id - 2].cumulativeCards;
    const cardsInLevel = this.totalMasteredCards - previousCumulative;
    const progress = (cardsInLevel / level.cardsRequired) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  getCardsToNextLevel(level: Level): number {
    const status = this.getLevelStatus(level);
    if (status === 'completed') return 0;
    return level.cumulativeCards - this.totalMasteredCards;
  }

  goBack() {
    this.router.navigate(['/tabs/settings']);
  }
}
