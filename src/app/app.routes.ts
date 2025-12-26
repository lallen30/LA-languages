import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'stories',
    loadComponent: () => import('./stories/stories.page').then( m => m.StoriesPage)
  },
  {
    path: 'story-detail',
    loadComponent: () => import('./story-detail/story-detail.page').then( m => m.StoryDetailPage)
  },
  {
    path: 'help',
    loadComponent: () => import('./help/help.page').then( m => m.HelpPage)
  },
  {
    path: 'progression-map',
    loadComponent: () => import('./progression-map/progression-map.page').then( m => m.ProgressionMapPage)
  },
];
