/**
 * Tests for Core Web Vitals Tracker
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { coreWebVitalsTracker } from '../coreWebVitals.js';

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.prototype.observe = vi.fn();
mockPerformanceObserver.prototype.disconnect = vi.fn();

// Mock performance API
const mockPerformance = {
  getEntriesByType: vi.fn(() => [
    {
      responseStart: 100,
      requestStart: 50
    }
  ])
};

// Mock window and document
const mockWindow = {
  PerformanceObserver: mockPerformanceObserver,
  performance: mockPerformance,
  location: { href: 'http://localhost:3000' },
  addEventListener: vi.fn(),
  navigator: {
    userAgent: 'test-user-agent'
  }
};

const mockDocument = {
  readyState: 'complete'
};

describe('CoreWebVitalsTracker', () => {
  beforeEach(() => {
    // Mock global objects
    global.window = mockWindow;
    global.document = mockDocument;
    global.performance = mockPerformance;
    global.PerformanceObserver = mockPerformanceObserver;
    global.navigator = mockWindow.navigator;
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset tracker state
    coreWebVitalsTracker.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      TTFB: null,
      INP: null
    };
    coreWebVitalsTracker.isInitialized = false;
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
      expect(() => coreWebVitalsTracker.initialize()).not.toThrow();
      expect(coreWebVitalsTracker.isInitialized).toBe(true);
    });

    it('should not initialize twice', () => {
      coreWebVitalsTracker.initialize();
      const firstCallCount = mockPerformanceObserver.mock.calls.length;
      
      coreWebVitalsTracker.initialize();
      const secondCallCount = mockPerformanceObserver.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('TTFB Tracking', () => {
    it('should track TTFB correctly', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          responseStart: 150,
          requestStart: 100
        }
      ]);

      coreWebVitalsTracker.trackTTFB();
      
      expect(coreWebVitalsTracker.metrics.TTFB).toBe(50);
    });

    it('should handle missing navigation entry', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);
      
      expect(() => coreWebVitalsTracker.trackTTFB()).not.toThrow();
      expect(coreWebVitalsTracker.metrics.TTFB).toBeNull();
    });
  });

  describe('Metric Rating', () => {
    it('should rate LCP correctly', () => {
      expect(coreWebVitalsTracker.getMetricRating('LCP', 2000)).toBe('good');
      expect(coreWebVitalsTracker.getMetricRating('LCP', 3000)).toBe('needs-improvement');
      expect(coreWebVitalsTracker.getMetricRating('LCP', 5000)).toBe('poor');
    });

    it('should rate FID correctly', () => {
      expect(coreWebVitalsTracker.getMetricRating('FID', 50)).toBe('good');
      expect(coreWebVitalsTracker.getMetricRating('FID', 200)).toBe('needs-improvement');
      expect(coreWebVitalsTracker.getMetricRating('FID', 400)).toBe('poor');
    });

    it('should rate CLS correctly', () => {
      expect(coreWebVitalsTracker.getMetricRating('CLS', 0.05)).toBe('good');
      expect(coreWebVitalsTracker.getMetricRating('CLS', 0.15)).toBe('needs-improvement');
      expect(coreWebVitalsTracker.getMetricRating('CLS', 0.3)).toBe('poor');
    });

    it('should handle unknown metrics', () => {
      expect(coreWebVitalsTracker.getMetricRating('UNKNOWN', 100)).toBe('unknown');
    });

    it('should handle null values', () => {
      expect(coreWebVitalsTracker.getMetricRating('LCP', null)).toBe('unknown');
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate overall score correctly', () => {
      const ratings = {
        LCP: 'good',
        FID: 'good',
        CLS: 'needs-improvement',
        TTFB: 'poor',
        INP: 'good'
      };

      const score = coreWebVitalsTracker.calculateOverallScore(ratings);
      
      // (100 + 100 + 50 + 0 + 100) / 5 = 70
      expect(score).toBe(70);
    });

    it('should handle empty ratings', () => {
      const score = coreWebVitalsTracker.calculateOverallScore({});
      expect(score).toBe(0);
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics with all required fields', () => {
      coreWebVitalsTracker.metrics = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        TTFB: 800,
        INP: 200
      };

      const exported = coreWebVitalsTracker.exportMetrics();
      
      expect(exported).toHaveProperty('timestamp');
      expect(exported).toHaveProperty('url');
      expect(exported).toHaveProperty('userAgent');
      expect(exported).toHaveProperty('metrics');
      expect(exported).toHaveProperty('ratings');
      expect(exported).toHaveProperty('overallScore');
      
      expect(exported.metrics).toEqual(coreWebVitalsTracker.metrics);
      expect(exported.overallScore).toBe(100); // All good ratings
    });
  });

  describe('Observer Pattern', () => {
    it('should notify observers when metrics are updated', () => {
      const mockCallback = vi.fn();
      const unsubscribe = coreWebVitalsTracker.subscribe(mockCallback);

      coreWebVitalsTracker.updateMetric('LCP', 2500);
      
      expect(mockCallback).toHaveBeenCalledWith('LCP', 2500, 'good');
      
      unsubscribe();
      coreWebVitalsTracker.updateMetric('FID', 100);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle observer errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Observer error');
      });
      
      coreWebVitalsTracker.subscribe(errorCallback);
      
      expect(() => {
        coreWebVitalsTracker.updateMetric('LCP', 2500);
      }).not.toThrow();
    });
  });

  describe('Performance Observer Setup', () => {
    it('should set up LCP observer when PerformanceObserver is available', () => {
      coreWebVitalsTracker.trackLCP();
      
      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(mockPerformanceObserver.prototype.observe).toHaveBeenCalledWith({
        type: 'largest-contentful-paint',
        buffered: true
      });
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      delete global.PerformanceObserver;
      
      expect(() => coreWebVitalsTracker.trackLCP()).not.toThrow();
    });
  });

  describe('Metric Updates', () => {
    it('should update metrics correctly', () => {
      coreWebVitalsTracker.updateMetric('LCP', 2500);
      
      expect(coreWebVitalsTracker.metrics.LCP).toBe(2500);
    });

    it('should get all ratings', () => {
      coreWebVitalsTracker.metrics = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        TTFB: 800,
        INP: 200
      };

      const ratings = coreWebVitalsTracker.getAllRatings();
      
      expect(ratings.LCP).toBe('good');
      expect(ratings.FID).toBe('good');
      expect(ratings.CLS).toBe('good');
      expect(ratings.TTFB).toBe('good');
      expect(ratings.INP).toBe('good');
    });
  });
});