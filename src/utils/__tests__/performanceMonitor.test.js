/**
 * Tests for Performance Monitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '../performanceMonitor.js';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.prototype.observe = vi.fn();
mockPerformanceObserver.prototype.disconnect = vi.fn();

// Mock window and document
const mockWindow = {
  performance: mockPerformance,
  PerformanceObserver: mockPerformanceObserver,
  addEventListener: vi.fn(),
  location: { href: 'http://localhost:3000' },
  fetch: vi.fn(),
  navigator: {
    userAgent: 'test-user-agent'
  }
};

const mockDocument = {
  readyState: 'complete',
  addEventListener: vi.fn()
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset the monitor
    performanceMonitor.reset();
    
    // Mock global objects
    global.window = mockWindow;
    global.document = mockDocument;
    global.performance = mockPerformance;
    global.PerformanceObserver = mockPerformanceObserver;
    global.navigator = mockWindow.navigator;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.performance;
    delete global.PerformanceObserver;
    delete global.navigator;
  });

  describe('Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => performanceMonitor.initialize()).not.toThrow();
    });

    it('should not initialize twice', () => {
      performanceMonitor.initialize();
      const firstCall = mockPerformanceObserver.mock.calls.length;
      
      performanceMonitor.initialize();
      const secondCall = mockPerformanceObserver.mock.calls.length;
      
      expect(secondCall).toBe(firstCall);
    });
  });

  describe('Component Timing', () => {
    it('should track component load times', () => {
      const endTiming = performanceMonitor.startTiming('TestComponent');
      
      // Simulate some time passing
      mockPerformance.now.mockReturnValue(1100);
      
      endTiming();
      
      const report = performanceMonitor.getPerformanceReport();
      expect(report.componentPerformance.averageLoadTime).toBeGreaterThan(0);
    });

    it('should identify slowest components', () => {
      // Track multiple components with different times
      mockPerformance.now.mockReturnValue(1000);
      const endTiming1 = performanceMonitor.startTiming('FastComponent');
      mockPerformance.now.mockReturnValue(1050);
      endTiming1();

      mockPerformance.now.mockReturnValue(1100);
      const endTiming2 = performanceMonitor.startTiming('SlowComponent');
      mockPerformance.now.mockReturnValue(1300);
      endTiming2();

      const report = performanceMonitor.getPerformanceReport();
      const slowest = report.componentPerformance.slowestComponents;
      
      expect(slowest).toHaveLength(2);
      expect(slowest[0].name).toBe('SlowComponent');
      expect(slowest[0].time).toBe(200);
    });
  });

  describe('User Interactions', () => {
    it('should track user interactions', () => {
      performanceMonitor.trackUserInteraction('click', { target: 'button' });
      
      const report = performanceMonitor.getPerformanceReport();
      expect(report.networkRequests.total).toBe(0); // No network requests yet
    });
  });

  describe('Custom Metrics', () => {
    it('should add custom metrics', () => {
      performanceMonitor.addCustomMetric('testMetric', 100, { unit: 'ms' });
      
      const report = performanceMonitor.getPerformanceReport();
      // Custom metrics would be in the internal metrics object
      expect(performanceMonitor.metrics.customMetrics.testMetric).toBeDefined();
      expect(performanceMonitor.metrics.customMetrics.testMetric.value).toBe(100);
    });
  });

  describe('Performance Budget', () => {
    it('should detect budget violations', () => {
      const violations = [];
      performanceMonitor.subscribe((event, data) => {
        if (event === 'budgetViolation') {
          violations.push(data);
        }
      });

      // Trigger a budget violation by checking a high value
      performanceMonitor.checkBudgetViolation('maxRenderTime', 100); // Budget is 16ms
      
      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('maxRenderTime');
      expect(violations[0].severity).toBeDefined();
    });

    it('should calculate violation severity correctly', () => {
      const lowViolation = performanceMonitor.calculateViolationSeverity(20, 16); // 25% over
      const highViolation = performanceMonitor.calculateViolationSeverity(50, 16); // 212% over
      
      expect(lowViolation).toBe('medium');
      expect(highViolation).toBe('critical');
    });
  });

  describe('Performance Report', () => {
    it('should generate a comprehensive performance report', () => {
      // Add some test data
      performanceMonitor.addCustomMetric('testMetric', 50);
      performanceMonitor.trackUserInteraction('click');
      
      const report = performanceMonitor.getPerformanceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('coreWebVitals');
      expect(report).toHaveProperty('bundleSize');
      expect(report).toHaveProperty('resourceTiming');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('networkRequests');
      expect(report).toHaveProperty('componentPerformance');
      expect(report).toHaveProperty('budgetViolations');
      expect(report).toHaveProperty('recommendations');
    });

    it('should generate recommendations based on performance data', () => {
      // Mock poor Core Web Vitals
      const mockCoreWebVitals = {
        exportMetrics: () => ({
          ratings: {
            LCP: 'poor',
            FID: 'good',
            CLS: 'needs-improvement'
          }
        })
      };

      // Temporarily replace the core web vitals tracker
      const originalTracker = performanceMonitor.coreWebVitalsTracker;
      performanceMonitor.coreWebVitalsTracker = mockCoreWebVitals;

      const report = performanceMonitor.getPerformanceReport();
      
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // Restore original tracker
      performanceMonitor.coreWebVitalsTracker = originalTracker;
    });
  });

  describe('Memory Tracking', () => {
    it('should track memory usage trends', () => {
      // Simulate memory usage over time with significant increase (>10MB)
      performanceMonitor.metrics.memoryUsage = [
        { timestamp: 1000, used: 10000000 },
        { timestamp: 2000, used: 15000000 },
        { timestamp: 3000, used: 25000000 } // 15MB increase from first to last
      ];

      const trend = performanceMonitor.getMemoryTrend();
      expect(trend.trend).toBe('increasing');
      expect(trend.current).toBe(25000000);
    });
  });

  describe('Observer Pattern', () => {
    it('should notify observers of performance events', () => {
      const mockCallback = vi.fn();
      const unsubscribe = performanceMonitor.subscribe(mockCallback);

      performanceMonitor.notifyObservers('test', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith('test', { data: 'test' });
      
      unsubscribe();
      performanceMonitor.notifyObservers('test2', { data: 'test2' });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle observer errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Observer error');
      });
      
      performanceMonitor.subscribe(errorCallback);
      
      expect(() => {
        performanceMonitor.notifyObservers('test', {});
      }).not.toThrow();
    });
  });

  describe('Resource Timing', () => {
    it('should categorize resources by type', () => {
      performanceMonitor.metrics.resourceTiming = [
        { name: 'app.js', transferSize: 100000, type: 'script' },
        { name: 'styles.css', transferSize: 50000, type: 'stylesheet' },
        { name: 'image.png', transferSize: 200000, type: 'image' }
      ];

      const grouped = performanceMonitor.groupResourcesByType();
      
      expect(grouped.script).toEqual({ count: 1, totalSize: 100000 });
      expect(grouped.stylesheet).toEqual({ count: 1, totalSize: 50000 });
      expect(grouped.image).toEqual({ count: 1, totalSize: 200000 });
    });
  });
});