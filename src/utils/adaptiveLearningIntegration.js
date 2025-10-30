/**
 * Adaptive Learning Integration Utilities
 * 
 * Helper functions to integrate adaptive learning with the existing app structure
 */

import { adaptiveLearningEngine, saveAdaptiveLearningData, DIFFICULTY_LEVELS } from './adaptiveLearning';

/**
 * Integration helper for tracking question attempts in the existing app
 */
export const integrateQuestionTracking = (
  user,
  subject,
  questionData,
  userAnswer,
  correctAnswer,
  responseTime,
  hintUsed = false,
  attempts = 1
) => {
  if (!user) return null;

  const result = {
    isCorrect: userAnswer === correctAnswer,
    responseTime: responseTime || 3000, // Default 3 seconds if not provided
    hintUsed,
    attempts,
    userAnswer,
    correctAnswer
  };

  // Track with adaptive learning engine
  const performanceEntry = adaptiveLearningEngine.trackPerformance(
    user.id,
    subject,
    {
      ...questionData,
      id: getQuestionId(questionData),
      difficulty: questionData.difficulty || DIFFICULTY_LEVELS.MEDIUM
    },
    result
  );

  // Save data
  saveAdaptiveLearningData();

  return {
    performanceEntry,
    result,
    encouragementMessage: getEncouragementMessage(user.id, subject, result)
  };
};

/**
 * Get smart question selection for existing question pools
 */
export const getSmartQuestionSelection = (user, subject, questionPool, count = 10, currentDifficulty = DIFFICULTY_LEVELS.MEDIUM) => {
  if (!user || !questionPool || questionPool.length === 0) {
    return questionPool.slice(0, count);
  }

  // Add difficulty to questions if not present
  const questionsWithDifficulty = questionPool.map(q => ({
    ...q,
    difficulty: q.difficulty || currentDifficulty,
    id: getQuestionId(q)
  }));

  // Use adaptive learning engine for smart selection
  const selectedQuestions = adaptiveLearningEngine.selectQuestions(
    user.id,
    subject,
    questionsWithDifficulty,
    count
  );

  return selectedQuestions;
};

/**
 * Get difficulty adjustment recommendation
 */
export const getDifficultyRecommendation = (user, subject, currentDifficulty) => {
  if (!user) {
    return {
      recommendedDifficulty: currentDifficulty,
      shouldChange: false,
      reason: 'No user data available'
    };
  }

  const recommendedDifficulty = adaptiveLearningEngine.adjustDifficulty(
    user.id,
    subject,
    currentDifficulty
  );

  const shouldChange = recommendedDifficulty !== currentDifficulty;
  let reason = 'No change needed';

  if (shouldChange) {
    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    
    if (recommendedDifficulty === DIFFICULTY_LEVELS.HARD) {
      reason = `Excellent progress! Your ${analytics.accuracy}% accuracy shows you're ready for harder challenges.`;
    } else if (recommendedDifficulty === DIFFICULTY_LEVELS.EASY) {
      reason = `Let's build confidence with easier questions. Focus on accuracy first.`;
    } else {
      reason = `Medium difficulty provides the right balance for your current level.`;
    }
  }

  return {
    recommendedDifficulty,
    shouldChange,
    reason,
    currentPerformance: adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject)
  };
};

/**
 * Update existing progress structure with adaptive learning data
 */
export const enhanceProgressWithAdaptiveData = (existingProgress, user) => {
  if (!user) return existingProgress;

  const enhancedProgress = { ...existingProgress };

  // Add adaptive learning stats to each completed subject
  Object.keys(enhancedProgress.completedSubjects || {}).forEach(subject => {
    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    
    enhancedProgress.completedSubjects[subject] = {
      ...enhancedProgress.completedSubjects[subject],
      adaptiveData: {
        masteryLevel: analytics.masteryLevel,
        accuracy: analytics.accuracy,
        consistency: analytics.consistency,
        averageResponseTime: analytics.averageResponseTime,
        currentStreak: analytics.currentStreak,
        totalAttempts: analytics.totalAttempts,
        recentTrend: analytics.recentTrend,
        strongAreas: analytics.strongAreas,
        improvementAreas: analytics.improvementAreas
      }
    };
  });

  // Add overall adaptive learning stats
  enhancedProgress.adaptiveLearning = {
    initialized: true,
    lastUpdated: Date.now(),
    totalSubjectsTracked: Object.keys(enhancedProgress.completedSubjects || {}).length
  };

  return enhancedProgress;
};

/**
 * Get personalized encouragement message based on performance
 */
export const getEncouragementMessage = (userId, subject, result) => {
  const analytics = adaptiveLearningEngine.getPerformanceAnalytics(userId, subject);
  
  if (result.isCorrect) {
    if (analytics.currentStreak >= 10) {
      return "🔥 Incredible! You're on a hot streak! Keep this momentum going!";
    } else if (analytics.currentStreak >= 5) {
      return "⭐ Fantastic work! You're really mastering this subject!";
    } else if (analytics.currentStreak >= 3) {
      return "🌟 Great job! You're building excellent momentum!";
    } else if (analytics.accuracy >= 90) {
      return "💯 Outstanding! Your accuracy is amazing!";
    } else if (analytics.accuracy >= 75) {
      return "👏 Well done! You're doing really well!";
    } else {
      return "✅ Correct! Keep up the great work!";
    }
  } else {
    if (analytics.recentTrend === 'improving') {
      return "📈 Don't worry! You're still improving overall. Keep practicing!";
    } else if (analytics.accuracy < 50 && analytics.totalAttempts > 5) {
      return "💪 Every expert was once a beginner. You're learning with each try!";
    } else if (analytics.currentStreak === 0 && analytics.totalAttempts > 10) {
      return "🌱 Learning takes time. Each mistake helps you grow stronger!";
    } else {
      return "🤔 Not quite right, but you're learning! Try again!";
    }
  }
};

/**
 * Generate learning insights for display
 */
export const generateLearningInsights = (user, subjects) => {
  if (!user) return [];

  const insights = [];

  subjects.forEach(subject => {
    const analytics = adaptiveLearningEngine.getPerformanceAnalytics(user.id, subject);
    
    if (analytics.totalAttempts === 0) {
      insights.push({
        type: 'new_subject',
        subject,
        message: `Ready to explore ${subject}? It's a great subject to start with!`,
        priority: 'medium',
        action: 'start_learning'
      });
      return;
    }

    // High accuracy insight
    if (analytics.accuracy >= 90 && analytics.totalAttempts >= 10) {
      insights.push({
        type: 'mastery',
        subject,
        message: `Amazing! You've mastered ${subject} with ${analytics.accuracy}% accuracy!`,
        priority: 'high',
        action: 'increase_difficulty'
      });
    }

    // Struggling insight
    if (analytics.accuracy < 60 && analytics.totalAttempts >= 5) {
      insights.push({
        type: 'struggling',
        subject,
        message: `${subject} needs some extra attention. Let's practice with easier questions.`,
        priority: 'high',
        action: 'decrease_difficulty'
      });
    }

    // Streak insight
    if (analytics.currentStreak >= 10) {
      insights.push({
        type: 'streak',
        subject,
        message: `🔥 You're on fire in ${subject}! ${analytics.currentStreak} correct answers in a row!`,
        priority: 'medium',
        action: 'celebrate'
      });
    }

    // Improvement insight
    if (analytics.recentTrend === 'improving' && analytics.totalAttempts >= 10) {
      insights.push({
        type: 'improvement',
        subject,
        message: `Great progress in ${subject}! Your recent performance is trending upward.`,
        priority: 'medium',
        action: 'continue_practice'
      });
    }

    // Consistency insight
    if (analytics.consistency >= 80 && analytics.totalAttempts >= 15) {
      insights.push({
        type: 'consistency',
        subject,
        message: `Your ${subject} performance is very consistent! That shows real understanding.`,
        priority: 'low',
        action: 'maintain_level'
      });
    }
  });

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return insights.slice(0, 5); // Return top 5 insights
};

/**
 * Helper function to create question ID
 */
export const getQuestionId = (questionData) => {
  if (questionData.id) return questionData.id;
  if (questionData.word) return `${questionData.word}-${questionData.question}`;
  return questionData.question || questionData.answer || JSON.stringify(questionData);
};

/**
 * Initialize adaptive learning for existing users
 */
export const initializeAdaptiveLearningForUser = (user, existingProgress) => {
  if (!user) return;

  // If user has existing progress, we can bootstrap the adaptive learning system
  if (existingProgress && existingProgress.completedSubjects) {
    Object.entries(existingProgress.completedSubjects).forEach(([subject, subjectData]) => {
      // Create some synthetic performance data based on existing progress
      const accuracy = (subjectData.score || 0) / 100; // Convert score to accuracy
      const questionsAnswered = subjectData.questionsAnswered || 10;
      
      // Generate synthetic performance entries
      for (let i = 0; i < Math.min(questionsAnswered, 20); i++) {
        const isCorrect = Math.random() < accuracy;
        const responseTime = 2000 + Math.random() * 4000; // 2-6 seconds
        
        adaptiveLearningEngine.trackPerformance(
          user.id,
          subject,
          {
            id: `synthetic-${subject}-${i}`,
            question: `Synthetic question ${i}`,
            difficulty: DIFFICULTY_LEVELS.MEDIUM
          },
          {
            isCorrect,
            responseTime,
            hintUsed: false,
            attempts: 1
          }
        );
      }
    });
    
    saveAdaptiveLearningData();
  }
};

/**
 * Export adaptive learning data for backup/sync
 */
export const exportAdaptiveLearningData = (user) => {
  if (!user) return null;

  return {
    userId: user.id,
    exportDate: new Date().toISOString(),
    data: adaptiveLearningEngine.exportData(),
    version: '1.0'
  };
};

/**
 * Import adaptive learning data from backup/sync
 */
export const importAdaptiveLearningData = (importData) => {
  if (!importData || !importData.data) return false;

  try {
    adaptiveLearningEngine.importData(importData.data);
    saveAdaptiveLearningData();
    return true;
  } catch (error) {
    console.error('Failed to import adaptive learning data:', error);
    return false;
  }
};