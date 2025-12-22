import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentLanguage = 'es-MX';
  private speechRate = 1.0;
  private speechPitch = 1.0;
  private voicesLoaded = false;
  private useGoogleTTS = true; // Enable Google Cloud TTS for better quality
  private audioCache: Map<string, string> = new Map(); // Cache audio URLs
  
  // Google Cloud TTS API configuration - using environment variables
  private readonly GOOGLE_TTS_API_KEY = environment.googleApiKey;
  private readonly GOOGLE_TTS_URL = environment.googleTtsUrl;
  
  // Language code mapping for Google Cloud TTS
  // Available Spanish voices:
  // Spain: es-ES-Neural2-A (female), es-ES-Neural2-B (male), es-ES-Neural2-C (female), es-ES-Neural2-D (female), es-ES-Neural2-E (female), es-ES-Neural2-F (male)
  // US: es-US-Neural2-A (female), es-US-Neural2-B (male), es-US-Neural2-C (male)
  // Latin America: es-US-Studio-B (male - more natural)
  private readonly languageVoiceMap: { [key: string]: { languageCode: string, name: string } } = {
    'es-ES': { languageCode: 'es-ES', name: 'es-ES-Neural2-B' }, // Male voice, Spain
    'es-MX': { languageCode: 'es-US', name: 'es-US-Neural2-B' }, // Male voice, US/Latin America
    'es-US': { languageCode: 'es-US', name: 'es-US-Neural2-B' }, // Male voice, US/Latin America
    'en-US': { languageCode: 'en-US', name: 'en-US-Neural2-J' },
    'en-GB': { languageCode: 'en-GB', name: 'en-GB-Neural2-B' },
    'fr-FR': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
    'pt-BR': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A' },
    'pt-PT': { languageCode: 'pt-PT', name: 'pt-PT-Neural2-A' },
    'de-DE': { languageCode: 'de-DE', name: 'de-DE-Neural2-A' },
    'it-IT': { languageCode: 'it-IT', name: 'it-IT-Neural2-A' },
  };

  constructor() {
    // Check if SpeechSynthesis is available (not available on Android WebView)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Load voices when they become available
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
      
      // iOS sometimes needs a delay to load voices
      setTimeout(() => this.loadVoices(), 100);
      setTimeout(() => this.loadVoices(), 500);
      setTimeout(() => this.loadVoices(), 1000);
    } else {
      console.log('TTS: SpeechSynthesis not available on this platform, using Google TTS only');
      this.synth = null as any;
    }
  }

  private loadVoices(): void {
    if (!this.synth) {
      return;
    }
    try {
      this.voices = this.synth.getVoices();
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
        console.log('TTS: Loaded', this.voices.length, 'browser voices');
      }
    } catch (error) {
      console.warn('TTS: Error loading voices:', error);
    }
  }

  /**
   * Set custom Spanish voice
   */
  setSpanishVoice(voiceName: string): void {
    // Update the voice map for Spanish languages
    const dialect = voiceName.startsWith('es-ES') ? 'es-ES' : 'es-US';
    const languageCode = dialect;
    
    this.languageVoiceMap['es-ES'] = { languageCode: 'es-ES', name: voiceName.startsWith('es-ES') ? voiceName : 'es-ES-Neural2-B' };
    this.languageVoiceMap['es-MX'] = { languageCode: 'es-US', name: voiceName.startsWith('es-US') ? voiceName : 'es-US-Neural2-B' };
    this.languageVoiceMap['es-US'] = { languageCode: 'es-US', name: voiceName.startsWith('es-US') ? voiceName : 'es-US-Neural2-B' };
    
    console.log('TTS: Spanish voice updated to:', voiceName);
  }

  /**
   * Speak the given text using Google Cloud TTS (with browser fallback)
   */
  async speak(text: string, language?: string): Promise<void> {
    console.log('🔊 TTS: speak() called with text:', text);
    console.log('🔊 TTS: useGoogleTTS:', this.useGoogleTTS);
    
    if (!text.trim()) {
      console.log('🔊 TTS: Empty text, returning');
      return;
    }

    const lang = language || this.currentLanguage;
    console.log('🔊 TTS: Language:', lang);
    console.log('🔊 TTS: Speaking text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

    // Try Google Cloud TTS first if enabled
    if (this.useGoogleTTS) {
      console.log('🔊 TTS: Attempting Google Cloud TTS');
      try {
        await this.speakWithGoogleTTS(text, lang);
        console.log('🔊 TTS: Google Cloud TTS completed successfully');
        return;
      } catch (error) {
        console.error('🔊 TTS: Google Cloud TTS failed, falling back to browser TTS:', error);
      }
    } else {
      console.log('🔊 TTS: Google TTS disabled, using browser TTS');
    }

    // Fallback to browser TTS
    console.log('🔊 TTS: Using browser TTS fallback');
    await this.speakWithBrowserTTS(text, lang);
  }

  /**
   * Speak with a specific voice (for voice preview)
   */
  async speakWithVoice(text: string, languageCode: string, voiceName: string): Promise<void> {
    console.log('🔊 TTS: speakWithVoice() called with voice:', voiceName);
    
    if (!text.trim()) {
      return;
    }

    // Use Google Cloud TTS with the specific voice
    try {
      await this.speakWithGoogleTTSVoice(text, languageCode, voiceName);
    } catch (error) {
      console.error('TTS: Failed to speak with voice:', error);
      // Fallback to regular speak
      await this.speak(text, languageCode);
    }
  }

  /**
   * Speak using Google Cloud TTS with a specific voice name
   */
  private async speakWithGoogleTTSVoice(text: string, languageCode: string, voiceName: string): Promise<void> {
    const requestBody = {
      input: { text },
      voice: {
        languageCode: languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: this.speechRate,
        pitch: (this.speechPitch - 1) * 4,
      },
    };

    console.log('TTS: Calling Google Cloud TTS API with specific voice:', voiceName);
    
    const response = await fetch(`${this.GOOGLE_TTS_URL}?key=${this.GOOGLE_TTS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Convert base64 audio to blob URL
    const audioContent = data.audioContent;
    const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);

    // Play the audio
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log('TTS: Voice preview playback completed');
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        console.error('TTS: Audio playback error:', e);
        reject(e);
      };
      audio.play().catch(reject);
    });
  }

  /**
   * Speak using Google Cloud Text-to-Speech API
   */
  private async speakWithGoogleTTS(text: string, language: string): Promise<void> {
    // Check cache first
    const cacheKey = `${language}:${text}`;
    let audioUrl = this.audioCache.get(cacheKey);

    if (!audioUrl) {
      // Get voice configuration for the language
      const voiceConfig = this.getGoogleVoiceConfig(language);
      
      const requestBody = {
        input: { text },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: this.speechRate,
          pitch: (this.speechPitch - 1) * 4, // Convert 0-2 range to -4 to 4
        },
      };

      console.log('TTS: Calling Google Cloud TTS API with voice:', voiceConfig.name);
      console.log('TTS: Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.GOOGLE_TTS_URL}?key=${this.GOOGLE_TTS_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('TTS: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS: API error response:', errorText);
        throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Convert base64 audio to blob URL
      const audioContent = data.audioContent;
      const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3');
      audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL (limit cache size)
      if (this.audioCache.size > 100) {
        // Remove oldest entry
        const firstKey = this.audioCache.keys().next().value;
        if (firstKey) {
          const oldUrl = this.audioCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          this.audioCache.delete(firstKey);
        }
      }
      this.audioCache.set(cacheKey, audioUrl);
    }

    // Play the audio
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        console.log('TTS: Google Cloud TTS playback completed');
        resolve();
      };
      audio.onerror = (e) => {
        console.error('TTS: Audio playback error:', e);
        reject(e);
      };
      audio.play().catch(reject);
    });
  }

  /**
   * Get Google Cloud TTS voice configuration for a language
   */
  private getGoogleVoiceConfig(language: string): { languageCode: string, name: string } {
    // Try exact match first
    if (this.languageVoiceMap[language]) {
      return this.languageVoiceMap[language];
    }
    
    // Try language code only (e.g., 'es' from 'es-ES')
    const langCode = language.split('-')[0];
    const matchingKey = Object.keys(this.languageVoiceMap).find(k => k.startsWith(langCode));
    if (matchingKey) {
      return this.languageVoiceMap[matchingKey];
    }
    
    // Default to Spanish
    return this.languageVoiceMap['es-ES'];
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Speak using browser's built-in TTS (fallback)
   */
  private speakWithBrowserTTS(text: string, language: string): Promise<void> {
    return new Promise((resolve) => {
      // Check if synth is available
      if (!this.synth) {
        console.log('TTS: Browser TTS not available, skipping');
        resolve();
        return;
      }
      
      // Try to load voices if not loaded yet
      if (!this.voicesLoaded || this.voices.length === 0) {
        this.loadVoices();
      }

      // Cancel any ongoing speech
      this.synth.cancel();
      
      // iOS WebView workaround: need a small delay after cancel
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language;
          utterance.rate = this.speechRate;
          utterance.pitch = this.speechPitch;

          // Find the best voice for the language
          const voice = this.findBestVoice(language);
          if (voice) {
            utterance.voice = voice;
            console.log('TTS: Using browser voice:', voice.name, voice.lang);
          } else {
            console.log('TTS: No specific voice found, using default for lang:', language);
          }

          utterance.onend = () => {
            console.log('TTS: Browser TTS completed');
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('TTS: Browser TTS error:', event.error);
            resolve();
          };

          this.synth.speak(utterance);
          
          // iOS workaround: sometimes speech doesn't start, check and retry
          setTimeout(() => {
            if (!this.synth.speaking && !this.synth.pending) {
              console.log('TTS: Speech may not have started, retrying...');
              this.synth.speak(utterance);
            }
          }, 100);
          
        } catch (error) {
          console.error('TTS: Exception during browser speak:', error);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Enable or disable Google Cloud TTS
   */
  setUseGoogleTTS(enabled: boolean): void {
    this.useGoogleTTS = enabled;
    console.log('TTS: Google Cloud TTS', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Check if Google Cloud TTS is enabled
   */
  isGoogleTTSEnabled(): boolean {
    return this.useGoogleTTS;
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Check if TTS is currently speaking
   */
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Set the language for TTS
   */
  setLanguage(language: string): void {
    this.currentLanguage = language;
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate: number): void {
    this.speechRate = Math.max(0.1, Math.min(10, rate));
    // Clear audio cache since rate affects audio generation
    this.clearCache();
    console.log('TTS: Speech rate set to:', this.speechRate);
  }

  /**
   * Clear the audio cache
   */
  clearCache(): void {
    // Revoke all cached audio URLs to free memory
    this.audioCache.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.audioCache.clear();
    console.log('TTS: Audio cache cleared');
  }

  /**
   * Set speech pitch (0 to 2)
   */
  setPitch(pitch: number): void {
    this.speechPitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Get available voices for a specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(language.split('-')[0]));
  }

  /**
   * Find the best voice for a given language
   */
  private findBestVoice(language: string): SpeechSynthesisVoice | null {
    // Try to find exact match first
    let voice = this.voices.find(v => v.lang === language);
    
    // If no exact match, try language code only (e.g., 'es' from 'es-ES')
    if (!voice) {
      const langCode = language.split('-')[0];
      voice = this.voices.find(v => v.lang.startsWith(langCode));
    }
    
    // Prefer local voices
    if (voice && !voice.localService) {
      const localVoice = this.voices.find(v => 
        v.lang.startsWith(language.split('-')[0]) && v.localService
      );
      if (localVoice) {
        voice = localVoice;
      }
    }
    
    return voice || null;
  }

  /**
   * Get current TTS settings
   */
  getSettings() {
    return {
      language: this.currentLanguage,
      rate: this.speechRate,
      pitch: this.speechPitch,
      availableVoices: this.getVoicesForLanguage(this.currentLanguage)
    };
  }
}
