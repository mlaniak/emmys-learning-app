/**
 * Progress Tracker Component
 * 
 * Displays adaptive learning progress, mastery levels, and personalized recommendations
 */

import React, { useState, useEffect } from 'react';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';

const ProgressTracker = ({ subject, onRecommendationSelect, compact = false }) => {
  const {
    getSubjectAnalytics,
    getProgressIndicators,
    getLearningRecommendations,
    isInitialized
  } = useAdaptiveLearning();

  const [analytics, setAnalytics] = useState(null);
  const [progressIndicators, setProgressIndicators] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (isInitialized && subject) {
      const subjectAnalytics = getSubjectAnalytics(subject);
      const indicators = getProgressIndicators(subject);
      
      setAnalytics(subjectAnalytics);
      setProgressIndicators(indicators);
    }
  }, [subject, isInitialized, getSubjectAnalytics, getProgressIndicators]);

  useEffect(() => {
    if (isInitialized) {
      const availableSubjects = ['phonics', 'math', 'reading', 'spelling', 'science', 'social', 'skipcounting', 'art', 'geography', 'history'];
      const recs = getLearningRecommendations(availableSubjects);
      setRecommendations(recs);
    }
  }, [isInitialized, getLearningRecommendations]);

  if (!isInitialized || !analytics) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getMasteryColor = (level) => {
    switch (level) {
      case 'expert': return 'text-purple-600 bg-purple-100';
      case 'proficient': return 'text-blue-600 bg-blue-100';
      case 'developing': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getStreakIcon = (status) => {
    switch (status) {
      case 'fire': return '🔥';
      case 'hot': return '⭐';
      case 'warm': return '🌟';
      default: return '💫';
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm capitalize">{subject} Progress</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMasteryColor(analytics.masteryLevel)}`}>
            {analytics.masteryLevel}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-green-600">{analytics.accuracy}%</div>
            <div className="text-gray-500">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{analytics.currentStreak}</div>
            <div className="text-gray-500">Streak</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{analytics.totalAttempts}</div>
            <div className="text-gray-500">Total</div>
          </div>
        </div>
        
        {progressIndicators && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Mastery</span>
              <span>{progressIndicators.masteryProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressIndicators.masteryProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 capitalize">
          {subject} Progress Tracker
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMasteryColor(analytics.masteryLevel)}`}>
          {analytics.masteryLevel.charAt(0).toUpperCase() + analytics.masteryLevel.slice(1)}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analytics.accuracy}%</div>
          <div className="text-sm text-gray-600 flex items-center justify-center">
            Accuracy {getTrendIcon(progressIndicators?.accuracyTrend)}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
            {analytics.currentStreak} {getStreakIcon(progressIndicators?.streakStatus)}
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{analytics.totalAttempts}</div>
          <div className="text-sm text-gray-600">Questions Tried</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{analytics.averageResponseTime}s</div>
          <div className="text-sm text-gray-600">Avg. Time</div>
        </div>
      </div>

      {/* Mastery Progress */}
      {progressIndicators && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Mastery Progress</h3>
            <span className="text-sm text-gray-600">{progressIndicators.masteryProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressIndicators.masteryProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Next milestone: {progressIndicators.nextMilestone}
          </div>
        </div>
      )}

      {/* Strengths and Areas for Improvement */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            💪 Strengths
          </h4>
          {analytics.strongAreas.length > 0 ? (
            <ul className="text-sm text-green-700 space-y-1">
              {analytics.strongAreas.map((area, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-600">Keep practicing to discover your strengths!</p>
          )}
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
            🎯 Focus Areas
          </h4>
          {analytics.improvementAreas.length > 0 ? (
            <ul className="text-sm text-blue-700 space-y-1">
              {analytics.improvementAreas.map((area, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blue-600">Great job! No specific areas need focus right now.</p>
          )}
        </div>
      </div>

      {/* Learning Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
            🎓 Recommended Next Steps
          </h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                  rec.priority === 'high' ? 'border-red-400 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                  'border-green-400 bg-green-50'
                }`}
                onClick={() => onRecommendationSelect && onRecommendationSelect(rec)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 capitalize">
                      {rec.subject}
                      {rec.priority === 'high' && <span className="ml-2 text-red-600">🔥</span>}
                    </h4>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                    {rec.accuracy !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current accuracy: {rec.accuracy}% • Est. time: {rec.estimatedTime} min
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rec.priority}
                    </div>
                    {rec.recommendedDifficulty && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {rec.recommendedDifficulty}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consistency Score */}
      {analytics.consistency !== undefined && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Consistency Score</span>
            <span className="text-sm font-bold text-gray-800">{analytics.consistency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
              style={{ width: `${analytics.consistency}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            How steady your performance has been recently
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;