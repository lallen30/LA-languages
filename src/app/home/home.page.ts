import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  library,
  folder,
  copy,
  play
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {

  constructor(
    private router: Router
  ) {
    // Register required icons
    addIcons({
      'library': library,
      'folder': folder,
      'copy': copy,
      'play': play
    });
  }

  ngOnInit() {
    // Simple initialization for home page
  }



  goToFlashcards() {
    // Navigate to flashcards page
    this.router.navigate(['/tabs/flashcards']);
  }

  goToDecksCopy() {
    // Navigate to decks copy page
    this.router.navigate(['/tabs/decks-copy']);
  }

  goToDecksBackup() {
    // Navigate to decks backup page
    this.router.navigate(['/tabs/decks']);
  }

  goToExample() {
    // Navigate to example page
    this.router.navigate(['/tabs/example']);
  }

}
