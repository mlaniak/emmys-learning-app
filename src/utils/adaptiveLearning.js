/**
 * Adaptive Learning Algorithm for Emmy's Learning Adventure
 * 
 * This system tracks student performance and adjusts difficulty dynamically
 * to provide optimal learning experiences based on individual progress.
 */

// Performance tracking constants
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const PERFORMANCE_THRESHOLDS = {
  ACCURACY: {
    HIGH: 0.85,    // 85% accuracy or higher
    MEDIUM: 0.65,  // 65-84% accuracy
    LOW: 0.64      // Below 65% accuracy
  },
  RESPONSE_TIME: {
    FAST: 3000,    // Under 3 seconds
    MEDIUM: 6000,  // 3-6 seconds
    SLOW: 6001     // Over 6 seconds
  },
  MASTERY: {
    EXPERT: 0.90,  // 90% mastery
    PROFICIENT: 0.75, // 75% mastery
    DEVELOPING: 0.60, // 60% mastery
    BEGINNER: 0.59    // Below 60% mastery
  }
};

export const ADJUSTMENT_FACTORS = {
  ACCURACY_WEIGHT: 0.4,
  SPEED_WEIGHT: 0.3,
  CONSISTENCY_WEIGHT: 0.2,
  STREAK_WEIGHT: 0.1
};

/**
 * Adaptive Learning Engine Class
 */
export class AdaptiveLearningEngine {
  constructor() {
    this.performanceHistory = new Map();
    this.subjectMastery = new Map();
    this.difficultyAdjustments = new Map();
    this.questionHistory = new Map();
  }

  /**
   * Track performance for a single question attempt
   */
  trackPerformance(userId, subject, questionData, result) {
    const performanceData = {
      userId,
      subject,
      questionId: this.getQuestionId(questionData),
      difficulty: questionData.difficulty || DIFFICULTY_LEVELS.MEDIUM,
      isCorrect: result.isCorrect,
      responseTime: result.responseTime,
      timestamp: Date.now(),
      hintUsed: result.hintUsed || false,
      attempts: result.attempts || 1
    };

    // Store performance data
    const userKey = `${userId}_${subject}`;
    if (!this.performanceHistory.has(userKey)) {
      this.performanceHistory.set(userKey, []);
    }
    
    const history = this.performanceHistory.get(userKey);
    history.push(performanceData);
    
    // Keep only last 100 attempts per subject to prevent memory bloat
    if (history.length > 100) {
      history.shift();
    }

    // Update subject mastery
    this.updateSubjectMastery(userId, subject);
    
    return performanceData;
  }

  /**
   * Calculate current accuracy for a subject
   */
  calculateAccuracy(userId, subject, recentCount = 10) {
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    if (history.length === 0) return 0;
    
    // Get recent attempts (default last 10)
    const recentAttempts = history.slice(-recentCount);
    const correctAnswers = recentAttempts.filter(attempt => attempt.isCorrect).length;
    
    return correctAnswers / recentAttempts.length;
  }

  /**
   * Calculate average response time for a subject
   */
  calculateAverageResponseTime(userId, subject, recentCount = 10) {
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    if (history.length === 0) return 0;
    
    const recentAttempts = history.slice(-recentCount);
    const totalTime = recentAttempts.reduce((sum, attempt) => sum + attempt.responseTime, 0);
    
    return totalTime / recentAttempts.length;
  }

  /**
   * Calculate consistency score (how stable performance is)
   */
  calculateConsistency(userId, subject, recentCount = 10) {
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    if (history.length < 3) return 0.5; // Default neutral consistency
    
    const recentAttempts = history.slice(-recentCount);
    const accuracies = [];
    
    // Calculate accuracy for sliding windows
    for (let i = 0; i < recentAttempts.length - 2; i++) {
      const window = recentAttempts.slice(i, i + 3);
      const windowAccuracy = window.filter(a => a.isCorrect).length / window.length;
      accuracies.push(windowAccuracy);
    }
    
    if (accuracies.length === 0) return 0.5;
    
    // Calculate variance (lower variance = higher consistency)
    const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    
    // Convert variance to consistency score (0-1, where 1 is most consistent)
    return Math.max(0, 1 - (variance * 4)); // Scale variance to 0-1 range
  }

  /**
   * Calculate current streak for a subject
   */
  calculateStreak(userId, subject) {
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    if (history.length === 0) return 0;
    
    let streak = 0;
    // Count consecutive correct answers from the end
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].isCorrect) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Update subject mastery calculation
   */
  updateSubjectMastery(userId, subject) {
    const accuracy = this.calculateAccuracy(userId, subject, 20); // Use last 20 attempts
    const consistency = this.calculateConsistency(userId, subject, 15);
    const avgResponseTime = this.calculateAverageResponseTime(userId, subject, 15);
    const streak = this.calculateStreak(userId, subject);
    
    // Calculate mastery score (0-1)
    const accuracyScore = accuracy;
    const speedScore = Math.max(0, 1 - (avgResponseTime / 10000)); // Normalize to 0-1
    const consistencyScore = consistency;
    const streakScore = Math.min(1, streak / 10); // Max out at 10 streak
    
    const masteryScore = (
      accuracyScore * ADJUSTMENT_FACTORS.ACCURACY_WEIGHT +
      speedScore * ADJUSTMENT_FACTORS.SPEED_WEIGHT +
      consistencyScore * ADJUSTMENT_FACTORS.CONSISTENCY_WEIGHT +
      streakScore * ADJUSTMENT_FACTORS.STREAK_WEIGHT
    );
    
    const masteryKey = `${userId}_${subject}`;
    this.subjectMastery.set(masteryKey, {
      score: masteryScore,
      accuracy,
      avgResponseTime,
      consistency,
      streak,
      level: this.getMasteryLevel(masteryScore),
      lastUpdated: Date.now()
    });
    
    return masteryScore;
  }

  /**
   * Get mastery level based on score
   */
  getMasteryLevel(masteryScore) {
    if (masteryScore >= PERFORMANCE_THRESHOLDS.MASTERY.EXPERT) return 'expert';
    if (masteryScore >= PERFORMANCE_THRESHOLDS.MASTERY.PROFICIENT) return 'proficient';
    if (masteryScore >= PERFORMANCE_THRESHOLDS.MASTERY.DEVELOPING) return 'developing';
    return 'beginner';
  }

  /**
   * Adjust difficulty based on performance
   */
  adjustDifficulty(userId, subject, currentDifficulty = DIFFICULTY_LEVELS.MEDIUM) {
    const masteryKey = `${userId}_${subject}`;
    const mastery = this.subjectMastery.get(masteryKey);
    
    if (!mastery) {
      return currentDifficulty; // No data yet, keep current difficulty
    }
    
    const { score, accuracy, avgResponseTime, streak } = mastery;
    
    // Decision logic for difficulty adjustment
    let newDifficulty = currentDifficulty;
    
    // Increase difficulty if performing well
    if (accuracy >= PERFORMANCE_THRESHOLDS.ACCURACY.HIGH && 
        avgResponseTime <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.FAST && 
        streak >= 5) {
      
      if (currentDifficulty === DIFFICULTY_LEVELS.EASY) {
        newDifficulty = DIFFICULTY_LEVELS.MEDIUM;
      } else if (currentDifficulty === DIFFICULTY_LEVELS.MEDIUM) {
        newDifficulty = DIFFICULTY_LEVELS.HARD;
      }
    }
    // Decrease difficulty if struggling
    else if (accuracy <= PERFORMANCE_THRESHOLDS.ACCURACY.LOW || 
             avgResponseTime >= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.SLOW) {
      
      if (currentDifficulty === DIFFICULTY_LEVELS.HARD) {
        newDifficulty = DIFFICULTY_LEVELS.MEDIUM;
      } else if (currentDifficulty === DIFFICULTY_LEVELS.MEDIUM && accuracy < 0.5) {
        newDifficulty = DIFFICULTY_LEVELS.EASY;
      }
    }
    
    // Store adjustment history
    const adjustmentKey = `${userId}_${subject}`;
    if (!this.difficultyAdjustments.has(adjustmentKey)) {
      this.difficultyAdjustments.set(adjustmentKey, []);
    }
    
    if (newDifficulty !== currentDifficulty) {
      const adjustments = this.difficultyAdjustments.get(adjustmentKey);
      adjustments.push({
        from: currentDifficulty,
        to: newDifficulty,
        reason: this.getDifficultyAdjustmentReason(mastery),
        timestamp: Date.now()
      });
      
      // Keep only last 20 adjustments
      if (adjustments.length > 20) {
        adjustments.shift();
      }
    }
    
    return newDifficulty;
  }

  /**
   * Get reason for difficulty adjustment
   */
  getDifficultyAdjustmentReason(mastery) {
    const { accuracy, avgResponseTime, streak } = mastery;
    
    if (accuracy >= PERFORMANCE_THRESHOLDS.ACCURACY.HIGH && streak >= 5) {
      return 'High accuracy and good streak - ready for challenge';
    }
    if (accuracy <= PERFORMANCE_THRESHOLDS.ACCURACY.LOW) {
      return 'Low accuracy - need more practice at easier level';
    }
    if (avgResponseTime >= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.SLOW) {
      return 'Slow response time - reducing difficulty to build confidence';
    }
    return 'Performance-based adjustment';
  }

  /**
   * Smart question selection to avoid recent repeats
   */
  selectQuestions(userId, subject, questionPool, count = 10) {
    const userKey = `${userId}_${subject}`;
    const recentQuestions = this.getRecentQuestions(userId, subject, 20);
    const recentIds = new Set(recentQuestions.map(q => this.getQuestionId(q)));
    
    // Separate questions into categories
    const newQuestions = questionPool.filter(q => !recentIds.has(this.getQuestionId(q)));
    const recentQuestions_filtered = questionPool.filter(q => recentIds.has(this.getQuestionId(q)));
    
    // Prioritize new questions, then add recent ones if needed
    const selectedQuestions = [];
    
    // Shuffle new questions and take what we need
    const shuffledNew = this.shuffleArray([...newQuestions]);
    selectedQuestions.push(...shuffledNew.slice(0, count));
    
    // If we need more questions, add some recent ones
    if (selectedQuestions.length < count) {
      const shuffledRecent = this.shuffleArray([...recentQuestions_filtered]);
      const needed = count - selectedQuestions.length;
      selectedQuestions.push(...shuffledRecent.slice(0, needed));
    }
    
    return selectedQuestions.slice(0, count);
  }

  /**
   * Get recent questions for a user and subject
   */
  getRecentQuestions(userId, subject, count = 20) {
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    return history.slice(-count).map(entry => ({
      id: entry.questionId,
      difficulty: entry.difficulty,
      timestamp: entry.timestamp
    }));
  }

  /**
   * Recommend learning path based on performance
   */
  recommendLearningPath(userId, availableSubjects) {
    const recommendations = [];
    
    for (const subject of availableSubjects) {
      const masteryKey = `${userId}_${subject}`;
      const mastery = this.subjectMastery.get(masteryKey);
      
      if (!mastery) {
        // New subject - high priority
        recommendations.push({
          subject,
          priority: 'high',
          reason: 'New subject to explore',
          recommendedDifficulty: DIFFICULTY_LEVELS.EASY,
          estimatedTime: 10
        });
        continue;
      }
      
      const { score, accuracy, level, streak } = mastery;
      
      let priority = 'medium';
      let reason = 'Continue practicing';
      let recommendedDifficulty = DIFFICULTY_LEVELS.MEDIUM;
      
      // High priority for struggling subjects
      if (accuracy < PERFORMANCE_THRESHOLDS.ACCURACY.LOW) {
        priority = 'high';
        reason = 'Needs more practice - low accuracy';
        recommendedDifficulty = DIFFICULTY_LEVELS.EASY;
      }
      // Low priority for mastered subjects
      else if (level === 'expert' && streak >= 10) {
        priority = 'low';
        reason = 'Well mastered - occasional review';
        recommendedDifficulty = DIFFICULTY_LEVELS.HARD;
      }
      // Medium priority for developing subjects
      else if (level === 'developing') {
        priority = 'medium';
        reason = 'Good progress - keep practicing';
        recommendedDifficulty = this.adjustDifficulty(userId, subject);
      }
      
      recommendations.push({
        subject,
        priority,
        reason,
        recommendedDifficulty,
        masteryLevel: level,
        accuracy: Math.round(accuracy * 100),
        estimatedTime: this.estimateSessionTime(mastery)
      });
    }
    
    // Sort by priority (high -> medium -> low) and then by accuracy (lowest first for same priority)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return (a.accuracy || 0) - (b.accuracy || 0);
    });
    
    return recommendations;
  }

  /**
   * Estimate session time based on mastery
   */
  estimateSessionTime(mastery) {
    const { level, avgResponseTime } = mastery;
    
    // Base time per question in minutes
    let baseTime = 0.5; // 30 seconds per question
    
    if (level === 'beginner') baseTime = 1.0; // 1 minute per question
    else if (level === 'developing') baseTime = 0.75; // 45 seconds per question
    else if (level === 'expert') baseTime = 0.33; // 20 seconds per question
    
    // Adjust based on actual response time
    if (avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.SLOW) {
      baseTime *= 1.5;
    } else if (avgResponseTime < PERFORMANCE_THRESHOLDS.RESPONSE_TIME.FAST) {
      baseTime *= 0.8;
    }
    
    return Math.round(baseTime * 10); // Assume 10 questions per session
  }

  /**
   * Get performance analytics for display
   */
  getPerformanceAnalytics(userId, subject) {
    const masteryKey = `${userId}_${subject}`;
    const mastery = this.subjectMastery.get(masteryKey);
    const userKey = `${userId}_${subject}`;
    const history = this.performanceHistory.get(userKey) || [];
    
    if (!mastery || history.length === 0) {
      return {
        totalAttempts: 0,
        accuracy: 0,
        averageResponseTime: 0,
        currentStreak: 0,
        masteryLevel: 'beginner',
        masteryScore: 0,
        recentTrend: 'stable',
        strongAreas: [],
        improvementAreas: []
      };
    }
    
    // Calculate recent trend
    const recentAccuracy = this.calculateAccuracy(userId, subject, 5);
    const olderAccuracy = this.calculateAccuracy(userId, subject, 10) - recentAccuracy;
    let recentTrend = 'stable';
    
    if (recentAccuracy > olderAccuracy + 0.1) recentTrend = 'improving';
    else if (recentAccuracy < olderAccuracy - 0.1) recentTrend = 'declining';
    
    // Analyze strong and weak areas (this would be more sophisticated with question categories)
    const strongAreas = [];
    const improvementAreas = [];
    
    if (mastery.accuracy >= PERFORMANCE_THRESHOLDS.ACCURACY.HIGH) {
      strongAreas.push('Accuracy');
    } else {
      improvementAreas.push('Accuracy');
    }
    
    if (mastery.avgResponseTime <= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.FAST) {
      strongAreas.push('Speed');
    } else if (mastery.avgResponseTime >= PERFORMANCE_THRESHOLDS.RESPONSE_TIME.SLOW) {
      improvementAreas.push('Speed');
    }
    
    if (mastery.consistency >= 0.7) {
      strongAreas.push('Consistency');
    } else {
      improvementAreas.push('Consistency');
    }
    
    return {
      totalAttempts: history.length,
      accuracy: Math.round(mastery.accuracy * 100),
      averageResponseTime: Math.round(mastery.avgResponseTime / 1000), // Convert to seconds
      currentStreak: mastery.streak,
      masteryLevel: mastery.level,
      masteryScore: Math.round(mastery.score * 100),
      recentTrend,
      strongAreas,
      improvementAreas,
      consistency: Math.round(mastery.consistency * 100)
    };
  }

  /**
   * Utility functions
   */
  getQuestionId(questionData) {
    if (questionData.id) return questionData.id;
    if (questionData.word) return `${questionData.word}-${questionData.question}`;
    return questionData.question || questionData.answer || JSON.stringify(questionData);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Export/Import data for persistence
   */
  exportData() {
    return {
      performanceHistory: Array.from(this.performanceHistory.entries()),
      subjectMastery: Array.from(this.subjectMastery.entries()),
      difficultyAdjustments: Array.from(this.difficultyAdjustments.entries()),
      timestamp: Date.now()
    };
  }

  importData(data) {
    if (data.performanceHistory) {
      this.performanceHistory = new Map(data.performanceHistory);
    }
    if (data.subjectMastery) {
      this.subjectMastery = new Map(data.subjectMastery);
    }
    if (data.difficultyAdjustments) {
      this.difficultyAdjustments = new Map(data.difficultyAdjustments);
    }
  }

  /**
   * Clear old data to prevent memory bloat
   */
  cleanupOldData(maxAgeMs = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const cutoffTime = Date.now() - maxAgeMs;
    
    // Clean performance history
    for (const [key, history] of this.performanceHistory.entries()) {
      const filteredHistory = history.filter(entry => entry.timestamp > cutoffTime);
      if (filteredHistory.length === 0) {
        this.performanceHistory.delete(key);
      } else {
        this.performanceHistory.set(key, filteredHistory);
      }
    }
    
    // Clean difficulty adjustments
    for (const [key, adjustments] of this.difficultyAdjustments.entries()) {
      const filteredAdjustments = adjustments.filter(adj => adj.timestamp > cutoffTime);
      if (filteredAdjustments.length === 0) {
        this.difficultyAdjustments.delete(key);
      } else {
        this.difficultyAdjustments.set(key, filteredAdjustments);
      }
    }
  }
}

// Create singleton instance
export const adaptiveLearningEngine = new AdaptiveLearningEngine();

// Storage key for persistence
export const ADAPTIVE_LEARNING_STORAGE_KEY = 'emmy-adaptive-learning-data';

/**
 * Save adaptive learning data to localStorage
 */
export function saveAdaptiveLearningData() {
  try {
    const data = adaptiveLearningEngine.exportData();
    localStorage.setItem(ADAPTIVE_LEARNING_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving adaptive learning data:', error);
  }
}

/**
 * Load adaptive learning data from localStorage
 */
export function loadAdaptiveLearningData() {
  try {
    const saved = localStorage.getItem(ADAPTIVE_LEARNING_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      adaptiveLearningEngine.importData(data);
    }
  } catch (error) {
    console.error('Error loading adaptive learning data:', error);
  }
}

/**
 * Initialize adaptive learning system
 */
export function initializeAdaptiveLearning() {
  loadAdaptiveLearningData();
  
  // Set up periodic cleanup (once per session)
  if (!window.adaptiveLearningCleanupScheduled) {
    setTimeout(() => {
      adaptiveLearningEngine.cleanupOldData();
      saveAdaptiveLearningData();
    }, 5000); // Clean up after 5 seconds
    
    window.adaptiveLearningCleanupScheduled = true;
  }
  
  // Set up periodic saving
  if (!window.adaptiveLearningAutoSave) {
    setInterval(() => {
      saveAdaptiveLearningData();
    }, 30000); // Save every 30 seconds
    
    window.adaptiveLearningAutoSave = true;
  }
}