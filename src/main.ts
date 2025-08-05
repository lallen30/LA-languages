import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { addIcons } from 'ionicons';
import {
  refresh,
  image,
  close,
  search,
  arrowUndo,
  checkmarkDone,
  closeCircle,
  checkmarkCircle,
  ban,
  addCircleOutline,
  imageOutline,
  add,
  createOutline,
  trashOutline,
  libraryOutline,
  library,
  trophy,
  analytics,
  barChartOutline,
  arrowBack,
  language,
  volumeHigh,
  refreshCircle,
  refreshOutline,
  play,
  moon,
  speedometer,
  musicalNotes,
  layers,
  notifications,
  folder,
  download,
  cloudUpload,
  trash,
  informationCircle
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Add all icons used in the app
addIcons({
  refresh,
  image,
  close,
  search,
  'arrow-undo': arrowUndo,
  'checkmark-done': checkmarkDone,
  'close-circle': closeCircle,
  'checkmark-circle': checkmarkCircle,
  ban,
  'add-circle-outline': addCircleOutline,
  'image-outline': imageOutline,
  add,
  'create-outline': createOutline,
  'trash-outline': trashOutline,
  'library-outline': libraryOutline,
  library,
  trophy,
  analytics,
  'bar-chart-outline': barChartOutline,
  'arrow-back': arrowBack,
  language,
  'volume-high': volumeHigh,
  'refresh-circle': refreshCircle,
  'refresh-outline': refreshOutline,
  play,
  moon,
  speedometer,
  'musical-notes': musicalNotes,
  layers,
  notifications,
  folder,
  download,
  'cloud-upload': cloudUpload,
  trash,
  'information-circle': informationCircle
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicStorageModule.forRoot()),
  ],
});
