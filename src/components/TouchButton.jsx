import React, { useRef, useEffect, useState } from 'react';
import touchInteractionManager from '../utils/touchInteractionManager';
import { getTouchCapabilities, getDeviceType } from '../utils/responsiveUtils';

/**
 * TouchButton - Enhanced button component with comprehensive touch support
 * 
 * Features:
 * - Touch-optimized sizing and spacing
 * - Haptic feedback and animations
 * - Long-press context menus
 * - Accessibility support
 * - Multiple interaction types
 */
const TouchButton = ({
  children,
  onClick,
  onLongPress,
  onDoubleClick,
  contextMenuItems = [],
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  hapticType = 'button',
  animationType = 'press',
  className = '',
  style = {},
  ...props
}) => {
  const buttonRef = useRef(null);
  const [isPressed, setIsPressed] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {}
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities()
    });
  }, []);

  useEffect(() => {
    if (!buttonRef.current || disabled) return;

    const element = buttonRef.current;
    
    const touchHandlers = {
      onTouchStart: () => {
        setIsPressed(true);
      },
      
      onTouchEnd: () => {
        setIsPressed(false);
      },
      
      onTap: (data) => {
        if (onClick && !loading) {
          touchInteractionManager.triggerHaptic(hapticType);
          onClick(data);
        }
      },
      
      onDoubleTap: (data) => {
        if (onDoubleClick && !loading) {
          touchInteractionManager.triggerHaptic('selection');
          onDoubleClick(data);
        }
      },
      
      onLongPress: (data) => {
        if (contextMenuItems.length > 0) {
          const showMenu = touchInteractionManager.createContextMenu(
            element,
            contextMenuItems,
            { hapticType: 'contextMenu' }
          );
          showMenu(data.x, data.y);
        } else if (onLongPress && !loading) {
          touchInteractionManager.triggerHaptic('longPress');
          onLongPress(data);
        }
      }
    };

    const cleanup = touchInteractionManager.addTouchSupport(element, touchHandlers);
    
    return cleanup;
  }, [onClick, onLongPress, onDoubleClick, contextMenuItems, disabled, loading, hapticType]);

  // Get button classes based on variant and size
  const getButtonClasses = () => {
    const baseClasses = 'relative overflow-hidden transition-all duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
      success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
      outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500',
      ghost: 'text-blue-500 hover:bg-blue-50 focus:ring-blue-500'
    };

    const sizeClasses = {
      small: 'px-3 py-2 text-sm min-h-[36px]',
      medium: 'px-4 py-3 text-base min-h-[44px]',
      large: 'px-6 py-4 text-lg min-h-[52px]',
      xlarge: 'px-8 py-5 text-xl min-h-[60px]'
    };

    // Touch-specific adjustments
    const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';
    const touchClasses = isMobile ? 'active:scale-95' : 'hover:scale-105';
    
    const pressedClasses = isPressed ? 'scale-95 brightness-90' : '';

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${touchClasses} ${pressedClasses} ${className}`;
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
  );

  // Long press indicator
  const LongPressIndicator = () => (
    contextMenuItems.length > 0 && (
      <div className="absolute top-1 right-1 w-2 h-2 bg-current opacity-30 rounded-full" />
    )
  );

  return (
    <button
      ref={buttonRef}
      className={getButtonClasses()}
      disabled={disabled || loading}
      style={{
        touchAction: 'manipulation', // Prevents double-tap zoom
        WebkitTapHighlightColor: 'transparent', // Removes default touch highlight
        ...style
      }}
      {...props}
    >
      <LongPressIndicator />
      
      <div className="flex items-center justify-center">
        {loading && <LoadingSpinner />}
        {children}
      </div>
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 pointer-events-none" />
    </button>
  );
};

/**
 * TouchIconButton - Icon-only button optimized for touch
 */
export const TouchIconButton = ({
  icon,
  label,
  size = 'medium',
  variant = 'ghost',
  ...props
}) => {
  const sizeMap = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <TouchButton
      variant={variant}
      size={size}
      className={`${sizeMap[size]} p-0 rounded-full`}
      aria-label={label}
      {...props}
    >
      <span className="text-xl">{icon}</span>
    </TouchButton>
  );
};

/**
 * TouchToggleButton - Toggle button with touch support
 */
export const TouchToggleButton = ({
  checked,
  onChange,
  onLabel = 'On',
  offLabel = 'Off',
  onIcon = '✓',
  offIcon = '✗',
  ...props
}) => {
  const handleToggle = () => {
    if (onChange) {
      onChange(!checked);
    }
  };

  return (
    <TouchButton
      onClick={handleToggle}
      variant={checked ? 'success' : 'secondary'}
      hapticType={checked ? 'success' : 'tap'}
      {...props}
    >
      <span className="mr-2">{checked ? onIcon : offIcon}</span>
      {checked ? onLabel : offLabel}
    </TouchButton>
  );
};

/**
 * TouchButtonGroup - Group of related touch buttons
 */
export const TouchButtonGroup = ({
  buttons,
  orientation = 'horizontal',
  spacing = 'normal',
  className = '',
  ...props
}) => {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-4'
  };

  return (
    <div
      className={`flex ${orientationClasses[orientation]} ${spacingClasses[spacing]} ${className}`}
      {...props}
    >
      {buttons.map((button, index) => (
        <TouchButton
          key={button.key || index}
          {...button}
        />
      ))}
    </div>
  );
};

/**
 * TouchFloatingActionButton - Floating action button with touch support
 */
export const TouchFloatingActionButton = ({
  icon,
  label,
  position = 'bottom-right',
  contextMenuItems = [],
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <TouchButton
      variant="primary"
      size="large"
      contextMenuItems={contextMenuItems}
      className={`${positionClasses[position]} w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-50 ${className}`}
      aria-label={label}
      {...props}
    >
      <span className="text-2xl">{icon}</span>
    </TouchButton>
  );
};

export default TouchButton;