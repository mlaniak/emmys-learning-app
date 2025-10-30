import React, { useState, useRef, useEffect } from 'react';
import { addTouchSupport, getDeviceType } from '../utils/responsiveUtils';

const SwipeNavigation = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  enableSwipeIndicators = true,
  swipeThreshold = 50,
  className = '',
  ...props 
}) => {
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [deviceType, setDeviceType] = useState('desktop');
  const containerRef = useRef(null);
  const touchCleanup = useRef(null);

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const touchHandlers = {
      onTouchStart: (e, { x, y }) => {
        setSwipeDirection(null);
        setSwipeProgress(0);
      },
      
      onTouchMove: (e, { deltaX, deltaY }) => {
        // Determine swipe direction and progress
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          const direction = deltaX > 0 ? 'right' : 'left';
          setSwipeDirection(direction);
          setSwipeProgress(Math.min(absDeltaX / swipeThreshold, 1));
        } else {
          // Vertical swipe
          const direction = deltaY > 0 ? 'down' : 'up';
          setSwipeDirection(direction);
          setSwipeProgress(Math.min(absDeltaY / swipeThreshold, 1));
        }
      },
      
      onSwipe: (direction, { deltaX, deltaY, deltaTime }) => {
        // Reset visual indicators
        setSwipeDirection(null);
        setSwipeProgress(0);
        
        // Call appropriate handler
        switch (direction) {
          case 'left':
            if (onSwipeLeft) onSwipeLeft({ deltaX, deltaY, deltaTime });
            break;
          case 'right':
            if (onSwipeRight) onSwipeRight({ deltaX, deltaY, deltaTime });
            break;
          case 'up':
            if (onSwipeUp) onSwipeUp({ deltaX, deltaY, deltaTime });
            break;
          case 'down':
            if (onSwipeDown) onSwipeDown({ deltaX, deltaY, deltaTime });
            break;
        }
      },
      
      onTouchEnd: () => {
        // Reset visual indicators
        setSwipeDirection(null);
        setSwipeProgress(0);
      },
    };

    touchCleanup.current = addTouchSupport(containerRef.current, touchHandlers);

    return () => {
      if (touchCleanup.current) {
        touchCleanup.current();
      }
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold]);

  // Generate swipe indicator styles
  const getSwipeIndicatorStyle = () => {
    if (!swipeDirection || swipeProgress === 0) return {};
    
    const opacity = Math.min(swipeProgress * 0.7, 0.7);
    const scale = 0.8 + (swipeProgress * 0.2);
    
    return {
      opacity,
      transform: `scale(${scale})`,
    };
  };

  const getSwipeIndicatorPosition = () => {
    switch (swipeDirection) {
      case 'left':
        return 'left-4 top-1/2 -translate-y-1/2';
      case 'right':
        return 'right-4 top-1/2 -translate-y-1/2';
      case 'up':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'down':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      default:
        return 'hidden';
    }
  };

  const getSwipeIndicatorIcon = () => {
    switch (swipeDirection) {
      case 'left':
        return '←';
      case 'right':
        return '→';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        touchAction: 'pan-x pan-y',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      {...props}
    >
      {children}
      
      {/* Swipe indicators */}
      {enableSwipeIndicators && swipeDirection && (deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android') && (
        <div 
          className={`absolute ${getSwipeIndicatorPosition()} pointer-events-none z-50`}
          style={getSwipeIndicatorStyle()}
        >
          <div className="bg-black bg-opacity-50 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            {getSwipeIndicatorIcon()}
          </div>
        </div>
      )}
      
      {/* Swipe progress indicator */}
      {enableSwipeIndicators && swipeDirection && swipeProgress > 0 && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {swipeDirection === 'left' && (
            <div 
              className="absolute left-0 top-0 bottom-0 bg-blue-500 bg-opacity-20 transition-all duration-100"
              style={{ width: `${swipeProgress * 100}%` }}
            />
          )}
          {swipeDirection === 'right' && (
            <div 
              className="absolute right-0 top-0 bottom-0 bg-blue-500 bg-opacity-20 transition-all duration-100"
              style={{ width: `${swipeProgress * 100}%` }}
            />
          )}
          {swipeDirection === 'up' && (
            <div 
              className="absolute top-0 left-0 right-0 bg-blue-500 bg-opacity-20 transition-all duration-100"
              style={{ height: `${swipeProgress * 100}%` }}
            />
          )}
          {swipeDirection === 'down' && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-20 transition-all duration-100"
              style={{ height: `${swipeProgress * 100}%` }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Swipeable card component for questions/content
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  leftAction = 'Previous',
  rightAction = 'Next',
  className = '',
  ...props 
}) => {
  return (
    <SwipeNavigation
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      className={`bg-white rounded-2xl shadow-lg ${className}`}
      {...props}
    >
      <div className="p-6">
        {children}
      </div>
      
      {/* Action hints for mobile */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 pointer-events-none">
        {onSwipeRight && <span>← {leftAction}</span>}
        {onSwipeLeft && <span>{rightAction} →</span>}
      </div>
    </SwipeNavigation>
  );
};

// Swipeable tabs component
export const SwipeableTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '',
  ...props 
}) => {
  const handleSwipeLeft = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].id);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].id);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={className} {...props}>
      {/* Tab headers */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-touch ${
              tab.id === activeTab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content with swipe navigation */}
      <SwipeNavigation
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        className="min-h-[200px]"
      >
        {activeTabContent?.content}
      </SwipeNavigation>
    </div>
  );
};

export default SwipeNavigation;