import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuOpenSubject = new BehaviorSubject<boolean>(false);
  menuOpen$ = this.menuOpenSubject.asObservable();

  open() {
    this.menuOpenSubject.next(true);
  }

  close() {
    this.menuOpenSubject.next(false);
  }

  toggle() {
    this.menuOpenSubject.next(!this.menuOpenSubject.value);
  }
}
