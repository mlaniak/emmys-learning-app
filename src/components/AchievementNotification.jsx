/**
 * Achievement Notification Component
 * 
 * Displays animated achievement notifications when students
 * unlock new badges in Emmy's Learning Adventure.
 */

import React, { useEffect, useState } from 'react';
import { ACHIEVEMENT_RARITIES } from '../utils/achievementSystem';

const AchievementNotification = ({ 
  achievement, 
  visible = false, 
  onClose = () => {},
  autoClose = true,
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (visible && achievement) {
      setIsVisible(true);
      setIsAnimating(true);
      generateSparkles();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, achievement, autoClose, duration]);

  const generateSparkles = () => {
    const sparkleCount = 12;
    const newSparkles = Array.from({ length: sparkleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2
    }));
    setSparkles(newSparkles);
  };

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

  const getRarityColors = (rarity) => {
    const colors = {
      [ACHIEVEMENT_RARITIES.COMMON]: {
        gradient: 'from-blue-500 to-blue-600',
        glow: 'shadow-blue-500/50',
        border: 'border-blue-400'
      },
      [ACHIEVEMENT_RARITIES.RARE]: {
        gradient: 'from-purple-500 to-purple-600',
        glow: 'shadow-purple-500/50',
        border: 'border-purple-400'
      },
      [ACHIEVEMENT_RARITIES.EPIC]: {
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-500/50',
        border: 'border-orange-400'
      },
      [ACHIEVEMENT_RARITIES.LEGENDARY]: {
        gradient: 'from-yellow-400 to-yellow-500',
        glow: 'shadow-yellow-500/50',
        border: 'border-yellow-400'
      }
    };
    return colors[rarity] || colors[ACHIEVEMENT_RARITIES.COMMON];
  };

  const rarityColors = getRarityColors(achievement.rarity);

  const getRarityLabel = (rarity) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-30' : 'bg-opacity-0'
        }`}
      />
      
      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute text-yellow-300 star-twinkle pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            fontSize: '16px',
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`
          }}
        >
          ✨
        </div>
      ))}
      
      {/* Achievement Badge */}
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl ${rarityColors.glow} p-8 mx-4 max-w-md w-full pointer-events-auto transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100 zoom-in' : 'scale-75 opacity-0'
        } ${rarityColors.border} border-2`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            🎉 Achievement Unlocked! 🎉
          </div>
          <div className={`w-20 h-2 bg-gradient-to-r ${rarityColors.gradient} rounded-full mx-auto`}></div>
        </div>

        {/* Achievement Content */}
        <div className="text-center">
          {/* Achievement Icon with Rarity Glow */}
          <div 
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${rarityColors.gradient} mb-6 trophy-bounce shadow-lg ${rarityColors.glow}`}
          >
            <span className="text-4xl text-white drop-shadow-lg">
              {achievement.icon || '🏆'}
            </span>
          </div>

          {/* Achievement Name */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {achievement.name}
          </h3>

          {/* Achievement Description */}
          <p className="text-gray-600 text-base mb-4 leading-relaxed">
            {achievement.description}
          </p>

          {/* Celebration Message */}
          {achievement.celebrationMessage && (
            <p className="text-purple-600 font-semibold text-sm mb-4 italic">
              "{achievement.celebrationMessage}"
            </p>
          )}

          {/* Achievement Details */}
          <div className="flex justify-center items-center gap-4 mb-4">
            {/* Rarity Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${rarityColors.gradient}`}>
              {getRarityLabel(achievement.rarity)}
            </div>
            
            {/* Points */}
            <div className="flex items-center gap-1 text-yellow-600 font-semibold">
              <span className="text-lg">⭐</span>
              <span>{achievement.points} pts</span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="inline-block px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100">
            {achievement.category?.charAt(0).toUpperCase() + achievement.category?.slice(1)} Achievement
          </div>
        </div>

        {/* Close Button */}
        {!autoClose && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-500 hover:text-gray-700"
            aria-label="Close achievement"
          >
            <span className="text-xl">×</span>
          </button>
        )}

        {/* Progress Bar (if auto-closing) */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 rounded-b-3xl overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${rarityColors.gradient} transition-all duration-100 ease-linear`}
              style={{
                width: isAnimating ? '0%' : '100%',
                transition: `width ${duration}ms linear`
              }}
            />
          </div>
        )}

        {/* Floating Elements */}
        <div className="absolute -top-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>
          🌟
        </div>
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>
          🎊
        </div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>
          🎈
        </div>
        <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '2s' }}>
          🏆
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;