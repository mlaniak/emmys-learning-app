/**
 * Unit Tests for AdaptiveDifficultyIndicator Component
 * 
 * Tests the adaptive difficulty display and adjustment functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

import AdaptiveDifficultyIndicator from '../AdaptiveDifficultyIndicator';
import { DIFFICULTY_LEVELS } from '../../utils/adaptiveLearning';

// Mock the adaptive learning hook
vi.mock('../../hooks/useAdaptiveLearning', () => ({
  useAdaptiveLearning: vi.fn(() => ({
    getDifficultyAdjustment: vi.fn(),
    getSubjectAnalytics: vi.fn(),
    isInitialized: true
  }))
}));

// Mock the difficulty levels
vi.mock('../../utils/adaptiveLearning', () => ({
  DIFFICULTY_LEVELS: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
  }
}));

describe('AdaptiveDifficultyIndicator', () => {
  let mockUseAdaptiveLearning;
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    mockUseAdaptiveLearning = require('../../hooks/useAdaptiveLearning').useAdaptiveLearning;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    subject: 'math',
    currentDifficulty: 'medium',
    onDifficultyChange: vi.fn()
  };

  const mockAnalytics = {
    totalAttempts: 10,
    accuracy: 85,
    currentStreak: 5,
    averageResponseTime: 3.2
  };

  const mockAdjustment = {
    shouldAdjust: false,
    suggestedDifficulty: 'medium',
    reason: 'Performance is stable',
    confidence: 0.8
  };

  describe('Basic Rendering', () => {
    it('should render difficulty indicator when initialized', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should not render when not initialized', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn(),
        getSubjectAnalytics: vi.fn(),
        isInitialized: false
      });

      const { container } = render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when no adjustment data', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(null),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      const { container } = render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact version when compact prop is true', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} compact={true} />);

      expect(screen.getByText('🌟 medium')).toBeInTheDocument();
      expect(screen.queryByText('Difficulty Level')).not.toBeInTheDocument();
    });

    it('should show adjustment suggestion in compact mode', () => {
      const adjustmentWithSuggestion = {
        ...mockAdjustment,
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} compact={true} />);

      expect(screen.getByText('→ 🔥 hard')).toBeInTheDocument();
    });

    it('should handle adjustment acceptance in compact mode', async () => {
      const mockOnDifficultyChange = vi.fn();
      const adjustmentWithSuggestion = {
        ...mockAdjustment,
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(
        <AdaptiveDifficultyIndicator 
          {...defaultProps} 
          compact={true}
          onDifficultyChange={mockOnDifficultyChange}
        />
      );

      const adjustmentButton = screen.getByText('→ 🔥 hard');
      await user.click(adjustmentButton);

      expect(mockOnDifficultyChange).toHaveBeenCalledWith('hard');
    });
  });

  describe('Performance Analytics Display', () => {
    it('should display performance metrics when analytics available', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Streak')).toBeInTheDocument();
      expect(screen.getByText('3.2s')).toBeInTheDocument();
      expect(screen.getByText('Avg Time')).toBeInTheDocument();
    });

    it('should not display analytics when no attempts made', () => {
      const analyticsNoAttempts = { ...mockAnalytics, totalAttempts: 0 };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(analyticsNoAttempts),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.queryByText('Accuracy')).not.toBeInTheDocument();
    });
  });

  describe('Difficulty Adjustment Recommendations', () => {
    it('should show adjustment recommendation when shouldAdjust is true', () => {
      const adjustmentWithSuggestion = {
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Excellent performance indicates readiness for harder challenges',
        confidence: 0.9
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.getByText('💡 Difficulty Adjustment Suggested')).toBeInTheDocument();
      expect(screen.getByText('Excellent performance indicates readiness for harder challenges')).toBeInTheDocument();
      expect(screen.getByText('🔥 hard')).toBeInTheDocument();
    });

    it('should not show recommendation when showRecommendation is false', () => {
      const adjustmentWithSuggestion = {
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} showRecommendation={false} />);

      expect(screen.queryByText('💡 Difficulty Adjustment Suggested')).not.toBeInTheDocument();
    });

    it('should handle apply change button click', async () => {
      const mockOnDifficultyChange = vi.fn();
      const adjustmentWithSuggestion = {
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(
        <AdaptiveDifficultyIndicator 
          {...defaultProps} 
          onDifficultyChange={mockOnDifficultyChange}
        />
      );

      const applyButton = screen.getByText('Apply Change');
      await user.click(applyButton);

      expect(mockOnDifficultyChange).toHaveBeenCalledWith('hard');
    });

    it('should handle keep current button click', async () => {
      const adjustmentWithSuggestion = {
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      const keepButton = screen.getByText('Keep Current');
      await user.click(keepButton);

      // Should hide the recommendation
      await waitFor(() => {
        expect(screen.queryByText('💡 Difficulty Adjustment Suggested')).not.toBeInTheDocument();
      });
    });
  });

  describe('Difficulty Level Display', () => {
    it('should display correct icons and colors for each difficulty', () => {
      const difficulties = [
        { level: 'easy', icon: '🌱', expectedText: 'Easy' },
        { level: 'medium', icon: '🌟', expectedText: 'Medium' },
        { level: 'hard', icon: '🔥', expectedText: 'Hard' }
      ];

      difficulties.forEach(({ level, expectedText }) => {
        mockUseAdaptiveLearning.mockReturnValue({
          getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
          getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
          isInitialized: true
        });

        const { unmount } = render(
          <AdaptiveDifficultyIndicator 
            {...defaultProps} 
            currentDifficulty={level}
          />
        );

        expect(screen.getByText(expectedText)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Manual Difficulty Override', () => {
    it('should display manual override buttons', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.getByText('Manual Override:')).toBeInTheDocument();
      expect(screen.getByText('🌱 easy')).toBeInTheDocument();
      expect(screen.getByText('🌟 medium')).toBeInTheDocument();
      expect(screen.getByText('🔥 hard')).toBeInTheDocument();
    });

    it('should handle manual difficulty selection', async () => {
      const mockOnDifficultyChange = vi.fn();

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(
        <AdaptiveDifficultyIndicator 
          {...defaultProps} 
          onDifficultyChange={mockOnDifficultyChange}
        />
      );

      const easyButton = screen.getByText('🌱 easy');
      await user.click(easyButton);

      expect(mockOnDifficultyChange).toHaveBeenCalledWith('easy');
    });

    it('should highlight current difficulty in manual override', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} currentDifficulty="easy" />);

      const easyButton = screen.getByText('🌱 easy');
      expect(easyButton).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });
  });

  describe('Difficulty Explanation', () => {
    it('should toggle difficulty explanation details', async () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      const toggleButton = screen.getByText('How difficulty works');
      expect(screen.queryByText('Perfect for building confidence')).not.toBeInTheDocument();

      await user.click(toggleButton);

      expect(screen.getByText('Perfect for building confidence and learning fundamentals.')).toBeInTheDocument();
      expect(screen.getByText('Balanced challenge that tests understanding.')).toBeInTheDocument();
      expect(screen.getByText('Advanced questions that require deeper thinking.')).toBeInTheDocument();
    });

    it('should show smart adjustment explanation', async () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      const toggleButton = screen.getByText('How difficulty works');
      await user.click(toggleButton);

      expect(screen.getByText(/Smart Adjustment:/)).toBeInTheDocument();
      expect(screen.getByText(/automatically suggests difficulty changes/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onDifficultyChange callback', async () => {
      const adjustmentWithSuggestion = {
        shouldAdjust: true,
        suggestedDifficulty: 'hard',
        reason: 'Performance is excellent'
      };

      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(adjustmentWithSuggestion),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} onDifficultyChange={undefined} />);

      const applyButton = screen.getByText('Apply Change');
      
      // Should not throw error when clicking without callback
      expect(() => user.click(applyButton)).not.toThrow();
    });

    it('should handle unknown difficulty level', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue({
          ...mockAdjustment,
          suggestedDifficulty: 'unknown'
        }),
        getSubjectAnalytics: vi.fn().mockReturnValue(mockAnalytics),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} currentDifficulty="unknown" />);

      expect(screen.getByText('❓ unknown')).toBeInTheDocument();
    });

    it('should handle missing analytics data', () => {
      mockUseAdaptiveLearning.mockReturnValue({
        getDifficultyAdjustment: vi.fn().mockReturnValue(mockAdjustment),
        getSubjectAnalytics: vi.fn().mockReturnValue(null),
        isInitialized: true
      });

      render(<AdaptiveDifficultyIndicator {...defaultProps} />);

      expect(screen.queryByText('Accuracy')).not.toBeInTheDocument();
      expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
    });
  });
});