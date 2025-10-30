import React, { useState, useRef, useEffect } from 'react';
import { getDeviceType } from '../utils/responsiveUtils';

const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  className = '',
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  const handleTouchStart = (e) => {
    if (disabled || !isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only allow pull-to-refresh when at the top of the container
    if (container.scrollTop === 0) {
      setCanPull(true);
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (disabled || !isMobile || !canPull || !isDragging.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      e.preventDefault(); // Prevent default scroll behavior
      
      // Apply resistance to the pull distance
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, maxPullDistance);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isMobile || !canPull || !isDragging.current) return;

    isDragging.current = false;
    setCanPull(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to original position
      setPullDistance(0);
    }
  };

  const getPullIndicatorText = () => {
    if (isRefreshing) return refreshingText;
    if (pullDistance >= threshold) return releaseText;
    return pullText;
  };

  const getPullIndicatorIcon = () => {
    if (isRefreshing) {
      return (
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
      );
    }
    
    if (pullDistance >= threshold) {
      return <span className="text-2xl">↑</span>;
    }
    
    return <span className="text-2xl">↓</span>;
  };

  const getIndicatorOpacity = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / threshold, 1);
  };

  const getIndicatorScale = () => {
    if (isRefreshing) return 1;
    return 0.8 + (Math.min(pullDistance / threshold, 1) * 0.2);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull indicator */}
      {isMobile && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center bg-white border-b border-gray-200 z-50"
          style={{
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            opacity: getIndicatorOpacity(),
            transform: `scale(${getIndicatorScale()})`,
            transition: isDragging.current ? 'none' : 'all 0.3s ease-out',
          }}
        >
          <div className="flex flex-col items-center justify-center text-gray-600">
            <div className="mb-2">
              {getPullIndicatorIcon()}
            </div>
            <div className="text-sm font-medium">
              {getPullIndicatorText()}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        style={{
          paddingTop: isRefreshing ? '60px' : '0px',
          transition: 'padding-top 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Enhanced pull-to-refresh with custom animations
export const AnimatedPullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  disabled = false,
}) => {
  const [pullState, setPullState] = useState('idle'); // idle, pulling, ready, refreshing
  const [pullDistance, setPullDistance] = useState(0);
  const [deviceType, setDeviceType] = useState('desktop');
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    setDeviceType(getDeviceType());
  }, []);

  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  const handleTouchStart = (e) => {
    if (disabled || !isMobile || pullState === 'refreshing') return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    setPullState('pulling');
  };

  const handleTouchMove = (e) => {
    if (disabled || !isMobile || !isDragging.current || pullState === 'refreshing') return;

    const deltaY = e.touches[0].clientY - startY.current;

    if (deltaY > 0) {
      e.preventDefault();
      
      const distance = Math.min(deltaY * 0.5, 120);
      setPullDistance(distance);
      
      if (distance >= threshold && pullState !== 'ready') {
        setPullState('ready');
        // Haptic feedback when ready to refresh
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else if (distance < threshold && pullState !== 'pulling') {
        setPullState('pulling');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isMobile || !isDragging.current) return;

    isDragging.current = false;

    if (pullState === 'ready') {
      setPullState('refreshing');
      
      try {
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setPullState('idle');
        setPullDistance(0);
      }
    } else {
      setPullState('idle');
      setPullDistance(0);
    }
  };

  const getIndicatorContent = () => {
    switch (pullState) {
      case 'pulling':
        return {
          icon: '↓',
          text: 'Pull to refresh',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        };
      case 'ready':
        return {
          icon: '↑',
          text: 'Release to refresh',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'refreshing':
        return {
          icon: <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />,
          text: 'Refreshing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      default:
        return null;
    }
  };

  const indicatorContent = getIndicatorContent();

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overscrollBehavior: 'none',
      }}
    >
      {/* Animated pull indicator */}
      {isMobile && indicatorContent && pullState !== 'idle' && (
        <div 
          className={`absolute top-0 left-0 right-0 flex items-center justify-center ${indicatorContent.bgColor} border-b border-gray-200 z-50`}
          style={{
            height: `${Math.max(pullDistance, pullState === 'refreshing' ? 60 : 0)}px`,
            transition: isDragging.current ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className={`flex flex-col items-center justify-center ${indicatorContent.color}`}>
            <div className="mb-2 text-2xl">
              {indicatorContent.icon}
            </div>
            <div className="text-sm font-medium">
              {indicatorContent.text}
            </div>
          </div>
        </div>
      )}

      {/* Content with smooth padding transition */}
      <div 
        style={{
          paddingTop: pullState === 'refreshing' ? '60px' : '0px',
          transition: 'padding-top 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;