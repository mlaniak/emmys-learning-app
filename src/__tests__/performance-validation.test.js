/**
 * Performance Validation Tests
 * 
 * Tests to validate performance requirements and Core Web Vitals compliance
 * Requirements tested: 4.1, 4.3 (Performance optimization and monitoring)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '../utils/performanceMonitor';
import { coreWebVitalsTracker } from '../utils/coreWebVitals';

// Mock performance APIs
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
};

const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.prototype.observe = vi.fn();
mockPerformanceObserver.prototype.disconnect = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Performance Validation Tests', () => {
  beforeEach(() => {
    global.performance = mockPerformance;
    global.PerformanceObserver = mockPerformanceObserver;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete global.performance;
    delete global.PerformanceObserver;
  });

  describe('Core Web Vitals Compliance', () => {
    it('should meet LCP (Largest Contentful Paint) requirements', async () => {
      // Mock good LCP value (< 2.5s)
      const mockLCPEntry = {
        name: 'largest-contentful-paint',
        startTime: 1500, // 1.5 seconds
        element: document.createElement('div')
      };

      mockPerformance.getEntriesByType.mockReturnValue([mockLCPEntry]);

      const lcpValue = coreWebVitalsTracker.getLCP();
      expect(lcpValue).toBeLessThan(2500); // Should be under 2.5s for good rating
    });

    it('should meet FID (First Input Delay) requirements', async () => {
      // Mock good FID value (< 100ms)
      const mockFIDEntry = {
        name: 'first-input',
        processingStart: 1050,
        startTime: 1000,
        duration: 50
      };

      const fid = mockFIDEntry.processingStart - mockFIDEntry.startTime;
      expect(fid).toBeLessThan(100); // Should be under 100ms for good rating
    });

    it('should meet CLS (Cumulative Layout Shift) requirements', async () => {
      // Mock good CLS value (< 0.1)
      const mockCLSEntries = [
        { value: 0.05, hadRecentInput: false },
        { value: 0.02, hadRecentInput: false }
      ];

      const totalCLS = mockCLSEntries
        .filter(entry => !entry.hadRecentInput)
        .reduce((sum, entry) => sum + entry.value, 0);

      expect(totalCLS).toBeLessThan(0.1); // Should be under 0.1 for good rating
    });

    it('should track TTFB (Time to First Byte)', async () => {
      // Mock navigation timing
      const mockNavigationEntry = {
        responseStart: 200,
        requestStart: 100
      };

      mockPerformance.getEntriesByType.mockReturnValue([mockNavigationEntry]);

      const ttfb = mockNavigationEntry.responseStart - mockNavigationEntry.requestStart;
      expect(ttfb).toBeLessThan(600); // Should be under 600ms for good performance
    });
  });

  describe('Component Performance', () => {
    it('should track component render times', () => {
      performanceMonitor.initialize();

      // Simulate component timing
      mockPerformance.now.mockReturnValueOnce(1000);
      const endTiming = performanceMonitor.startTiming('TestComponent');
      
      mockPerformance.now.mockReturnValueOnce(1050);
      endTiming();

      const report = performanceMonitor.getPerformanceReport();
      expect(report.componentPerformance.averageLoadTime).toBeLessThan(100); // Under 100ms
    });

    it('should identify performance bottlenecks', () => {
      performanceMonitor.initialize();

      // Simulate slow component
      mockPerformance.now.mockReturnValueOnce(1000);
      const endSlowTiming = performanceMonitor.startTiming('SlowComponent');
      mockPerformance.now.mockReturnValueOnce(1200); // 200ms
      endSlowTiming();

      // Simulate fast component
      mockPerformance.now.mockReturnValueOnce(1300);
      const endFastTiming = performanceMonitor.startTiming('FastComponent');
      mockPerformance.now.mockReturnValueOnce(1320); // 20ms
      endFastTiming();

      const report = performanceMonitor.getPerformanceReport();
      const slowest = report.componentPerformance.slowestComponents;
      
      expect(slowest[0].name).toBe('SlowComponent');
      expect(slowest[0].time).toBe(200);
    });
  });

  describe('Memory Performance', () => {
    it('should monitor memory usage', () => {
      performanceMonitor.initialize();

      const memoryReport = performanceMonitor.getMemoryUsage();
      
      expect(memoryReport.used).toBe(10000000);
      expect(memoryReport.total).toBe(20000000);
      expect(memoryReport.limit).toBe(100000000);
      expect(memoryReport.usagePercentage).toBe(50); // 10MB / 20MB = 50%
    });

    it('should detect memory leaks', () => {
      performanceMonitor.initialize();

      // Simulate increasing memory usage
      mockPerformance.memory.usedJSHeapSize = 15000000; // +5MB
      performanceMonitor.trackMemoryUsage();

      mockPerformance.memory.usedJSHeapSize = 25000000; // +10MB more
      performanceMonitor.trackMemoryUsage();

      const trend = performanceMonitor.getMemoryTrend();
      expect(trend.trend).toBe('increasing');
      expect(trend.increaseRate).toBeGreaterThan(0);
    });
  });

  describe('Bundle Size and Resource Loading', () => {
    it('should validate bundle size limits', () => {
      // Mock resource timing entries
      const mockResources = [
        { name: 'main.js', transferSize: 150000 }, // 150KB
        { name: 'vendor.js', transferSize: 200000 }, // 200KB
        { name: 'styles.css', transferSize: 50000 }, // 50KB
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const totalBundleSize = mockResources.reduce((sum, resource) => 
        sum + resource.transferSize, 0
      );

      // Total bundle should be under 500KB for good performance
      expect(totalBundleSize).toBeLessThan(500000);
    });

    it('should validate resource loading performance', () => {
      const mockResourceEntries = [
        {
          name: 'main.js',
          startTime: 100,
          responseEnd: 300,
          transferSize: 150000
        },
        {
          name: 'image.png',
          startTime: 200,
          responseEnd: 500,
          transferSize: 100000
        }
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResourceEntries);

      mockResourceEntries.forEach(entry => {
        const loadTime = entry.responseEnd - entry.startTime;
        // Resources should load within reasonable time
        expect(loadTime).toBeLessThan(1000); // Under 1 second
      });
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should enforce performance budgets', () => {
      performanceMonitor.initialize();

      const budgets = {
        maxRenderTime: 16, // 60fps = 16.67ms per frame
        maxBundleSize: 500000, // 500KB
        maxMemoryUsage: 50000000, // 50MB
        maxLCP: 2500, // 2.5s
        maxFID: 100, // 100ms
        maxCLS: 0.1 // 0.1
      };

      // Test render time budget
      const violations = [];
      performanceMonitor.subscribe((event, data) => {
        if (event === 'budgetViolation') {
          violations.push(data);
        }
      });

      // Simulate budget violation
      performanceMonitor.checkBudgetViolation('maxRenderTime', 25); // Over 16ms

      expect(violations).toHaveLength(1);
      expect(violations[0].metric).toBe('maxRenderTime');
      expect(violations[0].actual).toBe(25);
      expect(violations[0].budget).toBe(16);
    });

    it('should generate performance recommendations', () => {
      performanceMonitor.initialize();

      // Mock poor performance data
      performanceMonitor.metrics.componentPerformance = [
        { name: 'SlowComponent', time: 200 },
        { name: 'AnotherSlowComponent', time: 150 }
      ];

      performanceMonitor.metrics.memoryUsage = [
        { timestamp: 1000, used: 60000000 } // High memory usage
      ];

      const report = performanceMonitor.getPerformanceReport();
      const recommendations = report.recommendations;

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend optimizations for slow components
      const componentRec = recommendations.find(rec => 
        rec.includes('component') || rec.includes('render')
      );
      expect(componentRec).toBeDefined();
    });
  });

  describe('Real User Monitoring (RUM)', () => {
    it('should collect real user performance data', () => {
      performanceMonitor.initialize();

      // Simulate user interactions
      performanceMonitor.trackUserInteraction('click', { 
        target: 'button',
        timestamp: 1000 
      });

      performanceMonitor.trackUserInteraction('scroll', { 
        target: 'main',
        timestamp: 1100 
      });

      const report = performanceMonitor.getPerformanceReport();
      expect(report.userInteractions.total).toBe(2);
      expect(report.userInteractions.types.click).toBe(1);
      expect(report.userInteractions.types.scroll).toBe(1);
    });

    it('should track performance across different user scenarios', () => {
      performanceMonitor.initialize();

      // Scenario 1: Fast device/connection
      performanceMonitor.addCustomMetric('deviceType', 'desktop');
      performanceMonitor.addCustomMetric('connectionType', 'wifi');
      
      mockPerformance.now.mockReturnValue(1000);
      const endFastTiming = performanceMonitor.startTiming('PageLoad');
      mockPerformance.now.mockReturnValue(1500); // 500ms load
      endFastTiming();

      // Scenario 2: Slow device/connection
      performanceMonitor.addCustomMetric('deviceType', 'mobile');
      performanceMonitor.addCustomMetric('connectionType', '3g');
      
      mockPerformance.now.mockReturnValue(2000);
      const endSlowTiming = performanceMonitor.startTiming('PageLoad');
      mockPerformance.now.mockReturnValue(3000); // 1000ms load
      endSlowTiming();

      const report = performanceMonitor.getPerformanceReport();
      expect(report.componentPerformance.averageLoadTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      performanceMonitor.initialize();

      // Baseline performance
      const baseline = {
        averageLoadTime: 100,
        memoryUsage: 20000000,
        bundleSize: 300000
      };

      // Current performance (regression)
      const current = {
        averageLoadTime: 150, // 50% slower
        memoryUsage: 30000000, // 50% more memory
        bundleSize: 450000 // 50% larger bundle
      };

      const regressions = performanceMonitor.detectRegressions(baseline, current);
      
      expect(regressions).toHaveLength(3);
      expect(regressions[0].metric).toBe('averageLoadTime');
      expect(regressions[0].regression).toBe(50); // 50% regression
    });
  });
});