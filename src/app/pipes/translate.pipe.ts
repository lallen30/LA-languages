import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey: string = '';
  private lastValue: string = '';
  private subscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to language changes to trigger re-translation
    this.subscription = this.translationService.getLanguage$().subscribe(() => {
      this.lastKey = ''; // Reset to force re-translation
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.lastValue = this.translationService.translate(key);
    }
    return this.lastValue;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
