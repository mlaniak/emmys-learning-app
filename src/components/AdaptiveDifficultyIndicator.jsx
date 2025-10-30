/**
 * Adaptive Difficulty Indicator Component
 * 
 * Shows current difficulty level and provides feedback on adaptive adjustments
 */

import React, { useState, useEffect } from 'react';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import { DIFFICULTY_LEVELS } from '../utils/adaptiveLearning';

const AdaptiveDifficultyIndicator = ({ 
  subject, 
  currentDifficulty, 
  onDifficultyChange,
  showRecommendation = true,
  compact = false 
}) => {
  const { getDifficultyAdjustment, getSubjectAnalytics, isInitialized } = useAdaptiveLearning();
  const [adjustment, setAdjustment] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isInitialized && subject && currentDifficulty) {
      const adj = getDifficultyAdjustment(subject, currentDifficulty);
      const subjectAnalytics = getSubjectAnalytics(subject);
      
      setAdjustment(adj);
      setAnalytics(subjectAnalytics);
    }
  }, [subject, currentDifficulty, isInitialized, getDifficultyAdjustment, getSubjectAnalytics]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        return 'bg-green-100 text-green-800 border-green-200';
      case DIFFICULTY_LEVELS.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case DIFFICULTY_LEVELS.HARD:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        return '🌱';
      case DIFFICULTY_LEVELS.MEDIUM:
        return '🌟';
      case DIFFICULTY_LEVELS.HARD:
        return '🔥';
      default:
        return '❓';
    }
  };

  const handleAcceptAdjustment = () => {
    if (adjustment && adjustment.shouldAdjust && onDifficultyChange) {
      onDifficultyChange(adjustment.suggestedDifficulty);
    }
  };

  if (!isInitialized || !adjustment) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(currentDifficulty)}`}>
          {getDifficultyIcon(currentDifficulty)} {currentDifficulty}
        </div>
        {adjustment.shouldAdjust && showRecommendation && (
          <button
            onClick={handleAcceptAdjustment}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
            title={adjustment.reason}
          >
            → {getDifficultyIcon(adjustment.suggestedDifficulty)} {adjustment.suggestedDifficulty}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      {/* Current Difficulty */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Difficulty Level</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(currentDifficulty)}`}>
          {getDifficultyIcon(currentDifficulty)} {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
        </div>
      </div>

      {/* Performance Summary */}
      {analytics && analytics.totalAttempts > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-lg font-semibold text-gray-700">{analytics.accuracy}%</div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-lg font-semibold text-gray-700">{analytics.currentStreak}</div>
            <div className="text-xs text-gray-500">Streak</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-lg font-semibold text-gray-700">{analytics.averageResponseTime}s</div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
        </div>
      )}

      {/* Difficulty Adjustment Recommendation */}
      {adjustment.shouldAdjust && showRecommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                💡 Difficulty Adjustment Suggested
              </h4>
              <p className="text-sm text-blue-700 mb-2">{adjustment.reason}</p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-600">Recommended:</span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(adjustment.suggestedDifficulty)}`}>
                  {getDifficultyIcon(adjustment.suggestedDifficulty)} {adjustment.suggestedDifficulty}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleAcceptAdjustment}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Apply Change
            </button>
            <button
              onClick={() => setAdjustment(prev => ({ ...prev, shouldAdjust: false }))}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              Keep Current
            </button>
          </div>
        </div>
      )}

      {/* Difficulty Explanation */}
      <div className="border-t pt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-800"
        >
          <span>How difficulty works</span>
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showDetails && (
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-green-600">🌱</span>
              <div>
                <strong>Easy:</strong> Perfect for building confidence and learning fundamentals. 
                Questions focus on basic concepts with clear, simple choices.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">🌟</span>
              <div>
                <strong>Medium:</strong> Balanced challenge that tests understanding. 
                Good mix of straightforward and slightly tricky questions.
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-red-600">🔥</span>
              <div>
                <strong>Hard:</strong> Advanced questions that require deeper thinking. 
                Perfect for students who have mastered the basics.
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <strong>Smart Adjustment:</strong> The system automatically suggests difficulty changes 
              based on your accuracy, response time, and consistency. You can always override these suggestions.
            </div>
          </div>
        )}
      </div>

      {/* Manual Difficulty Override */}
      <div className="border-t pt-3 mt-3">
        <div className="text-sm text-gray-600 mb-2">Manual Override:</div>
        <div className="flex space-x-2">
          {Object.values(DIFFICULTY_LEVELS).map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange && onDifficultyChange(level)}
              className={`px-3 py-1 rounded text-sm font-medium border transition-colors ${
                currentDifficulty === level
                  ? getDifficultyColor(level)
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {getDifficultyIcon(level)} {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveDifficultyIndicator;