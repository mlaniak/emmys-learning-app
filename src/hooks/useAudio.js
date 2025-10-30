/**
 * useAudio - React hook for audio feedback integration
 * 
 * Provides easy access to audio functionality throughout the app
 */

import { useEffect, useCallback, useState } from 'react';
import audioManager from '../utils/audioManager';

export const useAudio = () => {
  const [audioStatus, setAudioStatus] = useState(audioManager.getStatus());
  const [isInitialized, setIsInitialized] = useState(false);

  // Update audio status
  useEffect(() => {
    const updateStatus = () => {
      const status = audioManager.getStatus();
      setAudioStatus(status);
      setIsInitialized(status.isInitialized);
    };

    updateStatus();
    
    // Check status periodically
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    if (!isInitialized) {
      const success = await audioManager.initialize();
      setIsInitialized(success);
      return success;
    }
    return true;
  }, [isInitialized]);

  // Play sound with automatic initialization
  const playSound = useCallback(async (soundType, options = {}) => {
    try {
      // Auto-initialize if needed
      if (!isInitialized) {
        await initializeAudio();
      }
      
      await audioManager.playSound(soundType, options);
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }, [isInitialized, initializeAudio]);

  // Convenience methods for common sounds
  const playCorrect = useCallback((options) => playSound('correct', options), [playSound]);
  const playIncorrect = useCallback((options) => playSound('incorrect', options), [playSound]);
  const playComplete = useCallback((options) => playSound('complete', options), [playSound]);
  const playClick = useCallback((options) => playSound('click', options), [playSound]);
  const playAchievement = useCallback((options) => playSound('achievement', options), [playSound]);
  const playCelebration = useCallback((options) => playSound('celebration', options), [playSound]);

  // Haptic feedback
  const triggerHaptic = useCallback((type = 'light') => {
    audioManager.triggerHaptic(type);
  }, []);

  // Volume and mute controls
  const setVolume = useCallback((volume) => {
    audioManager.setVolume(volume);
  }, []);

  const setMuted = useCallback((muted) => {
    audioManager.setMuted(muted);
  }, []);

  const setHapticEnabled = useCallback((enabled) => {
    audioManager.setHapticEnabled(enabled);
  }, []);

  return {
    // Status
    audioStatus,
    isInitialized,
    isSupported: audioStatus.isSupported,
    isMuted: audioStatus.isMuted,
    volume: audioStatus.volume,
    hapticEnabled: audioStatus.hapticEnabled,
    hasHapticSupport: audioStatus.hasHapticSupport,

    // Methods
    initializeAudio,
    playSound,
    
    // Convenience methods
    playCorrect,
    playIncorrect,
    playComplete,
    playClick,
    playAchievement,
    playCelebration,
    
    // Haptic feedback
    triggerHaptic,
    
    // Settings
    setVolume,
    setMuted,
    setHapticEnabled,
    
    // Direct access to manager
    audioManager
  };
};

export default useAudio;