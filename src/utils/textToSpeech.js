// Text-to-Speech utility for accessibility
class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.selectedVoice = null;
    this.preferredVoices = [
      'Google US English', 'Microsoft Zira Desktop', 'Microsoft David Desktop',
      'Alex', 'Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Veena'
    ];
    this.voiceLoaded = false;
    
    // Load voices when available
    this.loadVoices();
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
    // First try to find a preferred voice
    for (const preferredName of this.preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferredName) || 
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
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
      !v.name.toLowerCase().includes('system')
    );

    if (englishVoices.length > 0) {
      // Prefer local voices over remote ones
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

    // Enhanced default options for more natural speech
    const defaultOptions = {
      rate: 0.85,       // Slightly faster but still clear
      pitch: 1.05,      // Slightly higher pitch for friendliness
      volume: 0.9,      // Higher volume for clarity
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

    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Apply speech options
    Object.assign(utterance, speechOptions);

    // Set voice if available
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      this.isPlaying = true;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isPlaying = false;
      if (options.onError) options.onError(event);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  // Stop current speech
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.currentUtterance = null;
  }

  // Speak question text with natural pacing
  speakQuestion(questionText) {
    // Add natural pauses and emphasis
    const enhancedText = this.enhanceTextForSpeech(questionText);
    this.speak(enhancedText, {
      rate: 0.8,        // Clear but not too slow
      pitch: 1.05,      // Friendly pitch
      volume: 0.9,      // Clear volume
      onStart: () => console.log('Speaking question...'),
      onEnd: () => console.log('Question finished')
    });
  }

  // Speak answer option
  speakAnswer(answerText) {
    this.speak(answerText, {
      rate: 0.85,       // Clear and confident
      pitch: 1.0,       // Neutral pitch
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

  // Enhance text for more natural speech using SSML-like techniques
  enhanceTextForSpeech(text) {
    // Add natural pauses and emphasis using SSML techniques
    let enhanced = text
      .replace(/\?/g, '? ')  // Add pause after questions
      .replace(/!/g, '! ')   // Add pause after exclamations
      .replace(/\./g, '. ')  // Add pause after periods
      .replace(/,/g, ', ')   // Add pause after commas
      .replace(/\s+/g, ' ')  // Clean up extra spaces
      .trim();

    // Add emphasis to important words (numbers, key terms)
    enhanced = enhanced.replace(/\b(\d+)\b/g, '<emphasis level="strong">$1</emphasis>');
    
    // Add slight pauses before important conjunctions
    enhanced = enhanced.replace(/\b(and|but|or|so)\b/g, ' <break time="0.2s"/> $1');
    
    // Add emphasis to question words
    enhanced = enhanced.replace(/\b(what|where|when|why|how|which|who)\b/g, '<emphasis level="moderate">$1</emphasis>');
    
    return enhanced;
  }

  // Create SSML markup for better speech synthesis
  createSSML(text, options = {}) {
    const {
      rate = 0.85,
      pitch = 1.05,
      volume = 0.9,
      emphasis = 'moderate'
    } = options;

    // Basic SSML structure with prosody for better control
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
          ${this.enhanceTextForSpeech(text)}
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
      utterance.rate = 0.8;
      utterance.pitch = 1.05;
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
