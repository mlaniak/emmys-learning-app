/**
 * Tests for useAudio hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudio } from '../useAudio';
import audioManager from '../../utils/audioManager';

// Mock the audioManager
vi.mock('../../utils/audioManager', () => ({
  default: {
    getStatus: vi.fn(),
    initialize: vi.fn(),
    playSound: vi.fn(),
    triggerHaptic: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    setHapticEnabled: vi.fn()
  }
}));

describe('useAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    audioManager.getStatus.mockReturnValue({
      isInitialized: false,
      isSupported: true,
      isMuted: false,
      volume: 0.7,
      hapticEnabled: true,
      hasHapticSupport: true,
      contextState: 'suspended'
    });
    
    audioManager.initialize.mockResolvedValue(true);
    audioManager.playSound.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should provide initial audio status', () => {
      const { result } = renderHook(() => useAudio());
      
      expect(result.current.audioStatus).toEqual({
        isInitialized: false,
        isSupported: true,
        isMuted: false,
        volume: 0.7,
        hapticEnabled: true,
        hasHapticSupport: true,
        contextState: 'suspended'
      });
      
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isSupported).toBe(true);
    });

    it('should initialize audio when requested', async () => {
      const { result } = renderHook(() => useAudio());
      
      await act(async () => {
        const success = await result.current.initializeAudio();
        expect(success).toBe(true);
      });
      
      expect(audioManager.initialize).toHaveBeenCalledTimes(1);
    });

    it('should not reinitialize if already initialized', async () => {
      audioManager.getStatus.mockReturnValue({
        isInitialized: true,
        isSupported: true,
        isMuted: false,
        volume: 0.7,
        hapticEnabled: true,
        hasHapticSupport: true,
        contextState: 'running'
      });

      const { result } = renderHook(() => useAudio());
      
      await act(async () => {
        const success = await result.current.initializeAudio();
        expect(success).toBe(true);
      });
      
      expect(audioManager.initialize).not.toHaveBeenCalled();
    });
  });

  describe('Sound Playback', () => {
    it('should play sounds through audioManager', async () => {
      const { result } = renderHook(() => useAudio());
      
      await act(async () => {
        await result.current.playSound('correct', { volume: 0.5 });
      });
      
      expect(audioManager.playSound).toHaveBeenCalledWith('correct', { volume: 0.5 });
    });

    it('should auto-initialize when playing sounds', async () => {
      const { result } = renderHook(() => useAudio());
      
      await act(async () => {
        await result.current.playSound('click');
      });
      
      expect(audioManager.initialize).toHaveBeenCalledTimes(1);
      expect(audioManager.playSound).toHaveBeenCalledWith('click', {});
    });

    it('should provide convenience methods for common sounds', async () => {
      const { result } = renderHook(() => useAudio());
      
      await act(async () => {
        await result.current.playCorrect();
        await result.current.playIncorrect();
        await result.current.playComplete();
        await result.current.playClick();
        await result.current.playAchievement();
        await result.current.playCelebration();
      });
      
      expect(audioManager.playSound).toHaveBeenCalledWith('correct', {});
      expect(audioManager.playSound).toHaveBeenCalledWith('incorrect', {});
      expect(audioManager.playSound).toHaveBeenCalledWith('complete', {});
      expect(audioManager.playSound).toHaveBeenCalledWith('click', {});
      expect(audioManager.playSound).toHaveBeenCalledWith('achievement', {});
      expect(audioManager.playSound).toHaveBeenCalledWith('celebration', {});
    });

    it('should handle sound playback errors gracefully', async () => {
      audioManager.playSound.mockRejectedValue(new Error('Playback failed'));
      
      const { result } = renderHook(() => useAudio());
      
      // Should not throw error
      await act(async () => {
        await expect(result.current.playSound('correct')).resolves.not.toThrow();
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback', () => {
      const { result } = renderHook(() => useAudio());
      
      act(() => {
        result.current.triggerHaptic('success');
      });
      
      expect(audioManager.triggerHaptic).toHaveBeenCalledWith('success');
    });

    it('should use default haptic type', () => {
      const { result } = renderHook(() => useAudio());
      
      act(() => {
        result.current.triggerHaptic();
      });
      
      expect(audioManager.triggerHaptic).toHaveBeenCalledWith('light');
    });
  });

  describe('Settings Management', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => useAudio());
      
      act(() => {
        result.current.setVolume(0.8);
      });
      
      expect(audioManager.setVolume).toHaveBeenCalledWith(0.8);
    });

    it('should set muted state', () => {
      const { result } = renderHook(() => useAudio());
      
      act(() => {
        result.current.setMuted(true);
      });
      
      expect(audioManager.setMuted).toHaveBeenCalledWith(true);
    });

    it('should set haptic enabled state', () => {
      const { result } = renderHook(() => useAudio());
      
      act(() => {
        result.current.setHapticEnabled(false);
      });
      
      expect(audioManager.setHapticEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Status Updates', () => {
    it('should update status periodically', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useAudio());
      
      // Get initial call count
      const initialCallCount = audioManager.getStatus.mock.calls.length;
      
      // Fast-forward time to trigger interval
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      // Should have made at least one more call
      expect(audioManager.getStatus.mock.calls.length).toBeGreaterThan(initialCallCount);
      
      vi.useRealTimers();
    });

    it('should provide current status values', () => {
      audioManager.getStatus.mockReturnValue({
        isInitialized: true,
        isSupported: true,
        isMuted: true,
        volume: 0.3,
        hapticEnabled: false,
        hasHapticSupport: false,
        contextState: 'running'
      });

      const { result } = renderHook(() => useAudio());
      
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isMuted).toBe(true);
      expect(result.current.volume).toBe(0.3);
      expect(result.current.hapticEnabled).toBe(false);
      expect(result.current.hasHapticSupport).toBe(false);
    });
  });

  describe('AudioManager Access', () => {
    it('should provide direct access to audioManager', () => {
      const { result } = renderHook(() => useAudio());
      
      expect(result.current.audioManager).toBe(audioManager);
    });
  });
});