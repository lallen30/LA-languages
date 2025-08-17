import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonActionSheet, IonButton } from '@ionic/angular/standalone';
import {
  IonAvatar,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { pin, share, trash } from 'ionicons/icons';

@Component({
  selector: 'app-example',
  templateUrl: 'example.page.html',
  styleUrls: ['example.page.scss'],
  imports: [
    CommonModule,
    IonAvatar,
    IonContent,
    IonHeader,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
    IonActionSheet,
  ],
})
export class ExampleComponent {
  isActionSheetOpen = false;

  public actionSheetButtons = [
    {
      text: 'Delete',
      role: 'destructive',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Share',
      data: {
        action: 'share',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  constructor() {
    addIcons({ pin, share, trash });
  }

  setOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }

  unread(name: string) {
    console.log('Unread:', name);
  }


}