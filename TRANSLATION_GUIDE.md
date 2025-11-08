# Translation System Guide

## Overview

The app now supports multiple UI languages through a comprehensive translation system. Users can select their **Native Language** (for the app interface) and **Target Language** (the language they're learning) independently.

## Supported Languages

- English (en-US) - Default native language
- Spanish (es-ES) - Default target language
- French (fr-FR)
- Portuguese (pt-PT)
- German (de-DE)
- Italian (it-IT)

## How to Use Translations in Your Code

### 1. In TypeScript Components

Import and inject the `TranslationService`:

```typescript
import { TranslationService } from '../services/translation.service';

constructor(private translationService: TranslationService) {}

// Use the translate method
const text = this.translationService.translate('settings.title');
// or use the shorthand
const text = this.translationService.t('settings.title');
```

### 2. In HTML Templates

Import the `TranslatePipe` in your component:

```typescript
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  // ...
  imports: [CommonModule, IonicModule, TranslatePipe],
})
```

Then use it in your template:

```html
<ion-label>{{ 'settings.title' | translate }}</ion-label>
<h1>{{ 'home.sessionComplete' | translate }}</h1>
```

### 3. Adding New Translation Keys

Edit `/src/app/services/translation.service.ts` and add your keys to all language objects:

```typescript
this.translations['en-US'] = {
  common: {
    myNewKey: 'My New Text'
  }
};

this.translations['es-ES'] = {
  common: {
    myNewKey: 'Mi Nuevo Texto'
  }
};
// ... repeat for all languages
```

## Available Translation Keys

### Common
- `common.save`, `common.cancel`, `common.delete`, `common.edit`, `common.close`
- `common.ok`, `common.yes`, `common.no`, `common.confirm`
- `common.back`, `common.next`, `common.done`
- `common.loading`, `common.error`, `common.success`

### Settings
- `settings.title`, `settings.languageSettings`
- `settings.nativeLanguage`, `settings.targetLanguage`
- `settings.nativeLanguageDesc`, `settings.targetLanguageDesc`
- `settings.autoSpeak`, `settings.appearance`, `settings.study`
- `settings.data`, `settings.about`, `settings.darkMode`
- `settings.resetSettings`, `settings.resetData`
- `settings.exportData`, `settings.importData`

### Tabs
- `tabs.home`, `tabs.decks`, `tabs.stats`, `tabs.settings`

### Home/Study
- `home.title`, `home.noCards`, `home.flip`, `home.showAnswer`
- `home.hard`, `home.good`, `home.easy`
- `home.incorrect`, `home.correct`
- `home.sessionComplete`, `home.cardsStudied`
- `home.continueStudying`, `home.reviewMissed`

### Decks
- `decks.title`, `decks.createDeck`, `decks.editDeck`, `decks.deleteDeck`
- `decks.addCard`, `decks.deckName`, `decks.description`
- `decks.cards`, `decks.noDecks`, `decks.createFirst`

### Stats
- `stats.title`, `stats.totalCards`, `stats.mastered`
- `stats.learning`, `stats.new`, `stats.studyStreak`, `stats.days`

## Language Settings Location

Users can change their language preferences in:
**Settings → Language Settings**

- **Native Language**: Changes the app's UI language
- **Target Language**: The language being learned (used for TTS and card content)

## Implementation Details

### Files Modified/Created:
1. `/src/app/services/translation.service.ts` - Core translation service
2. `/src/app/pipes/translate.pipe.ts` - Angular pipe for templates
3. `/src/app/settings/settings.page.ts` - Added nativeLanguage field
4. `/src/app/modals/tts/tts-modal.component.ts` - Dual language pickers
5. `/src/app/modals/tts/tts-modal.component` (HTML) - Updated UI
6. `/src/app/tabs/tabs.page.ts` & `.html` - Example implementation

### Default Values:
- **Native Language**: English (en-US)
- **Target Language**: Spanish (es-ES)

## Best Practices

1. **Always add translations for all supported languages** when adding new keys
2. **Use descriptive key names** following the pattern `section.feature.action`
3. **Keep translations concise** for UI elements
4. **Test language switching** to ensure all text updates properly
5. **Use the pipe in templates** for automatic updates when language changes

## Future Enhancements

To add more languages:
1. Add the language code to `SupportedLanguage` type in `translation.service.ts`
2. Add the language to `availableLanguages` array in `settings.page.ts`
3. Create a complete translation object in `loadTranslations()` method
4. Test all screens with the new language

## Example: Complete Component Implementation

```typescript
// component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-example',
  templateUrl: './example.page.html',
  imports: [CommonModule, IonicModule, TranslatePipe],
})
export class ExamplePage {
  constructor(public translationService: TranslationService) {}
  
  showMessage() {
    const msg = this.translationService.t('common.success');
    console.log(msg);
  }
}
```

```html
<!-- component.html -->
<ion-header>
  <ion-toolbar>
    <ion-title>{{ 'settings.title' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-button (click)="showMessage()">
    {{ 'common.save' | translate }}
  </ion-button>
</ion-content>
```
