/**
 * React Hook for Animation Management
 * 
 * Provides easy-to-use animation functions for React components
 * in Emmy's Learning Adventure.
 */

import { useCallback, useEffect, useRef } from 'react';
import { animationController } from '../utils/animationController';

/**
 * Custom hook for managing animations in React components
 * @returns {Object} Animation functions and utilities
 */
export const useAnimations = () => {
  const elementRefs = useRef(new Map());

  /**
   * Register an element for animations
   * @param {string} key - Unique key for the element
   * @returns {Function} Ref callback function
   */
  const registerElement = useCallback((key) => {
    return (element) => {
      if (element) {
        elementRefs.current.set(key, element);
      } else {
        elementRefs.current.delete(key);
      }
    };
  }, []);

  /**
   * Get registered element by key
   * @param {string} key - Element key
   * @returns {HTMLElement|null} Element or null
   */
  const getElement = useCallback((key) => {
    return elementRefs.current.get(key) || null;
  }, []);

  /**
   * Trigger success animation
   * @param {string|HTMLElement} target - Element key or element
   * @param {string} type - Animation type
   */
  const triggerSuccess = useCallback((target, type = 'bounce') => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.triggerSuccess(element, type);
  }, [getElement]);

  /**
   * Trigger error animation
   * @param {string|HTMLElement} target - Element key or element
   * @param {string} type - Animation type
   */
  const triggerError = useCallback((target, type = 'shake') => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.triggerError(element, type);
  }, [getElement]);

  /**
   * Celebrate completion
   * @param {number} score - Score percentage
   * @param {HTMLElement} container - Container for effects
   */
  const celebrateCompletion = useCallback((score, container) => {
    animationController.celebrateCompletion(score, container);
  }, []);

  /**
   * Show achievement badge
   * @param {Object} achievement - Achievement data
   * @param {HTMLElement} container - Container for badge
   */
  const showAchievement = useCallback((achievement, container) => {
    animationController.showAchievementBadge(achievement, container);
  }, []);

  /**
   * Animate button press
   * @param {string|HTMLElement} target - Element key or element
   */
  const animateButtonPress = useCallback((target) => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.animateButtonPress(element);
  }, [getElement]);

  /**
   * Add floating animation
   * @param {string|HTMLElement} target - Element key or element
   * @param {number} duration - Animation duration
   */
  const addFloating = useCallback((target, duration = 3) => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.addFloatingAnimation(element, duration);
  }, [getElement]);

  /**
   * Add gentle bounce animation
   * @param {string|HTMLElement} target - Element key or element
   * @param {number} delay - Animation delay
   */
  const addBounce = useCallback((target, delay = 0) => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.addGentleBounce(element, delay);
  }, [getElement]);

  /**
   * Animate entrance
   * @param {string|HTMLElement} target - Element key or element
   * @param {string} direction - Entrance direction
   */
  const animateEntrance = useCallback((target, direction = 'up') => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.animateEntrance(element, direction);
  }, [getElement]);

  /**
   * Apply custom animation class
   * @param {string|HTMLElement} target - Element key or element
   * @param {string} animationClass - CSS animation class
   * @param {number} duration - Duration in milliseconds
   */
  const applyAnimation = useCallback((target, animationClass, duration = 500) => {
    const element = typeof target === 'string' ? getElement(target) : target;
    animationController.applyAnimation(element, animationClass, duration);
  }, [getElement]);

  /**
   * Check if reduced motion is preferred
   * @returns {boolean} True if reduced motion is preferred
   */
  const isReducedMotion = useCallback(() => {
    return animationController.isReducedMotion();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      elementRefs.current.clear();
    };
  }, []);

  return {
    // Element management
    registerElement,
    getElement,
    
    // Animation functions
    triggerSuccess,
    triggerError,
    celebrateCompletion,
    showAchievement,
    animateButtonPress,
    addFloating,
    addBounce,
    animateEntrance,
    applyAnimation,
    
    // Utilities
    isReducedMotion
  };
};

export default useAnimations;