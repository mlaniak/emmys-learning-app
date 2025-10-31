// Text-to-Speech utility for accessibility
class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.selectedVoice = null;
    // Prioritize neural and premium voices that sound more natural
    this.preferredVoices = [
      // Google Neural voices (most natural)
      'Google US English (Neural)',
      'Google en-US Neural',
      'Google US English',
      'Google en-US',
      'Google US English (Enhanced)',
      // Apple voices (natural sounding)
      'Samantha Enhanced',
      'Samantha Premium',
      'Samantha',
      'Alex Enhanced',
      'Alex Premium',
      'Alex',
      'Victoria Enhanced',
      'Victoria',
      'Karen Enhanced',
      'Karen',
      'Moira Enhanced',
      'Moira',
      // Microsoft Neural voices
      'Microsoft Aria Neural',
      'Microsoft Aria Online (Natural)',
      'Microsoft Aria',
      'Microsoft Zira Neural',
      'Microsoft Zira',
      'Microsoft Guy Neural',
      'Microsoft Guy',
      'Microsoft David Neural',
      'Microsoft David',
      // Other quality voices
      'Veena',
      'Tessa',
      'Fiona',
      'Daniel'
    ];
    this.voiceLoaded = false;
    this.audioUnlocked = false;
    this.audioCtx = null;
    
    // Load voices when available
    this.loadVoices();

    // Attempt to unlock audio on first user gesture (iOS/Safari/WebAudio quirk)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const unlock = () => {
        try {
          if (this.synth && this.synth.resume) this.synth.resume();
          this.unlockAudioContext();
          this.audioUnlocked = true;
        } catch (_) {}
        document.removeEventListener('touchstart', unlock, { passive: true });
        document.removeEventListener('click', unlock, true);
        document.removeEventListener('keydown', unlock, true);
      };
      document.addEventListener('touchstart', unlock, { passive: true });
      document.addEventListener('click', unlock, true);
      document.addEventListener('keydown', unlock, true);
    }
  }

  // Load available voices
  loadVoices() {
    if (!this.isSupported) return;
    
    const loadVoicesList = () => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voiceLoaded = true;
        this.selectBestVoice(voices);
      }
    };

    // Try to load voices immediately
    loadVoicesList();
    
    // Also listen for voice changes (some browsers load voices asynchronously)
    this.synth.onvoiceschanged = loadVoicesList;
  }

  // Select the best available voice
  selectBestVoice(voices) {
    // First try to find a preferred voice (prioritize neural/premium voices)
    for (const preferredName of this.preferredVoices) {
      const voice = voices.find(v => {
        const name = v.name.toLowerCase();
        const preferred = preferredName.toLowerCase();
        return name.includes(preferred) || 
               name.includes(preferred.replace(' enhanced', '')) ||
               name.includes(preferred.replace(' neural', '')) ||
               name.includes(preferred.replace(' premium', ''));
      });
      if (voice && voice.lang.startsWith('en')) {
        this.selectedVoice = voice;
        console.log(`Selected voice: ${voice.name}`);
        return;
      }
    }

    // Fallback: find any English voice that's not obviously robotic
    const englishVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      !v.name.toLowerCase().includes('robotic') &&
      !v.name.toLowerCase().includes('system') &&
      !v.name.toLowerCase().includes('novelty') &&
      !v.name.toLowerCase().includes('pipe organ')
    );

    if (englishVoices.length > 0) {
      // Prioritize: Neural voices > Premium voices > Enhanced voices > Local voices > Others
      const neuralVoice = englishVoices.find(v => 
        v.name.toLowerCase().includes('neural') || 
        v.name.toLowerCase().includes('natural')
      );
      if (neuralVoice) {
        this.selectedVoice = neuralVoice;
        console.log(`Selected neural voice: ${neuralVoice.name}`);
        return;
      }

      const premiumVoice = englishVoices.find(v => 
        v.name.toLowerCase().includes('premium') || 
        v.name.toLowerCase().includes('enhanced')
      );
      if (premiumVoice) {
        this.selectedVoice = premiumVoice;
        console.log(`Selected premium voice: ${premiumVoice.name}`);
        return;
      }

      // Prefer local voices over remote ones for better quality
      const localVoice = englishVoices.find(v => v.localService);
      this.selectedVoice = localVoice || englishVoices[0];
      console.log(`Selected fallback voice: ${this.selectedVoice.name}`);
    }
  }

  // Speak text with options
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    // Stop any current speech
    this.stop();

    // Enhanced default options for more natural, human-like speech
    const defaultOptions = {
      rate: 0.95,       // Closer to natural human speech rate (was 0.85, too slow/robotic)
      pitch: 1.0,       // Natural pitch (avoid artificial sounding highs)
      volume: 0.9,      // Clear volume without being too loud
      lang: 'en-US'     // English
    };

    // Merge with provided options
    const speechOptions = { ...defaultOptions, ...options };

    // Try to use SSML if supported, otherwise fall back to enhanced text
    let speechText = text;
    try {
      // Check if the browser supports SSML (some do, some don't)
      if (this.selectedVoice && this.selectedVoice.localService) {
        // For local voices, try SSML
        speechText = this.createSSML(text, speechOptions);
      } else {
        // For online voices, use enhanced text without SSML tags
        speechText = this.enhanceTextForSpeech(text)
          .replace(/<[^>]*>/g, '') // Remove SSML tags for compatibility
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (error) {
      console.warn('SSML not supported, using enhanced text:', error);
      speechText = this.enhanceTextForSpeech(text)
        .replace(/<[^>]*>/g, '') // Remove SSML tags
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Use natural sentence chunking with slight variations for more human delivery
    // Make sure Web Speech is not suspended (Safari/iOS) and WebAudio is unlocked
    try { if (this.synth && this.synth.resume) this.synth.resume(); } catch (_) {}
    this.unlockAudioContext();

    // Ensure we pass plain text to the browser TTS engine (SSML strings are not supported here)
    const plainText = typeof speechText === 'string' 
      ? speechText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() 
      : String(speechText || '');

    // Wait briefly for voices to be ready, then speak
    this.ensureVoicesReady(600).finally(() => {
      this.speakWithNaturalChunks(plainText, speechOptions);
    });
  }

  // Speak with sentence-level chunking and subtle prosody variations
  speakWithNaturalChunks(fullText, baseOptions) {
    const chunks = this.chunkTextIntoSentences(fullText);
    if (chunks.length === 0) return;

    let index = 0;
    const speakNext = () => {
      if (index >= chunks.length) {
        this.isPlaying = false;
        if (typeof baseOptions.onEnd === 'function') baseOptions.onEnd();
        return;
      }

      const raw = chunks[index];
      const trimmed = raw.trim();
      if (!trimmed) {
        index += 1;
        speakNext();
        return;
      }

      // Slight, human-like variations
      const isQuestion = /\?$/.test(trimmed);
      const isExclaim = /!$/.test(trimmed);
      const rateJitter = (Math.random() * 0.06) - 0.03; // ±0.03
      const pitchJitter = (Math.random() * 0.06) - 0.03; // ±0.03

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.rate = Math.max(0.8, Math.min(1.2, (baseOptions.rate ?? 0.95) + rateJitter + (isExclaim ? 0.02 : 0)));
      utterance.pitch = Math.max(0.8, Math.min(1.4, (baseOptions.pitch ?? 1.0) + pitchJitter + (isQuestion ? 0.04 : 0)));
      utterance.volume = baseOptions.volume ?? 0.9;
      utterance.lang = baseOptions.lang ?? 'en-US';

      if (this.selectedVoice) utterance.voice = this.selectedVoice;

      utterance.onstart = () => {
        this.isPlaying = true;
        if (index === 0 && typeof baseOptions.onStart === 'function') baseOptions.onStart();
      };

      utterance.onend = () => {
        // Natural pause between sentences
        index += 1;
        const pauseMs = isQuestion ? 140 : isExclaim ? 120 : 110;
        setTimeout(speakNext, pauseMs);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        this.isPlaying = false;
        if (typeof baseOptions.onError === 'function') baseOptions.onError(event);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);

      // Safety retry: some engines drop the first enqueue after resume/cancel
      setTimeout(() => {
        try {
          if (!this.synth.speaking && this.currentUtterance === utterance) {
            // Retry once without forcing a specific voice
            if (utterance.voice) utterance.voice = null;
            this.synth.speak(utterance);
          }
        } catch (_) {}
      }, 60);
    };

    speakNext();
  }

  // Basic sentence chunking respecting punctuation
  chunkTextIntoSentences(text) {
    try {
      const normalized = String(text).replace(/\s+/g, ' ').trim();
      if (!normalized) return [];
      const parts = normalized.split(/([.!?]+)\s+/).reduce((acc, cur, i, arr) => {
        if (!cur) return acc;
        if (/^[.!?]+$/.test(cur)) {
          // append punctuation to previous
          if (acc.length > 0) acc[acc.length - 1] += cur;
        } else {
          acc.push(cur);
        }
        return acc;
      }, []);
      return parts.length ? parts : [normalized];
    } catch (_) {
      return [String(text)];
    }
  }

  // WebAudio unlock helper (plays a near-silent blip to satisfy autoplay policies)
  unlockAudioContext() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.audioCtx) this.audioCtx = new Ctx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.02);
    } catch (_) {}
  }

  // Wait until voices are available (or timeout)
  ensureVoicesReady(timeoutMs = 500) {
    return new Promise((resolve) => {
      try {
        const start = Date.now();
        const check = () => {
          const voices = this.getVoices();
          if (voices && voices.length > 0) return resolve();
          if (Date.now() - start > timeoutMs) return resolve();
          setTimeout(check, 50);
        };
        check();
      } catch (_) {
        resolve();
      }
    });
  }

  // Stop current speech
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.currentUtterance = null;
  }

  // Toggle speaking: stop if currently speaking, otherwise speak
  toggleSpeak(text, options = {}) {
    if (this.getIsPlaying()) {
      this.stop();
      return 'stopped';
    }
    this.speak(text, options);
    return 'started';
  }

  // Speak question text with natural pacing
  speakQuestion(questionText) {
    // Add natural pauses and emphasis
    const enhancedText = this.enhanceTextForSpeech(questionText);
    this.speak(enhancedText, {
      rate: 0.92,       // Natural conversational pace (slightly slower for clarity)
      pitch: 1.02,      // Slight upward inflection for questions (natural)
      volume: 0.9,      // Clear volume
      onStart: () => console.log('Speaking question...'),
      onEnd: () => console.log('Question finished')
    });
  }

  // Toggle question speech (same button to start/stop)
  toggleQuestion(questionText) {
    if (this.getIsPlaying()) {
      this.stop();
      return 'stopped';
    }
    this.speakQuestion(questionText);
    return 'started';
  }

  // Speak answer option
  speakAnswer(answerText) {
    this.speak(answerText, {
      rate: 0.95,       // Natural pace, confident but not rushed
      pitch: 1.0,       // Neutral pitch (natural)
      volume: 0.9,      // Clear volume
      onStart: () => console.log('Speaking answer...'),
      onEnd: () => console.log('Answer finished')
    });
  }

  // Speak word (for spelling practice) with clear pronunciation
  speakWord(word) {
    // Enhance word for clearer pronunciation
    const enhancedWord = this.enhanceWordForSpelling(word);
    this.speak(enhancedWord, {
      rate: 0.7,        // Slower for spelling
      pitch: 1.1,       // Slightly higher for clarity
      volume: 0.95,     // Maximum clarity
      onStart: () => console.log('Speaking word...'),
      onEnd: () => console.log('Word finished')
    });
  }

  // Toggle word speech (same button to start/stop)
  toggleWord(word) {
    if (this.getIsPlaying()) {
      this.stop();
      return 'stopped';
    }
    this.speakWord(word);
    return 'started';
  }

  // Enhance text for more natural speech using prosody techniques
  enhanceTextForSpeech(text) {
    // Clean text first
    let enhanced = text
      .trim()
      // Preserve natural punctuation spacing (browser handles this, but we ensure single spaces)
      .replace(/\s+/g, ' ');

    // Add natural prosody variations to avoid monotone speech
    // This helps the voice sound more conversational and less robotic
    
    // Add slight emphasis to question words (makes questions sound more natural)
    enhanced = enhanced.replace(/\b(what|where|when|why|how|which|who)\b/gi, (match) => {
      // Capitalize properly
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });

    // Add natural pauses for lists (better rhythm)
    enhanced = enhanced.replace(/(\d+)[\.\)]\s*/g, '$1. ');

    // Improve number pronunciation (space out digits in larger numbers)
    enhanced = enhanced.replace(/\b(\d{4,})\b/g, (match) => {
      // For numbers 1000+, add slight pauses for clarity
      return match.split('').join(' ');
    });

    // Ensure proper spacing around punctuation (browser TTS handles this better with spacing)
    enhanced = enhanced
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')  // Space after sentence endings
      .replace(/([,:;])\s*/g, '$1 ')            // Consistent comma/colon spacing
      .replace(/\s+/g, ' ')                      // Clean up multiple spaces
      .trim();

    // Remove SSML tags if any were added (for browsers that don't support them)
    enhanced = enhanced.replace(/<[^>]*>/g, '');
    
    return enhanced;
  }

  // Create SSML markup for better speech synthesis
  createSSML(text, options = {}) {
    const {
      rate = 0.95,
      pitch = 1.0,
      volume = 0.9,
      emphasis = 'moderate'
    } = options;

    // Enhanced SSML structure with prosody for more natural speech
    // Add slight prosody variations to avoid monotone delivery
    const enhancedText = this.enhanceTextForSpeech(text);
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
          ${enhancedText}
        </prosody>
      </speak>
    `.trim();

    return ssml;
  }

  // Enhance word for spelling practice
  enhanceWordForSpelling(word) {
    // Add slight pauses between letters for spelling practice
    return word.split('').join(' ').replace(/\s+/g, ' ');
  }

  // Check if speech is currently playing
  getIsPlaying() {
    return this.isPlaying;
  }

  // Get available voices
  getVoices() {
    return this.synth.getVoices();
  }

  // Get available English voices
  getEnglishVoices() {
    const voices = this.getVoices();
    return voices.filter(v => v.lang.startsWith('en'));
  }

  // Set a specific voice (if available)
  setVoice(voiceName) {
    const voices = this.getVoices();
    const voice = voices.find(v => 
      v.name.includes(voiceName) || 
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    if (voice) {
      this.selectedVoice = voice;
      console.log(`Voice changed to: ${voice.name}`);
      return true;
    }
    return false;
  }

  // Get current voice info
  getCurrentVoice() {
    return this.selectedVoice ? {
      name: this.selectedVoice.name,
      lang: this.selectedVoice.lang,
      localService: this.selectedVoice.localService
    } : null;
  }

  // Test a voice with sample text
  testVoice(voiceName, sampleText = "Hello! This is a test of the text-to-speech voice.") {
    const voices = this.getVoices();
    const voice = voices.find(v => 
      v.name.includes(voiceName) || 
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (voice) {
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.voice = voice;
      utterance.rate = 0.95;    // More natural rate
      utterance.pitch = 1.0;     // Natural pitch
      utterance.volume = 0.9;
      this.synth.speak(utterance);
      return true;
    }
    return false;
  }

  // Get voice preferences for settings
  getVoicePreferences() {
    return {
      currentVoice: this.getCurrentVoice(),
      availableVoices: this.getEnglishVoices().map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService
      })),
      preferredVoices: this.preferredVoices
    };
  }
}

// Create singleton instance
const textToSpeech = new TextToSpeech();

export default textToSpeech;
