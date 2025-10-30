import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  optimizeTouchResponse, 
  ScrollOptimizer, 
  MobileErrorHandler, 
  MobilePerformanceMonitor,
  createOfflineIndicator,
  initializeMobileOptimizations 
} from '../mobilePerformanceOptimizer';

// Mock DOM methods
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: vi.fn(cb => setTimeout(cb, 16)),
  writable: true
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  writable: true
});

describe('Mobile Performance Optimizer', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('optimizeTouchResponse', () => {
    it('should add touch optimization styles', () => {
      optimizeTouchResponse();
      
      const styleElements = document.head.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);
      
      const styleContent = Array.from(styleElements)
        .map(el => el.textContent)
        .join('');
      
      expect(styleContent).toContain('touch-action: manipulation');
    });

    it('should add viewport meta tag if not present', () => {
      optimizeTouchResponse();
      
      const viewport = document.head.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
      expect(viewport.content).toContain('width=device-width');
    });

    it('should not duplicate viewport meta tag', () => {
      // Add existing viewport
      const existingViewport = document.createElement('meta');
      existingViewport.name = 'viewport';
      existingViewport.content = 'existing';
      document.head.appendChild(existingViewport);

      optimizeTouchResponse();
      
      const viewports = document.head.querySelectorAll('meta[name="viewport"]');
      expect(viewports.length).toBe(1);
      expect(viewports[0].content).toBe('existing');
    });
  });

  describe('ScrollOptimizer', () => {
    let scrollOptimizer;

    beforeEach(() => {
      scrollOptimizer = new ScrollOptimizer();
    });

    it('should initialize with default values', () => {
      expect(scrollOptimizer.isScrolling).toBe(false);
      expect(scrollOptimizer.scrollHandlers).toBeInstanceOf(Set);
      expect(scrollOptimizer.lastScrollTop).toBe(0);
      expect(scrollOptimizer.scrollDirection).toBe('down');
    });

    it('should add and remove scroll handlers', () => {
      const handler = vi.fn();
      const removeHandler = scrollOptimizer.addScrollHandler(handler);
      
      expect(scrollOptimizer.scrollHandlers.has(handler)).toBe(true);
      
      removeHandler();
      expect(scrollOptimizer.scrollHandlers.has(handler)).toBe(false);
    });

    it('should perform smooth scroll to element', () => {
      const mockElement = {
        offsetTop: 500
      };

      scrollOptimizer.smoothScrollTo(mockElement, 50);
      
      // Should call requestAnimationFrame for smooth scrolling
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('MobileErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new MobileErrorHandler();
    });

    it('should initialize with default values', () => {
      expect(errorHandler.errorQueue).toEqual([]);
      expect(errorHandler.isOnline).toBe(true);
      expect(errorHandler.retryAttempts).toBeInstanceOf(Map);
    });

    it('should show connection status', () => {
      errorHandler.showConnectionStatus('Test message', 'success');
      
      const indicator = document.querySelector('.connection-indicator');
      expect(indicator).toBeTruthy();
      expect(indicator.textContent).toBe('Test message');
      expect(indicator.className).toContain('bg-green-500');
    });

    it('should show user-friendly error', () => {
      errorHandler.showUserFriendlyError('Test error message');
      
      const errorToast = document.querySelector('.fixed.bottom-4');
      expect(errorToast).toBeTruthy();
      expect(errorToast.textContent).toContain('Test error message');
    });

    it('should handle online/offline events', () => {
      const showConnectionStatusSpy = vi.spyOn(errorHandler, 'showConnectionStatus');
      
      errorHandler.handleOffline();
      expect(errorHandler.isOnline).toBe(false);
      expect(showConnectionStatusSpy).toHaveBeenCalledWith('No internet connection', 'error');
      
      errorHandler.handleOnline();
      expect(errorHandler.isOnline).toBe(true);
      expect(showConnectionStatusSpy).toHaveBeenCalledWith('Connected', 'success');
    });
  });

  describe('MobilePerformanceMonitor', () => {
    let performanceMonitor;

    beforeEach(() => {
      performanceMonitor = new MobilePerformanceMonitor();
    });

    it('should initialize with default metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('firstContentfulPaint');
      expect(metrics).toHaveProperty('largestContentfulPaint');
      expect(metrics).toHaveProperty('firstInputDelay');
      expect(metrics).toHaveProperty('cumulativeLayoutShift');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('networkRequests');
    });

    it('should track memory usage', () => {
      performanceMonitor.trackMemoryUsage();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage.length).toBe(1);
      expect(metrics.memoryUsage[0]).toHaveProperty('timestamp');
      expect(metrics.memoryUsage[0]).toHaveProperty('used');
      expect(metrics.memoryUsage[0]).toHaveProperty('total');
      expect(metrics.memoryUsage[0]).toHaveProperty('limit');
    });

    it('should limit memory usage history', () => {
      // Add more than 100 entries
      for (let i = 0; i < 105; i++) {
        performanceMonitor.trackMemoryUsage();
      }
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage.length).toBe(100);
    });

    it('should log performance report', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      
      performanceMonitor.logPerformanceReport();
      
      expect(consoleSpy).toHaveBeenCalledWith('Mobile Performance Report');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe('createOfflineIndicator', () => {
    it('should create offline indicator element', () => {
      const indicator = createOfflineIndicator();
      
      expect(indicator).toBeTruthy();
      expect(indicator.id).toBe('offline-indicator');
      expect(indicator.textContent).toContain('You\'re offline');
    });

    it('should show/hide based on online status', () => {
      const indicator = createOfflineIndicator();
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      window.dispatchEvent(new Event('offline'));
      
      expect(indicator.style.transform).toBe('translateY(0)');
      
      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      window.dispatchEvent(new Event('online'));
      
      expect(indicator.style.transform).toBe('translateY(-100%)');
    });
  });

  describe('initializeMobileOptimizations', () => {
    it('should initialize all mobile optimizations', () => {
      const result = initializeMobileOptimizations();
      
      expect(result).toHaveProperty('scrollOptimizer');
      expect(result).toHaveProperty('errorHandler');
      expect(result).toHaveProperty('performanceMonitor');
      
      expect(result.scrollOptimizer).toBeInstanceOf(ScrollOptimizer);
      expect(result.errorHandler).toBeInstanceOf(MobileErrorHandler);
      expect(result.performanceMonitor).toBeInstanceOf(MobilePerformanceMonitor);
    });

    it('should add touch optimization styles', () => {
      initializeMobileOptimizations();
      
      const styleElements = document.head.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);
    });

    it('should create offline indicator', () => {
      initializeMobileOptimizations();
      
      const indicator = document.getElementById('offline-indicator');
      expect(indicator).toBeTruthy();
    });
  });
});