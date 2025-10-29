/**
 * Animation Controller for Emmy's Learning Adventure
 * 
 * Provides centralized animation management for user feedback,
 * celebrations, and interactive elements throughout the app.
 */

/**
 * Animation Controller Class
 * Manages all animations and visual feedback in the learning app
 */
export class AnimationController {
  constructor() {
    this.activeAnimations = new Set();
    this.confettiContainer = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Trigger success animation on an element
   * @param {HTMLElement} element - Element to animate
   * @param {string} type - Type of success animation ('bounce', 'glow', 'pulse')
   */
  triggerSuccess(element, type = 'bounce') {
    if (!element || this.reducedMotion) return;

    const animationClass = `correct-${type}`;
    this.applyAnimation(element, animationClass, 600);

    // Add success glow effect
    element.style.transition = 'box-shadow 0.3s ease-in-out';
    element.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6)';
    
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 600);
  }

  /**
   * Trigger error animation on an element
   * @param {HTMLElement} element - Element to animate
   * @param {string} type - Type of error animation ('shake', 'wobble', 'flash')
   */
  triggerError(element, type = 'shake') {
    if (!element || this.reducedMotion) return;

    const animationClass = `incorrect-${type}`;
    this.applyAnimation(element, animationClass, 600);

    // Add error flash effect
    element.style.transition = 'background-color 0.3s ease-in-out';
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 300);
  }

  /**
   * Celebrate completion with confetti and animations
   * @param {number} score - Score percentage (0-100)
   * @param {HTMLElement} container - Container for confetti
   */
  celebrateCompletion(score, container = document.body) {
    if (this.reducedMotion) {
      // Simple text celebration for reduced motion
      this.showTextCelebration(score, container);
      return;
    }

    // Create confetti effect
    this.createConfetti(container, score);

    // Trigger screen celebration
    this.triggerScreenCelebration(score);

    // Play celebration sound (handled by audio manager)
    this.dispatchAnimationEvent('celebration', { score });
  }

  /**
   * Show achievement badge with unlock animation
   * @param {Object} achievement - Achievement data
   * @param {HTMLElement} container - Container for badge
   */
  showAchievementBadge(achievement, container) {
    if (!achievement || !container) return;

    const badge = this.createAchievementBadge(achievement);
    container.appendChild(badge);

    if (!this.reducedMotion) {
      // Animate badge entrance
      badge.classList.add('zoom-in');
      
      // Add sparkle effect
      setTimeout(() => {
        this.addSparkleEffect(badge);
      }, 300);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        badge.classList.add('fade-out');
        setTimeout(() => {
          if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
          }
        }, 500);
      }, 4000);
    }
  }

  /**
   * Animate button press
   * @param {HTMLElement} button - Button element
   */
  animateButtonPress(button) {
    if (!button || this.reducedMotion) return;

    this.applyAnimation(button, 'button-press', 200);
  }

  /**
   * Add floating animation to element
   * @param {HTMLElement} element - Element to float
   * @param {number} duration - Animation duration in seconds
   */
  addFloatingAnimation(element, duration = 3) {
    if (!element || this.reducedMotion) return;

    element.style.animation = `float ${duration}s ease-in-out infinite`;
    this.activeAnimations.add(element);
  }

  /**
   * Add gentle bounce animation to element
   * @param {HTMLElement} element - Element to bounce
   * @param {number} delay - Animation delay in milliseconds
   */
  addGentleBounce(element, delay = 0) {
    if (!element || this.reducedMotion) return;

    setTimeout(() => {
      element.classList.add('gentle-bounce');
      this.activeAnimations.add(element);
    }, delay);
  }

  /**
   * Create entrance animation for new content
   * @param {HTMLElement} element - Element to animate in
   * @param {string} direction - Direction of entrance ('up', 'right', 'zoom')
   */
  animateEntrance(element, direction = 'up') {
    if (!element) return;

    const animationClass = direction === 'up' ? 'fade-in-up' : 
                          direction === 'right' ? 'slide-in-right' : 'zoom-in';
    
    element.classList.add(animationClass);
  }

  /**
   * Apply animation class to element with auto-cleanup
   * @param {HTMLElement} element - Element to animate
   * @param {string} animationClass - CSS animation class
   * @param {number} duration - Duration in milliseconds
   */
  applyAnimation(element, animationClass, duration) {
    if (!element) return;

    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
    }, duration);
  }

  /**
   * Create confetti particles
   * @param {HTMLElement} container - Container for confetti
   * @param {number} score - Score to determine confetti intensity
   */
  createConfetti(container, score) {
    const confettiCount = Math.min(50, Math.max(10, score / 2));
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-particle';
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -10px;
        z-index: 1000;
        pointer-events: none;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation-delay: ${Math.random() * 2}s;
      `;

      container.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 5000);
    }
  }

  /**
   * Create achievement badge element
   * @param {Object} achievement - Achievement data
   * @returns {HTMLElement} Badge element
   */
  createAchievementBadge(achievement) {
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      max-width: 300px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    badge.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">${achievement.icon || '🏆'}</div>
        <div>
          <div style="font-weight: bold; font-size: 16px;">${achievement.name}</div>
          <div style="font-size: 14px; opacity: 0.9;">${achievement.description}</div>
        </div>
      </div>
    `;

    return badge;
  }

  /**
   * Add sparkle effect around element
   * @param {HTMLElement} element - Element to add sparkles to
   */
  addSparkleEffect(element) {
    const rect = element.getBoundingClientRect();
    const sparkleCount = 8;

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = '✨';
      sparkle.className = 'star-twinkle';
      sparkle.style.cssText = `
        position: fixed;
        font-size: 16px;
        left: ${rect.left + Math.random() * rect.width}px;
        top: ${rect.top + Math.random() * rect.height}px;
        z-index: 1001;
        pointer-events: none;
        animation-delay: ${Math.random() * 1}s;
      `;

      document.body.appendChild(sparkle);

      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle);
        }
      }, 3000);
    }
  }

  /**
   * Trigger full screen celebration effect
   * @param {number} score - Score percentage
   */
  triggerScreenCelebration(score) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
      z-index: 999;
      pointer-events: none;
      animation: celebration-pulse 2s ease-in-out;
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 2000);
  }

  /**
   * Show text-based celebration for reduced motion
   * @param {number} score - Score percentage
   * @param {HTMLElement} container - Container for text
   */
  showTextCelebration(score, container) {
    const message = score >= 90 ? 'Perfect! 🌟' : 
                   score >= 70 ? 'Great job! 🎉' : 'Well done! 👏';

    const textElement = document.createElement('div');
    textElement.textContent = message;
    textElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      font-weight: bold;
      color: #22c55e;
      z-index: 1000;
      text-align: center;
      pointer-events: none;
    `;

    container.appendChild(textElement);

    setTimeout(() => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
    }, 2000);
  }

  /**
   * Dispatch custom animation event
   * @param {string} type - Event type
   * @param {Object} detail - Event detail data
   */
  dispatchAnimationEvent(type, detail) {
    const event = new CustomEvent(`animation:${type}`, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Clean up all active animations
   */
  cleanup() {
    this.activeAnimations.forEach(element => {
      if (element && element.style) {
        element.style.animation = '';
        element.className = element.className.replace(/\b(correct-\w+|incorrect-\w+|float|gentle-bounce|celebration-pulse)\b/g, '');
      }
    });
    this.activeAnimations.clear();
  }

  /**
   * Check if reduced motion is preferred
   * @returns {boolean} True if reduced motion is preferred
   */
  isReducedMotion() {
    return this.reducedMotion;
  }
}

// Create singleton instance
export const animationController = new AnimationController();

// Export default
export default animationController;