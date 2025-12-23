// TEMPLATE FILE - Copy to environment.ts and environment.prod.ts
// Replace placeholder values with your actual API keys
// DO NOT commit environment.ts or environment.prod.ts to Git!

export const environment = {
  production: false,
  
  // Google API Keys
  googleApiKey: 'YOUR_GOOGLE_API_KEY_HERE',
  googleSearchEngineId: 'YOUR_SEARCH_ENGINE_ID_HERE',
  
  // Google Cloud TTS API URL
  googleTtsUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  
  // Google Gemini AI API Key (for story generation)
  // Get your key from: https://aistudio.google.com/app/apikey
  googleGeminiApiKey: 'YOUR_GEMINI_API_KEY_HERE'
};
