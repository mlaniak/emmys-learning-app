import React, { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * KeyboardNavigationHelper - Enhances keyboard navigation for interactive elements
 * Supports grid, list, and tab navigation patterns
 */
const KeyboardNavigationHelper = ({ 
  children, 
  navigationMode = 'list', // 'list', 'grid', 'tabs'
  gridColumns = 3,
  className = '',
  ariaLabel,
  onNavigate,
  ...props 
}) => {
  const containerRef = useRef(null);
  const { preferences, announce } = useAccessibility();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !preferences.keyboardNavigation) return;

    // Set navigation attributes
    container.setAttribute('data-keyboard-navigation', navigationMode);
    if (navigationMode === 'grid') {
      container.setAttribute('data-grid-columns', gridColumns.toString());
    }

    // Add ARIA attributes based on navigation mode
    switch (navigationMode) {
      case 'grid':
        container.setAttribute('role', 'grid');
        container.setAttribute('aria-label', ariaLabel || 'Interactive grid');
        break;
      case 'tabs':
        container.setAttribute('role', 'tablist');
        container.setAttribute('aria-label', ariaLabel || 'Tab navigation');
        break;
      case 'list':
      default:
        container.setAttribute('role', 'list');
        container.setAttribute('aria-label', ariaLabel || 'Interactive list');
        break;
    }

    // Handle navigation events
    const handleKeyDown = (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        return;
      }

      const focusableElements = container.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([disabled]), [role="button"]:not([disabled]), [data-interactive]');
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      const totalElements = focusableElements.length;

      // Handle Home and End keys
      if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = totalElements - 1;
      } else {
        // Handle arrow keys based on navigation mode
        switch (navigationMode) {
          case 'grid':
            nextIndex = handleGridNavigation(e.key, currentIndex, totalElements, gridColumns);
            break;
          case 'tabs':
            nextIndex = handleTabNavigation(e.key, currentIndex, totalElements);
            break;
          case 'list':
          default:
            nextIndex = handleListNavigation(e.key, currentIndex, totalElements);
            break;
        }
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
        e.preventDefault();
        
        // Announce navigation if callback provided
        if (onNavigate) {
          onNavigate(nextIndex, focusableElements[nextIndex]);
        }
        
        // Announce position for screen readers
        if (preferences.announcements) {
          const element = focusableElements[nextIndex];
          const label = element.getAttribute('aria-label') || 
                       element.textContent || 
                       element.getAttribute('alt') || 
                       'Interactive element';
          announce(`${label}, ${nextIndex + 1} of ${totalElements}`);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigationMode, gridColumns, preferences.keyboardNavigation, ariaLabel, onNavigate, announce]);

  // Grid navigation logic
  const handleGridNavigation = (key, currentIndex, totalElements, columns) => {
    const rows = Math.ceil(totalElements / columns);
    const currentRow = Math.floor(currentIndex / columns);
    const currentCol = currentIndex % columns;

    switch (key) {
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : totalElements - 1;
      case 'ArrowRight':
        return currentIndex < totalElements - 1 ? currentIndex + 1 : 0;
      case 'ArrowUp':
        if (currentRow > 0) {
          return (currentRow - 1) * columns + currentCol;
        } else {
          // Go to last row, same column
          const lastRow = rows - 1;
          const targetIndex = lastRow * columns + currentCol;
          return targetIndex < totalElements ? targetIndex : totalElements - 1;
        }
      case 'ArrowDown':
        if (currentRow < rows - 1) {
          const targetIndex = (currentRow + 1) * columns + currentCol;
          return targetIndex < totalElements ? targetIndex : totalElements - 1;
        } else {
          // Go to first row, same column
          return currentCol < totalElements ? currentCol : 0;
        }
      default:
        return currentIndex;
    }
  };

  // Tab navigation logic
  const handleTabNavigation = (key, currentIndex, totalElements) => {
    switch (key) {
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : totalElements - 1;
      case 'ArrowRight':
        return currentIndex < totalElements - 1 ? currentIndex + 1 : 0;
      default:
        return currentIndex;
    }
  };

  // List navigation logic
  const handleListNavigation = (key, currentIndex, totalElements) => {
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : totalElements - 1;
      case 'ArrowDown':
      case 'ArrowRight':
        return currentIndex < totalElements - 1 ? currentIndex + 1 : 0;
      default:
        return currentIndex;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`keyboard-navigation-container ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default KeyboardNavigationHelper;