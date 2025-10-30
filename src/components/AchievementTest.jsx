/**
 * Achievement Test Component
 * 
 * Test component for verifying achievement system functionality
 * This should be removed in production
 */

import React, { useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import AchievementNotification from './AchievementNotification';
import AchievementGallery from './AchievementGallery';
import { ACHIEVEMENTS } from '../utils/achievementSystem';

const AchievementTest = () => {
  const {
    progress,
    currentNotification,
    isShowingNotification,
    trackEvent,
    unlockAchievement,
    closeNotification,
    resetProgress,
    getStats
  } = useAchievements();

  const [showGallery, setShowGallery] = useState(false);
  const stats = getStats();

  const handleTestEvent = (eventType) => {
    switch (eventType) {
      case 'first_question':
        trackEvent('question_answered', {
          isCorrect: true,
          responseTime: 2000,
          sessionQuestionCount: 1
        });
        break;
      
      case 'perfect_subject':
        trackEvent('subject_completed', {
          subject: 'math',
          score: 100,
          questionsAnswered: 10,
          correctAnswers: 10
        });
        break;
      
      case 'multiple_subjects':
        ['phonics', 'reading', 'science', 'spelling', 'social'].forEach(subject => {
          trackEvent('subject_completed', {
            subject,
            score: 85,
            questionsAnswered: 10,
            correctAnswers: 8
          });
        });
        break;
      
      case 'speed_run':
        trackEvent('question_answered', {
          isCorrect: true,
          responseTime: 1000,
          sessionQuestionCount: 10
        });
        break;
      
      default:
        console.log('Unknown test event:', eventType);
    }
  };

  const handleUnlockSpecific = (achievementId) => {
    unlockAchievement(achievementId);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">🏆 Achievement System Test</h1>
      
      {/* Stats Display */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Current Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">Achievements</div>
            <div>{stats.earned}/{stats.total} ({stats.percentage}%)</div>
          </div>
          <div>
            <div className="font-medium">Points</div>
            <div>{stats.points}</div>
          </div>
          <div>
            <div className="font-medium">Questions</div>
            <div>{progress.stats?.totalQuestionsAnswered || 0}</div>
          </div>
          <div>
            <div className="font-medium">Subjects</div>
            <div>{Object.keys(progress.completedSubjects || {}).length}</div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold mb-3">Test Events</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleTestEvent('first_question')}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Answer First Question
            </button>
            <button
              onClick={() => handleTestEvent('perfect_subject')}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Complete Subject (100%)
            </button>
            <button
              onClick={() => handleTestEvent('multiple_subjects')}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              Complete 5 Subjects
            </button>
            <button
              onClick={() => handleTestEvent('speed_run')}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              Speed Run (Fast Response)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-semibold mb-3">Direct Unlock</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.keys(ACHIEVEMENTS).map(achievementId => (
              <button
                key={achievementId}
                onClick={() => handleUnlockSpecific(achievementId)}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs text-left"
                disabled={(progress.achievements || []).includes(achievementId)}
              >
                {ACHIEVEMENTS[achievementId].name}
                {(progress.achievements || []).includes(achievementId) && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowGallery(!showGallery)}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          {showGallery ? 'Hide' : 'Show'} Achievement Gallery
        </button>
        <button
          onClick={resetProgress}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset Progress
        </button>
        {isShowingNotification && (
          <button
            onClick={closeNotification}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Close Notification
          </button>
        )}
      </div>

      {/* Achievement Gallery */}
      {showGallery && (
        <div className="border-t pt-6">
          <AchievementGallery 
            progress={progress}
            onAchievementClick={(achievement) => {
              console.log('Achievement clicked:', achievement);
            }}
          />
        </div>
      )}

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={currentNotification}
        visible={isShowingNotification}
        onClose={closeNotification}
        autoClose={true}
        duration={4000}
      />
    </div>
  );
};

export default AchievementTest;