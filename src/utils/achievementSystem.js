/**
 * Achievement System for Emmy's Learning Adventure
 * 
 * Manages achievement tracking, progress persistence, and badge unlocking
 */

// Achievement categories and unlock conditions
export const ACHIEVEMENT_CATEGORIES = {
  PROGRESS: 'progress',
  STREAK: 'streak', 
  MASTERY: 'mastery',
  EXPLORATION: 'exploration',
  SPECIAL: 'special'
};

export const ACHIEVEMENT_RARITIES = {
  COMMON: 'common',
  RARE: 'rare', 
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Complete achievement definitions with enhanced data structure
export const ACHIEVEMENTS = {
  // Progress Achievements
  first_steps: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first question!',
    icon: '👶',
    category: ACHIEVEMENT_CATEGORIES.PROGRESS,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    points: 10,
    unlockCondition: (progress) => progress.stats?.totalQuestionsAnswered >= 1,
    celebrationMessage: 'Welcome to your learning journey!'
  },
  
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on any subject!',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 50,
    unlockCondition: (progress) => {
      return Object.values(progress.completedSubjects || {}).some(subject => subject.score === 100);
    },
    celebrationMessage: 'Absolutely perfect! You nailed it!'
  },

  subject_master: {
    id: 'subject_master',
    name: 'Subject Master',
    description: 'Complete all questions in a subject!',
    icon: '🎓',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    points: 100,
    unlockCondition: (progress) => Object.keys(progress.completedSubjects || {}).length >= 1,
    celebrationMessage: 'You\'ve mastered your first subject!'
  },

  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer 10 questions in under 2 minutes!',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 75,
    unlockCondition: (progress) => progress.stats?.fastestSession <= 120000, // 2 minutes in ms
    celebrationMessage: 'Lightning fast! Your brain is on fire!'
  },

  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Complete 5 different subjects!',
    icon: '📚',
    category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    points: 150,
    unlockCondition: (progress) => Object.keys(progress.completedSubjects || {}).length >= 5,
    celebrationMessage: 'You\'re becoming a true scholar!'
  },

  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get perfect scores on 3 subjects!',
    icon: '⭐',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    points: 200,
    unlockCondition: (progress) => {
      const perfectScores = Object.values(progress.completedSubjects || {}).filter(s => s.score === 100);
      return perfectScores.length >= 3;
    },
    celebrationMessage: 'Perfection is your standard! Amazing!'
  },

  marathon_runner: {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Answer 50 questions in one session!',
    icon: '🏃',
    category: ACHIEVEMENT_CATEGORIES.PROGRESS,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 100,
    unlockCondition: (progress) => progress.stats?.longestSession >= 50,
    celebrationMessage: 'What endurance! You\'re unstoppable!'
  },

  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Play before 8 AM!',
    icon: '🌅',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    points: 25,
    unlockCondition: () => new Date().getHours() < 8,
    celebrationMessage: 'The early bird catches the worm!'
  },

  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play after 8 PM!',
    icon: '🦉',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    points: 25,
    unlockCondition: () => new Date().getHours() >= 20,
    celebrationMessage: 'Burning the midnight oil!'
  },

  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Play for 7 days in a row!',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.STREAK,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    points: 200,
    unlockCondition: (progress) => progress.streak >= 7,
    celebrationMessage: 'Your dedication is on fire!'
  },

  // Subject-specific achievements
  phonics_master: {
    id: 'phonics_master',
    name: 'Phonics Master',
    description: 'Master all phonics questions!',
    icon: '📚',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.phonics,
    celebrationMessage: 'You\'ve mastered the sounds of language!'
  },

  mathematician: {
    id: 'mathematician',
    name: 'Mathematician',
    description: 'Master all math questions!',
    icon: '🧮',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.math,
    celebrationMessage: 'Numbers are your best friends!'
  },

  reader: {
    id: 'reader',
    name: 'Reader',
    description: 'Master all reading questions!',
    icon: '📖',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.reading,
    celebrationMessage: 'You\'ve unlocked the world of stories!'
  },

  scientist: {
    id: 'scientist',
    name: 'Scientist',
    description: 'Master all science questions!',
    icon: '🔬',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.science,
    celebrationMessage: 'You\'re ready to discover the world!'
  },

  artist: {
    id: 'artist',
    name: 'Artist',
    description: 'Complete the spelling practice!',
    icon: '🎨',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    points: 30,
    unlockCondition: (progress) => progress.completedSubjects?.spelling,
    celebrationMessage: 'You paint with words beautifully!'
  },

  citizen: {
    id: 'citizen',
    name: 'Good Citizen',
    description: 'Master all citizenship questions!',
    icon: '🌟',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.social,
    celebrationMessage: 'You\'re a model citizen!'
  },

  counter: {
    id: 'counter',
    name: 'Counter',
    description: 'Master all skip counting!',
    icon: '🔢',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    points: 80,
    unlockCondition: (progress) => progress.completedSubjects?.skipcounting,
    celebrationMessage: 'You can count on yourself!'
  },

  grand_master: {
    id: 'grand_master',
    name: 'Grand Master',
    description: 'Complete ALL subjects with perfect scores!',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.MASTERY,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    points: 500,
    unlockCondition: (progress) => {
      const allSubjects = ['phonics', 'math', 'reading', 'spelling', 'science', 'social', 'skipcounting', 'art', 'geography', 'history'];
      return allSubjects.every(subject => 
        progress.completedSubjects?.[subject] && progress.completedSubjects[subject].score === 100
      );
    },
    celebrationMessage: 'You are the ultimate learning champion!'
  }
};

/**
 * Achievement tracking and management class
 */
export class AchievementTracker {
  constructor() {
    this.listeners = [];
  }

  /**
   * Add listener for achievement unlocks
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners of achievement unlock
   */
  notifyListeners(achievement) {
    this.listeners.forEach(callback => callback(achievement));
  }

  /**
   * Check for newly unlocked achievements
   */
  checkAchievements(progress) {
    const currentAchievements = progress.achievements || [];
    const newlyUnlocked = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
      // Skip if already unlocked
      if (currentAchievements.includes(achievement.id)) {
        return;
      }

      // Check unlock condition
      try {
        if (achievement.unlockCondition(progress)) {
          newlyUnlocked.push(achievement);
        }
      } catch (error) {
        console.warn(`Error checking achievement ${achievement.id}:`, error);
      }
    });

    return newlyUnlocked;
  }

  /**
   * Unlock achievement and update progress
   */
  unlockAchievement(progress, achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return progress;
    }

    const currentAchievements = progress.achievements || [];
    if (currentAchievements.includes(achievementId)) {
      return progress; // Already unlocked
    }

    const updatedProgress = {
      ...progress,
      achievements: [...currentAchievements, achievementId],
      totalScore: (progress.totalScore || 0) + achievement.points,
      stats: {
        ...progress.stats,
        achievementsUnlocked: (progress.stats?.achievementsUnlocked || 0) + 1
      }
    };

    // Notify listeners
    this.notifyListeners(achievement);

    return updatedProgress;
  }

  /**
   * Get achievement progress for display
   */
  getAchievementProgress(progress, achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return 0;

    const isUnlocked = (progress.achievements || []).includes(achievementId);
    if (isUnlocked) return 100;

    // For some achievements, we can show partial progress
    switch (achievementId) {
      case 'scholar':
        return Math.min((Object.keys(progress.completedSubjects || {}).length / 5) * 100, 100);
      case 'perfectionist':
        const perfectScores = Object.values(progress.completedSubjects || {}).filter(s => s.score === 100);
        return Math.min((perfectScores.length / 3) * 100, 100);
      case 'streak_master':
        return Math.min(((progress.streak || 0) / 7) * 100, 100);
      case 'marathon_runner':
        return Math.min(((progress.stats?.longestSession || 0) / 50) * 100, 100);
      default:
        return 0;
    }
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category) {
    return Object.values(ACHIEVEMENTS).filter(achievement => achievement.category === category);
  }

  /**
   * Get achievements by rarity
   */
  getAchievementsByRarity(rarity) {
    return Object.values(ACHIEVEMENTS).filter(achievement => achievement.rarity === rarity);
  }

  /**
   * Calculate total achievement points
   */
  calculateTotalPoints(progress) {
    const earnedAchievements = progress.achievements || [];
    return earnedAchievements.reduce((total, achievementId) => {
      const achievement = ACHIEVEMENTS[achievementId];
      return total + (achievement?.points || 0);
    }, 0);
  }

  /**
   * Get achievement statistics
   */
  getAchievementStats(progress) {
    const earnedAchievements = progress.achievements || [];
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    
    const statsByCategory = {};
    const statsByRarity = {};

    Object.values(ACHIEVEMENT_CATEGORIES).forEach(category => {
      const categoryAchievements = this.getAchievementsByCategory(category);
      const earnedInCategory = categoryAchievements.filter(a => earnedAchievements.includes(a.id));
      statsByCategory[category] = {
        total: categoryAchievements.length,
        earned: earnedInCategory.length,
        percentage: Math.round((earnedInCategory.length / categoryAchievements.length) * 100)
      };
    });

    Object.values(ACHIEVEMENT_RARITIES).forEach(rarity => {
      const rarityAchievements = this.getAchievementsByRarity(rarity);
      const earnedInRarity = rarityAchievements.filter(a => earnedAchievements.includes(a.id));
      statsByRarity[rarity] = {
        total: rarityAchievements.length,
        earned: earnedInRarity.length,
        percentage: Math.round((earnedInRarity.length / rarityAchievements.length) * 100)
      };
    });

    return {
      total: totalAchievements,
      earned: earnedAchievements.length,
      percentage: Math.round((earnedAchievements.length / totalAchievements) * 100),
      points: this.calculateTotalPoints(progress),
      byCategory: statsByCategory,
      byRarity: statsByRarity
    };
  }
}

// Create singleton instance
export const achievementTracker = new AchievementTracker();

// Progress persistence utilities
export const PROGRESS_STORAGE_KEY = 'emmy-learning-progress';

/**
 * Save progress to localStorage with achievement tracking
 */
export function saveProgress(progress) {
  try {
    // Check for new achievements before saving
    const newAchievements = achievementTracker.checkAchievements(progress);
    
    let updatedProgress = progress;
    
    // Unlock new achievements
    newAchievements.forEach(achievement => {
      updatedProgress = achievementTracker.unlockAchievement(updatedProgress, achievement.id);
    });

    // Save to localStorage
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updatedProgress));
    
    return updatedProgress;
  } catch (error) {
    console.error('Error saving progress:', error);
    return progress;
  }
}

/**
 * Load progress from localStorage
 */
export function loadProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) {
      return getDefaultProgress();
    }

    const progress = JSON.parse(saved);
    
    // Ensure all required fields exist
    return {
      ...getDefaultProgress(),
      ...progress,
      stats: {
        ...getDefaultProgress().stats,
        ...progress.stats
      }
    };
  } catch (error) {
    console.error('Error loading progress:', error);
    return getDefaultProgress();
  }
}

/**
 * Get default progress structure
 */
export function getDefaultProgress() {
  return {
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
}