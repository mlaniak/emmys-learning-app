import React, { forwardRef, useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * Higher-order component that adds accessibility features to any component
 * @param {React.Component} WrappedComponent - Component to enhance
 * @param {Object} options - Accessibility options
 */
const withAccessibility = (WrappedComponent, options = {}) => {
  const {
    // ARIA attributes
    role,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaExpanded,
    ariaSelected,
    ariaChecked,
    ariaDisabled,
    ariaHidden,
    ariaLive,
    ariaAtomic,
    
    // Keyboard navigation
    tabIndex,
    keyboardNavigable = false,
    activationKeys = ['Enter', ' '],
    
    // Focus management
    autoFocus = false,
    focusOnMount = false,
    
    // Announcements
    announceOnMount,
    announceOnUpdate,
    
    // Interactive behavior
    interactive = false,
    clickable = false,
    
    // Semantic enhancements
    landmark,
    heading,
    headingLevel,
    
    // Custom handlers
    onKeyDown,
    onFocus,
    onBlur,
    onClick
  } = options;

  const AccessibleComponent = forwardRef((props, ref) => {
    const elementRef = useRef(null);
    const { announce, preferences } = useAccessibility();
    
    // Use forwarded ref or create our own
    const finalRef = ref || elementRef;

    // Handle mount announcements
    useEffect(() => {
      if (announceOnMount && preferences.announcements) {
        announce(announceOnMount);
      }
      
      if (focusOnMount && finalRef.current) {
        finalRef.current.focus();
      }
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      // Call original handler first
      if (onKeyDown) {
        onKeyDown(e);
      }
      
      // Handle activation keys for interactive elements
      if (interactive && activationKeys.includes(e.key)) {
        if (onClick) {
          onClick(e);
        } else if (finalRef.current && finalRef.current.click) {
          finalRef.current.click();
        }
        e.preventDefault();
      }
      
      // Pass to parent component
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    // Handle focus events
    const handleFocus = (e) => {
      if (onFocus) {
        onFocus(e);
      }
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e) => {
      if (onBlur) {
        onBlur(e);
      }
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // Handle click events
    const handleClick = (e) => {
      if (onClick) {
        onClick(e);
      }
      if (props.onClick) {
        props.onClick(e);
      }
    };

    // Build accessibility props
    const accessibilityProps = {
      ref: finalRef,
      
      // ARIA attributes
      ...(role && { role }),
      ...(ariaLabel && { 'aria-label': ariaLabel }),
      ...(ariaLabelledBy && { 'aria-labelledby': ariaLabelledBy }),
      ...(ariaDescribedBy && { 'aria-describedby': ariaDescribedBy }),
      ...(ariaExpanded !== undefined && { 'aria-expanded': ariaExpanded }),
      ...(ariaSelected !== undefined && { 'aria-selected': ariaSelected }),
      ...(ariaChecked !== undefined && { 'aria-checked': ariaChecked }),
      ...(ariaDisabled !== undefined && { 'aria-disabled': ariaDisabled }),
      ...(ariaHidden !== undefined && { 'aria-hidden': ariaHidden }),
      ...(ariaLive && { 'aria-live': ariaLive }),
      ...(ariaAtomic !== undefined && { 'aria-atomic': ariaAtomic }),
      
      // Keyboard navigation
      ...(tabIndex !== undefined && { tabIndex }),
      ...(keyboardNavigable && { tabIndex: tabIndex || 0 }),
      ...(interactive && { 'data-interactive': true }),
      ...(clickable && { 'data-interactive': true, role: role || 'button' }),
      
      // Event handlers
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick
    };

    // Handle semantic elements
    if (landmark) {
      accessibilityProps.role = landmark;
    }
    
    if (heading) {
      const HeadingTag = `h${headingLevel || 2}`;
      return (
        <HeadingTag {...accessibilityProps} {...props}>
          <WrappedComponent {...props} />
        </HeadingTag>
      );
    }

    return (
      <WrappedComponent
        {...props}
        {...accessibilityProps}
      />
    );
  });

  AccessibleComponent.displayName = `withAccessibility(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AccessibleComponent;
};

/**
 * Specific accessibility enhancers for common patterns
 */

// Button enhancer
export const withButtonAccessibility = (Component) => 
  withAccessibility(Component, {
    role: 'button',
    interactive: true,
    keyboardNavigable: true,
    activationKeys: ['Enter', ' ']
  });

// Link enhancer
export const withLinkAccessibility = (Component) => 
  withAccessibility(Component, {
    role: 'link',
    keyboardNavigable: true,
    activationKeys: ['Enter']
  });

// Tab enhancer
export const withTabAccessibility = (Component) => 
  withAccessibility(Component, {
    role: 'tab',
    keyboardNavigable: true,
    activationKeys: ['Enter', ' ']
  });

// Menu item enhancer
export const withMenuItemAccessibility = (Component) => 
  withAccessibility(Component, {
    role: 'menuitem',
    keyboardNavigable: true,
    activationKeys: ['Enter', ' ']
  });

// Card/tile enhancer
export const withCardAccessibility = (Component) => 
  withAccessibility(Component, {
    interactive: true,
    keyboardNavigable: true,
    activationKeys: ['Enter', ' ']
  });

// Form control enhancer
export const withFormControlAccessibility = (Component, controlType = 'textbox') => 
  withAccessibility(Component, {
    role: controlType,
    keyboardNavigable: true
  });

// Landmark enhancer
export const withLandmarkAccessibility = (Component, landmark) => 
  withAccessibility(Component, {
    landmark
  });

// Heading enhancer
export const withHeadingAccessibility = (Component, level = 2) => 
  withAccessibility(Component, {
    heading: true,
    headingLevel: level
  });

// Announcement enhancer
export const withAnnouncementAccessibility = (Component, announcement) => 
  withAccessibility(Component, {
    announceOnMount: announcement
  });

export default withAccessibility;