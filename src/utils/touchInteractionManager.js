/**
 * TouchInteractionManager - Comprehensive touch interaction system
 * 
 * Features:
 * - Advanced touch event handling with proper delegation
 * - Enhanced haptic feedback patterns
 * - Touch-specific animations and micro-interactions
 * - Long-press menus and context actions
 * - Multi-touch gesture recognition
 * - Drawing and interactive element support
 */

import audioManager from './audioManager';

class TouchInteractionManager {
  constructor() {
    this.activeInteractions = new Map();
    this.longPressTimers = new Map();
    this.gestureRecognizers = new Map();
    this.hapticPatterns = new Map();
    this.touchAnimations = new Map();
    
    // Configuration
    this.config = {
      longPressDelay: 500,
      tapThreshold: 10,
      swipeThreshold: 50,
      pinchThreshold: 10,
      doubleTapDelay: 300,
      maxTouchPoints: 10
    };

    this.initializeHapticPatterns();
    this.initializeTouchAnimations();
  }

  /**
   * Initialize haptic feedback patterns
   */
  initializeHapticPatterns() {
    this.hapticPatterns.set('tap', [10]);
    this.hapticPatterns.set('longPress', [20, 10, 20]);
    this.hapticPatterns.set('swipe', [15]);
    this.hapticPatterns.set('pinch', [5, 5, 5]);
    this.hapticPatterns.set('success', [10, 10, 10]);
    this.hapticPatterns.set('error', [50, 50, 50]);
    this.hapticPatterns.set('selection', [8]);
    this.hapticPatterns.set('contextMenu', [30, 20, 30]);
    this.hapticPatterns.set('drawing', [3]);
    this.hapticPatterns.set('button', [12]);
  }

  /**
   * Initialize touch-specific animations
   */
  initializeTouchAnimations() {
    this.touchAnimations.set('ripple', {
      keyframes: [
        { transform: 'scale(0)', opacity: 0.6 },
        { transform: 'scale(1)', opacity: 0 }
      ],
      options: { duration: 300, easing: 'ease-out' }
    });

    this.touchAnimations.set('press', {
      keyframes: [
        { transform: 'scale(1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1)' }
      ],
      options: { duration: 150, easing: 'ease-in-out' }
    });

    this.touchAnimations.set('longPressGlow', {
      keyframes: [
        { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
        { boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' }
      ],
      options: { duration: 500, easing: 'ease-out' }
    });

    this.touchAnimations.set('swipeIndicator', {
      keyframes: [
        { transform: 'translateX(0)', opacity: 0.8 },
        { transform: 'translateX(20px)', opacity: 0 }
      ],
      options: { duration: 200, easing: 'ease-out' }
    });
  }

  /**
   * Add touch support to an element with comprehensive event handling
   */
  addTouchSupport(element, handlers = {}) {
    if (!element || !('ontouchstart' in window)) {
      return () => {}; // Return empty cleanup function for non-touch devices
    }

    const touchState = {
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      touches: [],
      isLongPress: false,
      gestureType: null,
      lastTapTime: 0,
      tapCount: 0
    };

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      const now = Date.now();
      
      touchState.startTime = now;
      touchState.startX = touch.clientX;
      touchState.startY = touch.clientY;
      touchState.currentX = touch.clientX;
      touchState.currentY = touch.clientY;
      touchState.touches = Array.from(e.touches);
      touchState.isLongPress = false;
      touchState.gestureType = null;

      // Handle double tap detection
      if (now - touchState.lastTapTime < this.config.doubleTapDelay) {
        touchState.tapCount++;
      } else {
        touchState.tapCount = 1;
      }

      // Store interaction state
      this.activeInteractions.set(element, touchState);

      // Start long press timer
      const longPressTimer = setTimeout(() => {
        if (this.activeInteractions.has(element)) {
          touchState.isLongPress = true;
          this.handleLongPress(element, touch, handlers);
        }
      }, this.config.longPressDelay);

      this.longPressTimers.set(element, longPressTimer);

      // Trigger touch start animation
      this.playTouchAnimation(element, 'press');
      this.triggerHaptic('tap');

      // Call handler
      if (handlers.onTouchStart) {
        handlers.onTouchStart(e, {
          x: touch.clientX,
          y: touch.clientY,
          touches: touchState.touches,
          element
        });
      }
    };

    const handleTouchMove = (e) => {
      if (!this.activeInteractions.has(element)) return;

      const touch = e.touches[0];
      const state = this.activeInteractions.get(element);
      
      state.currentX = touch.clientX;
      state.currentY = touch.clientY;
      state.touches = Array.from(e.touches);

      const deltaX = state.currentX - state.startX;
      const deltaY = state.currentY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Cancel long press if moved too much
      if (distance > this.config.tapThreshold && this.longPressTimers.has(element)) {
        clearTimeout(this.longPressTimers.get(element));
        this.longPressTimers.delete(element);
      }

      // Detect gesture type
      if (!state.gestureType && distance > this.config.tapThreshold) {
        if (e.touches.length === 1) {
          state.gestureType = Math.abs(deltaX) > Math.abs(deltaY) ? 'swipe-horizontal' : 'swipe-vertical';
        } else if (e.touches.length === 2) {
          state.gestureType = 'pinch';
        }
      }

      // Handle multi-touch gestures
      if (e.touches.length === 2 && handlers.onPinch) {
        this.handlePinchGesture(e, handlers.onPinch);
      }

      // Call handler
      if (handlers.onTouchMove) {
        handlers.onTouchMove(e, {
          x: touch.clientX,
          y: touch.clientY,
          deltaX,
          deltaY,
          distance,
          gestureType: state.gestureType,
          touches: state.touches,
          element
        });
      }
    };

    const handleTouchEnd = (e) => {
      if (!this.activeInteractions.has(element)) return;

      const state = this.activeInteractions.get(element);
      const touch = e.changedTouches[0];
      const now = Date.now();
      const deltaTime = now - state.startTime;
      const deltaX = state.currentX - state.startX;
      const deltaY = state.currentY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Clear long press timer
      if (this.longPressTimers.has(element)) {
        clearTimeout(this.longPressTimers.get(element));
        this.longPressTimers.delete(element);
      }

      // Handle different interaction types
      if (state.isLongPress) {
        // Long press was already handled
      } else if (distance < this.config.tapThreshold && deltaTime < 200) {
        // Handle tap/double tap
        state.lastTapTime = now;
        
        if (state.tapCount === 2 && handlers.onDoubleTap) {
          this.handleDoubleTap(element, touch, handlers);
        } else if (handlers.onTap) {
          // Delay single tap to allow for double tap detection
          setTimeout(() => {
            if (state.tapCount === 1) {
              this.handleTap(element, touch, handlers);
            }
          }, this.config.doubleTapDelay);
        }
      } else if (distance > this.config.swipeThreshold && deltaTime < 300) {
        // Handle swipe
        this.handleSwipe(element, deltaX, deltaY, deltaTime, handlers);
      }

      // Cleanup
      this.activeInteractions.delete(element);

      // Call handler
      if (handlers.onTouchEnd) {
        handlers.onTouchEnd(e, {
          x: touch.clientX,
          y: touch.clientY,
          deltaX,
          deltaY,
          deltaTime,
          distance,
          gestureType: state.gestureType,
          isLongPress: state.isLongPress,
          element
        });
      }
    };

    // Add event listeners with passive: false for preventDefault support
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      
      // Clear any pending timers
      if (this.longPressTimers.has(element)) {
        clearTimeout(this.longPressTimers.get(element));
        this.longPressTimers.delete(element);
      }
      
      this.activeInteractions.delete(element);
    };
  }

  /**
   * Handle tap interaction
   */
  handleTap(element, touch, handlers) {
    this.playTouchAnimation(element, 'ripple', {
      x: touch.clientX,
      y: touch.clientY
    });
    
    this.triggerHaptic('tap');
    
    if (handlers.onTap) {
      handlers.onTap({
        x: touch.clientX,
        y: touch.clientY,
        element
      });
    }
  }

  /**
   * Handle double tap interaction
   */
  handleDoubleTap(element, touch, handlers) {
    this.playTouchAnimation(element, 'ripple', {
      x: touch.clientX,
      y: touch.clientY,
      scale: 1.5
    });
    
    this.triggerHaptic('selection');
    
    if (handlers.onDoubleTap) {
      handlers.onDoubleTap({
        x: touch.clientX,
        y: touch.clientY,
        element
      });
    }
  }

  /**
   * Handle long press interaction
   */
  handleLongPress(element, touch, handlers) {
    this.playTouchAnimation(element, 'longPressGlow');
    this.triggerHaptic('longPress');
    
    if (handlers.onLongPress) {
      handlers.onLongPress({
        x: touch.clientX,
        y: touch.clientY,
        element
      });
    }
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe(element, deltaX, deltaY, deltaTime, handlers) {
    const direction = this.getSwipeDirection(deltaX, deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
    
    this.playTouchAnimation(element, 'swipeIndicator', {
      direction
    });
    
    this.triggerHaptic('swipe');
    
    if (handlers.onSwipe) {
      handlers.onSwipe({
        direction,
        deltaX,
        deltaY,
        velocity,
        element
      });
    }
  }

  /**
   * Handle pinch gesture
   */
  handlePinchGesture(e, handler) {
    if (e.touches.length !== 2) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    this.triggerHaptic('pinch');

    handler({
      distance,
      centerX,
      centerY,
      touches: [touch1, touch2]
    });
  }

  /**
   * Get swipe direction from delta values
   */
  getSwipeDirection(deltaX, deltaY) {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Play touch-specific animation
   */
  playTouchAnimation(element, animationType, options = {}) {
    const animation = this.touchAnimations.get(animationType);
    if (!animation || !element.animate) return;

    let keyframes = [...animation.keyframes];
    let animationOptions = { ...animation.options };

    // Apply custom options
    if (options.scale) {
      keyframes = keyframes.map(frame => ({
        ...frame,
        transform: frame.transform?.replace(/scale\([^)]*\)/, `scale(${options.scale})`) || frame.transform
      }));
    }

    if (options.direction) {
      const directionMap = {
        left: 'translateX(-20px)',
        right: 'translateX(20px)',
        up: 'translateY(-20px)',
        down: 'translateY(20px)'
      };
      
      keyframes = keyframes.map(frame => ({
        ...frame,
        transform: directionMap[options.direction] || frame.transform
      }));
    }

    // Create ripple effect for tap animations
    if (animationType === 'ripple' && options.x && options.y) {
      this.createRippleEffect(element, options.x, options.y, options.scale || 1);
      return;
    }

    // Play animation
    try {
      element.animate(keyframes, animationOptions);
    } catch (error) {
      console.warn('Touch animation failed:', error);
    }
  }

  /**
   * Create ripple effect at specific coordinates
   */
  createRippleEffect(element, x, y, scale = 1) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    const size = Math.max(rect.width, rect.height) * scale;
    const left = x - rect.left - size / 2;
    const top = y - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${left}px;
      top: ${top}px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // Ensure element has relative positioning
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }
    
    element.appendChild(ripple);
    
    // Animate ripple
    const animation = ripple.animate([
      { transform: 'scale(0)', opacity: 0.6 },
      { transform: 'scale(1)', opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
    
    animation.onfinish = () => {
      ripple.remove();
      // Restore original position if we changed it
      if (!originalPosition || originalPosition === 'static') {
        element.style.position = originalPosition || '';
      }
    };
  }

  /**
   * Trigger haptic feedback
   */
  triggerHaptic(type) {
    if (!('vibrate' in navigator)) return;
    
    const pattern = this.hapticPatterns.get(type) || this.hapticPatterns.get('tap');
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Add drawing support to canvas elements
   */
  addDrawingSupport(canvas, options = {}) {
    if (!canvas || canvas.tagName !== 'CANVAS') {
      console.warn('Drawing support requires a canvas element');
      return () => {};
    }

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const drawingOptions = {
      strokeStyle: options.strokeStyle || '#000000',
      lineWidth: options.lineWidth || 2,
      lineCap: options.lineCap || 'round',
      lineJoin: options.lineJoin || 'round',
      ...options
    };

    const startDrawing = (x, y) => {
      isDrawing = true;
      lastX = x;
      lastY = y;
      
      ctx.strokeStyle = drawingOptions.strokeStyle;
      ctx.lineWidth = drawingOptions.lineWidth;
      ctx.lineCap = drawingOptions.lineCap;
      ctx.lineJoin = drawingOptions.lineJoin;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      this.triggerHaptic('drawing');
      
      if (options.onDrawStart) {
        options.onDrawStart({ x, y });
      }
    };

    const draw = (x, y) => {
      if (!isDrawing) return;
      
      ctx.lineTo(x, y);
      ctx.stroke();
      
      lastX = x;
      lastY = y;
      
      if (options.onDraw) {
        options.onDraw({ x, y, lastX, lastY });
      }
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      
      isDrawing = false;
      ctx.closePath();
      
      if (options.onDrawEnd) {
        options.onDrawEnd();
      }
    };

    const getCanvasCoordinates = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    // Touch event handlers for drawing
    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      startDrawing(coords.x, coords.y);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      draw(coords.x, coords.y);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      stopDrawing();
    };

    // Mouse event handlers for desktop compatibility
    const handleMouseDown = (e) => {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      startDrawing(coords.x, coords.y);
    };

    const handleMouseMove = (e) => {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      draw(coords.x, coords.y);
    };

    const handleMouseUp = () => {
      stopDrawing();
    };

    // Add event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Return cleanup function
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }

  /**
   * Create a context menu for long press actions
   */
  createContextMenu(element, menuItems, options = {}) {
    const menuId = `context-menu-${Date.now()}`;
    
    const showMenu = (x, y) => {
      // Remove any existing context menus
      this.hideAllContextMenus();
      
      const menu = document.createElement('div');
      menu.id = menuId;
      menu.className = 'touch-context-menu';
      
      menu.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        min-width: 150px;
        overflow: hidden;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.2s ease-out;
      `;
      
      menuItems.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'touch-context-menu-item';
        menuItem.textContent = item.label;
        
        menuItem.style.cssText = `
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: ${index < menuItems.length - 1 ? '1px solid #f0f0f0' : 'none'};
          transition: background-color 0.2s;
          min-height: 44px;
          display: flex;
          align-items: center;
          font-size: 16px;
        `;
        
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.backgroundColor = '#f5f5f5';
        });
        
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.backgroundColor = '';
        });
        
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          this.triggerHaptic('selection');
          item.action();
          this.hideContextMenu(menuId);
        });
        
        menu.appendChild(menuItem);
      });
      
      document.body.appendChild(menu);
      
      // Adjust position if menu goes off screen
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (rect.right > viewportWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      
      if (rect.bottom > viewportHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
      
      // Animate in
      requestAnimationFrame(() => {
        menu.style.transform = 'scale(1)';
        menu.style.opacity = '1';
      });
      
      // Hide menu when clicking outside
      const hideOnClickOutside = (e) => {
        if (!menu.contains(e.target)) {
          this.hideContextMenu(menuId);
          document.removeEventListener('click', hideOnClickOutside);
          document.removeEventListener('touchstart', hideOnClickOutside);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', hideOnClickOutside);
        document.addEventListener('touchstart', hideOnClickOutside);
      }, 100);
    };
    
    return showMenu;
  }

  /**
   * Hide a specific context menu
   */
  hideContextMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
      menu.style.transform = 'scale(0.8)';
      menu.style.opacity = '0';
      setTimeout(() => menu.remove(), 200);
    }
  }

  /**
   * Hide all context menus
   */
  hideAllContextMenus() {
    const menus = document.querySelectorAll('.touch-context-menu');
    menus.forEach(menu => {
      menu.style.transform = 'scale(0.8)';
      menu.style.opacity = '0';
      setTimeout(() => menu.remove(), 200);
    });
  }

  /**
   * Cleanup all active interactions
   */
  cleanup() {
    // Clear all timers
    this.longPressTimers.forEach(timer => clearTimeout(timer));
    this.longPressTimers.clear();
    
    // Clear active interactions
    this.activeInteractions.clear();
    
    // Hide all context menus
    this.hideAllContextMenus();
  }
}

// Create and export singleton instance
const touchInteractionManager = new TouchInteractionManager();

export default touchInteractionManager;