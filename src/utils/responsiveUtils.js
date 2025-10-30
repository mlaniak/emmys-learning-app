// Mobile-first responsive utilities for Emmy's Learning Adventure

// Device detection utilities
export const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile devices
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  
  // Check for tablet
  if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
    return 'tablet';
  }
  
  // Check for mobile
  if (window.innerWidth < 768) {
    return 'mobile';
  }
  
  return 'desktop';
};

// Touch capabilities detection
export const getTouchCapabilities = () => {
  return {
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    supportsHaptics: 'vibrate' in navigator,
    supportsOrientationChange: 'orientation' in window,
    supportsPointerEvents: 'PointerEvent' in window,
  };
};

// Screen size utilities
export const getScreenInfo = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    pixelRatio: window.devicePixelRatio || 1,
    isSmallScreen: window.innerWidth < 640,
    isMediumScreen: window.innerWidth >= 640 && window.innerWidth < 1024,
    isLargeScreen: window.innerWidth >= 1024,
  };
};

// Touch-friendly sizing utilities
export const getTouchFriendlySize = (baseSize, deviceType = null) => {
  const device = deviceType || getDeviceType();
  const multipliers = {
    mobile: 1.2,
    tablet: 1.1,
    desktop: 1.0,
    ios: 1.25, // iOS requires slightly larger touch targets
    android: 1.15,
  };
  
  return Math.max(44, baseSize * (multipliers[device] || 1.0));
};

// Responsive breakpoint utilities
export const getBreakpoint = () => {
  const width = window.innerWidth;
  
  if (width < 475) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

// Mobile-first CSS class generators
export const generateResponsiveClasses = (baseClasses, responsiveOverrides = {}) => {
  let classes = baseClasses;
  
  Object.entries(responsiveOverrides).forEach(([breakpoint, overrideClasses]) => {
    if (overrideClasses) {
      classes += ` ${breakpoint}:${overrideClasses}`;
    }
  });
  
  return classes;
};

// Touch event utilities
export const addTouchSupport = (element, handlers = {}) => {
  const touchCapabilities = getTouchCapabilities();
  
  if (!touchCapabilities.hasTouch) return;
  
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    
    if (handlers.onTouchStart) {
      handlers.onTouchStart(e, { x: startX, y: startY });
    }
  };
  
  const handleTouchMove = (e) => {
    if (handlers.onTouchMove) {
      const touch = e.touches[0];
      handlers.onTouchMove(e, { 
        x: touch.clientX, 
        y: touch.clientY,
        deltaX: touch.clientX - startX,
        deltaY: touch.clientY - startY,
      });
    }
  };
  
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    // Detect swipe gestures
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    if (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
      const direction = deltaX > 0 ? 'right' : 'left';
      if (handlers.onSwipe) {
        handlers.onSwipe(direction, { deltaX, deltaY, deltaTime });
      }
    }
    
    if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime) {
      const direction = deltaY > 0 ? 'down' : 'up';
      if (handlers.onSwipe) {
        handlers.onSwipe(direction, { deltaX, deltaY, deltaTime });
      }
    }
    
    // Detect tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      if (handlers.onTap) {
        handlers.onTap(e, { x: endX, y: endY });
      }
    }
    
    // Detect long press
    if (deltaTime > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (handlers.onLongPress) {
        handlers.onLongPress(e, { x: endX, y: endY, duration: deltaTime });
      }
    }
    
    if (handlers.onTouchEnd) {
      handlers.onTouchEnd(e, { x: endX, y: endY, deltaX, deltaY, deltaTime });
    }
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Orientation change utilities
export const handleOrientationChange = (callback) => {
  const handleChange = () => {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      callback(getScreenInfo());
    }, 100);
  };
  
  window.addEventListener('orientationchange', handleChange);
  window.addEventListener('resize', handleChange);
  
  return () => {
    window.removeEventListener('orientationchange', handleChange);
    window.removeEventListener('resize', handleChange);
  };
};

// Pull-to-refresh utilities
export const addPullToRefresh = (element, onRefresh) => {
  let startY = 0;
  let currentY = 0;
  let isRefreshing = false;
  let pullDistance = 0;
  const threshold = 80;
  
  const handleTouchStart = (e) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY;
    }
  };
  
  const handleTouchMove = (e) => {
    if (element.scrollTop === 0 && !isRefreshing) {
      currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;
      
      if (pullDistance > 0) {
        e.preventDefault();
        
        // Visual feedback for pull distance
        const opacity = Math.min(pullDistance / threshold, 1);
        element.style.transform = `translateY(${Math.min(pullDistance * 0.5, 40)}px)`;
        element.style.opacity = 1 - (opacity * 0.2);
        
        // Add pull indicator
        if (pullDistance > threshold && !element.querySelector('.pull-refresh-indicator')) {
          const indicator = document.createElement('div');
          indicator.className = 'pull-refresh-indicator absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-center p-2 text-sm text-gray-600';
          indicator.innerHTML = '↓ Release to refresh';
          element.appendChild(indicator);
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (pullDistance > threshold && !isRefreshing) {
      isRefreshing = true;
      element.style.transform = 'translateY(20px)';
      
      // Show loading state
      const indicator = element.querySelector('.pull-refresh-indicator');
      if (indicator) {
        indicator.innerHTML = '⟳ Refreshing...';
        indicator.className = indicator.className.replace('text-gray-600', 'text-blue-600');
      }
      
      // Call refresh callback
      onRefresh().finally(() => {
        isRefreshing = false;
        element.style.transform = '';
        element.style.opacity = '';
        
        const indicator = element.querySelector('.pull-refresh-indicator');
        if (indicator) {
          indicator.remove();
        }
      });
    } else {
      // Reset without refreshing
      element.style.transform = '';
      element.style.opacity = '';
      
      const indicator = element.querySelector('.pull-refresh-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
    
    pullDistance = 0;
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Viewport utilities
export const setViewportHeight = () => {
  // Fix for mobile viewport height issues
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Initialize responsive utilities
export const initializeResponsiveUtils = () => {
  setViewportHeight();
  
  // Update viewport height on resize
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
  
  // Add mobile-specific meta tags if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
  }
  
  // Prevent zoom on input focus (iOS)
  if (getDeviceType() === 'ios') {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.style.fontSize) {
        input.style.fontSize = '16px';
      }
    });
  }
};

export default {
  getDeviceType,
  getTouchCapabilities,
  getScreenInfo,
  getTouchFriendlySize,
  getBreakpoint,
  generateResponsiveClasses,
  addTouchSupport,
  handleOrientationChange,
  addPullToRefresh,
  setViewportHeight,
  initializeResponsiveUtils,
};