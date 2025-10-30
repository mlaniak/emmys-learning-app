/**
 * Accessibility Helper Functions
 * Common utilities for implementing accessibility features
 */

/**
 * Generate unique IDs for ARIA relationships
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = 'a11y') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create ARIA describedby relationship
 * @param {Element} element - Element to describe
 * @param {string} description - Description text
 * @returns {string} ID of description element
 */
export const addAriaDescription = (element, description) => {
  if (!element || !description) return null;

  const descId = generateId('desc');
  
  // Create description element
  const descElement = document.createElement('div');
  descElement.id = descId;
  descElement.className = 'sr-only';
  descElement.textContent = description;
  
  // Add to DOM
  document.body.appendChild(descElement);
  
  // Link to element
  const existingDescribedBy = element.getAttribute('aria-describedby');
  const newDescribedBy = existingDescribedBy 
    ? `${existingDescribedBy} ${descId}`
    : descId;
  element.setAttribute('aria-describedby', newDescribedBy);
  
  return descId;
};

/**
 * Create ARIA labelledby relationship
 * @param {Element} element - Element to label
 * @param {Element} labelElement - Label element
 * @returns {string} ID of label element
 */
export const addAriaLabel = (element, labelElement) => {
  if (!element || !labelElement) return null;

  let labelId = labelElement.id;
  if (!labelId) {
    labelId = generateId('label');
    labelElement.id = labelId;
  }
  
  const existingLabelledBy = element.getAttribute('aria-labelledby');
  const newLabelledBy = existingLabelledBy 
    ? `${existingLabelledBy} ${labelId}`
    : labelId;
  element.setAttribute('aria-labelledby', newLabelledBy);
  
  return labelId;
};

/**
 * Set up roving tabindex for a group of elements
 * @param {NodeList|Array} elements - Elements to manage
 * @param {number} initialIndex - Initially focused index
 */
export const setupRovingTabIndex = (elements, initialIndex = 0) => {
  if (!elements || elements.length === 0) return;

  Array.from(elements).forEach((element, index) => {
    element.tabIndex = index === initialIndex ? 0 : -1;
    element.setAttribute('data-roving-index', index);
  });
};

/**
 * Move roving tabindex focus
 * @param {NodeList|Array} elements - Elements being managed
 * @param {number} newIndex - New index to focus
 */
export const moveRovingFocus = (elements, newIndex) => {
  if (!elements || elements.length === 0) return;

  const elementsArray = Array.from(elements);
  
  // Wrap around if necessary
  if (newIndex < 0) newIndex = elementsArray.length - 1;
  if (newIndex >= elementsArray.length) newIndex = 0;

  // Update tabindex values
  elementsArray.forEach((element, index) => {
    element.tabIndex = index === newIndex ? 0 : -1;
  });

  // Focus new element
  if (elementsArray[newIndex]) {
    elementsArray[newIndex].focus();
  }

  return newIndex;
};

/**
 * Check if element is visible to screen readers
 * @param {Element} element - Element to check
 * @returns {boolean} Whether element is visible to screen readers
 */
export const isVisibleToScreenReader = (element) => {
  if (!element) return false;

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') return false;

  // Check if element or parent has display: none or visibility: hidden
  let current = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    current = current.parentElement;
  }

  return true;
};

/**
 * Get all focusable elements within a container
 * @param {Element} container - Container element
 * @returns {Array} Array of focusable elements
 */
export const getFocusableElements = (container) => {
  if (!container) return [];

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    '[data-interactive]',
    '[role="button"]:not([disabled])',
    '[role="tab"]:not([disabled])',
    '[role="menuitem"]:not([disabled])',
    '[role="option"]:not([disabled])'
  ];

  const elements = container.querySelectorAll(focusableSelectors.join(', '));
  
  return Array.from(elements).filter(element => {
    return isVisibleToScreenReader(element) && 
           !element.hasAttribute('disabled') &&
           element.tabIndex !== -1;
  });
};

/**
 * Trap focus within a container
 * @param {Element} container - Container to trap focus within
 * @returns {Function} Cleanup function
 */
export const trapFocus = (container) => {
  if (!container) return () => {};

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  // Focus first element
  firstElement.focus();

  // Add event listener
  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 * @param {number} delay - Delay before announcement
 */
export const announceToScreenReader = (message, priority = 'polite', delay = 100) => {
  if (!message) return;

  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;

  document.body.appendChild(announcer);

  setTimeout(() => {
    announcer.textContent = message;
    
    // Clean up after announcement
    setTimeout(() => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    }, 3000);
  }, delay);
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} Whether user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user is using high contrast mode
 * @returns {boolean} Whether user is using high contrast mode
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches ||
         window.matchMedia('(forced-colors: active)').matches;
};

/**
 * Get appropriate ARIA role for interactive element
 * @param {string} elementType - Type of element
 * @param {Object} options - Additional options
 * @returns {string} Appropriate ARIA role
 */
export const getAriaRole = (elementType, options = {}) => {
  const { interactive, clickable, expandable, selectable } = options;

  switch (elementType) {
    case 'button':
      return 'button';
    case 'link':
      return 'link';
    case 'tab':
      return 'tab';
    case 'menuitem':
      return 'menuitem';
    case 'option':
      return 'option';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    case 'slider':
      return 'slider';
    case 'textbox':
      return 'textbox';
    case 'combobox':
      return 'combobox';
    case 'listbox':
      return 'listbox';
    case 'grid':
      return 'grid';
    case 'tree':
      return 'tree';
    default:
      if (clickable || interactive) return 'button';
      if (expandable) return 'button';
      if (selectable) return 'option';
      return null;
  }
};

/**
 * Create accessible button attributes
 * @param {Object} options - Button options
 * @returns {Object} Button attributes
 */
export const createButtonAttributes = (options = {}) => {
  const {
    label,
    description,
    expanded,
    pressed,
    disabled,
    controls,
    describedBy
  } = options;

  const attributes = {
    role: 'button',
    tabIndex: disabled ? -1 : 0
  };

  if (label) attributes['aria-label'] = label;
  if (description) attributes['aria-describedby'] = addAriaDescription(null, description);
  if (expanded !== undefined) attributes['aria-expanded'] = expanded;
  if (pressed !== undefined) attributes['aria-pressed'] = pressed;
  if (disabled) attributes['aria-disabled'] = true;
  if (controls) attributes['aria-controls'] = controls;
  if (describedBy) attributes['aria-describedby'] = describedBy;

  return attributes;
};

/**
 * Create accessible form field attributes
 * @param {Object} options - Field options
 * @returns {Object} Field attributes
 */
export const createFieldAttributes = (options = {}) => {
  const {
    label,
    description,
    required,
    invalid,
    errorMessage,
    placeholder
  } = options;

  const attributes = {};

  if (label) {
    const labelId = generateId('label');
    attributes['aria-labelledby'] = labelId;
  }
  
  if (description) {
    const descId = generateId('desc');
    attributes['aria-describedby'] = descId;
  }
  
  if (required) attributes['aria-required'] = true;
  if (invalid) attributes['aria-invalid'] = true;
  if (placeholder) attributes['placeholder'] = placeholder;
  
  if (errorMessage && invalid) {
    const errorId = generateId('error');
    attributes['aria-describedby'] = attributes['aria-describedby'] 
      ? `${attributes['aria-describedby']} ${errorId}`
      : errorId;
  }

  return attributes;
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};