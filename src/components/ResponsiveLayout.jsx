import React, { useState, useEffect, useRef } from 'react';
import { 
  getDeviceType, 
  getTouchCapabilities, 
  getScreenInfo, 
  handleOrientationChange,
  addTouchSupport,
  addPullToRefresh,
  initializeResponsiveUtils 
} from '../utils/responsiveUtils';
import touchInteractionManager from '../utils/touchInteractionManager';

const ResponsiveLayout = ({ 
  children, 
  onSwipe, 
  onPullRefresh, 
  enableSwipeNavigation = false,
  enablePullToRefresh = false,
  className = '',
  ...props 
}) => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {},
    screenInfo: {},
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const layoutRef = useRef(null);
  const touchSupportCleanup = useRef(null);
  const pullRefreshCleanup = useRef(null);

  // Initialize device detection and responsive utilities
  useEffect(() => {
    initializeResponsiveUtils();
    
    const updateDeviceInfo = () => {
      setDeviceInfo({
        type: getDeviceType(),
        touchCapabilities: getTouchCapabilities(),
        screenInfo: getScreenInfo(),
      });
    };

    updateDeviceInfo();

    // Listen for orientation changes
    const orientationCleanup = handleOrientationChange(updateDeviceInfo);

    return orientationCleanup;
  }, []);

  // Setup enhanced touch support
  useEffect(() => {
    if (!layoutRef.current || !enableSwipeNavigation) return;

    const touchHandlers = {
      onSwipe: (data) => {
        touchInteractionManager.triggerHaptic('swipe');
        if (onSwipe) {
          onSwipe(data.direction, data);
        }
      },
      onTap: (data) => {
        touchInteractionManager.triggerHaptic('tap');
      },
      onLongPress: (data) => {
        touchInteractionManager.triggerHaptic('longPress');
      },
      onDoubleTap: (data) => {
        touchInteractionManager.triggerHaptic('selection');
      },
      onPinch: (data) => {
        touchInteractionManager.triggerHaptic('pinch');
      }
    };

    touchSupportCleanup.current = touchInteractionManager.addTouchSupport(layoutRef.current, touchHandlers);

    return () => {
      if (touchSupportCleanup.current) {
        touchSupportCleanup.current();
      }
    };
  }, [enableSwipeNavigation, onSwipe, deviceInfo.touchCapabilities]);

  // Setup pull-to-refresh
  useEffect(() => {
    if (!layoutRef.current || !enablePullToRefresh || !onPullRefresh) return;

    const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
        await onPullRefresh();
      } finally {
        setIsRefreshing(false);
      }
    };

    pullRefreshCleanup.current = addPullToRefresh(layoutRef.current, handleRefresh);

    return () => {
      if (pullRefreshCleanup.current) {
        pullRefreshCleanup.current();
      }
    };
  }, [enablePullToRefresh, onPullRefresh]);

  // Generate responsive classes based on device type
  const getResponsiveClasses = () => {
    const baseClasses = 'min-h-screen w-full';
    const { type, screenInfo } = deviceInfo;
    
    let responsiveClasses = baseClasses;

    // Add device-specific classes
    if (type === 'mobile' || type === 'ios' || type === 'android') {
      responsiveClasses += ' mobile-layout';
      // Use CSS custom property for mobile viewport height
      responsiveClasses += ' min-h-[calc(var(--vh,1vh)*100)]';
      
      // Add landscape-specific classes
      if (screenInfo.orientation === 'landscape') {
        responsiveClasses += ' mobile-landscape mobile-landscape-compact';
      } else {
        responsiveClasses += ' mobile-portrait mobile-portrait-optimized';
      }
    }

    if (screenInfo.isSmallScreen) {
      responsiveClasses += ' small-screen';
    }

    // Add touch-friendly classes for mobile
    if (type === 'mobile' || type === 'ios' || type === 'android') {
      responsiveClasses += ' touch-manipulation';
    }

    return `${responsiveClasses} ${className}`;
  };

  // Generate container classes for touch-friendly spacing
  const getContainerClasses = () => {
    const { type, screenInfo } = deviceInfo;
    
    let containerClasses = 'container-mobile'; // Use our mobile-first container class
    
    if (type === 'mobile' || type === 'ios' || type === 'android') {
      // Add mobile-specific classes
      containerClasses += ' content-mobile';
      
      // Adjust for landscape orientation
      if (screenInfo.orientation === 'landscape') {
        containerClasses += ' mobile-landscape-compact';
      }
    }
    
    return containerClasses;
  };

  return (
    <div 
      ref={layoutRef}
      className={getResponsiveClasses()}
      style={{
        // Prevent overscroll bounce on iOS
        overscrollBehavior: 'none',
        // Improve touch scrolling on mobile
        WebkitOverflowScrolling: 'touch',
        // Prevent text selection on mobile games
        WebkitUserSelect: deviceInfo.type === 'mobile' ? 'none' : 'auto',
        userSelect: deviceInfo.type === 'mobile' ? 'none' : 'auto',
      }}
      {...props}
    >
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-2 animate-pull-refresh">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className={getContainerClasses()}>
        {children}
      </div>

      {/* Device info for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-tl-lg z-50">
          <div>Device: {deviceInfo.type}</div>
          <div>Screen: {deviceInfo.screenInfo.width}x{deviceInfo.screenInfo.height}</div>
          <div>Orientation: {deviceInfo.screenInfo.orientation}</div>
          <div>Touch: {deviceInfo.touchCapabilities.hasTouch ? 'Yes' : 'No'}</div>
          <div>Haptics: {deviceInfo.touchCapabilities.supportsHaptics ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

// Legacy TouchButton component - use the new TouchButton from TouchButton.jsx instead
export const TouchButton = ({ 
  children, 
  onClick, 
  className = '', 
  size = 'medium',
  variant = 'primary',
  disabled = false,
  ...props 
}) => {
  const [deviceInfo, setDeviceInfo] = useState({ type: 'desktop' });

  useEffect(() => {
    setDeviceInfo({ type: getDeviceType() });
  }, []);

  const getSizeClasses = () => {
    const sizes = {
      compact: 'px-3 py-1.5 min-h-[36px] text-sm rounded-lg',
      small: 'btn-touch text-mobile-sm',
      medium: 'btn-touch text-mobile-base',
      large: 'btn-touch-lg text-mobile-base',
    };
    
    return sizes[size] || sizes.medium;
  };

  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white',
      success: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white',
      danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
      outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
    };
    
    return variants[variant] || variants.primary;
  };

  const handleClick = (e) => {
    // Use enhanced haptic feedback
    touchInteractionManager.triggerHaptic('button');
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        touch-feedback
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Touch-friendly input component
export const TouchInput = ({ 
  className = '', 
  size = 'medium',
  ...props 
}) => {
  const [deviceInfo, setDeviceInfo] = useState({ type: 'desktop' });

  useEffect(() => {
    setDeviceInfo({ type: getDeviceType() });
  }, []);

  const getSizeClasses = () => {
    const sizes = {
      small: 'input-touch text-mobile-sm',
      medium: 'input-touch text-mobile-base',
      large: 'input-touch text-mobile-lg px-6 py-4',
    };
    
    return sizes[size] || sizes.medium;
  };

  return (
    <input
      className={`
        ${getSizeClasses()}
        ${className}
      `}
      {...props}
    />
  );
};

export default ResponsiveLayout;