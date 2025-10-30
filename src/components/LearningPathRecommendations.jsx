/**
 * Learning Path Recommendations Component
 * 
 * Displays personalized learning recommendations based on adaptive learning data
 */

import React, { useState, useEffect } from 'react';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';

const LearningPathRecommendations = ({ onSubjectSelect, maxRecommendations = 5 }) => {
  const { getLearningRecommendations, isInitialized } = useAdaptiveLearning();
  const [recommendations, setRecommendations] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      const availableSubjects = [
        'phonics', 'math', 'reading', 'spelling', 'science', 
        'social', 'skipcounting', 'art', 'geography', 'history'
      ];
      const recs = getLearningRecommendations(availableSubjects);
      setRecommendations(recs);
    }
  }, [isInitialized, getLearningRecommendations]);

  const getSubjectIcon = (subject) => {
    const icons = {
      phonics: '📚',
      math: '🧮',
      reading: '📖',
      spelling: '✏️',
      science: '🔬',
      social: '🌍',
      skipcounting: '🔢',
      art: '🎨',
      geography: '🗺️',
      history: '🏛️'
    };
    return icons[subject] || '📝';
  };

  const getSubjectName = (subject) => {
    const names = {
      phonics: 'Phonics',
      math: 'Math',
      reading: 'Reading',
      spelling: 'Spelling',
      science: 'Science',
      social: 'Social Studies',
      skipcounting: 'Skip Counting',
      art: 'Art',
      geography: 'Geography',
      history: 'History'
    };
    return names[subject] || subject;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-400 bg-red-50 hover:bg-red-100';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100';
      case 'low':
        return 'border-green-400 bg-green-50 hover:bg-green-100';
      default:
        return 'border-gray-400 bg-gray-50 hover:bg-gray-100';
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { text: 'High Priority', color: 'bg-red-100 text-red-700', icon: '🔥' },
      medium: { text: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700', icon: '⭐' },
      low: { text: 'Low Priority', color: 'bg-green-100 text-green-700', icon: '✅' }
    };
    return badges[priority] || badges.medium;
  };

  const getMasteryBadge = (level) => {
    const badges = {
      expert: { text: 'Expert', color: 'bg-purple-100 text-purple-700', icon: '👑' },
      proficient: { text: 'Proficient', color: 'bg-blue-100 text-blue-700', icon: '🌟' },
      developing: { text: 'Developing', color: 'bg-green-100 text-green-700', icon: '🌱' },
      beginner: { text: 'Beginner', color: 'bg-gray-100 text-gray-700', icon: '🆕' }
    };
    return badges[level] || badges.beginner;
  };

  if (!isInitialized) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <div className="text-4xl mb-3">🎓</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Ready to Start Learning!
        </h3>
        <p className="text-gray-600">
          Complete a few questions to get personalized recommendations.
        </p>
      </div>
    );
  }

  const displayedRecommendations = showAll 
    ? recommendations 
    : recommendations.slice(0, maxRecommendations);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          🎯 Your Learning Path
        </h2>
        <div className="text-sm text-gray-500">
          Based on your progress
        </div>
      </div>

      <div className="space-y-4">
        {displayedRecommendations.map((rec, index) => {
          const priorityBadge = getPriorityBadge(rec.priority);
          const masteryBadge = rec.masteryLevel ? getMasteryBadge(rec.masteryLevel) : null;

          return (
            <div
              key={`${rec.subject}-${index}`}
              className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all duration-200 ${getPriorityColor(rec.priority)}`}
              onClick={() => onSubjectSelect && onSubjectSelect(rec.subject)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getSubjectIcon(rec.subject)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {getSubjectName(rec.subject)}
                      </h3>
                      <p className="text-sm text-gray-600">{rec.reason}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                      {priorityBadge.icon} {priorityBadge.text}
                    </span>
                    
                    {masteryBadge && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${masteryBadge.color}`}>
                        {masteryBadge.icon} {masteryBadge.text}
                      </span>
                    )}
                    
                    {rec.recommendedDifficulty && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        📊 {rec.recommendedDifficulty.charAt(0).toUpperCase() + rec.recommendedDifficulty.slice(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {rec.accuracy !== undefined && (
                      <div className="flex items-center space-x-1">
                        <span>🎯</span>
                        <span>{rec.accuracy}% accuracy</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <span>⏱️</span>
                      <span>~{rec.estimatedTime} min</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="text-2xl mb-2">
                    {index === 0 && rec.priority === 'high' && '🔥'}
                    {index === 0 && rec.priority === 'medium' && '⭐'}
                    {index === 0 && rec.priority === 'low' && '✅'}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{index + 1}
                  </div>
                </div>
              </div>

              {/* Progress indicator for subjects with existing data */}
              {rec.accuracy !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{rec.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        rec.accuracy >= 80 ? 'bg-green-500' :
                        rec.accuracy >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${rec.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {recommendations.length > maxRecommendations && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${recommendations.length - maxRecommendations} More`}
          </button>
        </div>
      )}

      {/* Learning Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          💡 Learning Tips
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Start with high-priority subjects for the biggest impact</li>
          <li>• Practice consistently - even 10 minutes daily helps!</li>
          <li>• Don't worry about perfect scores - learning from mistakes is important</li>
          <li>• Take breaks between subjects to stay fresh and focused</li>
        </ul>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-red-50 rounded p-3">
          <div className="text-lg font-bold text-red-600">
            {recommendations.filter(r => r.priority === 'high').length}
          </div>
          <div className="text-xs text-red-600">High Priority</div>
        </div>
        <div className="bg-yellow-50 rounded p-3">
          <div className="text-lg font-bold text-yellow-600">
            {recommendations.filter(r => r.priority === 'medium').length}
          </div>
          <div className="text-xs text-yellow-600">Medium Priority</div>
        </div>
        <div className="bg-green-50 rounded p-3">
          <div className="text-lg font-bold text-green-600">
            {recommendations.filter(r => r.priority === 'low').length}
          </div>
          <div className="text-xs text-green-600">Low Priority</div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathRecommendations;