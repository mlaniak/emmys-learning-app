/**
 * Achievement Badge Component
 * 
 * Displays animated achievement notifications when students
 * unlock new badges in Emmy's Learning Adventure.
 */

import React, { useEffect, useState } from 'react';

const AchievementBadge = ({ 
  achievement, 
  visible = false, 
  onClose = () => {},
  autoClose = true,
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible && achievement) {
      setIsVisible(true);
      setIsAnimating(true);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, achievement, autoClose, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible || !achievement) {
    return null;
  }

  const getBadgeColor = (category) => {
    const colors = {
      progress: 'from-blue-500 to-blue-600',
      streak: 'from-orange-500 to-red-500',
      mastery: 'from-purple-500 to-purple-600',
      exploration: 'from-green-500 to-green-600',
      default: 'from-yellow-500 to-yellow-600'
    };
    return colors[category] || colors.default;
  };

  const getSparkles = () => {
    return Array.from({ length: 6 }, (_, i) => (
      <div
        key={i}
        className="absolute text-yellow-300 star-twinkle"
        style={{
          fontSize: '12px',
          left: `${20 + (i * 15)}%`,
          top: `${10 + (i % 2) * 20}%`,
          animationDelay: `${i * 0.2}s`
        }}
      >
        ✨
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-20' : 'bg-opacity-0'
        }`}
      />
      
      {/* Achievement Badge */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full pointer-events-auto transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100 zoom-in' : 'scale-75 opacity-0'
        }`}
      >
        {/* Sparkles */}
        {getSparkles()}
        
        {/* Badge Header */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-gray-800 mb-1">
            🎉 Achievement Unlocked! 🎉
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"></div>
        </div>

        {/* Achievement Content */}
        <div className="text-center">
          {/* Achievement Icon */}
          <div 
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getBadgeColor(achievement.category)} mb-4 trophy-bounce`}
          >
            <span className="text-3xl text-white">
              {achievement.icon || '🏆'}
            </span>
          </div>

          {/* Achievement Name */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {achievement.name}
          </h3>

          {/* Achievement Description */}
          <p className="text-gray-600 text-sm mb-4">
            {achievement.description}
          </p>

          {/* Achievement Category Badge */}
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getBadgeColor(achievement.category)}`}>
            {achievement.category?.charAt(0).toUpperCase() + achievement.category?.slice(1) || 'Achievement'}
          </div>
        </div>

        {/* Close Button */}
        {!autoClose && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            aria-label="Close achievement"
          >
            <span className="text-gray-500 text-lg">×</span>
          </button>
        )}

        {/* Progress Bar (if auto-closing) */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-100 ease-linear"
              style={{
                width: isAnimating ? '0%' : '100%',
                transition: `width ${duration}ms linear`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;