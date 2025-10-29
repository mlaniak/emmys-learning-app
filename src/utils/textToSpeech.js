// Text-to-Speech utility for accessibility
class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    this.isPlaying = false;
    this.currentUtterance = null;
  }

  // Speak text with options
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    // Stop any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Default options
    const defaultOptions = {
      rate: 0.8,        // Slower for children
      pitch: 1.0,       // Normal pitch
      volume: 0.8,      // Good volume
      lang: 'en-US'     // English
    };

    // Merge with provided options
    Object.assign(utterance, defaultOptions, options);

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

  // Speak question text
  speakQuestion(questionText) {
    this.speak(questionText, {
      rate: 0.7,  // Even slower for questions
      onStart: () => console.log('Speaking question...'),
      onEnd: () => console.log('Question finished')
    });
  }

  // Speak answer option
  speakAnswer(answerText) {
    this.speak(answerText, {
      rate: 0.8,
      onStart: () => console.log('Speaking answer...'),
      onEnd: () => console.log('Answer finished')
    });
  }

  // Speak word (for spelling practice)
  speakWord(word) {
    this.speak(word, {
      rate: 0.6,  // Very slow for spelling
      pitch: 1.1, // Slightly higher pitch
      onStart: () => console.log('Speaking word...'),
      onEnd: () => console.log('Word finished')
    });
  }

  // Check if speech is currently playing
  getIsPlaying() {
    return this.isPlaying;
  }

  // Get available voices
  getVoices() {
    return this.synth.getVoices();
  }

  // Set a specific voice (if available)
  setVoice(voiceName) {
    const voices = this.getVoices();
    const voice = voices.find(v => v.name.includes(voiceName));
    if (voice) {
      this.selectedVoice = voice;
      return true;
    }
    return false;
  }
}

// Create singleton instance
const textToSpeech = new TextToSpeech();

export default textToSpeech;
