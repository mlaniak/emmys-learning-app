import React, { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * FocusManager - Manages focus for modals, overlays, and complex components
 * Implements focus trapping and restoration
 */
const FocusManager = ({ 
  children, 
  trapFocus = false, 
  restoreFocus = true,
  autoFocus = true,
  className = '',
  ...props 
}) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const { setFocusTrap, removeFocusTrap, getFocusableElements } = useAccessibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Store previous focus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement;
    }

    // Set up focus trap
    if (trapFocus) {
      setFocusTrap(container);
    }

    // Auto focus first element
    if (autoFocus) {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        // Focus first focusable element, or container if none found
        focusableElements[0].focus();
      } else if (container.tabIndex >= 0) {
        container.focus();
      }
    }

    return () => {
      // Remove focus trap
      if (trapFocus) {
        removeFocusTrap(container);
      }

      // Restore previous focus
      if (restoreFocus && previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [trapFocus, restoreFocus, autoFocus, setFocusTrap, removeFocusTrap, getFocusableElements]);

  return (
    <div
      ref={containerRef}
      className={`focus-manager ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * FocusTrap - Simple focus trap component for modals and overlays
 */
export const FocusTrap = ({ children, active = true, ...props }) => {
  return (
    <FocusManager
      trapFocus={active}
      restoreFocus={active}
      autoFocus={active}
      {...props}
    >
      {children}
    </FocusManager>
  );
};

/**
 * AutoFocus - Component that automatically focuses its first focusable child
 */
export const AutoFocus = ({ children, delay = 0, ...props }) => {
  const containerRef = useRef(null);
  const { getFocusableElements } = useAccessibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusFirst = () => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    if (delay > 0) {
      const timer = setTimeout(focusFirst, delay);
      return () => clearTimeout(timer);
    } else {
      focusFirst();
    }
  }, [delay, getFocusableElements]);

  return (
    <div ref={containerRef} {...props}>
      {children}
    </div>
  );
};

export default FocusManager;