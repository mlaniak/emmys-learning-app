/**
 * Alternative Text Manager
 * Utilities for managing and enhancing alternative text for images and interactive elements
 */

/**
 * Default alternative text for common educational content
 */
const DEFAULT_ALT_TEXT = {
  // Educational subjects
  math: 'Math problem or equation',
  reading: 'Reading exercise or text',
  phonics: 'Phonics lesson or sound exercise',
  spelling: 'Spelling word or exercise',
  science: 'Science concept or experiment',
  geography: 'Geographic location or map',
  history: 'Historical event or figure',
  art: 'Art project or creative activity',
  
  // UI elements
  button: 'Interactive button',
  link: 'Navigation link',
  menu: 'Menu option',
  close: 'Close button',
  back: 'Back button',
  next: 'Next button',
  previous: 'Previous button',
  home: 'Home button',
  settings: 'Settings button',
  help: 'Help button',
  
  // Game elements
  correct: 'Correct answer indicator',
  incorrect: 'Incorrect answer indicator',
  star: 'Achievement star',
  trophy: 'Achievement trophy',
  badge: 'Achievement badge',
  progress: 'Progress indicator',
  score: 'Score display',
  
  // Media
  video: 'Educational video',
  audio: 'Audio content',
  image: 'Educational image',
  diagram: 'Educational diagram',
  chart: 'Data chart or graph',
  
  // Loading states
  loading: 'Content loading',
  spinner: 'Loading indicator',
  placeholder: 'Content placeholder'
};

/**
 * Generate contextual alternative text based on element properties
 * @param {Element} element - The element to generate alt text for
 * @param {Object} context - Additional context information
 * @returns {string} Generated alternative text
 */
export const generateAltText = (element, context = {}) => {
  if (!element) return '';
  
  // Check if element already has good alt text
  const existingAlt = element.getAttribute('alt') || element.getAttribute('aria-label');
  if (existingAlt && existingAlt.trim() && existingAlt !== 'image') {
    return existingAlt;
  }
  
  // Analyze element properties
  const tagName = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  const role = element.getAttribute('role') || '';
  const src = element.getAttribute('src') || '';
  const textContent = element.textContent?.trim() || '';
  
  // Generate alt text based on context
  let altText = '';
  
  // Check for specific patterns in class names or IDs
  const patterns = {
    math: /math|equation|number|calculate|arithmetic/i,
    reading: /read|text|story|book|literature/i,
    phonics: /phonic|sound|letter|alphabet/i,
    spelling: /spell|word|vocabulary/i,
    science: /science|experiment|lab|biology|chemistry|physics/i,
    geography: /geo|map|country|state|city|location/i,
    history: /history|historical|past|timeline/i,
    art: /art|draw|paint|create|craft/i,
    correct: /correct|right|success|check|tick/i,
    incorrect: /incorrect|wrong|error|cross|x/i,
    star: /star|rating/i,
    trophy: /trophy|award|win/i,
    badge: /badge|achievement|medal/i,
    close: /close|dismiss|cancel/i,
    back: /back|previous|prev/i,
    next: /next|forward/i,
    home: /home|main/i,
    settings: /setting|config|preference/i,
    help: /help|info|question/i,
    loading: /load|spinner|wait/i
  };
  
  // Find matching pattern
  const combinedText = `${className} ${id} ${role}`.toLowerCase();
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(combinedText) || pattern.test(src)) {
      altText = DEFAULT_ALT_TEXT[key];
      break;
    }
  }
  
  // Enhance based on element type
  if (tagName === 'img') {
    if (!altText) {
      if (src.includes('icon')) {
        altText = 'Icon';
      } else if (src.includes('logo')) {
        altText = 'Logo';
      } else if (src.includes('avatar') || src.includes('profile')) {
        altText = 'Profile picture';
      } else {
        altText = DEFAULT_ALT_TEXT.image;
      }
    }
    
    // Add context if available
    if (context.subject) {
      altText = `${context.subject} ${altText.toLowerCase()}`;
    }
    
  } else if (tagName === 'button' || role === 'button') {
    if (!altText) {
      if (textContent) {
        altText = `${textContent} button`;
      } else {
        altText = DEFAULT_ALT_TEXT.button;
      }
    }
    
  } else if (tagName === 'a' || role === 'link') {
    if (!altText) {
      if (textContent) {
        altText = `Link to ${textContent}`;
      } else {
        altText = DEFAULT_ALT_TEXT.link;
      }
    }
    
  } else if (role === 'menuitem') {
    if (!altText) {
      altText = textContent ? `${textContent} menu item` : DEFAULT_ALT_TEXT.menu;
    }
  }
  
  // Fallback to generic description
  if (!altText) {
    if (textContent) {
      altText = textContent;
    } else if (tagName === 'div' || tagName === 'span') {
      altText = 'Interactive element';
    } else {
      altText = `${tagName} element`;
    }
  }
  
  return altText;
};

/**
 * Enhance images with better alternative text
 * @param {Element|NodeList} elements - Elements to enhance
 * @param {Object} context - Context information
 */
export const enhanceImageAltText = (elements, context = {}) => {
  const imgs = elements instanceof NodeList ? elements : [elements];
  
  imgs.forEach(img => {
    if (img.tagName.toLowerCase() !== 'img') return;
    
    const currentAlt = img.getAttribute('alt');
    
    // Skip if already has good alt text
    if (currentAlt && currentAlt.trim() && currentAlt !== 'image' && currentAlt.length > 3) {
      return;
    }
    
    // Generate new alt text
    const newAlt = generateAltText(img, context);
    img.setAttribute('alt', newAlt);
    
    // Add title for additional context
    if (!img.getAttribute('title')) {
      img.setAttribute('title', newAlt);
    }
  });
};

/**
 * Enhance interactive elements with ARIA labels
 * @param {Element|NodeList} elements - Elements to enhance
 * @param {Object} context - Context information
 */
export const enhanceInteractiveElements = (elements, context = {}) => {
  const items = elements instanceof NodeList ? elements : [elements];
  
  items.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const isInteractive = ['button', 'a', 'input'].includes(tagName) || 
                         ['button', 'link', 'menuitem', 'tab'].includes(role) ||
                         element.hasAttribute('onclick') ||
                         element.classList.contains('clickable') ||
                         element.hasAttribute('data-interactive');
    
    if (!isInteractive) return;
    
    // Check if already has good accessibility labels
    const hasLabel = element.getAttribute('aria-label') || 
                    element.getAttribute('aria-labelledby') ||
                    (tagName === 'input' && element.getAttribute('placeholder')) ||
                    (element.textContent && element.textContent.trim());
    
    if (hasLabel) return;
    
    // Generate appropriate label
    const label = generateAltText(element, context);
    element.setAttribute('aria-label', label);
    
    // Ensure proper role if missing
    if (!role && !['button', 'a', 'input'].includes(tagName)) {
      element.setAttribute('role', 'button');
    }
    
    // Ensure keyboard accessibility
    if (!element.hasAttribute('tabindex') && tagName !== 'button' && tagName !== 'a' && tagName !== 'input') {
      element.setAttribute('tabindex', '0');
    }
  });
};

/**
 * Scan and enhance all images and interactive elements on the page
 * @param {Element} container - Container to scan (defaults to document)
 * @param {Object} context - Context information
 */
export const enhancePageAccessibility = (container = document, context = {}) => {
  // Enhance images
  const images = container.querySelectorAll('img');
  enhanceImageAltText(images, context);
  
  // Enhance interactive elements
  const interactiveSelectors = [
    'button:not([aria-label]):not([aria-labelledby])',
    '[role="button"]:not([aria-label]):not([aria-labelledby])',
    'a:not([aria-label]):not([aria-labelledby])',
    '[onclick]:not([aria-label]):not([aria-labelledby])',
    '.clickable:not([aria-label]):not([aria-labelledby])',
    '[data-interactive]:not([aria-label]):not([aria-labelledby])'
  ];
  
  interactiveSelectors.forEach(selector => {
    const elements = container.querySelectorAll(selector);
    enhanceInteractiveElements(elements, context);
  });
  
  // Add landmark roles if missing
  addLandmarkRoles(container);
  
  // Enhance form elements
  enhanceFormAccessibility(container);
};

/**
 * Add landmark roles to page sections
 * @param {Element} container - Container to scan
 */
export const addLandmarkRoles = (container = document) => {
  // Main content
  const main = container.querySelector('main:not([role]), #main:not([role]), .main-content:not([role])');
  if (main) {
    main.setAttribute('role', 'main');
    if (!main.id) main.id = 'main-content';
  }
  
  // Navigation
  const nav = container.querySelector('nav:not([role]), .navigation:not([role]), .nav:not([role])');
  if (nav) {
    nav.setAttribute('role', 'navigation');
    if (!nav.id) nav.id = 'navigation';
  }
  
  // Header
  const header = container.querySelector('header:not([role]), .header:not([role])');
  if (header) {
    header.setAttribute('role', 'banner');
  }
  
  // Footer
  const footer = container.querySelector('footer:not([role]), .footer:not([role])');
  if (footer) {
    footer.setAttribute('role', 'contentinfo');
    if (!footer.id) footer.id = 'footer';
  }
  
  // Sidebar
  const sidebar = container.querySelector('aside:not([role]), .sidebar:not([role])');
  if (sidebar) {
    sidebar.setAttribute('role', 'complementary');
  }
};

/**
 * Enhance form accessibility
 * @param {Element} container - Container to scan
 */
export const enhanceFormAccessibility = (container = document) => {
  // Associate labels with inputs
  const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby]), textarea:not([aria-label]):not([aria-labelledby]), select:not([aria-label]):not([aria-labelledby])');
  
  inputs.forEach(input => {
    const id = input.id;
    if (!id) return;
    
    // Look for associated label
    let label = container.querySelector(`label[for="${id}"]`);
    if (!label) {
      // Look for parent label
      label = input.closest('label');
    }
    
    if (label && !input.getAttribute('aria-labelledby')) {
      if (!label.id) {
        label.id = `label-${id}`;
      }
      input.setAttribute('aria-labelledby', label.id);
    }
    
    // Add required indicator
    if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
      input.setAttribute('aria-required', 'true');
    }
  });
  
  // Enhance error messages
  const errorElements = container.querySelectorAll('.error, .invalid, [class*="error"], [class*="invalid"]');
  errorElements.forEach(error => {
    const relatedInput = error.previousElementSibling || error.nextElementSibling;
    if (relatedInput && ['INPUT', 'TEXTAREA', 'SELECT'].includes(relatedInput.tagName)) {
      if (!error.id) {
        error.id = `error-${relatedInput.id || Date.now()}`;
      }
      
      const describedBy = relatedInput.getAttribute('aria-describedby');
      if (!describedBy || !describedBy.includes(error.id)) {
        relatedInput.setAttribute('aria-describedby', describedBy ? `${describedBy} ${error.id}` : error.id);
      }
      
      relatedInput.setAttribute('aria-invalid', 'true');
    }
  });
};

/**
 * Create alternative text overlay for images (for sighted users)
 * @param {Element} img - Image element
 * @param {string} altText - Alternative text to display
 */
export const createAltTextOverlay = (img, altText) => {
  if (!img || !altText) return;
  
  // Remove existing overlay
  const existingOverlay = img.parentNode.querySelector('.alt-text-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'alt-text-overlay';
  overlay.textContent = altText;
  overlay.setAttribute('aria-hidden', 'true');
  
  // Position relative to image
  const container = img.parentNode;
  if (container.style.position !== 'relative' && container.style.position !== 'absolute') {
    container.style.position = 'relative';
  }
  
  container.appendChild(overlay);
};

/**
 * Initialize alternative text management for the page
 * @param {Object} options - Configuration options
 */
export const initAltTextManager = (options = {}) => {
  const {
    autoEnhance = true,
    showOverlays = false,
    context = {},
    container = document
  } = options;
  
  if (autoEnhance) {
    // Initial enhancement
    enhancePageAccessibility(container, context);
    
    // Watch for new content
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              enhancePageAccessibility(node, context);
            }
          });
        });
      });
      
      observer.observe(container, {
        childList: true,
        subtree: true
      });
    }
  }
  
  if (showOverlays) {
    // Add overlays to all images
    const images = container.querySelectorAll('img[alt]');
    images.forEach(img => {
      const altText = img.getAttribute('alt');
      if (altText) {
        createAltTextOverlay(img, altText);
      }
    });
  }
};

export default {
  generateAltText,
  enhanceImageAltText,
  enhanceInteractiveElements,
  enhancePageAccessibility,
  addLandmarkRoles,
  enhanceFormAccessibility,
  createAltTextOverlay,
  initAltTextManager
};