import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const ProgressTracker = () => {
  const { userProfile, updateProgress } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [localProgress, setLocalProgress] = useState({
    score: 0,
    learningStreak: 0,
    completedLessons: [],
    achievements: []
  });

  // Sync local progress with cloud when user profile changes
  useEffect(() => {
    if (userProfile?.progress) {
      setLocalProgress({
        score: userProfile.progress.score || 0,
        learningStreak: userProfile.progress.learning_streak || 0,
        completedLessons: userProfile.progress.completed_lessons || [],
        achievements: userProfile.progress.achievements || []
      });
    }
  }, [userProfile]);

  // Sync progress to cloud
  const syncProgress = async (newProgress) => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      await updateProgress(newProgress);
      setLocalProgress(prev => ({ ...prev, ...newProgress }));
    } catch (error) {
      console.error('Error syncing progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add score
  const addScore = (points) => {
    const newScore = localProgress.score + points;
    syncProgress({ score: newScore });
  };

  // Complete lesson
  const completeLesson = (lessonId) => {
    if (!localProgress.completedLessons.includes(lessonId)) {
      const newCompletedLessons = [...localProgress.completedLessons, lessonId];
      syncProgress({ completedLessons: newCompletedLessons });
    }
  };

  // Add achievement
  const addAchievement = (achievement) => {
    if (!localProgress.achievements.find(a => a.id === achievement.id)) {
      const newAchievements = [...localProgress.achievements, achievement];
      syncProgress({ achievements: newAchievements });
    }
  };

  // Update streak
  const updateStreak = (increment = 1) => {
    const newStreak = localProgress.learningStreak + increment;
    syncProgress({ learningStreak: newStreak });
  };

  const achievements = [
    { id: 'first_lesson', name: 'First Steps', emoji: '👶', description: 'Complete your first lesson!' },
    { id: 'streak_7', name: 'Week Warrior', emoji: '🔥', description: 'Learn for 7 days in a row!' },
    { id: 'score_100', name: 'Century Club', emoji: '💯', description: 'Earn 100 points!' },
    { id: 'perfect_lesson', name: 'Perfect Score', emoji: '⭐', description: 'Get everything right!' },
    { id: 'early_bird', name: 'Early Bird', emoji: '🐦', description: 'Learn before 8 AM!' }
  ];

  const getAchievementProgress = (achievementId) => {
    switch (achievementId) {
      case 'first_lesson':
        return localProgress.completedLessons.length >= 1 ? 100 : 0;
      case 'streak_7':
        return Math.min((localProgress.learningStreak / 7) * 100, 100);
      case 'score_100':
        return Math.min((localProgress.score / 100) * 100, 100);
      case 'perfect_lesson':
        return localProgress.achievements.find(a => a.id === 'perfect_lesson') ? 100 : 0;
      case 'early_bird':
        return localProgress.achievements.find(a => a.id === 'early_bird') ? 100 : 0;
      default:
        return 0;
    }
  };

  if (!userProfile) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Progress 📊</h2>
        {isLoading && (
          <div className="flex items-center text-purple-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            Syncing...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{localProgress.score}</div>
          <div className="text-sm opacity-90">Total Points</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{localProgress.learningStreak}</div>
          <div className="text-sm opacity-90">Day Streak</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{localProgress.completedLessons.length}</div>
          <div className="text-sm opacity-90">Lessons Done</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{localProgress.achievements.length}</div>
          <div className="text-sm opacity-90">Achievements</div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements 🏆</h3>
        <div className="space-y-3">
          {achievements.map(achievement => {
            const progress = getAchievementProgress(achievement.id);
            const isCompleted = progress === 100;
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCompleted
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`text-2xl mr-3 ${isCompleted ? '' : 'grayscale opacity-50'}`}>
                      {achievement.emoji}
                    </div>
                    <div>
                      <div className={`font-semibold ${isCompleted ? 'text-yellow-800' : 'text-gray-700'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isCompleted ? 'text-yellow-800' : 'text-gray-500'}`}>
                      {Math.round(progress)}%
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-yellow-400' : 'bg-purple-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity 📈</h3>
        <div className="space-y-2">
          {localProgress.completedLessons.slice(-5).map((lessonId, index) => (
            <div key={lessonId} className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              <span>Completed lesson: {lessonId}</span>
              <span className="ml-auto text-xs text-gray-400">
                {index === 0 ? 'Today' : `${index} days ago`}
              </span>
            </div>
          ))}
          {localProgress.completedLessons.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📚</div>
              <div>Start learning to see your activity here!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
