import React, { useState, useEffect } from 'react';
import { SwipeableCard } from './SwipeNavigation';
import { TouchButton } from './ResponsiveLayout';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

const MobileOptimizedQuestion = ({
  question,
  options,
  correct,
  onAnswer,
  onNext,
  onPrevious,
  questionNumber,
  totalQuestions,
  showExplanation = false,
  explanation = '',
  emoji = '🤔',
  playSound,
  triggerHaptic,
  className = '',
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {},
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities(),
    });
  }, []);

  const handleAnswerSelect = (answer) => {
    if (showResult) return; // Prevent multiple selections

    setSelectedAnswer(answer);
    setShowResult(true);

    // Haptic feedback
    if (deviceInfo.touchCapabilities.supportsHaptics) {
      navigator.vibrate(answer === correct ? [50, 50, 100] : [100]);
    }

    // Audio feedback
    if (playSound) {
      playSound(answer === correct ? 'correct' : 'incorrect');
    }

    // Call parent handler
    if (onAnswer) {
      onAnswer(answer, correct, question, explanation);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
    // Reset for next question
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
    // Reset for previous question
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const getAnswerButtonClass = (option) => {
    const baseClass = 'w-full text-left transition-all duration-300 transform active:scale-95';
    
    if (!showResult) {
      return `${baseClass} bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800`;
    }

    if (option === correct) {
      return `${baseClass} bg-green-100 border-2 border-green-400 text-green-800`;
    }

    if (option === selectedAnswer && option !== correct) {
      return `${baseClass} bg-red-100 border-2 border-red-400 text-red-800`;
    }

    return `${baseClass} bg-gray-100 border-2 border-gray-300 text-gray-600 opacity-60`;
  };

  const getResultMessage = () => {
    if (!showResult) return null;

    const isCorrect = selectedAnswer === correct;
    return (
      <div className={`mt-4 p-4 rounded-lg text-center ${
        isCorrect 
          ? 'bg-green-100 text-green-800 border border-green-300' 
          : 'bg-red-100 text-red-800 border border-red-300'
      }`}>
        <div className="text-2xl mb-2">
          {isCorrect ? '🎉' : '💪'}
        </div>
        <div className="font-semibold mb-2">
          {isCorrect ? 'Excellent!' : 'Keep trying!'}
        </div>
        {showExplanation && explanation && (
          <div className="text-sm opacity-90">
            {explanation}
          </div>
        )}
      </div>
    );
  };

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  return (
    <SwipeableCard
      onSwipeLeft={onNext}
      onSwipeRight={onPrevious}
      leftAction="Previous"
      rightAction="Next"
      className={`max-w-2xl mx-auto card-mobile ${className}`}
    >
      {/* Progress indicator */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-mobile-sm font-medium text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-2xl">{emoji}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
          <div 
            className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-mobile-lg font-bold text-center text-gray-800">
          {question}
        </h2>
      </div>

      {/* Answer options */}
      <div className="space-mobile-normal mb-6">
        {options.map((option, index) => (
          <TouchButton
            key={index}
            onClick={() => handleAnswerSelect(option)}
            disabled={showResult}
            className={getAnswerButtonClass(option)}
            size="large"
          >
            <div className="flex items-center justify-between">
              <span className="text-mobile-base">{option}</span>
              {showResult && option === correct && (
                <span className="text-green-600 text-xl">✓</span>
              )}
              {showResult && option === selectedAnswer && option !== correct && (
                <span className="text-red-600 text-xl">✗</span>
              )}
            </div>
          </TouchButton>
        ))}
      </div>

      {/* Result message */}
      {getResultMessage()}

      {/* Navigation buttons */}
      {showResult && (
        <div className="flex gap-3 mt-6 flex-col xs:flex-row">
          {onPrevious && (
            <TouchButton
              onClick={handlePrevious}
              variant="secondary"
              className="flex-1"
              size="large"
            >
              ← Previous
            </TouchButton>
          )}
          {onNext && (
            <TouchButton
              onClick={handleNext}
              variant="primary"
              className="flex-1"
              size="large"
            >
              Next →
            </TouchButton>
          )}
        </div>
      )}

      {/* Mobile-only swipe hint */}
      {isMobile && !showResult && (
        <div className="text-center text-mobile-xs text-gray-400 mt-4">
          Swipe left/right to navigate questions
        </div>
      )}
    </SwipeableCard>
  );
};

// Mobile-optimized multiple choice component
export const MobileMultipleChoice = ({
  question,
  options,
  correct,
  onAnswer,
  emoji = '🤔',
  explanation = '',
  className = '',
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ type: 'desktop' });

  useEffect(() => {
    setDeviceInfo({ type: getDeviceType() });
  }, []);

  const handleSelect = (answer) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(answer === correct ? [50, 50, 100] : [100]);
    }

    if (onAnswer) {
      onAnswer(answer, correct, explanation);
    }
  };

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  return (
    <div className={`card-mobile max-w-lg mx-auto ${className}`}>
      {/* Question header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className={`font-bold text-gray-800 ${
          isMobile ? 'text-base sm:text-lg' : 'text-lg md:text-xl'
        }`}>
          {question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          let buttonClass = 'w-full text-left btn-touch';
          
          if (!showResult) {
            buttonClass += ' bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800';
          } else if (option === correct) {
            buttonClass += ' bg-green-100 border-2 border-green-400 text-green-800';
          } else if (option === selectedAnswer) {
            buttonClass += ' bg-red-100 border-2 border-red-400 text-red-800';
          } else {
            buttonClass += ' bg-gray-100 border-2 border-gray-300 text-gray-600 opacity-60';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && option === correct && (
                  <span className="text-green-600 text-xl">✓</span>
                )}
                {showResult && option === selectedAnswer && option !== correct && (
                  <span className="text-red-600 text-xl">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg text-center ${
          selectedAnswer === correct
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          <div className="text-2xl mb-2">
            {selectedAnswer === correct ? '🎉' : '💪'}
          </div>
          <div className="font-semibold mb-2">
            {selectedAnswer === correct ? 'Perfect!' : 'Good try!'}
          </div>
          {explanation && (
            <div className="text-sm opacity-90">
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedQuestion;