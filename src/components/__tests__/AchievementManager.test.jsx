/**
 * Unit Tests for AchievementManager Component
 * 
 * Tests the central achievement management functionality including
 * progress tracking, notification display, and audio feedback integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

import AchievementManager from '../AchievementManager';

// Mock hooks
vi.mock('../../hooks/useAchievements', () => ({
  useAchievements: vi.fn(() => ({
    currentNotification: null,
    isShowingNotification: false,
    closeNotification: vi.fn(),
    trackEvent: vi.fn(),
    updateProgress: vi.fn((progress) => progress)
  }))
}));

vi.mock('../../hooks/useAudio', () => ({
  useAudio: vi.fn(() => ({
    playAchievement: vi.fn(),
    playCelebration: vi.fn(),
    triggerHaptic: vi.fn()
  }))
}));

// Mock child components
vi.mock('../AchievementNotification', () => ({
  default: ({ achievement, visible, onClose }) => (
    visible && achievement ? (
      <div data-testid="achievement-notification">
        <div>{achievement.title}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

describe('AchievementManager', () => {
  let mockUseAchievements;
  let mockUseAudio;
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockUseAchievements = require('../../hooks/useAchievements').useAchievements;
    mockUseAudio = require('../../hooks/useAudio').useAudio;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <AchievementManager>
          <div data-testid="child-content">Test Content</div>
        </AchievementManager>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render function children with achievement context', () => {
      const mockChild = vi.fn(() => <div data-testid="function-child">Function Child</div>);

      render(
        <AchievementManager>
          {mockChild}
        </AchievementManager>
      );

      expect(screen.getByTestId('function-child')).toBeInTheDocument();
      expect(mockChild).toHaveBeenCalledWith(
        expect.objectContaining({
          trackEvent: expect.any(Function),
          updateProgress: expect.any(Function),
          isShowingNotification: false
        })
      );
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AchievementManager className="custom-class">
          <div>Content</div>
        </AchievementManager>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Achievement Notifications', () => {
    it('should display achievement notification when available', () => {
      const mockAchievement = {
        id: 'test-achievement',
        title: 'Test Achievement',
        description: 'Test Description',
        rarity: 'common'
      };

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      expect(screen.getByTestId('achievement-notification')).toBeInTheDocument();
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('should not display notification when not showing', () => {
      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      expect(screen.queryByTestId('achievement-notification')).not.toBeInTheDocument();
    });

    it('should handle notification close', async () => {
      const mockCloseNotification = vi.fn();
      const mockAchievement = {
        id: 'test-achievement',
        title: 'Test Achievement',
        rarity: 'common'
      };

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: mockCloseNotification,
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockCloseNotification).toHaveBeenCalled();
    });
  });

  describe('Audio and Haptic Feedback', () => {
    it('should play achievement sound when notification shows', () => {
      const mockPlayAchievement = vi.fn();
      const mockTriggerHaptic = vi.fn();
      const mockAchievement = {
        id: 'test-achievement',
        title: 'Test Achievement',
        rarity: 'common'
      };

      mockUseAudio.mockReturnValue({
        playAchievement: mockPlayAchievement,
        playCelebration: vi.fn(),
        triggerHaptic: mockTriggerHaptic
      });

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockPlayAchievement).toHaveBeenCalled();
      expect(mockTriggerHaptic).toHaveBeenCalledWith('success');
    });

    it('should play celebration sound for legendary achievements', async () => {
      const mockPlayCelebration = vi.fn();
      const mockAchievement = {
        id: 'legendary-achievement',
        title: 'Legendary Achievement',
        rarity: 'legendary'
      };

      mockUseAudio.mockReturnValue({
        playAchievement: vi.fn(),
        playCelebration: mockPlayCelebration,
        triggerHaptic: vi.fn()
      });

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      // Wait for the delayed celebration sound
      await waitFor(() => {
        expect(mockPlayCelebration).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should not play sounds when no notification is showing', () => {
      const mockPlayAchievement = vi.fn();
      const mockTriggerHaptic = vi.fn();

      mockUseAudio.mockReturnValue({
        playAchievement: mockPlayAchievement,
        playCelebration: vi.fn(),
        triggerHaptic: mockTriggerHaptic
      });

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockPlayAchievement).not.toHaveBeenCalled();
      expect(mockTriggerHaptic).not.toHaveBeenCalled();
    });
  });

  describe('Progress Management', () => {
    it('should sync progress updates with parent component', () => {
      const mockOnProgressUpdate = vi.fn();
      const mockUpdateProgress = vi.fn((progress) => ({ ...progress, updated: true }));
      const initialProgress = { score: 80, level: 2 };

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: mockUpdateProgress
      });

      render(
        <AchievementManager 
          progress={initialProgress}
          onProgressUpdate={mockOnProgressUpdate}
        >
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockUpdateProgress).toHaveBeenCalledWith(initialProgress);
      expect(mockOnProgressUpdate).toHaveBeenCalledWith({ ...initialProgress, updated: true });
    });

    it('should not update progress when no onProgressUpdate callback', () => {
      const mockUpdateProgress = vi.fn((progress) => progress);
      const initialProgress = { score: 80, level: 2 };

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: mockUpdateProgress
      });

      render(
        <AchievementManager progress={initialProgress}>
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockUpdateProgress).toHaveBeenCalledWith(initialProgress);
    });

    it('should handle progress updates when progress changes', () => {
      const mockOnProgressUpdate = vi.fn();
      const mockUpdateProgress = vi.fn((progress) => progress);
      const initialProgress = { score: 80, level: 2 };

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: mockUpdateProgress
      });

      const { rerender } = render(
        <AchievementManager 
          progress={initialProgress}
          onProgressUpdate={mockOnProgressUpdate}
        >
          <div>Content</div>
        </AchievementManager>
      );

      const updatedProgress = { score: 90, level: 3 };
      rerender(
        <AchievementManager 
          progress={updatedProgress}
          onProgressUpdate={mockOnProgressUpdate}
        >
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockUpdateProgress).toHaveBeenCalledWith(updatedProgress);
    });
  });

  describe('Achievement Context', () => {
    it('should provide achievement context to function children', () => {
      const mockTrackEvent = vi.fn();
      const mockUpdateProgress = vi.fn();

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: mockTrackEvent,
        updateProgress: mockUpdateProgress
      });

      const TestChild = ({ trackEvent, updateProgress, isShowingNotification }) => (
        <div>
          <button onClick={() => trackEvent('test-event')}>Track Event</button>
          <button onClick={() => updateProgress({ score: 100 })}>Update Progress</button>
          <div data-testid="notification-status">{isShowingNotification.toString()}</div>
        </div>
      );

      render(
        <AchievementManager>
          {(context) => <TestChild {...context} />}
        </AchievementManager>
      );

      expect(screen.getByTestId('notification-status')).toHaveTextContent('false');
    });

    it('should allow children to track events through context', async () => {
      const mockTrackEvent = vi.fn();

      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: mockTrackEvent,
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          {({ trackEvent }) => (
            <button onClick={() => trackEvent('button-click', { value: 1 })}>
              Track Click
            </button>
          )}
        </AchievementManager>
      );

      const button = screen.getByText('Track Click');
      await user.click(button);

      expect(mockTrackEvent).toHaveBeenCalledWith('button-click', { value: 1 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing progress prop', () => {
      mockUseAchievements.mockReturnValue({
        currentNotification: null,
        isShowingNotification: false,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      expect(() => {
        render(
          <AchievementManager>
            <div>Content</div>
          </AchievementManager>
        );
      }).not.toThrow();
    });

    it('should handle achievement notification without rarity', () => {
      const mockPlayAchievement = vi.fn();
      const mockAchievement = {
        id: 'test-achievement',
        title: 'Test Achievement'
        // No rarity property
      };

      mockUseAudio.mockReturnValue({
        playAchievement: mockPlayAchievement,
        playCelebration: vi.fn(),
        triggerHaptic: vi.fn()
      });

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      render(
        <AchievementManager>
          <div>Content</div>
        </AchievementManager>
      );

      expect(mockPlayAchievement).toHaveBeenCalled();
    });

    it('should handle audio hook errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockUseAudio.mockImplementation(() => {
        throw new Error('Audio not available');
      });

      const mockAchievement = {
        id: 'test-achievement',
        title: 'Test Achievement',
        rarity: 'common'
      };

      mockUseAchievements.mockReturnValue({
        currentNotification: mockAchievement,
        isShowingNotification: true,
        closeNotification: vi.fn(),
        trackEvent: vi.fn(),
        updateProgress: vi.fn()
      });

      expect(() => {
        render(
          <AchievementManager>
            <div>Content</div>
          </AchievementManager>
        );
      }).toThrow('Audio not available');

      consoleSpy.mockRestore();
    });
  });
});