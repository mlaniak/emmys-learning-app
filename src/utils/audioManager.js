/**
 * AudioManager - Comprehensive audio feedback system for Emmy's Learning Adventure
 * 
 * Features:
 * - Web Audio API for sound effect management
 * - Haptic feedback for mobile devices
 * - Volume control and mute options
 * - Graceful fallbacks and error handling
 * - Preloading and caching of audio resources
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.isInitialized = false;
    this.isMuted = false;
    this.volume = 0.7; // Default volume (0.0 to 1.0)
    this.hapticEnabled = true;
    this.loadingPromises = new Map();
    
    // Sound definitions with fallback to generated tones
    this.soundDefinitions = {
      correct: {
        type: 'generated',
        generator: this.generateCorrectSound.bind(this)
      },
      incorrect: {
        type: 'generated', 
        generator: this.generateIncorrectSound.bind(this)
      },
      complete: {
        type: 'generated',
        generator: this.generateCompleteSound.bind(this)
      },
      click: {
        type: 'generated',
        generator: this.generateClickSound.bind(this)
      },
      achievement: {
        type: 'generated',
        generator: this.generateAchievementSound.bind(this)
      },
      celebration: {
        type: 'generated',
        generator: this.generateCelebrationSound.bind(this)
      }
    };

    // Initialize on first user interaction
    this.initPromise = null;
    this.pendingSounds = [];
  }

  /**
   * Initialize the audio system
   * Must be called after user interaction due to browser autoplay policies
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Create AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContext();
      
      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load sound preferences from localStorage
      this.loadPreferences();

      // Preload generated sounds
      await this.preloadSounds();

      this.isInitialized = true;
      
      // Play any pending sounds
      this.pendingSounds.forEach(({ soundType, options }) => {
        this.playSound(soundType, options);
      });
      this.pendingSounds = [];

      if (import.meta.env.DEV) console.log('AudioManager initialized successfully');
      return true;
    } catch (error) {
      // Suppress autoplay-policy warnings in production to avoid noisy consoles
      if (import.meta.env.DEV) console.warn('AudioManager initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Load audio preferences from localStorage
   */
  loadPreferences() {
    try {
      const preferences = JSON.parse(localStorage.getItem('emmy-audio-preferences') || '{}');
      this.volume = preferences.volume ?? 0.7;
      this.isMuted = preferences.muted ?? false;
      this.hapticEnabled = preferences.hapticEnabled ?? true;
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
  }

  /**
   * Save audio preferences to localStorage
   */
  savePreferences() {
    try {
      const preferences = {
        volume: this.volume,
        muted: this.isMuted,
        hapticEnabled: this.hapticEnabled
      };
      localStorage.setItem('emmy-audio-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save audio preferences:', error);
    }
  }

  /**
   * Preload all sounds for better performance
   */
  async preloadSounds() {
    const preloadPromises = Object.keys(this.soundDefinitions).map(soundType => {
      return this.loadSound(soundType);
    });

    try {
      await Promise.all(preloadPromises);
      console.log('All sounds preloaded successfully');
    } catch (error) {
      console.warn('Some sounds failed to preload:', error);
    }
  }

  /**
   * Load a specific sound
   */
  async loadSound(soundType) {
    if (this.sounds.has(soundType)) {
      return this.sounds.get(soundType);
    }

    if (this.loadingPromises.has(soundType)) {
      return this.loadingPromises.get(soundType);
    }

    const loadPromise = this._loadSoundDefinition(soundType);
    this.loadingPromises.set(soundType, loadPromise);

    try {
      const sound = await loadPromise;
      this.sounds.set(soundType, sound);
      this.loadingPromises.delete(soundType);
      return sound;
    } catch (error) {
      this.loadingPromises.delete(soundType);
      throw error;
    }
  }

  async _loadSoundDefinition(soundType) {
    const definition = this.soundDefinitions[soundType];
    if (!definition) {
      throw new Error(`Unknown sound type: ${soundType}`);
    }

    if (definition.type === 'generated') {
      // For generated sounds, we don't need to preload anything
      return { type: 'generated', generator: definition.generator };
    }

    // For file-based sounds (future enhancement)
    if (definition.type === 'file') {
      return this._loadAudioFile(definition.url);
    }

    throw new Error(`Unsupported sound type: ${definition.type}`);
  }

  /**
   * Play a sound effect
   */
  async playSound(soundType, options = {}) {
    // If not initialized, queue the sound for later
    if (!this.isInitialized) {
      this.pendingSounds.push({ soundType, options });
      // Try to initialize if we haven't already
      if (!this.initPromise) {
        this.initialize();
      }
      return;
    }

    // Don't play if muted
    if (this.isMuted) {
      return;
    }

    try {
      const sound = await this.loadSound(soundType);
      
      if (sound.type === 'generated') {
        await sound.generator(options);
      } else if (sound.type === 'buffer') {
        await this._playAudioBuffer(sound.buffer, options);
      }

      // Trigger haptic feedback if enabled
      if (this.hapticEnabled) {
        this.triggerHaptic(soundType);
      }

    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }

  /**
   * Generate correct answer sound (happy ascending chord)
   */
  async generateCorrectSound(options = {}) {
    if (!this.audioContext) return;

    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const baseVolume = (options.volume ?? this.volume) * 0.2;

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + i * 0.05;
      const duration = 0.4;
      
      gainNode.gain.setValueAtTime(baseVolume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  /**
   * Generate incorrect answer sound (sad descending tone)
   */
  async generateIncorrectSound(options = {}) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const startTime = this.audioContext.currentTime;
    const duration = 0.3;
    const baseVolume = (options.volume ?? this.volume) * 0.1;
    
    oscillator.frequency.setValueAtTime(400, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, startTime + duration);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(baseVolume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Generate completion sound (victory fanfare)
   */
  async generateCompleteSound(options = {}) {
    if (!this.audioContext) return;

    const frequencies = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6
    const baseVolume = (options.volume ?? this.volume) * 0.15;

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = this.audioContext.currentTime + i * 0.1;
      const duration = 0.5;
      
      gainNode.gain.setValueAtTime(baseVolume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  /**
   * Generate click sound (button press)
   */
  async generateClickSound(options = {}) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    const startTime = this.audioContext.currentTime;
    const duration = 0.1;
    const baseVolume = (options.volume ?? this.volume) * 0.1;
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(baseVolume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Generate achievement unlock sound
   */
  async generateAchievementSound(options = {}) {
    if (!this.audioContext) return;

    // Magical ascending arpeggio
    const frequencies = [523, 659, 784, 1047, 1319, 1568]; // C5 to G6
    const baseVolume = (options.volume ?? this.volume) * 0.12;

    frequencies.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';
      
      const startTime = this.audioContext.currentTime + i * 0.08;
      const duration = 0.6;
      
      gainNode.gain.setValueAtTime(baseVolume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  /**
   * Generate celebration sound (for perfect scores)
   */
  async generateCelebrationSound(options = {}) {
    if (!this.audioContext) return;

    // Triumphant chord progression
    const chords = [
      [523, 659, 784], // C major
      [587, 740, 880], // D major  
      [659, 831, 988], // E major
      [523, 659, 784, 1047] // C major octave
    ];
    
    const baseVolume = (options.volume ?? this.volume) * 0.1;

    chords.forEach((chord, chordIndex) => {
      chord.forEach((freq, noteIndex) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = this.audioContext.currentTime + chordIndex * 0.3;
        const duration = 0.4;
        
        gainNode.gain.setValueAtTime(baseVolume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    });
  }

  /**
   * Trigger haptic feedback for mobile devices
   */
  triggerHaptic(soundType) {
    if (!this.hapticEnabled || !('vibrate' in navigator)) {
      return;
    }

    const patterns = {
      correct: [10, 10, 10], // Triple light tap
      incorrect: [50, 50, 50], // Triple heavy tap
      complete: [20, 10, 20, 10, 30], // Victory pattern
      click: [10], // Single light tap
      achievement: [30, 20, 30, 20, 50], // Special achievement pattern
      celebration: [50, 30, 50, 30, 50, 30, 100] // Grand celebration
    };

    const pattern = patterns[soundType] || patterns.click;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted) {
    this.isMuted = muted;
    this.savePreferences();
  }

  /**
   * Check if audio is muted
   */
  isMuted() {
    return this.isMuted;
  }

  /**
   * Enable/disable haptic feedback
   */
  setHapticEnabled(enabled) {
    this.hapticEnabled = enabled;
    this.savePreferences();
  }

  /**
   * Check if haptic feedback is enabled
   */
  isHapticEnabled() {
    return this.hapticEnabled;
  }

  /**
   * Get audio capabilities and status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isSupported: !!(window.AudioContext || window.webkitAudioContext),
      isMuted: this.isMuted,
      volume: this.volume,
      hapticEnabled: this.hapticEnabled,
      hasHapticSupport: 'vibrate' in navigator,
      contextState: this.audioContext?.state || 'not-created'
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.sounds.clear();
    this.loadingPromises.clear();
    this.pendingSounds = [];
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Create and export singleton instance
const audioManager = new AudioManager();

export default audioManager;