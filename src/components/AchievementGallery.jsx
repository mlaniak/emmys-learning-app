/**
 * Achievement Gallery Component
 * 
 * Displays all achievements with earned badges and progress tracking
 */

import React, { useState, useMemo } from 'react';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_RARITIES, achievementTracker } from '../utils/achievementSystem';

const AchievementGallery = ({ progress, onAchievementClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [sortBy, setSortBy] = useState('category'); // category, rarity, earned, points

  const achievementStats = useMemo(() => {
    return achievementTracker.getAchievementStats(progress);
  }, [progress]);

  const filteredAchievements = useMemo(() => {
    let filtered = Object.values(ACHIEVEMENTS);

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity);
    }

    // Sort achievements
    filtered.sort((a, b) => {
      const aEarned = (progress.achievements || []).includes(a.id);
      const bEarned = (progress.achievements || []).includes(b.id);

      switch (sortBy) {
        case 'earned':
          if (aEarned !== bEarned) return bEarned - aEarned; // Earned first
          return a.name.localeCompare(b.name);
        case 'points':
          return b.points - a.points; // Highest points first
        case 'rarity':
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
          const aRarityValue = rarityOrder[a.rarity] || 0;
          const bRarityValue = rarityOrder[b.rarity] || 0;
          if (aRarityValue !== bRarityValue) return bRarityValue - aRarityValue;
          return a.name.localeCompare(b.name);
        case 'category':
        default:
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [selectedCategory, selectedRarity, sortBy, progress.achievements]);

  const getRarityColors = (rarity) => {
    const colors = {
      [ACHIEVEMENT_RARITIES.COMMON]: {
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        gradient: 'from-blue-500 to-blue-600'
      },
      [ACHIEVEMENT_RARITIES.RARE]: {
        bg: 'bg-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-800',
        gradient: 'from-purple-500 to-purple-600'
      },
      [ACHIEVEMENT_RARITIES.EPIC]: {
        bg: 'bg-orange-100',
        border: 'border-orange-300',
        text: 'text-orange-800',
        gradient: 'from-orange-500 to-red-500'
      },
      [ACHIEVEMENT_RARITIES.LEGENDARY]: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        gradient: 'from-yellow-400 to-yellow-500'
      }
    };
    return colors[rarity] || colors[ACHIEVEMENT_RARITIES.COMMON];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      [ACHIEVEMENT_CATEGORIES.PROGRESS]: '📈',
      [ACHIEVEMENT_CATEGORIES.STREAK]: '🔥',
      [ACHIEVEMENT_CATEGORIES.MASTERY]: '🎓',
      [ACHIEVEMENT_CATEGORIES.EXPLORATION]: '🗺️',
      [ACHIEVEMENT_CATEGORIES.SPECIAL]: '⭐'
    };
    return icons[category] || '🏆';
  };

  const AchievementCard = ({ achievement }) => {
    const isEarned = (progress.achievements || []).includes(achievement.id);
    const progressPercent = achievementTracker.getAchievementProgress(progress, achievement.id);
    const rarityColors = getRarityColors(achievement.rarity);

    return (
      <div
        className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg ${
          isEarned 
            ? `${rarityColors.bg} ${rarityColors.border} shadow-md` 
            : 'bg-gray-50 border-gray-200 opacity-75'
        }`}
        onClick={() => onAchievementClick?.(achievement)}
      >
        {/* Earned Badge */}
        {isEarned && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            ✓
          </div>
        )}

        {/* Achievement Icon */}
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl ${
          isEarned 
            ? `bg-gradient-to-br ${rarityColors.gradient} shadow-lg` 
            : 'bg-gray-200'
        }`}>
          <span className={isEarned ? 'text-white' : 'text-gray-400'}>
            {achievement.icon}
          </span>
        </div>

        {/* Achievement Name */}
        <h3 className={`text-lg font-bold text-center mb-2 ${
          isEarned ? rarityColors.text : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>

        {/* Achievement Description */}
        <p className={`text-sm text-center mb-3 ${
          isEarned ? 'text-gray-700' : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>

        {/* Progress Bar (for partially completed achievements) */}
        {!isEarned && progressPercent > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${rarityColors.gradient} transition-all duration-300`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">
              {Math.round(progressPercent)}% Complete
            </p>
          </div>
        )}

        {/* Achievement Details */}
        <div className="flex justify-between items-center text-xs">
          <div className={`px-2 py-1 rounded-full ${
            isEarned ? rarityColors.bg : 'bg-gray-100'
          }`}>
            <span className={isEarned ? rarityColors.text : 'text-gray-500'}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
          </div>
          <div className={`flex items-center gap-1 ${
            isEarned ? 'text-yellow-600' : 'text-gray-400'
          }`}>
            <span>⭐</span>
            <span>{achievement.points}</span>
          </div>
        </div>

        {/* Category Icon */}
        <div className="absolute top-2 left-2 text-lg">
          {getCategoryIcon(achievement.category)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Achievement Gallery</h1>
        <p className="text-gray-600">
          {achievementStats.earned} of {achievementStats.total} achievements unlocked
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-3 max-w-md mx-auto">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${achievementStats.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {achievementStats.percentage}% Complete • {achievementStats.points} Total Points
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(achievementStats.byRarity).map(([rarity, stats]) => {
          const rarityColors = getRarityColors(rarity);
          return (
            <div key={rarity} className={`p-4 rounded-lg ${rarityColors.bg} ${rarityColors.border} border`}>
              <div className={`text-lg font-bold ${rarityColors.text}`}>
                {stats.earned}/{stats.total}
              </div>
              <div className="text-sm text-gray-600">
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </div>
              <div className="text-xs text-gray-500">
                {stats.percentage}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Category Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {Object.values(ACHIEVEMENT_CATEGORIES).map(category => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Rarity</label>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Rarities</option>
            {Object.values(ACHIEVEMENT_RARITIES).map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="category">Category</option>
            <option value="earned">Earned First</option>
            <option value="rarity">Rarity</option>
            <option value="points">Points</option>
          </select>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No achievements found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more achievements.</p>
        </div>
      )}
    </div>
  );
};

export default AchievementGallery;