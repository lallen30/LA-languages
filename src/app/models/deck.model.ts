export interface Deck {
  id: string;
  name: string;
  description: string;
  language: string;
  cardCount: number;
  createdAt: Date;
  lastStudied?: Date;
  masteredCards: number;
  newCards: number;
  reviewCards: number;
  color: string;
}

export interface DeckStats {
  totalCards: number;
  newCards: number;
  reviewCards: number;
  masteredCards: number;
  completionPercentage: number;
  averageEaseFactor: number;
  streak: number;
}
