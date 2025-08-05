import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentLanguage = 'es-ES';
  private speechRate = 1.0;
  private speechPitch = 1.0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  /**
   * Speak the given text using TTS
   */
  speak(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language || this.currentLanguage;
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      // Find the best voice for the language
      const voice = this.findBestVoice(utterance.lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    this.synth.cancel();
  }

  /**
   * Check if TTS is currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
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
