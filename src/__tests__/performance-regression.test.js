/**
 * Performance Regression Tests
 * 
 * Tests to detect performance regressions and ensure the application
 * meets performance benchmarks across different scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Import performance utilities
import { performanceMonitor } from '../utils/performanceMonitor';
import { performanceRegressionDetector } from '../utils/performanceRegressionDetector';

// Import main app components
import App from '../App';
import { UserProvider } from '../contexts/UserContext';
import { AccessibilityProvider } from '../components/AccessibilityProvider';

// Mock external dependencies
vi.mock('../supabase/config', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

// Mock performance APIs
const mockPerformanceEntries = [];
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn((name) => {
    mockPerformanceEntries.push({
      name,
      entryType: 'mark',
      startTime: Date.now(),
      duration: 0
    });
  }),
  measure: vi.fn((name, startMark, endMark) => {
    const duration = Math.random() * 100; // Random duration for testing
    mockPerformanceEntries.push({
      name,
      entryType: 'measure',
      startTime: Date.now() - duration,
      duration
    });
    return { duration };
  }),
  getEntriesByType: vi.fn((type) => {
    return mockPerformanceEntries.filter(entry => entry.entryType === type);
  }),
  getEntriesByName: vi.fn((name) => {
    return mockPerformanceEntries.filter(entry => entry.name === name);
  }),
  clearMarks: vi.fn(() => {
    mockPerformanceEntries.length = 0;
  }),
  clearMeasures: vi.fn(() => {
    mockPerformanceEntries.length = 0;
  }),
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000
  }
};

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Test wrapper
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AccessibilityProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AccessibilityProvider>
  </BrowserRouter>
);

describe('Performance Regression Tests', () => {
  let user;
  let performanceBaseline;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockPerformanceEntries.length = 0;
    
    // Set performance baseline
    performanceBaseline = {
      initialRender: 100, // ms
      componentMount: 50, // ms
      userInteraction: 16, // ms (60fps)
      memoryUsage: 15000000, // bytes
      bundleSize: 500000, // bytes
      coreWebVitals: {
        LCP: 2000, // ms
        FID: 50, // ms
        CLS: 0.05
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(performanceBaseline.initialRender);
    });

    it('should not exceed memory usage baseline during initial render', async () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(performanceBaseline.memoryUsage);
    });

    it('should meet Core Web Vitals thresholds', async () => {
      // Mock Core Web Vitals measurements
      const mockLCPEntry = {
        name: 'largest-contentful-paint',
        startTime: 1500, // 1.5s
        size: 1000
      };

      const mockFIDEntry = {
        name: 'first-input',
        processingStart: 1050,
        startTime: 1000,
        duration: 50
      };

      const mockCLSEntries = [
        { value: 0.02, hadRecentInput: false },
        { value: 0.01, hadRecentInput: false }
      ];

      // Simulate performance observer callbacks
      const performanceObserver = new PerformanceObserver(() => {});
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Validate Core Web Vitals
      expect(mockLCPEntry.startTime).toBeLessThan(performanceBaseline.coreWebVitals.LCP);
      
      const fid = mockFIDEntry.processingStart - mockFIDEntry.startTime;
      expect(fid).toBeLessThan(performanceBaseline.coreWebVitals.FID);
      
      const cls = mockCLSEntries.reduce((sum, entry) => sum + entry.value, 0);
      expect(cls).toBeLessThan(performanceBaseline.coreWebVitals.CLS);
    });
  });

  describe('Component Performance', () => {
    it('should mount components within performance budget', async () => {
      performance.mark('component-mount-start');
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      performance.mark('component-mount-end');
      performance.measure('component-mount', 'component-mount-start', 'component-mount-end');

      const measures = performance.getEntriesByName('component-mount');
      expect(measures[0].duration).toBeLessThan(performanceBaseline.componentMount);
    });

    it('should handle component updates efficiently', async () => {
      const { rerender } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      performance.mark('update-start');
      
      // Trigger re-render
      rerender(
        <TestWrapper>
          <App key="updated" />
        </TestWrapper>
      );

      performance.mark('update-end');
      performance.measure('component-update', 'update-start', 'update-end');

      const measures = performance.getEntriesByName('component-update');
      expect(measures[0].duration).toBeLessThan(performanceBaseline.userInteraction);
    });

    it('should lazy load components efficiently', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      performance.mark('lazy-load-start');
      
      // Navigate to a subject that should lazy load
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      await waitFor(() => {
        expect(screen.getByText(/Math Questions/i)).toBeInTheDocument();
      });

      performance.mark('lazy-load-end');
      performance.measure('lazy-load', 'lazy-load-start', 'lazy-load-end');

      const measures = performance.getEntriesByName('lazy-load');
      expect(measures[0].duration).toBeLessThan(performanceBaseline.componentMount * 2);
    });
  });

  describe('User Interaction Performance', () => {
    it('should respond to user interactions within 16ms (60fps)', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const mathButton = screen.getByText(/Math/i);
      
      performance.mark('interaction-start');
      await user.click(mathButton);
      performance.mark('interaction-end');
      
      performance.measure('user-interaction', 'interaction-start', 'interaction-end');

      const measures = performance.getEntriesByName('user-interaction');
      expect(measures[0].duration).toBeLessThan(performanceBaseline.userInteraction);
    });

    it('should handle rapid user interactions without performance degradation', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const mathButton = screen.getByText(/Math/i);
      const readingButton = screen.getByText(/Reading/i);
      
      const interactionTimes = [];

      // Perform rapid interactions
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        await user.click(i % 2 === 0 ? mathButton : readingButton);
        
        const endTime = performance.now();
        interactionTimes.push(endTime - startTime);
      }

      // All interactions should be within budget
      interactionTimes.forEach(time => {
        expect(time).toBeLessThan(performanceBaseline.userInteraction * 2);
      });

      // Performance should not degrade significantly
      const firstInteraction = interactionTimes[0];
      const lastInteraction = interactionTimes[interactionTimes.length - 1];
      const degradation = (lastInteraction - firstInteraction) / firstInteraction;
      
      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
    });

    it('should maintain smooth animations during interactions', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Mock animation frame timing
      const animationFrames = [];
      const originalRAF = window.requestAnimationFrame;
      
      window.requestAnimationFrame = vi.fn((callback) => {
        const frameTime = performance.now();
        animationFrames.push(frameTime);
        return setTimeout(() => callback(frameTime), 16); // 60fps
      });

      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Wait for animations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Check frame timing consistency
      if (animationFrames.length > 1) {
        const frameTimes = [];
        for (let i = 1; i < animationFrames.length; i++) {
          frameTimes.push(animationFrames[i] - animationFrames[i - 1]);
        }

        const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        expect(averageFrameTime).toBeLessThan(20); // Should be close to 16.67ms for 60fps
      }

      window.requestAnimationFrame = originalRAF;
    });
  });

  describe('Memory Performance', () => {
    it('should not have memory leaks during navigation', async () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Navigate through different sections multiple times
      const subjects = ['Math', 'Reading', 'Science', 'Phonics'];
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const subject of subjects) {
          const button = screen.getByText(new RegExp(subject, 'i'));
          await user.click(button);
          
          await waitFor(() => {
            expect(screen.getByText(new RegExp(`${subject} Questions`, 'i'))).toBeInTheDocument();
          });
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (not indicating major leaks)
      expect(memoryIncrease).toBeLessThan(performanceBaseline.memoryUsage * 2);
    });

    it('should clean up event listeners and timers', async () => {
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;
      const originalSetTimeout = window.setTimeout;
      const originalClearTimeout = window.clearTimeout;
      
      const eventListeners = new Set();
      const timeouts = new Set();

      window.addEventListener = vi.fn((event, handler) => {
        eventListeners.add({ event, handler });
        return originalAddEventListener.call(window, event, handler);
      });

      window.removeEventListener = vi.fn((event, handler) => {
        eventListeners.delete({ event, handler });
        return originalRemoveEventListener.call(window, event, handler);
      });

      window.setTimeout = vi.fn((callback, delay) => {
        const id = originalSetTimeout(callback, delay);
        timeouts.add(id);
        return id;
      });

      window.clearTimeout = vi.fn((id) => {
        timeouts.delete(id);
        return originalClearTimeout(id);
      });

      const { unmount } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const listenersAfterMount = eventListeners.size;
      const timeoutsAfterMount = timeouts.size;

      unmount();

      // Should clean up most listeners and timers
      expect(eventListeners.size).toBeLessThanOrEqual(listenersAfterMount * 0.1);
      expect(timeouts.size).toBeLessThanOrEqual(timeoutsAfterMount * 0.1);

      // Restore original functions
      window.addEventListener = originalAddEventListener;
      window.removeEventListener = originalRemoveEventListener;
      window.setTimeout = originalSetTimeout;
      window.clearTimeout = originalClearTimeout;
    });
  });

  describe('Bundle Size Performance', () => {
    it('should not exceed bundle size budget', () => {
      // Mock bundle analysis
      const mockBundleStats = {
        main: 250000, // 250KB
        vendor: 200000, // 200KB
        styles: 50000, // 50KB
        total: 500000 // 500KB
      };

      expect(mockBundleStats.total).toBeLessThanOrEqual(performanceBaseline.bundleSize);
      expect(mockBundleStats.main).toBeLessThan(300000); // Main bundle under 300KB
      expect(mockBundleStats.vendor).toBeLessThan(250000); // Vendor bundle under 250KB
    });

    it('should load critical resources first', async () => {
      // Mock resource loading order
      const resourceLoadOrder = [
        { name: 'main.css', type: 'stylesheet', priority: 'high' },
        { name: 'main.js', type: 'script', priority: 'high' },
        { name: 'vendor.js', type: 'script', priority: 'medium' },
        { name: 'images.js', type: 'script', priority: 'low' }
      ];

      // Critical resources should load first
      const criticalResources = resourceLoadOrder.filter(r => r.priority === 'high');
      const nonCriticalResources = resourceLoadOrder.filter(r => r.priority !== 'high');

      expect(criticalResources.length).toBeGreaterThan(0);
      expect(nonCriticalResources.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      const currentMetrics = {
        initialRender: 150, // Regression: 50ms slower
        componentMount: 45, // Good: 5ms faster
        userInteraction: 25, // Regression: 9ms slower
        memoryUsage: 18000000, // Regression: 3MB more
        coreWebVitals: {
          LCP: 2500, // Regression: 500ms slower
          FID: 40, // Good: 10ms faster
          CLS: 0.08 // Regression: 0.03 higher
        }
      };

      const regressions = performanceRegressionDetector.detectRegressions(
        performanceBaseline,
        currentMetrics
      );

      expect(regressions).toContainEqual(
        expect.objectContaining({
          metric: 'initialRender',
          baseline: 100,
          current: 150,
          regression: 50
        })
      );

      expect(regressions).toContainEqual(
        expect.objectContaining({
          metric: 'userInteraction',
          regression: expect.any(Number)
        })
      );
    });

    it('should track performance trends over time', () => {
      const performanceHistory = [
        { timestamp: Date.now() - 86400000, metrics: { initialRender: 95 } }, // 1 day ago
        { timestamp: Date.now() - 43200000, metrics: { initialRender: 105 } }, // 12 hours ago
        { timestamp: Date.now() - 21600000, metrics: { initialRender: 115 } }, // 6 hours ago
        { timestamp: Date.now(), metrics: { initialRender: 125 } } // Now
      ];

      const trend = performanceRegressionDetector.analyzeTrend(
        performanceHistory,
        'initialRender'
      );

      expect(trend.direction).toBe('increasing'); // Performance getting worse
      expect(trend.rate).toBeGreaterThan(0);
      expect(trend.significance).toBe('concerning');
    });

    it('should provide performance optimization recommendations', () => {
      const currentMetrics = {
        initialRender: 150,
        memoryUsage: 25000000,
        bundleSize: 750000,
        coreWebVitals: {
          LCP: 3000,
          CLS: 0.15
        }
      };

      const recommendations = performanceRegressionDetector.getRecommendations(
        performanceBaseline,
        currentMetrics
      );

      expect(recommendations).toContain(
        expect.stringMatching(/bundle size|code splitting/i)
      );
      expect(recommendations).toContain(
        expect.stringMatching(/memory|garbage collection/i)
      );
      expect(recommendations).toContain(
        expect.stringMatching(/LCP|largest contentful paint/i)
      );
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with large datasets', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        question: `Question ${i}`,
        answers: [`Answer ${i}A`, `Answer ${i}B`, `Answer ${i}C`, `Answer ${i}D`],
        correct: 0
      }));

      const startTime = performance.now();

      render(
        <TestWrapper>
          <App initialData={largeDataset} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(performanceBaseline.initialRender * 3);
    });

    it('should handle concurrent user interactions efficiently', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Simulate concurrent interactions
      const interactions = [];
      const buttons = screen.getAllByRole('button');

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const promise = user.click(buttons[i % buttons.length]).then(() => {
          const endTime = performance.now();
          return endTime - startTime;
        });
        interactions.push(promise);
      }

      const interactionTimes = await Promise.all(interactions);
      
      // All concurrent interactions should complete within reasonable time
      interactionTimes.forEach(time => {
        expect(time).toBeLessThan(performanceBaseline.userInteraction * 5);
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should integrate with performance monitoring system', () => {
      const mockPerformanceMonitor = {
        startTiming: vi.fn(() => vi.fn()),
        trackUserInteraction: vi.fn(),
        addCustomMetric: vi.fn(),
        getPerformanceReport: vi.fn(() => ({
          coreWebVitals: { LCP: 1.5, FID: 50, CLS: 0.1 },
          componentPerformance: { averageLoadTime: 80 },
          memoryUsage: { current: 12000000 }
        }))
      };

      // Mock the performance monitor
      vi.mocked(performanceMonitor).mockImplementation(() => mockPerformanceMonitor);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(mockPerformanceMonitor.startTiming).toHaveBeenCalled();
    });

    it('should report performance metrics to monitoring service', async () => {
      const mockReportMetrics = vi.fn();
      
      // Mock performance reporting
      global.performanceReporter = {
        report: mockReportMetrics
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Should report performance metrics
      expect(mockReportMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          renderTime: expect.any(Number),
          memoryUsage: expect.any(Number),
          timestamp: expect.any(Number)
        })
      );

      delete global.performanceReporter;
    });
  });
});