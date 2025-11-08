import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { home, library, barChart, settings, flask } from 'ionicons/icons';
import { SessionStateService } from '../services/session-state.service';
import { TranslationService } from '../services/translation.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule, TranslatePipe],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  isSessionActive = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private sessionStateService: SessionStateService,
    public translationService: TranslationService
  ) {
    addIcons({ home, library, barChart, settings, flask });
  }

  ngOnInit() {
    this.subscription = this.sessionStateService.sessionActive$.subscribe(
      (isActive) => {
        this.isSessionActive = isActive;
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
