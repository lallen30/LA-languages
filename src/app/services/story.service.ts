import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Story, StoryCategory, WordCategory, GenerateStoryRequest, GenerateStoryResponse, StoryLevel } from '../models/story.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  constructor(private storageService: StorageService) {}

  /**
   * Generate a story using Google Gemini AI
   */
  async generateStory(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
    const apiKey = environment.googleGeminiApiKey;
    
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured. Please add googleGeminiApiKey to environment.');
    }

    const levelDescriptions: Record<StoryLevel, string> = {
      'beginner': 'Use simple vocabulary, short sentences, present tense, and basic grammar. Suitable for A1-A2 level learners.',
      'intermediate': 'Use moderate vocabulary, compound sentences, various tenses, and intermediate grammar. Suitable for B1-B2 level learners.',
      'advanced': 'Use rich vocabulary, complex sentences, all tenses, idioms, and advanced grammar. Suitable for C1-C2 level learners.'
    };

    const languageNames: Record<string, string> = {
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'es-US': 'Spanish (Latin America)',
      'fr-FR': 'French',
      'pt-BR': 'Portuguese (Brazil)',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'en-US': 'English'
    };

    const languageName = languageNames[request.language] || request.language;
    const sentenceCount = request.sentenceCount || 10;

    const prompt = `Generate a short story in ${languageName} about "${request.subject}".

Requirements:
- Level: ${request.level} - ${levelDescriptions[request.level]}
- The story MUST include these words naturally: ${request.words.join(', ')}
- The story should be approximately ${sentenceCount} sentences long
- Make the story engaging and educational

Please respond in this exact JSON format:
{
  "title": "Story title in ${languageName}",
  "content": "The full story text with proper punctuation",
  "sentences": ["First sentence.", "Second sentence.", "...each sentence as a separate array element"]
}

Important: Return ONLY valid JSON, no additional text or markdown.`;

    try {
      const response = await fetch(`${this.GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new Error('No content returned from Gemini API');
      }

      // Parse the JSON response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse story response as JSON');
      }

      const storyData = JSON.parse(jsonMatch[0]) as GenerateStoryResponse;
      return storyData;

    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  }

  /**
   * Save a new story
   */
  async saveStory(story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>): Promise<Story> {
    const stories = await this.getStories();
    
    const newStory: Story = {
      ...story,
      id: `story_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    stories.push(newStory);
    await this.storageService.set('stories', stories);

    // Update category story count
    await this.updateCategoryStoryCount(story.categoryId);

    return newStory;
  }

  /**
   * Get all stories
   */
  async getStories(): Promise<Story[]> {
    const stories = await this.storageService.get('stories');
    return stories || [];
  }

  /**
   * Get stories by category
   */
  async getStoriesByCategory(categoryId: string): Promise<Story[]> {
    const stories = await this.getStories();
    return stories.filter(s => s.categoryId === categoryId);
  }

  /**
   * Get a single story by ID
   */
  async getStory(id: string): Promise<Story | null> {
    const stories = await this.getStories();
    return stories.find(s => s.id === id) || null;
  }

  /**
   * Update an existing story
   */
  async updateStory(id: string, updates: Partial<Pick<Story, 'title' | 'content' | 'sentences'>>): Promise<Story | null> {
    const stories = await this.getStories();
    const index = stories.findIndex(s => s.id === id);
    
    if (index === -1) {
      return null;
    }

    stories[index] = {
      ...stories[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.storageService.set('stories', stories);
    return stories[index];
  }

  /**
   * Delete a story
   */
  async deleteStory(id: string): Promise<void> {
    const stories = await this.getStories();
    const story = stories.find(s => s.id === id);
    const filtered = stories.filter(s => s.id !== id);
    await this.storageService.set('stories', filtered);

    if (story) {
      await this.updateCategoryStoryCount(story.categoryId);
    }
  }

  // ============ CATEGORIES ============

  /**
   * Get all story categories
   */
  async getCategories(): Promise<StoryCategory[]> {
    const categories = await this.storageService.get('storyCategories');
    return categories || [];
  }

  /**
   * Create a new category
   */
  async createCategory(name: string, description?: string): Promise<StoryCategory> {
    const categories = await this.getCategories();
    
    const newCategory: StoryCategory = {
      id: `cat_${Date.now()}`,
      name,
      description,
      storyCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    categories.push(newCategory);
    await this.storageService.set('storyCategories', categories);
    return newCategory;
  }

  /**
   * Update category story count
   */
  private async updateCategoryStoryCount(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const stories = await this.getStoriesByCategory(categoryId);
    
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.storyCount = stories.length;
      category.updatedAt = new Date();
      await this.storageService.set('storyCategories', categories);
    }
  }

  /**
   * Delete a category and all its stories
   */
  async deleteCategory(id: string): Promise<void> {
    const categories = await this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    await this.storageService.set('storyCategories', filtered);

    // Delete all stories in this category
    const stories = await this.getStories();
    const filteredStories = stories.filter(s => s.categoryId !== id);
    await this.storageService.set('stories', filteredStories);
  }

  // ============ WORD CATEGORIES ============

  /**
   * Get all word categories
   */
  async getWordCategories(): Promise<WordCategory[]> {
    const categories = await this.storageService.get('wordCategories');
    return categories || [];
  }

  /**
   * Create a new word category
   */
  async createWordCategory(name: string): Promise<WordCategory> {
    const categories = await this.getWordCategories();
    
    const newCategory: WordCategory = {
      id: `wordcat_${Date.now()}`,
      name,
      words: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    categories.push(newCategory);
    await this.storageService.set('wordCategories', categories);
    return newCategory;
  }

  /**
   * Add words to a word category
   */
  async addWordsToCategory(categoryId: string, words: string[]): Promise<void> {
    const categories = await this.getWordCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      // Add unique words only
      const uniqueWords = [...new Set([...category.words, ...words])];
      category.words = uniqueWords;
      category.updatedAt = new Date();
      await this.storageService.set('wordCategories', categories);
    }
  }

  /**
   * Remove a word from a category
   */
  async removeWordFromCategory(categoryId: string, word: string): Promise<void> {
    const categories = await this.getWordCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      category.words = category.words.filter(w => w !== word);
      category.updatedAt = new Date();
      await this.storageService.set('wordCategories', categories);
    }
  }

  /**
   * Delete a word category
   */
  async deleteWordCategory(id: string): Promise<void> {
    const categories = await this.getWordCategories();
    const filtered = categories.filter(c => c.id !== id);
    await this.storageService.set('wordCategories', filtered);
  }

  /**
   * Get a word category by ID
   */
  async getWordCategory(id: string): Promise<WordCategory | null> {
    const categories = await this.getWordCategories();
    return categories.find(c => c.id === id) || null;
  }
}
