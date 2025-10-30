/**
 * Achievement Manager Component
 * 
 * Central component that manages achievement notifications and integrates
 * with the learning app to track progress and unlock achievements
 */

import React, { useEffect } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import AchievementNotification from './AchievementNotification';
import { useAudio } from '../hooks/useAudio';

const AchievementManager = ({ 
  children, 
  progress, 
  onProgressUpdate,
  className = '' 
}) => {
  const {
    currentNotification,
    isShowingNotification,
    closeNotification,
    trackEvent,
    updateProgress
  } = useAchievements(progress);

  const { playAchievement, playCelebration, triggerHaptic } = useAudio();

  // Sync progress updates
  useEffect(() => {
    if (progress && onProgressUpdate) {
      const updatedProgress = updateProgress(progress);
      if (updatedProgress !== progress) {
        onProgressUpdate(updatedProgress);
      }
    }
  }, [progress, onProgressUpdate, updateProgress]);

  // Play achievement sound and haptic feedback when notification shows
  useEffect(() => {
    if (isShowingNotification && currentNotification) {
      // Play achievement sound
      playAchievement();
      
      // Trigger haptic feedback
      triggerHaptic('success');
      
      // Play celebration sound for legendary achievements
      if (currentNotification.rarity === 'legendary') {
        setTimeout(() => {
          playCelebration();
        }, 500);
      }
    }
  }, [isShowingNotification, currentNotification, playAchievement, playCelebration, triggerHaptic]);

  // Provide achievement tracking functions to children
  const achievementContext = {
    trackEvent,
    updateProgress,
    isShowingNotification
  };

  return (
    <div className={className}>
      {/* Render children with achievement context */}
      {typeof children === 'function' ? children(achievementContext) : children}
      
      {/* Achievement Notification */}
      <AchievementNotification
        achievement={currentNotification}
        visible={isShowingNotification}
        onClose={closeNotification}
        autoClose={true}
        duration={4000}
      />
    </div>
  );
};

export default AchievementManager;