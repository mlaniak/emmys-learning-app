import React, { useState, useEffect, useRef } from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import SwipeNavigation from './SwipeNavigation';
import PullToRefresh from './PullToRefresh';
import { getDeviceType, initializeResponsiveUtils } from '../utils/responsiveUtils';

const MobileFirstLayout = ({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullRefresh,
  enableSwipeNavigation = true,
  enablePullToRefresh = false,
  className = '',
  ...props 
}) => {
  const [deviceType, setDeviceType] = useState('desktop');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize responsive utilities
    initializeResponsiveUtils();
    
    // Set device type
    setDeviceType(getDeviceType());
    
    // Mark as initialized
    setIsInitialized(true);
  }, []);

  // Don't render until initialized to prevent layout shifts
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  // Wrap content with appropriate mobile features
  let content = children;

  // Add pull-to-refresh for mobile if enabled
  if (isMobile && enablePullToRefresh && onPullRefresh) {
    content = (
      <PullToRefresh onRefresh={onPullRefresh}>
        {content}
      </PullToRefresh>
    );
  }

  // Add swipe navigation for mobile if enabled
  if (isMobile && enableSwipeNavigation) {
    content = (
      <SwipeNavigation
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        onSwipeUp={onSwipeUp}
        onSwipeDown={onSwipeDown}
        enableSwipeIndicators={true}
        className="h-full"
      >
        {content}
      </SwipeNavigation>
    );
  }

  return (
    <ResponsiveLayout
      className={`mobile-first-layout ${className}`}
      {...props}
    >
      {content}
    </ResponsiveLayout>
  );
};

// Mobile-first page wrapper with common mobile optimizations
export const MobileFirstPage = ({ 
  children, 
  title,
  onBack,
  showBackButton = true,
  enableSwipeBack = true,
  enablePullRefresh = false,
  onPullRefresh,
  className = '',
  ...props 
}) => {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  const handleSwipeRight = () => {
    if (enableSwipeBack && onBack) {
      onBack();
    }
  };

  return (
    <MobileFirstLayout
      onSwipeRight={handleSwipeRight}
      enableSwipeNavigation={isMobile && enableSwipeBack}
      enablePullToRefresh={enablePullRefresh}
      onPullRefresh={onPullRefresh}
      className={`mobile-first-page ${className}`}
      {...props}
    >
      {/* Mobile-optimized header */}
      {(title || showBackButton) && (
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="btn-touch bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 hover-mobile-scale"
            >
              <span>←</span>
              <span className="hidden xs:inline">Back</span>
            </button>
          )}
          
          {title && (
            <h1 className="text-mobile-xl font-bold text-center flex-1 mx-4">
              {title}
            </h1>
          )}
          
          {/* Spacer for layout balance */}
          {showBackButton && <div className="w-16"></div>}
        </div>
      )}

      {/* Page content */}
      <div className="content-mobile">
        {children}
      </div>

      {/* Mobile navigation hint */}
      {isMobile && enableSwipeBack && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-400 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          Swipe right to go back
        </div>
      )}
    </MobileFirstLayout>
  );
};

// Mobile-first card component
export const MobileFirstCard = ({ 
  children, 
  className = '',
  interactive = false,
  ...props 
}) => {
  const baseClasses = 'card-mobile';
  const interactiveClasses = interactive ? 'hover-mobile-lift touch-feedback cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile-first button component
export const MobileFirstButton = ({ 
  children, 
  size = 'medium',
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'btn-touch text-mobile-sm',
    medium: 'btn-touch-lg text-mobile-base',
    large: 'btn-touch-xl text-mobile-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white',
    success: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${sizeClasses[size] || sizeClasses.medium}
        ${variantClasses[variant] || variantClasses.primary}
        ${widthClasses}
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

// Mobile-first grid component
export const MobileFirstGrid = ({ 
  children, 
  columns = 'auto',
  gap = 'normal',
  className = '',
  ...props 
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 xs:grid-cols-2',
    3: 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    auto: 'grid-mobile',
  };

  const gapClasses = {
    tight: 'gap-2',
    normal: 'gap-3 sm:gap-4',
    loose: 'gap-4 sm:gap-6',
  };

  return (
    <div 
      className={`
        grid 
        ${columnClasses[columns] || columnClasses.auto}
        ${gapClasses[gap] || gapClasses.normal}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default MobileFirstLayout;