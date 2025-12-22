# Story Feature Setup Guide

## Overview

The Story feature allows you to generate AI-powered stories in your target language using Google's Gemini AI. Stories are generated based on:
- A subject/topic you choose
- Difficulty level (beginner, intermediate, advanced)
- Specific words you want included in the story

## Google Gemini API Setup

### Step 1: Get Your API Key

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select a Google Cloud project (or create a new one)
5. Copy the generated API key

### Step 2: Add the API Key to Your App

1. Open `src/environments/environment.ts`
2. Find the `googleGeminiApiKey` field
3. Paste your API key:

```typescript
export const environment = {
  production: false,
  googleApiKey: 'your-existing-key',
  googleSearchEngineId: 'your-search-engine-id',
  googleTtsUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  googleGeminiApiKey: 'YOUR_GEMINI_API_KEY_HERE'  // <-- Add your key here
};
```

4. Also update `src/environments/environment.prod.ts` with the same key for production builds.

### Step 3: Rebuild the App

```bash
ionic build
npx cap sync android  # For Android
npx cap sync ios      # For iOS
```

## Using the Story Feature

### Accessing Stories

Navigate to `/tabs/stories` in the app (you may need to add a tab button or menu item to access it).

### Creating Word Categories

Word categories help you organize vocabulary for story generation:

1. On the Stories page, tap the **+** button in the header
2. Enter a category name (e.g., "Travel Words", "Food Vocabulary")
3. Add words manually or from your flashcard decks

### Adding Words from Decks

1. Go to the **Decks** page
2. Tap on a deck to open its menu
3. Select **"Add Words to Story Category"**
4. Choose an existing category or create a new one
5. All words from the deck's cards will be added

### Generating a Story

1. On the Stories page, tap the **FAB (+) button**
2. Fill in the form:
   - **Subject**: What the story should be about (e.g., "A trip to the market")
   - **Level**: Beginner, Intermediate, or Advanced
   - **Category**: Where to save the story
   - **Words**: Add words that must appear in the story
3. Tap **"Generate Story with AI"**
4. Wait for the AI to generate your story

### Reading Stories

1. Tap on any story card to open it
2. Read the story text
3. Tap **"Listen to Story"** to have it read aloud
4. The current sentence being read will be highlighted in real-time
5. Use pause/stop controls as needed

## API Pricing

Google Gemini API has a generous free tier:
- **Free**: 15 requests per minute, 1 million tokens per month
- For most users, the free tier is sufficient

Check current pricing at: https://ai.google.dev/pricing

## Troubleshooting

### "API key not configured" error
- Make sure you've added your API key to the environment files
- Rebuild the app after adding the key

### "Generation Failed" error
- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded the rate limit (wait a minute and try again)

### Stories not generating in the correct language
- Make sure your Target Language is set correctly in Settings
- The story will be generated in your configured target language

## Files Created/Modified

### New Files:
- `src/app/models/story.model.ts` - Data models
- `src/app/services/story.service.ts` - Story & AI generation service
- `src/app/stories/` - Stories list page
- `src/app/story-detail/` - Story reading page

### Modified Files:
- `src/environments/environment.ts` - Added Gemini API key
- `src/environments/environment.prod.ts` - Added Gemini API key
- `src/app/tabs/tabs.routes.ts` - Added story routes
- `src/app/decks_backup/decks.page.ts` - Added "Add Words to Category" feature
- `src/app/services/storage.service.ts` - Added generic get/set methods
