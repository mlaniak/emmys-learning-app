/**
 * Tests for Adaptive Learning System
 */

import { 
  AdaptiveLearningEngine, 
  DIFFICULTY_LEVELS, 
  PERFORMANCE_THRESHOLDS 
} from '../adaptiveLearning';

describe('AdaptiveLearningEngine', () => {
  let engine;
  const userId = 'test-user-123';
  const subject = 'math';

  beforeEach(() => {
    engine = new AdaptiveLearningEngine();
  });

  describe('Performance Tracking', () => {
    test('should track question performance correctly', () => {
      const questionData = {
        id: 'q1',
        question: 'What is 2 + 2?',
        difficulty: DIFFICULTY_LEVELS.EASY
      };

      const result = {
        isCorrect: true,
        responseTime: 2000,
        hintUsed: false,
        attempts: 1
      };

      const performance = engine.trackPerformance(userId, subject, questionData, result);

      expect(performance).toBeDefined();
      expect(performance.userId).toBe(userId);
      expect(performance.subject).toBe(subject);
      expect(performance.isCorrect).toBe(true);
      expect(performance.responseTime).toBe(2000);
    });

    test('should calculate accuracy correctly', () => {
      // Add some performance data
      const questions = [
        { id: 'q1', question: 'Test 1' },
        { id: 'q2', question: 'Test 2' },
        { id: 'q3', question: 'Test 3' },
        { id: 'q4', question: 'Test 4' }
      ];

      const results = [true, true, false, true]; // 75% accuracy

      questions.forEach((q, i) => {
        engine.trackPerformance(userId, subject, q, {
          isCorrect: results[i],
          responseTime: 3000,
          hintUsed: false,
          attempts: 1
        });
      });

      const accuracy = engine.calculateAccuracy(userId, subject);
      expect(accuracy).toBe(0.75);
    });

    test('should calculate streak correctly', () => {
      const questions = [
        { id: 'q1', question: 'Test 1' },
        { id: 'q2', question: 'Test 2' },
        { id: 'q3', question: 'Test 3' },
        { id: 'q4', question: 'Test 4' }
      ];

      // Pattern: wrong, correct, correct, correct (streak of 3)
      const results = [false, true, true, true];

      questions.forEach((q, i) => {
        engine.trackPerformance(userId, subject, q, {
          isCorrect: results[i],
          responseTime: 3000,
          hintUsed: false,
          attempts: 1
        });
      });

      const streak = engine.calculateStreak(userId, subject);
      expect(streak).toBe(3);
    });
  });

  describe('Difficulty Adjustment', () => {
    test('should increase difficulty for high performance', () => {
      // Add high-performance data
      for (let i = 0; i < 10; i++) {
        engine.trackPerformance(userId, subject, 
          { id: `q${i}`, question: `Test ${i}` },
          {
            isCorrect: true,
            responseTime: 2000, // Fast response
            hintUsed: false,
            attempts: 1
          }
        );
      }

      const newDifficulty = engine.adjustDifficulty(userId, subject, DIFFICULTY_LEVELS.EASY);
      expect(newDifficulty).toBe(DIFFICULTY_LEVELS.MEDIUM);
    });

    test('should decrease difficulty for poor performance', () => {
      // Add poor performance data
      for (let i = 0; i < 10; i++) {
        engine.trackPerformance(userId, subject,
          { id: `q${i}`, question: `Test ${i}` },
          {
            isCorrect: i < 3, // Only 30% correct
            responseTime: 8000, // Slow response
            hintUsed: false,
            attempts: 1
          }
        );
      }

      const newDifficulty = engine.adjustDifficulty(userId, subject, DIFFICULTY_LEVELS.HARD);
      expect(newDifficulty).toBe(DIFFICULTY_LEVELS.MEDIUM);
    });

    test('should maintain difficulty for balanced performance', () => {
      // Add balanced performance data
      for (let i = 0; i < 10; i++) {
        engine.trackPerformance(userId, subject,
          { id: `q${i}`, question: `Test ${i}` },
          {
            isCorrect: i < 7, // 70% correct
            responseTime: 4000, // Medium response time
            hintUsed: false,
            attempts: 1
          }
        );
      }

      const newDifficulty = engine.adjustDifficulty(userId, subject, DIFFICULTY_LEVELS.MEDIUM);
      expect(newDifficulty).toBe(DIFFICULTY_LEVELS.MEDIUM);
    });
  });

  describe('Question Selection', () => {
    test('should prioritize new questions over recent ones', () => {
      const questionPool = [
        { id: 'q1', question: 'Question 1' },
        { id: 'q2', question: 'Question 2' },
        { id: 'q3', question: 'Question 3' },
        { id: 'q4', question: 'Question 4' }
      ];

      // Track some questions as recently asked
      engine.trackPerformance(userId, subject, questionPool[0], {
        isCorrect: true,
        responseTime: 3000,
        hintUsed: false,
        attempts: 1
      });

      engine.trackPerformance(userId, subject, questionPool[1], {
        isCorrect: true,
        responseTime: 3000,
        hintUsed: false,
        attempts: 1
      });

      const selectedQuestions = engine.selectQuestions(userId, subject, questionPool, 2);
      
      // Should prefer q3 and q4 (new questions) over q1 and q2 (recent)
      expect(selectedQuestions).toHaveLength(2);
      const selectedIds = selectedQuestions.map(q => q.id);
      expect(selectedIds).toContain('q3');
      expect(selectedIds).toContain('q4');
    });
  });

  describe('Learning Path Recommendations', () => {
    test('should recommend high priority for struggling subjects', () => {
      // Add poor performance for math
      for (let i = 0; i < 10; i++) {
        engine.trackPerformance(userId, 'math',
          { id: `math-q${i}`, question: `Math ${i}` },
          {
            isCorrect: i < 4, // 40% accuracy
            responseTime: 6000,
            hintUsed: false,
            attempts: 1
          }
        );
      }

      // Add excellent performance for reading (to reach expert level with high streak)
      for (let i = 0; i < 15; i++) {
        engine.trackPerformance(userId, 'reading',
          { id: `reading-q${i}`, question: `Reading ${i}` },
          {
            isCorrect: true, // 100% accuracy for expert level
            responseTime: 1500, // Fast response time
            hintUsed: false,
            attempts: 1
          }
        );
      }

      const recommendations = engine.recommendLearningPath(userId, ['math', 'reading']);
      
      expect(recommendations).toHaveLength(2);
      
      // Math should be high priority due to poor performance
      const mathRec = recommendations.find(r => r.subject === 'math');
      expect(mathRec.priority).toBe('high');
      
      // Reading should be low priority due to good performance
      const readingRec = recommendations.find(r => r.subject === 'reading');
      expect(readingRec.priority).toBe('low');
    });

    test('should recommend new subjects with high priority', () => {
      const recommendations = engine.recommendLearningPath(userId, ['science', 'history']);
      
      expect(recommendations).toHaveLength(2);
      recommendations.forEach(rec => {
        expect(rec.priority).toBe('high');
        expect(rec.reason).toContain('New subject');
      });
    });
  });

  describe('Performance Analytics', () => {
    test('should provide comprehensive analytics', () => {
      // Add varied performance data
      const performances = [
        { correct: true, time: 2000 },
        { correct: true, time: 3000 },
        { correct: false, time: 5000 },
        { correct: true, time: 2500 },
        { correct: true, time: 3500 }
      ];

      performances.forEach((perf, i) => {
        engine.trackPerformance(userId, subject,
          { id: `q${i}`, question: `Test ${i}` },
          {
            isCorrect: perf.correct,
            responseTime: perf.time,
            hintUsed: false,
            attempts: 1
          }
        );
      });

      const analytics = engine.getPerformanceAnalytics(userId, subject);
      
      expect(analytics.totalAttempts).toBe(5);
      expect(analytics.accuracy).toBe(80); // 4/5 = 80%
      expect(analytics.currentStreak).toBe(2); // Last 2 were correct
      expect(analytics.masteryLevel).toBeDefined();
      expect(analytics.recentTrend).toBeDefined();
      expect(Array.isArray(analytics.strongAreas)).toBe(true);
      expect(Array.isArray(analytics.improvementAreas)).toBe(true);
    });
  });

  describe('Data Export/Import', () => {
    test('should export and import data correctly', () => {
      // Add some data
      engine.trackPerformance(userId, subject,
        { id: 'q1', question: 'Test question' },
        {
          isCorrect: true,
          responseTime: 3000,
          hintUsed: false,
          attempts: 1
        }
      );

      // Export data
      const exportedData = engine.exportData();
      expect(exportedData).toBeDefined();
      expect(exportedData.performanceHistory).toBeDefined();
      expect(exportedData.timestamp).toBeDefined();

      // Create new engine and import data
      const newEngine = new AdaptiveLearningEngine();
      newEngine.importData(exportedData);

      // Verify data was imported
      const analytics = newEngine.getPerformanceAnalytics(userId, subject);
      expect(analytics.totalAttempts).toBe(1);
      expect(analytics.accuracy).toBe(100);
    });
  });

  describe('Utility Functions', () => {
    test('should generate consistent question IDs', () => {
      const question1 = { word: 'cat', question: 'What sound does C make?' };
      const question2 = { question: 'What is 2 + 2?' };
      const question3 = { id: 'custom-id', question: 'Custom question' };

      const id1 = engine.getQuestionId(question1);
      const id2 = engine.getQuestionId(question2);
      const id3 = engine.getQuestionId(question3);

      expect(id1).toBe('cat-What sound does C make?');
      expect(id2).toBe('What is 2 + 2?');
      expect(id3).toBe('custom-id');
    });

    test('should shuffle arrays randomly', () => {
      const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffledArray = engine.shuffleArray(originalArray);

      expect(shuffledArray).toHaveLength(originalArray.length);
      expect(shuffledArray).toEqual(expect.arrayContaining(originalArray));
      
      // Arrays should be different (very unlikely to be the same after shuffle)
      // Note: This test might occasionally fail due to randomness, but it's very unlikely
      expect(shuffledArray).not.toEqual(originalArray);
    });
  });
});