import { 
  scienceQuestions, 
  artQuestions, 
  geographyQuestions, 
  historyQuestions,
  enhancedPhonicQuestions,
  enhancedMathQuestions,
  enhancedReadingQuestions,
  enhancedSpellingWords,
  subjectAchievements
} from '../../data/educationalContent';

describe('Educational Content', () => {
  test('Science questions should have at least 20 questions', () => {
    expect(scienceQuestions.length).toBeGreaterThanOrEqual(20);
  });

  test('Art questions should have at least 20 questions', () => {
    expect(artQuestions.length).toBeGreaterThanOrEqual(20);
  });

  test('Geography questions should have at least 20 questions', () => {
    expect(geographyQuestions.length).toBeGreaterThanOrEqual(20);
  });

  test('History questions should have at least 20 questions', () => {
    expect(historyQuestions.length).toBeGreaterThanOrEqual(20);
  });

  test('Enhanced phonics questions should have easy, medium, and hard levels', () => {
    expect(enhancedPhonicQuestions).toHaveProperty('easy');
    expect(enhancedPhonicQuestions).toHaveProperty('medium');
    expect(enhancedPhonicQuestions).toHaveProperty('hard');
    expect(enhancedPhonicQuestions.easy.length).toBeGreaterThan(0);
  });

  test('Enhanced math questions should have easy, medium, and hard levels', () => {
    expect(enhancedMathQuestions).toHaveProperty('easy');
    expect(enhancedMathQuestions).toHaveProperty('medium');
    expect(enhancedMathQuestions).toHaveProperty('hard');
    expect(enhancedMathQuestions.easy.length).toBeGreaterThan(0);
  });

  test('Enhanced reading questions should be an array with questions', () => {
    expect(Array.isArray(enhancedReadingQuestions)).toBe(true);
    expect(enhancedReadingQuestions.length).toBeGreaterThan(0);
  });

  test('Enhanced spelling words should be an array with words', () => {
    expect(Array.isArray(enhancedSpellingWords)).toBe(true);
    expect(enhancedSpellingWords.length).toBeGreaterThan(0);
  });

  test('Subject achievements should include new subjects', () => {
    expect(subjectAchievements).toHaveProperty('science');
    expect(subjectAchievements).toHaveProperty('art');
    expect(subjectAchievements).toHaveProperty('geography');
    expect(subjectAchievements).toHaveProperty('history');
  });

  test('All questions should have required properties', () => {
    const allQuestions = [
      ...scienceQuestions,
      ...artQuestions,
      ...geographyQuestions,
      ...historyQuestions
    ];

    allQuestions.forEach(question => {
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('options');
      expect(question).toHaveProperty('correct');
      expect(question).toHaveProperty('explanation');
    });
  });

  test('Question types should include multiple choice by default', () => {
    const sampleQuestion = scienceQuestions[0];
    expect(sampleQuestion.type || 'multiple-choice').toBe('multiple-choice');
  });
});