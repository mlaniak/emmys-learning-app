import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * RovingTabIndex - Implements roving tabindex pattern for complex interactive components
 * Only one element in the group is tabbable at a time, arrow keys move focus
 */
const RovingTabIndex = ({ 
  children, 
  orientation = 'horizontal', // 'horizontal' | 'vertical' | 'both'
  wrap = true, // Whether to wrap around at edges
  defaultIndex = 0,
  onFocusChange,
  className = '',
  role = 'group',
  ariaLabel,
  ...props 
}) => {
  const containerRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(defaultIndex);
  const [items, setItems] = useState([]);
  const { announce, preferences } = useAccessibility();

  // Update items when children change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableItems = Array.from(
      container.querySelectorAll('[data-roving-item]')
    );
    setItems(focusableItems);

    // Set initial tabindex values
    focusableItems.forEach((item, index) => {
      item.tabIndex = index === focusedIndex ? 0 : -1;
    });
  }, [children, focusedIndex]);

  // Move focus to specific index
  const moveFocus = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= items.length) {
      if (!wrap) return;
      newIndex = newIndex < 0 ? items.length - 1 : 0;
    }

    // Update tabindex values
    items.forEach((item, index) => {
      item.tabIndex = index === newIndex ? 0 : -1;
    });

    // Focus the new item
    if (items[newIndex]) {
      items[newIndex].focus();
      setFocusedIndex(newIndex);
      
      // Announce for screen readers
      if (preferences.announcements) {
        const label = items[newIndex].getAttribute('aria-label') || 
                     items[newIndex].textContent || 
                     'Item';
        announce(`${label}, ${newIndex + 1} of ${items.length}`);
      }
      
      // Call callback
      if (onFocusChange) {
        onFocusChange(newIndex, items[newIndex]);
      }
    }
  }, [items, wrap, announce, preferences.announcements, onFocusChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const currentIndex = focusedIndex;
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex + 1;
          e.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex - 1;
          e.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex + 1;
          e.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex - 1;
          e.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      moveFocus(newIndex);
    }
  }, [focusedIndex, items.length, orientation, moveFocus]);

  // Handle focus events to update current index
  const handleFocus = useCallback((e) => {
    const focusedItem = e.target.closest('[data-roving-item]');
    if (focusedItem) {
      const newIndex = items.indexOf(focusedItem);
      if (newIndex !== -1 && newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        
        // Update tabindex values
        items.forEach((item, index) => {
          item.tabIndex = index === newIndex ? 0 : -1;
        });
      }
    }
  }, [items, focusedIndex]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focusin', handleFocus);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focusin', handleFocus);
    };
  }, [handleKeyDown, handleFocus]);

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      className={`roving-tabindex ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * RovingTabIndexItem - Individual item within a roving tabindex group
 */
export const RovingTabIndexItem = ({ 
  children, 
  className = '',
  disabled = false,
  ...props 
}) => {
  return (
    <div
      data-roving-item
      className={`roving-tabindex-item ${disabled ? 'disabled' : ''} ${className}`}
      tabIndex={-1}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Toolbar - Specific implementation for toolbar pattern
 */
export const Toolbar = ({ children, ariaLabel = 'Toolbar', ...props }) => (
  <RovingTabIndex
    role="toolbar"
    orientation="horizontal"
    ariaLabel={ariaLabel}
    {...props}
  >
    {children}
  </RovingTabIndex>
);

/**
 * TabList - Specific implementation for tab list pattern
 */
export const TabList = ({ children, ariaLabel = 'Tabs', ...props }) => (
  <RovingTabIndex
    role="tablist"
    orientation="horizontal"
    ariaLabel={ariaLabel}
    {...props}
  >
    {children}
  </RovingTabIndex>
);

/**
 * MenuBar - Specific implementation for menu bar pattern
 */
export const MenuBar = ({ children, ariaLabel = 'Menu', ...props }) => (
  <RovingTabIndex
    role="menubar"
    orientation="horizontal"
    ariaLabel={ariaLabel}
    {...props}
  >
    {children}
  </RovingTabIndex>
);

/**
 * Grid - Specific implementation for grid pattern
 */
export const Grid = ({ 
  children, 
  columns = 3, 
  ariaLabel = 'Grid', 
  ...props 
}) => {
  const handleKeyDown = useCallback((e, currentIndex, items) => {
    const rows = Math.ceil(items.length / columns);
    const currentRow = Math.floor(currentIndex / columns);
    const currentCol = currentIndex % columns;
    
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
        if (currentRow < rows - 1) {
          const targetIndex = (currentRow + 1) * columns + currentCol;
          newIndex = targetIndex < items.length ? targetIndex : items.length - 1;
        } else {
          newIndex = currentCol < items.length ? currentCol : 0;
        }
        break;
      case 'ArrowUp':
        if (currentRow > 0) {
          newIndex = (currentRow - 1) * columns + currentCol;
        } else {
          const lastRow = rows - 1;
          const targetIndex = lastRow * columns + currentCol;
          newIndex = targetIndex < items.length ? targetIndex : items.length - 1;
        }
        break;
      default:
        return currentIndex;
    }

    return newIndex;
  }, [columns]);

  return (
    <RovingTabIndex
      role="grid"
      orientation="both"
      ariaLabel={ariaLabel}
      className={`grid-${columns}-columns`}
      {...props}
    >
      {children}
    </RovingTabIndex>
  );
};

export default RovingTabIndex;