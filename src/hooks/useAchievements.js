/**
 * Achievement Management Hook
 * 
 * Provides achievement tracking, unlocking, and notification functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { achievementTracker, ACHIEVEMENTS, saveProgress, loadProgress } from '../utils/achievementSystem';

export const useAchievements = (initialProgress = null) => {
  const [progress, setProgress] = useState(initialProgress || loadProgress());
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [isShowingNotification, setIsShowingNotification] = useState(false);
  
  // Refs for managing notification timing
  const notificationTimeoutRef = useRef(null);
  const queueProcessorRef = useRef(null);

  // Process notification queue
  const processNotificationQueue = useCallback(() => {
    if (isShowingNotification || notificationQueue.length === 0) {
      return;
    }

    const nextNotification = notificationQueue[0];
    setNotificationQueue(prev => prev.slice(1));
    setCurrentNotification(nextNotification);
    setIsShowingNotification(true);

    // Auto-hide notification after 4 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setIsShowingNotification(false);
      setCurrentNotification(null);
      
      // Process next notification after a brief delay
      setTimeout(() => {
        processNotificationQueue();
      }, 500);
    }, 4000);
  }, [isShowingNotification, notificationQueue]);

  // Start queue processor when queue changes
  useEffect(() => {
    if (notificationQueue.length > 0 && !isShowingNotification) {
      queueProcessorRef.current = setTimeout(processNotificationQueue, 100);
    }

    return () => {
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
      }
    };
  }, [notificationQueue, isShowingNotification, processNotificationQueue]);

  // Achievement unlock listener
  useEffect(() => {
    const handleAchievementUnlock = (achievement) => {
      // Add to notification queue
      setNotificationQueue(prev => [...prev, achievement]);
    };

    achievementTracker.addListener(handleAchievementUnlock);

    return () => {
      achievementTracker.removeListener(handleAchievementUnlock);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
      }
    };
  }, []);

  // Update progress and check for achievements
  const updateProgress = useCallback((newProgress) => {
    const updatedProgress = saveProgress(newProgress);
    setProgress(updatedProgress);
    return updatedProgress;
  }, []);

  // Track specific achievement events
  const trackEvent = useCallback((eventType, data = {}) => {
    const currentTime = Date.now();
    let updatedProgress = { ...progress };

    switch (eventType) {
      case 'question_answered':
        updatedProgress.stats = {
          ...updatedProgress.stats,
          totalQuestionsAnswered: (updatedProgress.stats?.totalQuestionsAnswered || 0) + 1,
          correctAnswers: updatedProgress.stats?.correctAnswers || 0,
          timeSpent: (updatedProgress.stats?.timeSpent || 0) + (data.responseTime || 0)
        };

        if (data.isCorrect) {
          updatedProgress.stats.correctAnswers += 1;
        }

        // Track session length
        if (data.sessionQuestionCount) {
          updatedProgress.stats.longestSession = Math.max(
            updatedProgress.stats?.longestSession || 0,
            data.sessionQuestionCount
          );
        }

        // Track response time for speed achievements
        if (data.responseTime) {
          updatedProgress.stats.fastestSession = Math.min(
            updatedProgress.stats?.fastestSession || Infinity,
            data.responseTime
          );
        }
        break;

      case 'subject_completed':
        updatedProgress.completedSubjects = {
          ...updatedProgress.completedSubjects,
          [data.subject]: {
            score: data.score,
            completedAt: currentTime,
            questionsAnswered: data.questionsAnswered,
            correctAnswers: data.correctAnswers
          }
        };

        if (data.score === 100) {
          updatedProgress.stats.perfectScores = (updatedProgress.stats?.perfectScores || 0) + 1;
        }
        break;

      case 'session_started':
        updatedProgress.stats.sessionsPlayed = (updatedProgress.stats?.sessionsPlayed || 0) + 1;
        updatedProgress.lastPlayed = currentTime;
        break;

      case 'streak_updated':
        updatedProgress.streak = data.streak;
        break;

      default:
        console.warn(`Unknown event type: ${eventType}`);
    }

    return updateProgress(updatedProgress);
  }, [progress, updateProgress]);

  // Manually unlock achievement (for testing or special cases)
  const unlockAchievement = useCallback((achievementId) => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return progress;
    }

    const updatedProgress = achievementTracker.unlockAchievement(progress, achievementId);
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
    
    return updatedProgress;
  }, [progress]);

  // Get achievement statistics
  const getStats = useCallback(() => {
    return achievementTracker.getAchievementStats(progress);
  }, [progress]);

  // Get achievement progress for a specific achievement
  const getAchievementProgress = useCallback((achievementId) => {
    return achievementTracker.getAchievementProgress(progress, achievementId);
  }, [progress]);

  // Check if achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId) => {
    return (progress.achievements || []).includes(achievementId);
  }, [progress.achievements]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category) => {
    return achievementTracker.getAchievementsByCategory(category);
  }, []);

  // Get achievements by rarity
  const getAchievementsByRarity = useCallback((rarity) => {
    return achievementTracker.getAchievementsByRarity(rarity);
  }, []);

  // Close current notification
  const closeNotification = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setIsShowingNotification(false);
    setCurrentNotification(null);
    
    // Process next notification after a brief delay
    setTimeout(() => {
      processNotificationQueue();
    }, 300);
  }, [processNotificationQueue]);

  // Reset progress (for testing)
  const resetProgress = useCallback(() => {
    const defaultProgress = {
      completedSubjects: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null,
      achievements: [],
      unlockedThemes: ['default'],
      selectedTheme: 'default',
      avatar: 'default',
      certificates: [],
      questionHistory: {},
      stats: {
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        perfectScores: 0,
        timeSpent: 0,
        favoriteSubject: null,
        achievementsUnlocked: 0,
        longestSession: 0,
        fastestSession: Infinity,
        sessionsPlayed: 0
      }
    };
    
    setProgress(defaultProgress);
    saveProgress(defaultProgress);
    setNotificationQueue([]);
    setCurrentNotification(null);
    setIsShowingNotification(false);
    
    return defaultProgress;
  }, []);

  return {
    // State
    progress,
    currentNotification,
    isShowingNotification,
    notificationQueue: notificationQueue.length,

    // Actions
    updateProgress,
    trackEvent,
    unlockAchievement,
    closeNotification,
    resetProgress,

    // Getters
    getStats,
    getAchievementProgress,
    isAchievementUnlocked,
    getAchievementsByCategory,
    getAchievementsByRarity,

    // Constants
    achievements: ACHIEVEMENTS
  };
};