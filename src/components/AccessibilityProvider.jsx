import React, { createContext, useContext, useEffect, useState } from 'react';
import accessibilityManager from '../utils/accessibilityManager';
import altTextManager from '../utils/altTextManager';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('accessibility-preferences');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      reducedMotion: false,
      textScaling: 1,
      screenReaderMode: false,
      keyboardNavigation: false,
      focusIndicators: true,
      announcements: true,
      alternativeText: true,
      enhancedFocus: true
    };
  });

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);

  // Save preferences to localStorage
  const savePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('accessibility-preferences', JSON.stringify(newPreferences));
  };

  // Update individual preference
  const updatePreference = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  // Announce message to screen readers
  const announce = (message, priority = 'polite') => {
    if (preferences.announcements) {
      accessibilityManager.announce(message, priority);
    }
  };

  // Announce page change
  const announcePageChange = (pageName) => {
    if (preferences.announcements) {
      accessibilityManager.announcePageChange(pageName);
    }
  };

  // Announce loading state
  const announceLoadingState = (isLoading, context) => {
    if (preferences.announcements) {
      accessibilityManager.announceLoadingState(isLoading, context);
    }
  };

  // Announce success
  const announceSuccess = (message) => {
    if (preferences.announcements) {
      accessibilityManager.announceSuccess(message);
    }
  };

  // Announce form errors
  const announceFormErrors = (errors) => {
    if (preferences.announcements) {
      accessibilityManager.announceFormErrors(errors);
    }
  };

  // Set focus trap
  const setFocusTrap = (element) => {
    accessibilityManager.setFocusTrap(element);
  };

  // Remove focus trap
  const removeFocusTrap = (element) => {
    accessibilityManager.removeFocusTrap(element);
  };

  // Get focusable elements
  const getFocusableElements = (container) => {
    return accessibilityManager.getFocusableElements(container);
  };

  // Enhance page accessibility
  const enhancePageAccessibility = (container, context) => {
    altTextManager.enhancePageAccessibility(container, context);
  };

  // Generate alt text for element
  const generateAltText = (element, context) => {
    return altTextManager.generateAltText(element, context);
  };

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // High contrast mode
    root.classList.toggle('high-contrast', preferences.highContrast);
    body.classList.toggle('high-contrast', preferences.highContrast);
    
    // Reduced motion
    root.classList.toggle('reduce-motion', preferences.reducedMotion);
    body.classList.toggle('reduce-motion', preferences.reducedMotion);
    
    // Text scaling with responsive support
    root.style.setProperty('--text-scale', preferences.textScaling);
    
    // Apply text scaling class for better CSS targeting
    body.classList.remove('text-scale-small', 'text-scale-normal', 'text-scale-large', 'text-scale-extra-large', 'text-scale-maximum');
    if (preferences.textScaling <= 0.875) {
      body.classList.add('text-scale-small');
    } else if (preferences.textScaling === 1) {
      body.classList.add('text-scale-normal');
    } else if (preferences.textScaling === 1.2) {
      body.classList.add('text-scale-large');
    } else if (preferences.textScaling === 1.5) {
      body.classList.add('text-scale-extra-large');
    } else if (preferences.textScaling >= 2) {
      body.classList.add('text-scale-maximum');
    }
    
    // Apply text-scalable class to body for global scaling
    body.classList.toggle('text-scalable', preferences.textScaling !== 1);
    
    // Screen reader mode
    root.classList.toggle('screen-reader-mode', preferences.screenReaderMode);
    body.classList.toggle('screen-reader-mode', preferences.screenReaderMode);
    
    // Enhanced focus indicators
    root.classList.toggle('enhanced-focus', preferences.focusIndicators || preferences.enhancedFocus);
    body.classList.toggle('enhanced-focus', preferences.focusIndicators || preferences.enhancedFocus);
    
    // Keyboard navigation
    root.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);
    body.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);
    
    // Alternative text support
    body.classList.toggle('show-alt-text', preferences.alternativeText);
    
    // Update CSS custom properties for better theming
    if (preferences.highContrast) {
      root.style.setProperty('--focus-width', '4px');
      root.style.setProperty('--focus-offset', '3px');
    } else {
      root.style.setProperty('--focus-width', '3px');
      root.style.setProperty('--focus-offset', '2px');
    }
    
    // Announce preference changes to screen readers
    if (preferences.announcements) {
      const changes = [];
      if (preferences.highContrast) changes.push('high contrast mode');
      if (preferences.reducedMotion) changes.push('reduced motion');
      if (preferences.textScaling !== 1) changes.push(`text scaling at ${Math.round(preferences.textScaling * 100)}%`);
      if (preferences.enhancedFocus) changes.push('enhanced focus indicators');
      
      if (changes.length > 0) {
        setTimeout(() => {
          accessibilityManager.announce(`Accessibility settings applied: ${changes.join(', ')}`, 'polite');
        }, 500);
      }
    }
  }, [preferences]);

  // Detect screen reader usage
  useEffect(() => {
    const detectScreenReader = () => {
      setIsScreenReaderActive(accessibilityManager.screenReaderDetected);
    };

    // Initial detection
    detectScreenReader();

    // Listen for keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsKeyboardNavigating(true);
        updatePreference('keyboardNavigation', true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardNavigating(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Initialize accessibility features
  useEffect(() => {
    // Create skip links
    accessibilityManager.createSkipLinks();
    
    // Add landmark roles
    accessibilityManager.addLandmarkRoles();
    
    // Initialize alternative text management
    altTextManager.initAltTextManager({
      autoEnhance: true,
      showOverlays: preferences.alternativeText,
      context: { subject: 'learning' }
    });

    return () => {
      // Cleanup if needed
    };
  }, [preferences.alternativeText]);

  const value = {
    preferences,
    updatePreference,
    savePreferences,
    isScreenReaderActive,
    isKeyboardNavigating,
    announce,
    announcePageChange,
    announceLoadingState,
    announceSuccess,
    announceFormErrors,
    setFocusTrap,
    removeFocusTrap,
    getFocusableElements,
    enhancePageAccessibility,
    generateAltText
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};