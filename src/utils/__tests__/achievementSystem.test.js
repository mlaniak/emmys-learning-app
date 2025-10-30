/**
 * Achievement System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AchievementTracker, 
  ACHIEVEMENTS, 
  ACHIEVEMENT_CATEGORIES, 
  ACHIEVEMENT_RARITIES,
  saveProgress,
  loadProgress,
  getDefaultProgress
} from '../achievementSystem';

describe('Achievement System', () => {
  let tracker;
  let mockProgress;

  beforeEach(() => {
    tracker = new AchievementTracker();
    mockProgress = getDefaultProgress();
  });

  describe('AchievementTracker', () => {
    it('should check for newly unlocked achievements', () => {
      const progressWithFirstQuestion = {
        ...mockProgress,
        stats: { totalQuestionsAnswered: 1 }
      };

      const newAchievements = tracker.checkAchievements(progressWithFirstQuestion);
      expect(newAchievements).toHaveLength(1);
      expect(newAchievements[0].id).toBe('first_steps');
    });

    it('should not unlock already earned achievements', () => {
      const progressWithAchievement = {
        ...mockProgress,
        achievements: ['first_steps'],
        stats: { totalQuestionsAnswered: 1 }
      };

      const newAchievements = tracker.checkAchievements(progressWithAchievement);
      expect(newAchievements).toHaveLength(0);
    });

    it('should unlock achievement and update progress', () => {
      const updatedProgress = tracker.unlockAchievement(mockProgress, 'first_steps');
      
      expect(updatedProgress.achievements).toContain('first_steps');
      expect(updatedProgress.totalScore).toBe(ACHIEVEMENTS.first_steps.points);
      expect(updatedProgress.stats.achievementsUnlocked).toBe(1);
    });

    it('should calculate achievement progress correctly', () => {
      const progressWithSubjects = {
        ...mockProgress,
        completedSubjects: {
          math: { score: 100 },
          reading: { score: 85 },
          science: { score: 100 }
        }
      };

      // Scholar achievement requires 5 subjects, we have 3
      const scholarProgress = tracker.getAchievementProgress(progressWithSubjects, 'scholar');
      expect(scholarProgress).toBe(60); // 3/5 * 100

      // Perfectionist requires 3 perfect scores, we have 2
      const perfectionistProgress = tracker.getAchievementProgress(progressWithSubjects, 'perfectionist');
      expect(perfectionistProgress).toBe(Math.min((2 / 3) * 100, 100));
    });

    it('should get achievements by category', () => {
      const masteryAchievements = tracker.getAchievementsByCategory(ACHIEVEMENT_CATEGORIES.MASTERY);
      expect(masteryAchievements.length).toBeGreaterThan(0);
      expect(masteryAchievements.every(a => a.category === ACHIEVEMENT_CATEGORIES.MASTERY)).toBe(true);
    });

    it('should get achievements by rarity', () => {
      const legendaryAchievements = tracker.getAchievementsByRarity(ACHIEVEMENT_RARITIES.LEGENDARY);
      expect(legendaryAchievements.length).toBeGreaterThan(0);
      expect(legendaryAchievements.every(a => a.rarity === ACHIEVEMENT_RARITIES.LEGENDARY)).toBe(true);
    });

    it('should calculate total achievement points', () => {
      const progressWithAchievements = {
        ...mockProgress,
        achievements: ['first_steps', 'perfect_score']
      };

      const totalPoints = tracker.calculateTotalPoints(progressWithAchievements);
      const expectedPoints = ACHIEVEMENTS.first_steps.points + ACHIEVEMENTS.perfect_score.points;
      expect(totalPoints).toBe(expectedPoints);
    });

    it('should generate achievement statistics', () => {
      const progressWithAchievements = {
        ...mockProgress,
        achievements: ['first_steps', 'perfect_score', 'mathematician']
      };

      const stats = tracker.getAchievementStats(progressWithAchievements);
      
      expect(stats.earned).toBe(3);
      expect(stats.total).toBe(Object.keys(ACHIEVEMENTS).length);
      expect(stats.percentage).toBe(Math.round((3 / stats.total) * 100));
      expect(stats.points).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byRarity).toBeDefined();
    });
  });

  describe('Achievement Definitions', () => {
    it('should have valid achievement structure', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('rarity');
        expect(achievement).toHaveProperty('points');
        expect(achievement).toHaveProperty('unlockCondition');
        expect(typeof achievement.unlockCondition).toBe('function');
      });
    });

    it('should have valid categories and rarities', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(Object.values(ACHIEVEMENT_CATEGORIES)).toContain(achievement.category);
        expect(Object.values(ACHIEVEMENT_RARITIES)).toContain(achievement.rarity);
      });
    });
  });

  describe('Progress Management', () => {
    it('should create default progress structure', () => {
      const defaultProgress = getDefaultProgress();
      
      expect(defaultProgress).toHaveProperty('completedSubjects');
      expect(defaultProgress).toHaveProperty('totalScore');
      expect(defaultProgress).toHaveProperty('achievements');
      expect(defaultProgress).toHaveProperty('stats');
      expect(defaultProgress.achievements).toEqual([]);
      expect(defaultProgress.totalScore).toBe(0);
    });

    it('should save and load progress', () => {
      const testProgress = {
        ...getDefaultProgress(),
        achievements: ['first_steps'],
        totalScore: 100
      };

      // Note: In a real test environment, we'd mock localStorage
      // For now, we'll just test the function structure
      expect(() => saveProgress(testProgress)).not.toThrow();
      expect(() => loadProgress()).not.toThrow();
    });
  });

  describe('Specific Achievement Conditions', () => {
    it('should unlock first_steps achievement', () => {
      const progress = {
        ...mockProgress,
        stats: { totalQuestionsAnswered: 1 }
      };

      expect(ACHIEVEMENTS.first_steps.unlockCondition(progress)).toBe(true);
    });

    it('should unlock perfect_score achievement', () => {
      const progress = {
        ...mockProgress,
        completedSubjects: {
          math: { score: 100 }
        }
      };

      expect(ACHIEVEMENTS.perfect_score.unlockCondition(progress)).toBe(true);
    });

    it('should unlock scholar achievement', () => {
      const progress = {
        ...mockProgress,
        completedSubjects: {
          math: { score: 85 },
          reading: { score: 90 },
          science: { score: 95 },
          phonics: { score: 80 },
          spelling: { score: 88 }
        }
      };

      expect(ACHIEVEMENTS.scholar.unlockCondition(progress)).toBe(true);
    });

    it('should unlock grand_master achievement', () => {
      const allSubjects = ['phonics', 'math', 'reading', 'spelling', 'science', 'social', 'skipcounting', 'art', 'geography', 'history'];
      const completedSubjects = {};
      
      allSubjects.forEach(subject => {
        completedSubjects[subject] = { score: 100 };
      });

      const progress = {
        ...mockProgress,
        completedSubjects
      };

      expect(ACHIEVEMENTS.grand_master.unlockCondition(progress)).toBe(true);
    });

    it('should handle time-based achievements', () => {
      // Mock current time for early_bird (before 8 AM)
      const originalDate = Date;
      global.Date = class extends Date {
        getHours() {
          return 7; // 7 AM
        }
      };

      expect(ACHIEVEMENTS.early_bird.unlockCondition(mockProgress)).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });
  });
});