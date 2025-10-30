/**
 * Accessibility Manager - Core accessibility utilities and management
 * Handles ARIA announcements, focus management, keyboard navigation, and screen reader support
 */

class AccessibilityManager {
  constructor() {
    this.announcer = null;
    this.focusHistory = [];
    this.currentFocusIndex = -1;
    this.keyboardNavigationEnabled = false;
    this.screenReaderDetected = false;
    this.reducedMotionPreferred = false;
    
    this.init();
  }

  /**
   * Initialize accessibility manager
   */
  init() {
    this.createAnnouncer();
    this.detectScreenReader();
    this.detectReducedMotion();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  createAnnouncer() {
    if (this.announcer || typeof document === 'undefined') return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('class', 'sr-only');
    this.announcer.style.cssText = `
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
    
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.announcer || !message) return;

    // Clear previous message
    this.announcer.textContent = '';
    
    // Set priority
    this.announcer.setAttribute('aria-live', priority);
    
    // Announce new message with slight delay to ensure screen readers pick it up
    setTimeout(() => {
      this.announcer.textContent = message;
    }, 100);

    // Clear message after announcement to avoid repetition
    setTimeout(() => {
      if (this.announcer.textContent === message) {
        this.announcer.textContent = '';
      }
    }, 3000);
  }

  /**
   * Detect if screen reader is likely being used
   */
  detectScreenReader() {
    // Check if matchMedia is available (for testing environments)
    if (typeof window === 'undefined' || !window.matchMedia) {
      this.screenReaderDetected = false;
      return;
    }

    // Check for common screen reader indicators
    const indicators = [
      // Check for high contrast mode (often used with screen readers)
      window.matchMedia('(prefers-contrast: high)').matches,
      // Check for reduced motion (often used with assistive tech)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // Check for forced colors (Windows high contrast)
      window.matchMedia('(forced-colors: active)').matches,
      // Check for inverted colors
      window.matchMedia('(inverted-colors: inverted)').matches
    ];

    this.screenReaderDetected = indicators.some(indicator => indicator);

    // Listen for keyboard navigation as another indicator
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          this.screenReaderDetected = true;
          this.keyboardNavigationEnabled = true;
        }
      }, { once: true });
    }
  }

  /**
   * Detect reduced motion preference
   */
  detectReducedMotion() {
    // Check if matchMedia is available (for testing environments)
    if (typeof window === 'undefined' || !window.matchMedia) {
      this.reducedMotionPreferred = false;
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionPreferred = mediaQuery.matches;

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotionPreferred = e.matches;
      document.body.classList.toggle('reduce-motion', e.matches);
    });

    // Apply initial state
    document.body.classList.toggle('reduce-motion', this.reducedMotionPreferred);
  }

  /**
   * Setup keyboard navigation support
   */
  setupKeyboardNavigation() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Enable keyboard navigation on first tab
      if (e.key === 'Tab') {
        this.keyboardNavigationEnabled = true;
        document.body.classList.add('keyboard-navigation');
      }

      // Handle escape key for modal/overlay dismissal
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }

      // Handle arrow keys for custom navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKeys(e);
      }

      // Handle Enter and Space for activation
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivationKeys(e);
      }
    });

    // Disable keyboard navigation indicator on mouse use
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    if (typeof document === 'undefined') return;

    // Track focus changes
    document.addEventListener('focusin', (e) => {
      this.updateFocusHistory(e.target);
    });

    // Handle focus trapping for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleFocusTrapping(e);
      }
    });
  }

  /**
   * Update focus history for navigation
   * @param {Element} element - Focused element
   */
  updateFocusHistory(element) {
    if (!element || element === document.body) return;

    // Remove element if it already exists in history
    const existingIndex = this.focusHistory.findIndex(item => item.element === element);
    if (existingIndex !== -1) {
      this.focusHistory.splice(existingIndex, 1);
    }

    // Add to beginning of history
    this.focusHistory.unshift({
      element,
      timestamp: Date.now(),
      selector: this.getElementSelector(element)
    });

    // Limit history size
    if (this.focusHistory.length > 10) {
      this.focusHistory = this.focusHistory.slice(0, 10);
    }

    this.currentFocusIndex = 0;
  }

  /**
   * Get CSS selector for element (for debugging/logging)
   * @param {Element} element - Element to get selector for
   * @returns {string} CSS selector
   */
  getElementSelector(element) {
    if (!element) return '';
    
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Handle escape key for dismissing overlays
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleEscapeKey(e) {
    // Find the topmost modal or overlay
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, .overlay');
    const topModal = Array.from(modals).pop(); // Get last (topmost) modal

    if (topModal) {
      // Try to find and trigger close button
      const closeButton = topModal.querySelector('[aria-label*="close"], [aria-label*="Close"], .close-button, [data-dismiss]');
      if (closeButton) {
        closeButton.click();
        e.preventDefault();
      }
    }
  }

  /**
   * Handle arrow keys for custom navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowKeys(e) {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    // Check if we're in a custom navigable container
    const navigableContainer = activeElement.closest('[data-keyboard-navigation]');
    if (!navigableContainer) return;

    const navigationType = navigableContainer.getAttribute('data-keyboard-navigation');
    const focusableElements = this.getFocusableElements(navigableContainer);
    const currentIndex = Array.from(focusableElements).indexOf(activeElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (navigationType) {
      case 'grid':
        nextIndex = this.handleGridNavigation(e.key, currentIndex, focusableElements, navigableContainer);
        break;
      case 'list':
        nextIndex = this.handleListNavigation(e.key, currentIndex, focusableElements);
        break;
      case 'tabs':
        nextIndex = this.handleTabNavigation(e.key, currentIndex, focusableElements);
        break;
    }

    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
      e.preventDefault();
    }
  }

  /**
   * Handle grid navigation (2D)
   * @param {string} key - Arrow key pressed
   * @param {number} currentIndex - Current element index
   * @param {NodeList} elements - Focusable elements
   * @param {Element} container - Container element
   * @returns {number} Next index
   */
  handleGridNavigation(key, currentIndex, elements, container) {
    const columns = parseInt(container.getAttribute('data-grid-columns') || '3');
    const rows = Math.ceil(elements.length / columns);
    const currentRow = Math.floor(currentIndex / columns);
    const currentCol = currentIndex % columns;

    switch (key) {
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      case 'ArrowRight':
        return currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      case 'ArrowUp':
        if (currentRow > 0) {
          return (currentRow - 1) * columns + currentCol;
        } else {
          // Go to last row, same column
          const lastRow = rows - 1;
          const targetIndex = lastRow * columns + currentCol;
          return targetIndex < elements.length ? targetIndex : elements.length - 1;
        }
      case 'ArrowDown':
        if (currentRow < rows - 1) {
          const targetIndex = (currentRow + 1) * columns + currentCol;
          return targetIndex < elements.length ? targetIndex : elements.length - 1;
        } else {
          // Go to first row, same column
          return currentCol;
        }
      default:
        return currentIndex;
    }
  }

  /**
   * Handle list navigation (1D)
   * @param {string} key - Arrow key pressed
   * @param {number} currentIndex - Current element index
   * @param {NodeList} elements - Focusable elements
   * @returns {number} Next index
   */
  handleListNavigation(key, currentIndex, elements) {
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      case 'ArrowDown':
      case 'ArrowRight':
        return currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      default:
        return currentIndex;
    }
  }

  /**
   * Handle tab navigation
   * @param {string} key - Arrow key pressed
   * @param {number} currentIndex - Current element index
   * @param {NodeList} elements - Focusable elements
   * @returns {number} Next index
   */
  handleTabNavigation(key, currentIndex, elements) {
    switch (key) {
      case 'ArrowLeft':
        return currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
      case 'ArrowRight':
        return currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
      default:
        return currentIndex;
    }
  }

  /**
   * Handle activation keys (Enter/Space)
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleActivationKeys(e) {
    const activeElement = document.activeElement;
    if (!activeElement) return;

    // Don't interfere with native button/link behavior
    if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
      return;
    }

    // Check if element has click handler or is marked as interactive
    const isInteractive = activeElement.hasAttribute('data-interactive') ||
                         activeElement.getAttribute('role') === 'button' ||
                         activeElement.hasAttribute('onclick') ||
                         activeElement.classList.contains('clickable');

    if (isInteractive) {
      activeElement.click();
      e.preventDefault();
    }
  }

  /**
   * Handle focus trapping for modals
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleFocusTrapping(e) {
    const modal = document.querySelector('[data-focus-trap="true"]');
    if (!modal) return;

    const focusableElements = this.getFocusableElements(modal);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

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
  }

  /**
   * Get all focusable elements within a container
   * @param {Element} container - Container element
   * @returns {NodeList} Focusable elements
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[data-interactive]',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])'
    ].join(', ');

    return container.querySelectorAll(focusableSelectors);
  }

  /**
   * Set focus trap on modal/overlay
   * @param {Element} element - Element to trap focus within
   */
  setFocusTrap(element) {
    if (!element) return;

    element.setAttribute('data-focus-trap', 'true');
    
    // Focus first focusable element
    const focusableElements = this.getFocusableElements(element);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Remove focus trap
   * @param {Element} element - Element to remove focus trap from
   */
  removeFocusTrap(element) {
    if (!element) return;

    element.removeAttribute('data-focus-trap');
    
    // Return focus to previous element if available
    if (this.focusHistory.length > 1) {
      const previousFocus = this.focusHistory[1];
      if (previousFocus.element && document.contains(previousFocus.element)) {
        previousFocus.element.focus();
      }
    }
  }

  /**
   * Create skip links for navigation
   */
  createSkipLinks() {
    // Only create skip links if they don't already exist
    if (typeof document === 'undefined' || document.querySelector('.skip-links')) {
      return;
    }

    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;

    // Insert at beginning of body
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Add landmark roles to page sections
   */
  addLandmarkRoles() {
    if (typeof document === 'undefined') return;

    // Main content
    const main = document.querySelector('main, #main, .main-content');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
      main.id = main.id || 'main-content';
    }

    // Navigation
    const nav = document.querySelector('nav, .navigation, .nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.id = nav.id || 'navigation';
    }

    // Footer
    const footer = document.querySelector('footer, .footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
      footer.id = footer.id || 'footer';
    }

    // Header/Banner
    const header = document.querySelector('header, .header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }
  }

  /**
   * Announce page changes for single-page applications
   * @param {string} pageName - Name of the new page/view
   */
  announcePageChange(pageName) {
    this.announce(`Navigated to ${pageName}`, 'polite');
    
    // Update document title for screen readers
    if (pageName && !document.title.includes(pageName)) {
      document.title = `${pageName} - Emmy's Learning Adventure`;
    }
  }

  /**
   * Announce loading states
   * @param {boolean} isLoading - Whether content is loading
   * @param {string} context - Context of what's loading
   */
  announceLoadingState(isLoading, context = 'content') {
    if (isLoading) {
      this.announce(`Loading ${context}, please wait`, 'polite');
    } else {
      this.announce(`${context} loaded`, 'polite');
    }
  }

  /**
   * Announce form validation errors
   * @param {Array} errors - Array of error messages
   */
  announceFormErrors(errors) {
    if (!errors || errors.length === 0) return;

    const errorMessage = errors.length === 1 
      ? `Error: ${errors[0]}`
      : `${errors.length} errors found: ${errors.join(', ')}`;
    
    this.announce(errorMessage, 'assertive');
  }

  /**
   * Announce success messages
   * @param {string} message - Success message
   */
  announceSuccess(message) {
    this.announce(`Success: ${message}`, 'polite');
  }

  /**
   * Clean up accessibility manager
   */
  destroy() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
    this.announcer = null;
    this.focusHistory = [];
  }
}

// Create singleton instance lazily
let accessibilityManager = null;

const getAccessibilityManager = () => {
  if (!accessibilityManager) {
    accessibilityManager = new AccessibilityManager();
  }
  return accessibilityManager;
};

export default getAccessibilityManager();