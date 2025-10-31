/**
 * Enhanced Feedback Overlay Component
 * 
 * Provides rich visual feedback for correct/incorrect answers
 * with animations, sounds, and celebratory effects.
 */

import React, { useEffect, useState } from 'react';
import ConfettiEffect from './ConfettiEffect';

const FeedbackOverlay = ({ 
  feedback, 
  visible = false, 
  onClose = () => {},
  showExplanation = false,
  explanation = '',
  correctAnswer = '',
  score = 0,
  isComplete = false
}) => {
  const [animationPhase, setAnimationPhase] = useState('enter');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible && feedback) {
      setAnimationPhase('enter');
      
      // Trigger confetti for correct answers or completion
      if (feedback === 'correct' || isComplete) {
        setTimeout(() => {
          setShowConfetti(true);
        }, 200);
      }

      // Auto-close after delay
      const timer = setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setShowConfetti(false);
          onClose();
        }, 300);
      }, isComplete ? 3000 : 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, feedback, isComplete, onClose]);

  // Allow closing with Escape key when visible
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setAnimationPhase('exit');
        setTimeout(() => {
          setShowConfetti(false);
          onClose();
        }, 300);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  if (!visible || !feedback) {
    return null;
  }

  const isCorrect = feedback === 'correct';
  const isIncorrect = feedback === 'incorrect';

  const getFeedbackConfig = () => {
    if (isComplete) {
      // Lightweight completion state to avoid branching on undefined props
      return {
        emoji: '🎉',
        title: 'Great Job!',
        message: 'You finished this set!',
        bgColor: 'from-green-400 via-green-500 to-green-600',
        textColor: 'text-white',
        animation: 'correct-bounce'
      };
    } else if (isCorrect) {
      return {
        emoji: '🎉',
        title: 'Correct!',
        message: 'Amazing work!',
        bgColor: 'from-green-400 via-green-500 to-green-600',
        textColor: 'text-white',
        animation: 'correct-bounce'
      };
    } else if (isIncorrect) {
      return {
        emoji: '🤔',
        title: 'Not quite!',
        message: 'Try again!',
        bgColor: 'from-orange-400 via-orange-500 to-orange-600',
        textColor: 'text-white',
        animation: 'incorrect-shake'
      };
    }
    
    return {
      emoji: '🎯',
      title: 'Keep Going!',
      message: 'You\'re learning!',
      bgColor: 'from-purple-400 via-purple-500 to-purple-600',
      textColor: 'text-white',
      animation: 'gentle-bounce'
    };
  };

  const config = getFeedbackConfig();
  const autoCloseMs = isComplete ? 3000 : (isCorrect ? 1200 : 1600);

  const getEncouragingMessages = () => {
    if (isCorrect) {
      const messages = [
        'Fantastic!', 'Brilliant!', 'Excellent!', 'Outstanding!', 
        'Superb!', 'Wonderful!', 'Perfect!', 'Amazing!'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (isIncorrect) {
      const messages = [
        'Almost there!', 'So close!', 'Try once more!', 'You can do it!',
        'Keep trying!', 'Don\'t give up!', 'You\'re learning!', 'Great effort!'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    return config.message;
  };

  return (
    <>
      {/* Confetti Effect */}
      <ConfettiEffect 
        active={showConfetti}
        particleCount={isComplete ? 100 : 24}
        duration={isComplete ? 3000 : autoCloseMs}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Feedback Overlay */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black/40 backdrop-blur-sm ${
          animationPhase === 'enter' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setAnimationPhase('exit');
          setTimeout(() => {
            setShowConfetti(false);
            onClose();
          }, 300);
        }}
        role="dialog"
        aria-live="polite"
        aria-modal="true"
      >
        {/* Foreground Card */}
        <div 
          className={`relative w-[92%] max-w-xl text-center p-6 sm:p-8 rounded-2xl shadow-2xl ring-1 ring-white/20 bg-gradient-to-br ${config.bgColor} ${config.animation}`}
          style={{
            backgroundSize: '200% 200%',
            animation: `${animationPhase === 'enter' ? 'gradient-shift 2s ease-in-out infinite' : 'none'}, ${config.animation ? '' : ''}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            aria-label="Close"
            className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/25 hover:bg-white/35 active:bg-white/40 transition text-white text-2xl leading-none flex items-center justify-center"
            onClick={() => {
              setAnimationPhase('exit');
              setTimeout(() => {
                setShowConfetti(false);
                onClose();
              }, 300);
            }}
          >
            ×
          </button>
          {/* Main Emoji */}
          <div className="text-8xl md:text-9xl mb-4 animate-bounce">
            {config.emoji}
          </div>

          {/* Title */}
          <h2 className={`text-4xl md:text-6xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h2>

          {/* Encouraging Message */}
          <p className={`text-xl md:text-3xl ${config.textColor} mb-4 opacity-90`}>
            {getEncouragingMessages()}
          </p>

          {/* Score Display for Completion */}
          {isComplete && (
            <div className={`text-2xl md:text-3xl ${config.textColor} mb-4 font-semibold`}>
              Score: {Math.round(score)}%
            </div>
          )}

          {/* Explanation Section */}
          {showExplanation && (explanation || correctAnswer) && (
            <div className="mt-6 bg-white bg-opacity-20 rounded-2xl p-4 backdrop-blur-sm">
              {correctAnswer && (
                <div className={`text-lg md:text-xl ${config.textColor} mb-2 font-semibold`}>
                  Correct Answer: {correctAnswer}
                </div>
              )}
              {explanation && (
                <div className={`text-base md:text-lg ${config.textColor} opacity-90`}>
                  {explanation}
                </div>
              )}
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-2xl opacity-70 star-twinkle">⭐</div>
          <div className="absolute top-8 right-6 text-xl opacity-70 star-twinkle" style={{ animationDelay: '0.5s' }}>✨</div>
          <div className="absolute bottom-6 left-8 text-2xl opacity-70 star-twinkle" style={{ animationDelay: '1s' }}>🌟</div>
          <div className="absolute bottom-4 right-4 text-xl opacity-70 star-twinkle" style={{ animationDelay: '1.5s' }}>💫</div>
        </div>
      </div>

      {/* Additional CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
};

export default FeedbackOverlay;