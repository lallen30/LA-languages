import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationDataService {
  private pendingCardData: any = null;

  setPendingCardData(data: any) {
    console.log('📱 NavigationDataService: Setting pending card data:', data);
    this.pendingCardData = data;
  }

  getPendingCardData(): any {
    console.log('📱 NavigationDataService: Getting pending card data:', this.pendingCardData);
    const data = this.pendingCardData;
    this.pendingCardData = null; // Clear after retrieval
    return data;
  }

  hasPendingCardData(): boolean {
    return this.pendingCardData !== null;
  }
}
