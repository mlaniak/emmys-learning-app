/**
 * Tests for AudioManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import audioManager from '../audioManager';

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
};

// Mock navigator.vibrate
const mockVibrate = vi.fn();

describe('AudioManager', () => {
  beforeEach(() => {
    // Reset the audio manager
    audioManager.dispose();
    
    // Mock Web Audio API
    global.AudioContext = vi.fn(() => mockAudioContext);
    global.webkitAudioContext = vi.fn(() => mockAudioContext);
    
    // Mock navigator.vibrate
    Object.defineProperty(global.navigator, 'vibrate', {
      value: mockVibrate,
      writable: true
    });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    global.localStorage = localStorageMock;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await audioManager.initialize();
      expect(result).toBe(true);
      expect(audioManager.getStatus().isInitialized).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock AudioContext to throw an error
      global.AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported');
      });
      global.webkitAudioContext = undefined;

      const result = await audioManager.initialize();
      expect(result).toBe(false);
      expect(audioManager.getStatus().isInitialized).toBe(false);
    });

    it('should load preferences from localStorage', async () => {
      const mockPreferences = {
        volume: 0.5,
        muted: true,
        hapticEnabled: false
      };
      
      global.localStorage.getItem.mockReturnValue(JSON.stringify(mockPreferences));
      
      await audioManager.initialize();
      
      expect(audioManager.getVolume()).toBe(0.5);
      expect(audioManager.isMuted).toBe(true);
      expect(audioManager.isHapticEnabled()).toBe(false);
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should play correct sound', async () => {
      await audioManager.playSound('correct');
      
      // Verify oscillators were created for the chord
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(4);
    });

    it('should play incorrect sound', async () => {
      await audioManager.playSound('incorrect');
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    });

    it('should play complete sound', async () => {
      await audioManager.playSound('complete');
      
      // Verify oscillators were created for the fanfare
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(5);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(5);
    });

    it('should not play sound when muted', async () => {
      audioManager.setMuted(true);
      await audioManager.playSound('correct');
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should queue sounds when not initialized', async () => {
      audioManager.dispose();
      
      // Try to play sound before initialization
      await audioManager.playSound('click');
      
      // Should not have created oscillators yet
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      
      // Initialize and check if queued sound plays
      await audioManager.initialize();
      
      // Should now play the queued sound
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('Haptic Feedback', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should trigger haptic feedback', () => {
      audioManager.triggerHaptic('correct');
      expect(mockVibrate).toHaveBeenCalledWith([10, 10, 10]);
    });

    it('should not trigger haptic when disabled', () => {
      audioManager.setHapticEnabled(false);
      audioManager.triggerHaptic('correct');
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should handle different haptic patterns', () => {
      audioManager.triggerHaptic('incorrect');
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
      
      audioManager.triggerHaptic('achievement');
      expect(mockVibrate).toHaveBeenCalledWith([30, 20, 30, 20, 50]);
    });
  });

  describe('Settings Management', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should set and get volume', () => {
      audioManager.setVolume(0.8);
      expect(audioManager.getVolume()).toBe(0.8);
    });

    it('should clamp volume to valid range', () => {
      audioManager.setVolume(1.5);
      expect(audioManager.getVolume()).toBe(1.0);
      
      audioManager.setVolume(-0.5);
      expect(audioManager.getVolume()).toBe(0.0);
    });

    it('should save preferences to localStorage', () => {
      audioManager.setVolume(0.6);
      audioManager.setMuted(true);
      audioManager.setHapticEnabled(false);
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'emmy-audio-preferences',
        JSON.stringify({
          volume: 0.6,
          muted: true,
          hapticEnabled: false
        })
      );
    });
  });

  describe('Status and Capabilities', () => {
    it('should report correct status before initialization', () => {
      const status = audioManager.getStatus();
      
      expect(status.isInitialized).toBe(false);
      expect(status.isSupported).toBe(true);
      expect(status.hasHapticSupport).toBe(true);
    });

    it('should report correct status after initialization', async () => {
      await audioManager.initialize();
      const status = audioManager.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.contextState).toBe('running');
    });
  });

  describe('Error Handling', () => {
    it('should handle sound generation errors gracefully', async () => {
      await audioManager.initialize();
      
      // Mock oscillator creation to throw error
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Oscillator creation failed');
      });
      
      // Should not throw error
      await expect(audioManager.playSound('correct')).resolves.not.toThrow();
    });

    it('should handle localStorage errors gracefully', async () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw error
      expect(() => audioManager.setVolume(0.5)).not.toThrow();
    });
  });
});