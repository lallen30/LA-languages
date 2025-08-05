export type CardType = 'fill-blank' | 'picture-word';

export interface Card {
  id: string;
  type: CardType;
  // For fill-blank cards
  sentenceFront?: string;
  missingWord?: string;
  sentenceBack?: string;
  // For picture-word cards
  spanishWord?: string;
  // Common fields
  englishTranslation?: string;
  imageUrls: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReviewed: Date;
  skipCount: number;
  deckId: string;
  nextReview: Date;
  isNew: boolean;
  // For picture-word cards - determines if word or images show first
  showWordFirst?: boolean;
}

export interface CardResponse {
  correct: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}
