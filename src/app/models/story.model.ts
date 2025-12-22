export type StoryLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WordCategory {
  id: string;
  name: string;
  words: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  sentences: string[]; // Content split into sentences for TTS highlighting
  subject: string;
  level: StoryLevel;
  categoryId: string;
  wordsUsed: string[]; // Words that were requested to be included
  language: string; // Target language code (e.g., 'es-ES')
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryCategory {
  id: string;
  name: string;
  description?: string;
  storyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateStoryRequest {
  subject: string;
  level: StoryLevel;
  words: string[];
  language: string;
  sentenceCount?: number; // Optional: how many sentences to generate
}

export interface GenerateStoryResponse {
  title: string;
  content: string;
  sentences: string[];
}
