import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private sessionActiveSubject = new BehaviorSubject<boolean>(false);
  public sessionActive$ = this.sessionActiveSubject.asObservable();

  constructor() { }

  setSessionActive(active: boolean) {
    this.sessionActiveSubject.next(active);
  }

  isSessionActive(): boolean {
    return this.sessionActiveSubject.value;
  }
}
