/**
 * Example Integration of Adaptive Learning System
 * 
 * This shows how to integrate the adaptive learning system with the existing app
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import ProgressTracker from '../components/ProgressTracker';
import AdaptiveDifficultyIndicator from '../components/AdaptiveDifficultyIndicator';
import LearningPathRecommendations from '../components/LearningPathRecommendations';
import { DIFFICULTY_LEVELS } from '../utils/adaptiveLearning';

const AdaptiveLearningExample = () => {
  const { user } = useUser();
  const {
    trackQuestionAttempt,
    startQuestion,
    startSession,
    endSession,
    getCurrentDifficulty,
    selectQuestions,
    getEncouragementMessage,
    isInitialized
  } = useAdaptiveLearning();

  const [currentSubject, setCurrentSubject] = useState('math');
  const [currentDifficulty, setCurrentDifficulty] = useState(DIFFICULTY_LEVELS.MEDIUM);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [sessionResults, setSessionResults] = useState({
    questionsAttempted: 0,
    correctAnswers: 0,
    totalScore: 0
  });
  const [showResults, setShowResults] = useState(false);

  // Sample question pool
  const questionPools = {
    math: [
      { id: 'math-1', question: 'What is 2 + 3?', options: ['4', '5', '6'], correct: '5' },
      { id: 'math-2', question: 'What is 7 - 4?', options: ['2', '3', '4'], correct: '3' },
      { id: 'math-3', question: 'What is 3 × 2?', options: ['5', '6', '7'], correct: '6' },
      { id: 'math-4', question: 'What is 8 ÷ 2?', options: ['3', '4', '5'], correct: '4' },
      { id: 'math-5', question: 'What is 5 + 7?', options: ['11', '12', '13'], correct: '12' }
    ],
    phonics: [
      { id: 'phonics-1', question: 'What sound does "B" make?', options: ['buh', 'bee', 'bay'], correct: 'buh' },
      { id: 'phonics-2', question: 'What sound does "C" make?', options: ['see', 'kuh', 'kay'], correct: 'kuh' },
      { id: 'phonics-3', question: 'What sound does "D" make?', options: ['dee', 'duh', 'day'], correct: 'duh' }
    ]
  };

  // Initialize questions when subject or difficulty changes
  useEffect(() => {
    if (isInitialized && user && questionPools[currentSubject]) {
      const adjustedDifficulty = getCurrentDifficulty(currentSubject, currentDifficulty);
      if (adjustedDifficulty !== currentDifficulty) {
        setCurrentDifficulty(adjustedDifficulty);
      }

      const selectedQuestions = selectQuestions(
        currentSubject,
        questionPools[currentSubject],
        5
      );
      
      setQuestions(selectedQuestions);
      setCurrentQuestion(0);
      startSession(currentSubject);
    }
  }, [currentSubject, isInitialized, user]);

  const handleAnswer = (selectedAnswer) => {
    if (!questions[currentQuestion]) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correct;
    
    // Track the question attempt
    const trackingResult = trackQuestionAttempt(
      currentSubject,
      question,
      {
        isCorrect,
        responseTime: Date.now() - questionStartTime,
        userAnswer: selectedAnswer,
        correctAnswer: question.correct
      }
    );

    // Update session results
    const newResults = {
      questionsAttempted: sessionResults.questionsAttempted + 1,
      correctAnswers: sessionResults.correctAnswers + (isCorrect ? 1 : 0),
      totalScore: sessionResults.totalScore + (isCorrect ? 10 : 0)
    };
    setSessionResults(newResults);

    // Show encouragement message
    if (trackingResult) {
      alert(trackingResult.encouragementMessage);
    }

    // Move to next question or show results
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      startQuestion();
    } else {
      // End session
      endSession(currentSubject, newResults);
      setShowResults(true);
    }
  };

  const resetSession = () => {
    setCurrentQuestion(0);
    setSessionResults({
      questionsAttempted: 0,
      correctAnswers: 0,
      totalScore: 0
    });
    setShowResults(false);
    
    // Re-select questions with updated adaptive data
    if (questionPools[currentSubject]) {
      const selectedQuestions = selectQuestions(
        currentSubject,
        questionPools[currentSubject],
        5
      );
      setQuestions(selectedQuestions);
      startSession(currentSubject);
    }
  };

  const handleSubjectChange = (newSubject) => {
    setCurrentSubject(newSubject);
    resetSession();
  };

  const handleDifficultyChange = (newDifficulty) => {
    setCurrentDifficulty(newDifficulty);
    resetSession();
  };

  // Track question start time
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  useEffect(() => {
    setQuestionStartTime(Date.now());
    startQuestion();
  }, [currentQuestion]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing adaptive learning system...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Session Complete! 🎉</h1>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{sessionResults.questionsAttempted}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{sessionResults.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{sessionResults.totalScore}</div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
            </div>
            <div className="space-x-4">
              <button
                onClick={resetSession}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Practice More
              </button>
              <button
                onClick={() => setShowResults(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Progress
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ProgressTracker subject={currentSubject} />
            <LearningPathRecommendations 
              onSubjectSelect={handleSubjectChange}
              maxRecommendations={3}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">
              {currentSubject} Practice
            </h1>
            <div className="flex items-center space-x-4">
              <select
                value={currentSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="px-3 py-1 border rounded-lg"
              >
                <option value="math">Math</option>
                <option value="phonics">Phonics</option>
              </select>
            </div>
          </div>

          <AdaptiveDifficultyIndicator
            subject={currentSubject}
            currentDifficulty={currentDifficulty}
            onDifficultyChange={handleDifficultyChange}
            compact={true}
          />
        </div>

        {/* Question */}
        {currentQ && (
          <div className="bg-white rounded-xl p-8 shadow-lg mb-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQ.question}
              </h2>
            </div>

            <div className="grid gap-3 max-w-md mx-auto">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              Score: {sessionResults.totalScore} points | 
              Correct: {sessionResults.correctAnswers}/{sessionResults.questionsAttempted}
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressTracker subject={currentSubject} compact={true} />
          <LearningPathRecommendations 
            onSubjectSelect={handleSubjectChange}
            maxRecommendations={2}
          />
        </div>
      </div>
    </div>
  );
};

export default AdaptiveLearningExample;