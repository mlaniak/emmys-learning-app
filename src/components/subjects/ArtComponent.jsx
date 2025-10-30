// Art Component - Lazy Loaded
import React, { useState, useEffect } from 'react';
import { ProgressiveLoader } from '../../utils/lazyLoading';

const ArtComponent = ({ onQuestionComplete, gameSettings = {} }) => {
  const [questions, setQuestions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  // Progressive loader for content
  const progressiveLoader = new ProgressiveLoader({
    chunkSize: 10,
    loadDelay: 50
  });

  useEffect(() => {
    loadArtContent();
  }, []);

  const loadArtContent = async () => {
    try {
      setLoading(true);
      
      // Dynamically import art content
      const { artQuestions, artAchievements } = await import('../../data/subjects/artContent');
      
      // Load questions progressively
      const loadedQuestions = await progressiveLoader.loadInChunks(
        artQuestions,
        (chunk) => Promise.resolve(chunk)
      );
      
      setQuestions(loadedQuestions);
      setAchievements(artAchievements);
      
      // Track loading performance
      if (window.emmyPerformance?.monitor) {
        window.emmyPerformance.monitor.recordCustomMetric('art_content_loaded', performance.now());
      }
      
    } catch (error) {
      console.error('Failed to load art content:', error);
      // Fallback to empty arrays
      setQuestions([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer) return; // Prevent multiple selections
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentQuestion]?.correct;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(score + 10);
    }
    
    setShowExplanation(true);
    
    // Auto-advance after showing explanation
    setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  };

  const handleNextQuestion = () => {
    if (onQuestionComplete) {
      onQuestionComplete({
        questionIndex: currentQuestion,
        isCorrect,
        score: isCorrect ? 10 : 0,
        subject: 'art'
      });
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsCorrect(false);
    } else {
      // Game complete
      if (onQuestionComplete) {
        onQuestionComplete({
          gameComplete: true,
          finalScore: score + (isCorrect ? 10 : 0),
          subject: 'art'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎨</div>
          <div className="text-2xl mb-4">Loading Art Studio...</div>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl mb-4">Failed to load Art content</div>
          <button 
            onClick={loadArtContent}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  if (!question) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{question.image || '🎨'}</div>
          <h1 className="text-4xl font-bold text-white mb-2">Art Studio</h1>
          <div className="text-white text-xl">
            Question {currentQuestion + 1} of {questions.length} | Score: {score}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {question.question}
          </h2>

          {/* Answer Options */}
          <div className="grid gap-4 mb-6">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== ''}
                className={`p-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  selectedAnswer === ''
                    ? 'bg-pink-100 hover:bg-pink-200 text-pink-800 hover:scale-105'
                    : selectedAnswer === option
                    ? isCorrect
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-red-500 text-white scale-105'
                    : option === question.correct
                    ? 'bg-green-200 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">
                  {isCorrect ? '✅' : '❌'}
                </span>
                <span className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right!'}
                </span>
              </div>
              <p className="text-gray-700">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-white bg-opacity-20 rounded-full h-4 mb-4">
          <div 
            className="bg-white rounded-full h-4 transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ArtComponent;