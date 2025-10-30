// Mobile Performance Optimization Utilities

// Touch response optimization - eliminate 300ms click delay
export const optimizeTouchResponse = () => {
  // Add CSS to eliminate 300ms delay
  const style = document.createElement('style');
  style.textContent = `
    * {
      touch-action: manipulation;
    }
    
    button, input, select, textarea, a {
      touch-action: manipulation;
    }
    
    .no-touch-delay {
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(style);

  // Add meta tag for viewport if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
  }
};

// Efficient scroll handling with throttling
export class ScrollOptimizer {
  constructor() {
    this.isScrolling = false;
    this.scrollHandlers = new Set();
    this.lastScrollTop = 0;
    this.scrollDirection = 'down';
    
    this.init();
  }

  init() {
    // Use passive listeners for better performance
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Add momentum scrolling for iOS
    document.body.style.webkitOverflowScrolling = 'touch';
  }

  handleScroll() {
    if (!this.isScrolling) {
      requestAnimationFrame(() => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.scrollDirection = currentScrollTop > this.lastScrollTop ? 'down' : 'up';
        this.lastScrollTop = currentScrollTop;

        this.scrollHandlers.forEach(handler => {
          handler({
            scrollTop: currentScrollTop,
            direction: this.scrollDirection,
            isAtTop: currentScrollTop === 0,
            isAtBottom: (window.innerHeight + currentScrollTop) >= document.body.offsetHeight - 10
          });
        });

        this.isScrolling = false;
      });
    }
    this.isScrolling = true;
  }

  addScrollHandler(handler) {
    this.scrollHandlers.add(handler);
    return () => this.scrollHandlers.delete(handler);
  }

  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = Math.min(Math.abs(distance) / 2, 800); // Max 800ms
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function for smooth animation
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      window.scrollTo(0, startPosition + distance * ease);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }
}

// Mobile-specific error handling
export class MobileErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Global error handler
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    this.showConnectionStatus('Connected', 'success');
    this.retryFailedRequests();
  }

  handleOffline() {
    this.isOnline = false;
    this.showConnectionStatus('No internet connection', 'error');
  }

  handleError(event) {
    console.error('Global error:', event.error);
    
    // Don't show error for script loading failures (common on mobile)
    if (event.filename && event.filename.includes('.js')) {
      return;
    }

    this.showUserFriendlyError('Something went wrong. Please try again.');
  }

  handlePromiseRejection(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Handle network errors gracefully
    if (event.reason && event.reason.name === 'NetworkError') {
      if (!this.isOnline) {
        this.showUserFriendlyError('Please check your internet connection and try again.');
      } else {
        this.queueForRetry(event.reason);
      }
    }
  }

  showConnectionStatus(message, type) {
    const existingIndicator = document.querySelector('.connection-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.className = `connection-indicator fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    indicator.textContent = message;
    
    document.body.appendChild(indicator);
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 300);
      }, 3000);
    }
  }

  showUserFriendlyError(message) {
    const errorToast = document.createElement('div');
    errorToast.className = 'fixed bottom-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-y-full transition-transform duration-300';
    errorToast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(errorToast);
    
    // Animate in
    setTimeout(() => {
      errorToast.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorToast.style.transform = 'translateY(100%)';
      setTimeout(() => errorToast.remove(), 300);
    }, 5000);
  }

  queueForRetry(error) {
    const errorId = Date.now().toString();
    this.errorQueue.push({ id: errorId, error, timestamp: Date.now() });
    this.retryAttempts.set(errorId, 0);
  }

  async retryFailedRequests() {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (const queuedError of [...this.errorQueue]) {
      const attempts = this.retryAttempts.get(queuedError.id) || 0;
      
      if (attempts < maxRetries) {
        try {
          // Attempt to retry the failed operation
          // This would need to be implemented based on the specific error type
          await this.retryOperation(queuedError.error);
          
          // Remove from queue on success
          this.errorQueue = this.errorQueue.filter(e => e.id !== queuedError.id);
          this.retryAttempts.delete(queuedError.id);
        } catch (retryError) {
          this.retryAttempts.set(queuedError.id, attempts + 1);
          
          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
        }
      } else {
        // Max retries reached, remove from queue
        this.errorQueue = this.errorQueue.filter(e => e.id !== queuedError.id);
        this.retryAttempts.delete(queuedError.id);
      }
    }
  }

  async retryOperation(error) {
    // This would be implemented based on the specific error type
    // For now, just throw to indicate retry failed
    throw error;
  }
}

// Offline indicator component
export const createOfflineIndicator = () => {
  const indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50 transform -translate-y-full transition-transform duration-300';
  indicator.innerHTML = `
    <div class="flex items-center justify-center space-x-2">
      <span>📡</span>
      <span>You're offline. Some features may not work.</span>
    </div>
  `;
  
  document.body.appendChild(indicator);
  
  const updateIndicator = () => {
    if (navigator.onLine) {
      indicator.style.transform = 'translateY(-100%)';
    } else {
      indicator.style.transform = 'translateY(0)';
    }
  };
  
  window.addEventListener('online', updateIndicator);
  window.addEventListener('offline', updateIndicator);
  
  // Initial check
  updateIndicator();
  
  return indicator;
};

// Performance monitoring for mobile
export class MobilePerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      memoryUsage: [],
      networkRequests: []
    };
    
    this.init();
  }

  init() {
    // Measure page load time
    window.addEventListener('load', () => {
      this.metrics.loadTime = performance.now();
    });

    // Observe Core Web Vitals
    this.observeWebVitals();
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        this.trackMemoryUsage();
      }, 10000); // Every 10 seconds
    }
  }

  observeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.metrics.cumulativeLayoutShift += entry.value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  logPerformanceReport() {
    const metrics = this.getMetrics();
    console.group('Mobile Performance Report');
    console.log('Load Time:', `${metrics.loadTime.toFixed(2)}ms`);
    console.log('First Contentful Paint:', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log('Largest Contentful Paint:', `${metrics.largestContentfulPaint.toFixed(2)}ms`);
    console.log('First Input Delay:', `${metrics.firstInputDelay.toFixed(2)}ms`);
    console.log('Cumulative Layout Shift:', metrics.cumulativeLayoutShift.toFixed(4));
    
    if (metrics.memoryUsage.length > 0) {
      const latestMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];
      console.log('Memory Usage:', `${(latestMemory.used / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.groupEnd();
  }
}

// Initialize mobile optimizations
export const initializeMobileOptimizations = () => {
  // Optimize touch response
  optimizeTouchResponse();
  
  // Initialize scroll optimizer
  const scrollOptimizer = new ScrollOptimizer();
  
  // Initialize error handler
  const errorHandler = new MobileErrorHandler();
  
  // Create offline indicator
  createOfflineIndicator();
  
  // Initialize performance monitor
  const performanceMonitor = new MobilePerformanceMonitor();
  
  // Log performance report after 5 seconds
  setTimeout(() => {
    performanceMonitor.logPerformanceReport();
  }, 5000);
  
  return {
    scrollOptimizer,
    errorHandler,
    performanceMonitor
  };
};

export default {
  optimizeTouchResponse,
  ScrollOptimizer,
  MobileErrorHandler,
  MobilePerformanceMonitor,
  createOfflineIndicator,
  initializeMobileOptimizations
};