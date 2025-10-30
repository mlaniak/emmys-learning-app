/**
 * Adaptive Learning Algorithm Validation Tests
 * 
 * Tests to validate the adaptive learning system with diverse user patterns
 * Requirements tested: 1.5, 5.5 (Adaptive learning and performance tracking)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { adaptiveLearning } from '../utils/adaptiveLearning';
import { achievementSystem } from '../utils/achievementSystem';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('Adaptive Learning Algorithm Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset adaptive learning state
    adaptiveLearning.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Performance Tracking', () => {
    it('should track accuracy over time', () => {
      const userId = 'test-user-123';
      const subject = 'math';

      // Simulate a series of answers
      const answers = [
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 4000 },
        { correct: false, timeSpent: 8000 },
        { correct: true, timeSpent: 3000 },
        { correct: true, timeSpent: 4500 }
      ];

      answers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      
      expect(performance.accuracy).toBe(0.8); // 4/5 correct
      expect(performance.averageResponseTime).toBe(4900); // Average of response times
      expect(performance.totalQuestions).toBe(5);
    });

    it('should track response time patterns', () => {
      const userId = 'test-user-123';
      const subject = 'reading';

      // Simulate improving response times
      const answers = [
        { correct: true, timeSpent: 10000 }, // 10s
        { correct: true, timeSpent: 8000 },  // 8s
        { correct: true, timeSpent: 6000 },  // 6s
        { correct: true, timeSpent: 5000 },  // 5s
        { correct: true, timeSpent: 4000 }   // 4s
      ];

      answers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      const trend = adaptiveLearning.getResponseTimeTrend(userId, subject);
      
      expect(performance.averageResponseTime).toBe(6600);
      expect(trend).toBe('improving'); // Response times are decreasing
    });

    it('should track streak performance', () => {
      const userId = 'test-user-123';
      const subject = 'science';

      // Simulate a streak of correct answers
      const correctAnswers = Array(7).fill({ correct: true, timeSpent: 5000 });
      correctAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      
      expect(performance.currentStreak).toBe(7);
      expect(performance.longestStreak).toBe(7);
      expect(performance.accuracy).toBe(1.0);
    });

    it('should reset streak on incorrect answer', () => {
      const userId = 'test-user-123';
      const subject = 'phonics';

      // Build up a streak, then break it
      const answers = [
        { correct: true, timeSpent: 4000 },
        { correct: true, timeSpent: 3500 },
        { correct: true, timeSpent: 4200 },
        { correct: false, timeSpent: 8000 }, // Break streak
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 4500 }
      ];

      answers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      
      expect(performance.currentStreak).toBe(2); // Last 2 correct
      expect(performance.longestStreak).toBe(3); // First 3 correct
    });
  });

  describe('Difficulty Adjustment', () => {
    it('should increase difficulty for high-performing users', () => {
      const userId = 'high-performer';
      const subject = 'math';

      // Simulate excellent performance
      const excellentAnswers = Array(10).fill({ correct: true, timeSpent: 3000 });
      excellentAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      expect(newDifficulty).toBe('hard');
      
      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      expect(performance.difficultyLevel).toBe('hard');
    });

    it('should decrease difficulty for struggling users', () => {
      const userId = 'struggling-user';
      const subject = 'reading';

      // Simulate poor performance
      const poorAnswers = [
        { correct: false, timeSpent: 12000 },
        { correct: false, timeSpent: 15000 },
        { correct: true, timeSpent: 10000 },
        { correct: false, timeSpent: 18000 },
        { correct: false, timeSpent: 14000 }
      ];

      poorAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      expect(newDifficulty).toBe('easy');
      
      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      expect(performance.difficultyLevel).toBe('easy');
    });

    it('should maintain difficulty for average performance', () => {
      const userId = 'average-user';
      const subject = 'science';

      // Simulate average performance (70% accuracy)
      const averageAnswers = [
        { correct: true, timeSpent: 6000 },
        { correct: true, timeSpent: 5500 },
        { correct: false, timeSpent: 9000 },
        { correct: true, timeSpent: 6500 },
        { correct: false, timeSpent: 8500 },
        { correct: true, timeSpent: 5800 },
        { correct: true, timeSpent: 6200 },
        { correct: false, timeSpent: 10000 },
        { correct: true, timeSpent: 5900 },
        { correct: true, timeSpent: 6100 }
      ];

      averageAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const initialDifficulty = 'medium';
      adaptiveLearning.setDifficulty(userId, subject, initialDifficulty);
      
      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      expect(newDifficulty).toBe('medium'); // Should stay the same
    });

    it('should consider response time in difficulty adjustment', () => {
      const userId = 'fast-learner';
      const subject = 'phonics';

      // High accuracy with fast response times
      const fastCorrectAnswers = Array(8).fill({ correct: true, timeSpent: 2000 });
      fastCorrectAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      // Should increase difficulty due to both high accuracy and fast responses
      expect(newDifficulty).toBe('hard');
    });

    it('should not adjust difficulty too frequently', () => {
      const userId = 'stable-user';
      const subject = 'math';

      // Set initial difficulty
      adaptiveLearning.setDifficulty(userId, subject, 'medium');
      
      // Record just a few answers (not enough for adjustment)
      const fewAnswers = [
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 4500 }
      ];

      fewAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      // Should maintain current difficulty with insufficient data
      expect(newDifficulty).toBe('medium');
    });
  });

  describe('Question Selection Algorithm', () => {
    it('should avoid recently asked questions', () => {
      const userId = 'test-user';
      const subject = 'math';
      
      const availableQuestions = [
        { id: 1, difficulty: 'medium', topic: 'addition' },
        { id: 2, difficulty: 'medium', topic: 'subtraction' },
        { id: 3, difficulty: 'medium', topic: 'multiplication' },
        { id: 4, difficulty: 'medium', topic: 'division' },
        { id: 5, difficulty: 'medium', topic: 'fractions' }
      ];

      // Record recent questions
      adaptiveLearning.recordQuestionAsked(userId, subject, 1);
      adaptiveLearning.recordQuestionAsked(userId, subject, 2);
      adaptiveLearning.recordQuestionAsked(userId, subject, 3);

      const nextQuestion = adaptiveLearning.selectNextQuestion(
        userId, 
        subject, 
        availableQuestions
      );

      // Should not select recently asked questions (1, 2, 3)
      expect([4, 5]).toContain(nextQuestion.id);
    });

    it('should select questions matching current difficulty', () => {
      const userId = 'test-user';
      const subject = 'reading';
      
      adaptiveLearning.setDifficulty(userId, subject, 'hard');
      
      const availableQuestions = [
        { id: 1, difficulty: 'easy', topic: 'sight-words' },
        { id: 2, difficulty: 'medium', topic: 'comprehension' },
        { id: 3, difficulty: 'hard', topic: 'analysis' },
        { id: 4, difficulty: 'hard', topic: 'inference' },
        { id: 5, difficulty: 'medium', topic: 'vocabulary' }
      ];

      const nextQuestion = adaptiveLearning.selectNextQuestion(
        userId, 
        subject, 
        availableQuestions
      );

      expect(nextQuestion.difficulty).toBe('hard');
      expect([3, 4]).toContain(nextQuestion.id);
    });

    it('should balance topic coverage', () => {
      const userId = 'test-user';
      const subject = 'science';
      
      const availableQuestions = [
        { id: 1, difficulty: 'medium', topic: 'biology' },
        { id: 2, difficulty: 'medium', topic: 'chemistry' },
        { id: 3, difficulty: 'medium', topic: 'physics' },
        { id: 4, difficulty: 'medium', topic: 'biology' },
        { id: 5, difficulty: 'medium', topic: 'chemistry' }
      ];

      // Record that user has answered many biology questions
      adaptiveLearning.recordTopicCoverage(userId, subject, 'biology', 5);
      adaptiveLearning.recordTopicCoverage(userId, subject, 'chemistry', 2);
      adaptiveLearning.recordTopicCoverage(userId, subject, 'physics', 1);

      const nextQuestion = adaptiveLearning.selectNextQuestion(
        userId, 
        subject, 
        availableQuestions
      );

      // Should prefer less-covered topics (physics or chemistry)
      expect(['chemistry', 'physics']).toContain(nextQuestion.topic);
    });

    it('should handle empty question pool gracefully', () => {
      const userId = 'test-user';
      const subject = 'math';
      
      const emptyQuestions = [];

      const nextQuestion = adaptiveLearning.selectNextQuestion(
        userId, 
        subject, 
        emptyQuestions
      );

      expect(nextQuestion).toBeNull();
    });
  });

  describe('Learning Path Recommendations', () => {
    it('should recommend next subjects based on mastery', () => {
      const userId = 'progressing-user';
      
      // Set high mastery in math
      adaptiveLearning.setSubjectMastery(userId, 'math', 0.9);
      adaptiveLearning.setSubjectMastery(userId, 'reading', 0.6);
      adaptiveLearning.setSubjectMastery(userId, 'science', 0.3);

      const recommendations = adaptiveLearning.getSubjectRecommendations(userId);
      
      // Should recommend advancing in math and improving science
      expect(recommendations).toContain('advanced-math');
      expect(recommendations).toContain('science');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should suggest review for declining performance', () => {
      const userId = 'declining-user';
      const subject = 'reading';

      // Simulate declining performance
      const decliningAnswers = [
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 5500 },
        { correct: false, timeSpent: 8000 },
        { correct: false, timeSpent: 9000 },
        { correct: false, timeSpent: 10000 }
      ];

      decliningAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const recommendations = adaptiveLearning.getRecommendations(userId, subject);
      
      expect(recommendations).toContain('review-basics');
      expect(recommendations).toContain('practice-more');
    });

    it('should recommend challenge activities for advanced users', () => {
      const userId = 'advanced-user';
      const subject = 'math';

      // Simulate excellent performance
      const excellentAnswers = Array(15).fill({ correct: true, timeSpent: 2500 });
      excellentAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const recommendations = adaptiveLearning.getRecommendations(userId, subject);
      
      expect(recommendations).toContain('challenge-problems');
      expect(recommendations).toContain('advanced-topics');
    });
  });

  describe('Diverse User Pattern Validation', () => {
    it('should handle perfectionist pattern (high accuracy, slow responses)', () => {
      const userId = 'perfectionist';
      const subject = 'math';

      const perfectionistAnswers = Array(10).fill({ correct: true, timeSpent: 15000 });
      perfectionistAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      const recommendations = adaptiveLearning.getRecommendations(userId, subject);
      
      expect(performance.accuracy).toBe(1.0);
      expect(performance.averageResponseTime).toBe(15000);
      expect(recommendations).toContain('speed-practice');
    });

    it('should handle impulsive pattern (fast responses, mixed accuracy)', () => {
      const userId = 'impulsive';
      const subject = 'reading';

      const impulsiveAnswers = [
        { correct: true, timeSpent: 2000 },
        { correct: false, timeSpent: 1500 },
        { correct: true, timeSpent: 1800 },
        { correct: false, timeSpent: 1200 },
        { correct: true, timeSpent: 2200 },
        { correct: false, timeSpent: 1600 }
      ];

      impulsiveAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      const recommendations = adaptiveLearning.getRecommendations(userId, subject);
      
      expect(performance.accuracy).toBe(0.5);
      expect(performance.averageResponseTime).toBeLessThan(3000);
      expect(recommendations).toContain('careful-reading');
      expect(recommendations).toContain('slow-down');
    });

    it('should handle inconsistent pattern (variable performance)', () => {
      const userId = 'inconsistent';
      const subject = 'science';

      const inconsistentAnswers = [
        { correct: true, timeSpent: 3000 },
        { correct: true, timeSpent: 4000 },
        { correct: true, timeSpent: 3500 },
        { correct: false, timeSpent: 12000 },
        { correct: false, timeSpent: 15000 },
        { correct: false, timeSpent: 10000 },
        { correct: true, timeSpent: 4500 },
        { correct: true, timeSpent: 3800 }
      ];

      inconsistentAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      const variability = adaptiveLearning.getPerformanceVariability(userId, subject);
      
      expect(performance.accuracy).toBe(0.625); // 5/8 correct
      expect(variability).toBe('high'); // High variability in response times
    });

    it('should handle learning plateau pattern', () => {
      const userId = 'plateau-user';
      const subject = 'phonics';

      // Simulate consistent but not improving performance
      const plateauAnswers = Array(20).fill({ correct: true, timeSpent: 6000 });
      // Add some incorrect answers to maintain 70% accuracy
      plateauAnswers.push(
        { correct: false, timeSpent: 8000 },
        { correct: false, timeSpent: 9000 },
        { correct: false, timeSpent: 7500 },
        { correct: false, timeSpent: 8500 },
        { correct: false, timeSpent: 9200 },
        { correct: false, timeSpent: 8800 }
      );

      plateauAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const trend = adaptiveLearning.getPerformanceTrend(userId, subject);
      const recommendations = adaptiveLearning.getRecommendations(userId, subject);
      
      expect(trend).toBe('plateau');
      expect(recommendations).toContain('variety-practice');
      expect(recommendations).toContain('new-approach');
    });

    it('should handle rapid improvement pattern', () => {
      const userId = 'improving-user';
      const subject = 'math';

      // Simulate improving performance over time
      const improvingAnswers = [
        { correct: false, timeSpent: 12000 },
        { correct: false, timeSpent: 10000 },
        { correct: true, timeSpent: 8000 },
        { correct: true, timeSpent: 7000 },
        { correct: true, timeSpent: 6000 },
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 4500 },
        { correct: true, timeSpent: 4000 }
      ];

      improvingAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      const trend = adaptiveLearning.getPerformanceTrend(userId, subject);
      const newDifficulty = adaptiveLearning.adjustDifficulty(userId, subject);
      
      expect(trend).toBe('improving');
      expect(newDifficulty).toBe('medium'); // Should increase from easy
    });
  });

  describe('Integration with Achievement System', () => {
    it('should trigger achievements based on adaptive learning milestones', () => {
      const userId = 'achiever';
      const subject = 'reading';

      // Simulate performance that should trigger achievements
      const achievementAnswers = Array(10).fill({ correct: true, timeSpent: 4000 });
      achievementAnswers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      // Check for triggered achievements
      const achievements = achievementSystem.checkAchievements(userId, {
        subject,
        streak: 10,
        accuracy: 1.0,
        averageTime: 4000
      });

      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.some(a => a.id === 'perfect-streak-10')).toBe(true);
    });

    it('should unlock advanced content based on mastery', () => {
      const userId = 'master-user';
      const subject = 'science';

      // Achieve high mastery
      adaptiveLearning.setSubjectMastery(userId, subject, 0.95);

      const unlockedContent = adaptiveLearning.getUnlockedContent(userId, subject);
      
      expect(unlockedContent).toContain('advanced-experiments');
      expect(unlockedContent).toContain('research-projects');
    });
  });

  describe('Data Persistence and Recovery', () => {
    it('should persist learning data across sessions', () => {
      const userId = 'persistent-user';
      const subject = 'math';

      // Record some performance data
      const answers = [
        { correct: true, timeSpent: 5000 },
        { correct: true, timeSpent: 4500 },
        { correct: false, timeSpent: 8000 }
      ];

      answers.forEach(answer => {
        adaptiveLearning.recordAnswer(userId, subject, answer);
      });

      // Simulate saving to localStorage
      const savedData = adaptiveLearning.exportUserData(userId);
      expect(savedData).toBeDefined();
      expect(savedData.subjects[subject]).toBeDefined();

      // Simulate loading from localStorage
      adaptiveLearning.reset();
      adaptiveLearning.importUserData(userId, savedData);

      const performance = adaptiveLearning.getPerformanceData(userId, subject);
      expect(performance.totalQuestions).toBe(3);
      expect(performance.accuracy).toBeCloseTo(0.667, 2);
    });

    it('should handle corrupted learning data gracefully', () => {
      const userId = 'corrupted-user';
      
      // Simulate corrupted data
      const corruptedData = { invalid: 'data' };
      
      expect(() => {
        adaptiveLearning.importUserData(userId, corruptedData);
      }).not.toThrow();

      // Should initialize with default values
      const performance = adaptiveLearning.getPerformanceData(userId, 'math');
      expect(performance.totalQuestions).toBe(0);
      expect(performance.accuracy).toBe(0);
    });
  });
});