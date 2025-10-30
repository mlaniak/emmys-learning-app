/**
 * React Hook for Adaptive Learning Integration
 * 
 * Provides easy access to adaptive learning functionality within React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  adaptiveLearningEngine, 
  saveAdaptiveLearningData, 
  loadAdaptiveLearningData,
  initializeAdaptiveLearning,
  DIFFICULTY_LEVELS 
} from '../utils/adaptiveLearning';
import { useUser } from '../contexts/UserContext';

export const useAdaptiveLearning = () => {
  const { user } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const sessionStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  // Initialize the adaptive learning system
  useEffect(() => {
    if (user && !isInitialized) {
      initializeAdaptiveLearning();
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  /**
   * Track a question attempt
   */
  const trackQuestionAttempt = useCallback((subject, questionData, result) => {
    if (!user || !isInitialized) return;

    const performanceEntry = adaptiveLearningEngine.trackPerformance(
      user.id,
      subject,
      questionData,
      {
        ...result,
        responseTime: result.responseTime || (Date.now() - questionStartTime.current)
      }
    );

    // Update local performance data
    setPerformanceData(prev => ({
      ...prev,
      [subject]: adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject)
    }));

    // Save data after tracking
    saveAdaptiveLearningData();

    return performanceEntry;
  }, [user, isInitialized]);

  /**
   * Start tracking a new question
   */
  const startQuestion = useCallback(() => {
    questionStartTime.current = Date.now();
  }, []);

  /**
   * Get current difficulty for a subject
   */
  const getCurrentDifficulty = useCallback((subject, currentDifficulty = DIFFICULTY_LEVELS.MEDIUM) => {
    if (!user || !isInitialized) return currentDifficulty;
    
    return adaptiveLearningEngine.adjustDifficulty(user.id, subject, currentDifficulty);
  }, [user, isInitialized]);

  /**
   * Get smart question selection
   */
  const selectQuestions = useCallback((subject, questionPool, count = 10) => {
    if (!user || !isInitialized) {
      // Fallback to random selection
      const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
    
    return adaptiveLearningEngine.selectQuestions(user.id, subject, questionPool, count);
  }, [user, isInitialized]);

  /**
   * Get learning path recommendations
   */
  const getLearningRecommendations = useCallback((availableSubjects) => {
    if (!user || !isInitialized) return [];
    
    const recs = adaptiveLearningEngine.recommendLearningPath(user.id, availableSubjects);
    setRecommendations(recs);
    return recs;
  }, [user, isInitialized]);

  /**
   * Get performance analytics for a subject
   */
  const getSubjectAnalytics = useCallback((subject) => {
    if (!user || !isInitialized) {
      return {
        totalAttempts: 0,
        accuracy: 0,
        averageResponseTime: 0,
        currentStreak: 0,
        masteryLevel: 'beginner',
        masteryScore: 0,
        recentTrend: 'stable',
        strongAreas: [],
        improvementAreas: [],
        consistency: 0
      };
    }
    
    return adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
  }, [user, isInitialized]);

  /**
   * Get subject mastery level
   */
  const getSubjectMastery = useCallback((subject) => {
    if (!user || !isInitialized) return 'beginner';
    
    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    return analytics.masteryLevel;
  }, [user, isInitialized]);

  /**
   * Calculate accuracy for a subject
   */
  const getSubjectAccuracy = useCallback((subject, recentCount = 10) => {
    if (!user || !isInitialized) return 0;
    
    return Math.round(adaptiveLearningEngine.calculateAccuracy(user.id, subject, recentCount) * 100);
  }, [user, isInitialized]);

  /**
   * Get current streak for a subject
   */
  const getSubjectStreak = useCallback((subject) => {
    if (!user || !isInitialized) return 0;
    
    return adaptiveLearningEngine.calculateStreak(user.id, subject);
  }, [user, isInitialized]);

  /**
   * Start a new learning session
   */
  const startSession = useCallback((subject) => {
    sessionStartTime.current = Date.now();
    questionStartTime.current = Date.now();
    
    // Update performance data for the subject
    if (user && isInitialized) {
      setPerformanceData(prev => ({
        ...prev,
        [subject]: adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject)
      }));
    }
  }, [user, isInitialized]);

  /**
   * End a learning session and track session-level metrics
   */
  const endSession = useCallback((subject, sessionResults) => {
    if (!user || !isInitialized) return;

    const sessionDuration = Date.now() - sessionStartTime.current;
    
    // Track session-level performance
    const sessionData = {
      subject,
      duration: sessionDuration,
      questionsAttempted: sessionResults.questionsAttempted || 0,
      correctAnswers: sessionResults.correctAnswers || 0,
      totalScore: sessionResults.totalScore || 0,
      averageResponseTime: sessionResults.averageResponseTime || 0,
      hintsUsed: sessionResults.hintsUsed || 0,
      timestamp: Date.now()
    };

    // Update performance data
    setPerformanceData(prev => ({
      ...prev,
      [subject]: adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject)
    }));

    // Save data
    saveAdaptiveLearningData();

    return sessionData;
  }, [user, isInitialized]);

  /**
   * Get difficulty adjustment suggestion with explanation
   */
  const getDifficultyAdjustment = useCallback((subject, currentDifficulty) => {
    if (!user || !isInitialized) {
      return {
        suggestedDifficulty: currentDifficulty,
        shouldAdjust: false,
        reason: 'Insufficient data for adjustment'
      };
    }

    const suggestedDifficulty = adaptiveLearningEngine.adjustDifficulty(user.id, subject, currentDifficulty);
    const shouldAdjust = suggestedDifficulty !== currentDifficulty;
    
    let reason = 'No adjustment needed';
    if (shouldAdjust) {
      const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
      
      if (suggestedDifficulty === DIFFICULTY_LEVELS.HARD) {
        reason = `Great job! Your ${analytics.accuracy}% accuracy shows you're ready for harder questions.`;
      } else if (suggestedDifficulty === DIFFICULTY_LEVELS.EASY) {
        reason = `Let's practice more at an easier level to build confidence.`;
      } else {
        reason = `Adjusting to medium difficulty based on your progress.`;
      }
    }

    return {
      suggestedDifficulty,
      shouldAdjust,
      reason
    };
  }, [user, isInitialized]);

  /**
   * Get progress indicators for UI display
   */
  const getProgressIndicators = useCallback((subject) => {
    if (!user || !isInitialized) {
      return {
        masteryProgress: 0,
        accuracyTrend: 'stable',
        streakStatus: 'none',
        nextMilestone: 'Complete first question',
        strengthAreas: [],
        improvementAreas: []
      };
    }

    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    
    // Calculate mastery progress as percentage
    const masteryProgress = analytics.masteryScore;
    
    // Determine streak status
    let streakStatus = 'none';
    if (analytics.currentStreak >= 10) streakStatus = 'fire';
    else if (analytics.currentStreak >= 5) streakStatus = 'hot';
    else if (analytics.currentStreak >= 3) streakStatus = 'warm';
    
    // Determine next milestone
    let nextMilestone = 'Complete first question';
    if (analytics.totalAttempts === 0) {
      nextMilestone = 'Complete first question';
    } else if (analytics.accuracy < 70) {
      nextMilestone = 'Reach 70% accuracy';
    } else if (analytics.currentStreak < 5) {
      nextMilestone = 'Get 5 questions right in a row';
    } else if (analytics.masteryLevel === 'beginner') {
      nextMilestone = 'Reach developing level';
    } else if (analytics.masteryLevel === 'developing') {
      nextMilestone = 'Reach proficient level';
    } else if (analytics.masteryLevel === 'proficient') {
      nextMilestone = 'Become an expert';
    } else {
      nextMilestone = 'Maintain expert level';
    }

    return {
      masteryProgress,
      accuracyTrend: analytics.recentTrend,
      streakStatus,
      nextMilestone,
      strengthAreas: analytics.strongAreas,
      improvementAreas: analytics.improvementAreas
    };
  }, [user, isInitialized]);

  /**
   * Get personalized encouragement message
   */
  const getEncouragementMessage = useCallback((subject, result) => {
    if (!user || !isInitialized) {
      return result.isCorrect ? 'Great job!' : 'Keep trying!';
    }

    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    const streak = analytics.currentStreak;
    const accuracy = analytics.accuracy;

    if (result.isCorrect) {
      if (streak >= 10) return "🔥 You're on fire! Amazing streak!";
      if (streak >= 5) return "⭐ Fantastic! You're really getting the hang of this!";
      if (streak >= 3) return "🌟 Great job! You're building momentum!";
      if (accuracy >= 90) return "💯 Excellent work! You're mastering this!";
      if (accuracy >= 75) return "👏 Well done! You're doing great!";
      return "✅ Correct! Keep up the good work!";
    } else {
      if (streak === 0 && analytics.totalAttempts > 5) return "💪 Don't give up! Every expert was once a beginner!";
      if (accuracy < 50) return "🌱 You're learning! Each mistake helps you grow!";
      if (analytics.recentTrend === 'improving') return "📈 You're getting better! Keep practicing!";
      return "🤔 Not quite, but you're learning! Try again!";
    }
  }, [user, isInitialized]);

  return {
    // Core functionality
    trackQuestionAttempt,
    startQuestion,
    startSession,
    endSession,
    
    // Difficulty management
    getCurrentDifficulty,
    getDifficultyAdjustment,
    
    // Question selection
    selectQuestions,
    
    // Analytics and insights
    getSubjectAnalytics,
    getSubjectMastery,
    getSubjectAccuracy,
    getSubjectStreak,
    getLearningRecommendations,
    getProgressIndicators,
    getEncouragementMessage,
    
    // State
    isInitialized,
    performanceData,
    recommendations
  };
};

export default useAdaptiveLearning;