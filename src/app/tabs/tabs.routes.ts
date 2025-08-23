import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'flashcards',
        loadComponent: () =>
          import('../flashcards/flashcards.page').then((m) => m.FlashcardsPage),
      },
      {
        path: 'decks_backup',
        loadComponent: () =>
          import('../decks_backup/decks.page').then((m) => m.DecksPage),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('../stats/stats.page').then((m) => m.StatsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'card-management/:deckId',
        loadComponent: () =>
          import('../card-management/card-management.page').then((m) => m.CardManagementPage),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('../help/help.page').then((m) => m.HelpPage),
      },
      {
        path: 'example',
        loadComponent: () =>
          import('../example/example.page').then((m) => m.ExampleComponent),
      },
      {
        path: 'decks-copy',
        loadComponent: () =>
          import('../decks copy/decks.page').then((m) => m.DecksPage),
      },
      {
        path: 'image-selection',
        loadComponent: () =>
          import('../image-selection/image-selection.page').then((m) => m.ImageSelectionPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
