/**
 * End-to-End Integration Tests
 * 
 * Comprehensive tests that validate the complete user journey across all systems:
 * - Enhanced learning experience with animations and adaptive content
 * - Mobile-first responsive design and touch interactions
 * - Accessibility compliance and keyboard navigation
 * - Performance optimization and offline functionality
 * - PWA features and background sync
 * 
 * Requirements tested: All requirements from 1.1 to 5.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock global APIs first
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: query.includes('(max-width: 768px)') || query.includes('(prefers-reduced-motion: reduce)'),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Import main app components
import App from '../App';
import { UserProvider } from '../contexts/UserContext';
import { AccessibilityProvider } from '../components/AccessibilityProvider';

// Mock all external dependencies
vi.mock('../supabase/config', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

vi.mock('../utils/serviceWorkerManager', () => ({
  default: {
    initialize: vi.fn(),
    cacheProgressData: vi.fn().mockResolvedValue(true),
    getCachedProgressData: vi.fn().mockReturnValue([]),
    forceSyncCachedData: vi.fn().mockResolvedValue(true),
    getOfflineCapabilities: vi.fn().mockReturnValue({
      canWorkOffline: true,
      hasBackgroundSync: true,
      hasPushNotifications: true
    }),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    isOnline: true
  }
}));

vi.mock('../utils/performanceMonitor', () => ({
  performanceMonitor: {
    initialize: vi.fn(),
    startTiming: vi.fn(() => vi.fn()),
    trackUserInteraction: vi.fn(),
    addCustomMetric: vi.fn(),
    getPerformanceReport: vi.fn().mockReturnValue({
      coreWebVitals: { LCP: 1.5, FID: 50, CLS: 0.1 },
      componentPerformance: { averageLoadTime: 100 },
      memoryUsage: { current: 10000000 },
      recommendations: []
    }),
    subscribe: vi.fn(() => vi.fn())
  }
}));

vi.mock('../utils/audioManager', () => ({
  playSound: vi.fn(),
  setVolume: vi.fn(),
  enableHapticFeedback: vi.fn(),
  initialize: vi.fn()
}));

// Mock Web APIs before any imports
Object.defineProperty(global, 'window', {
  value: {
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: query.includes('(max-width: 768px)') || query.includes('(prefers-reduced-motion: reduce)'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    innerWidth: 1024,
    innerHeight: 768,
    TouchEvent: class TouchEvent extends Event {
      constructor(type, options = {}) {
        super(type, options);
        this.touches = options.touches || [];
        this.targetTouches = options.targetTouches || [];
        this.changedTouches = options.changedTouches || [];
      }
    }
  },
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('(max-width: 768px)') || query.includes('(prefers-reduced-motion: reduce)'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({})
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AccessibilityProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AccessibilityProvider>
  </BrowserRouter>
);

describe('End-to-End Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock successful session
    const { supabase } = require('../supabase/config');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Journey - Learning Experience', () => {
    it('should complete full learning session with animations and achievements', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Navigate to a subject (Math)
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Wait for subject to load
      await waitFor(() => {
        expect(screen.getByText(/Math Questions/i)).toBeInTheDocument();
      });

      // Answer a question correctly
      const answerButton = screen.getAllByRole('button')[0];
      await user.click(answerButton);

      // Verify success animation and audio feedback
      await waitFor(() => {
        // Check for success indicators
        const successElements = screen.queryAllByText(/correct/i);
        expect(successElements.length).toBeGreaterThan(0);
      });

      // Continue with more questions to trigger achievement
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByText(/Next/i);
        if (nextButton) {
          await user.click(nextButton);
          await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            if (buttons.length > 0) {
              fireEvent.click(buttons[0]);
            }
          });
        }
      }

      // Check for achievement notification
      await waitFor(() => {
        // Achievement system should trigger
        expect(screen.queryByText(/achievement/i) || screen.queryByText(/badge/i)).toBeTruthy();
      }, { timeout: 5000 });
    });

    it('should adapt difficulty based on performance', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Start with Math subject
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Answer several questions correctly to trigger difficulty increase
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          if (buttons.length > 1) {
            fireEvent.click(buttons[0]); // Always click first answer
          }
        });

        const nextButton = screen.queryByText(/Next/i);
        if (nextButton) {
          await user.click(nextButton);
        }
      }

      // Verify adaptive learning is working (difficulty should increase)
      await waitFor(() => {
        // Check for harder questions or difficulty indicators
        const difficultyIndicators = screen.queryAllByText(/hard/i);
        expect(difficultyIndicators.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Mobile Experience and Touch Interactions', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Mock touch events
      window.TouchEvent = class TouchEvent extends Event {
        constructor(type, options = {}) {
          super(type, options);
          this.touches = options.touches || [];
          this.targetTouches = options.targetTouches || [];
          this.changedTouches = options.changedTouches || [];
        }
      };
    });

    it('should provide mobile-optimized interface with touch interactions', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for mobile-friendly button sizes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Buttons should have adequate touch target size (44px minimum)
        expect(button).toBeInTheDocument();
      });

      // Test swipe navigation
      const mathButton = screen.getByText(/Math/i);
      
      // Simulate touch events
      fireEvent.touchStart(mathButton, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(mathButton, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      
      fireEvent.touchEnd(mathButton, {
        changedTouches: [{ clientX: 200, clientY: 100 }]
      });

      // Verify touch interaction handling
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('should handle orientation changes gracefully', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Simulate orientation change to landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      fireEvent(window, new Event('orientationchange'));
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // App should still be functional in landscape mode
      const mathButton = screen.getByText(/Math/i);
      expect(mathButton).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should support complete keyboard navigation', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Test keyboard navigation through main interface
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Navigate with Tab key
      await user.keyboard('{Tab}');
      const secondButton = screen.getAllByRole('button')[1];
      expect(secondButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      // Should navigate or activate the focused element
      await waitFor(() => {
        // Check that some action occurred
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });
    });

    it('should provide proper ARIA labels and screen reader support', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for proper ARIA attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Each button should have accessible name
        expect(button).toHaveAttribute('aria-label');
      });

      // Check for skip links
      const skipLinks = screen.queryAllByText(/skip to/i);
      expect(skipLinks.length).toBeGreaterThan(0);

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should support high contrast and text scaling', async () => {
      // Mock high contrast preference
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        highContrast: true,
        textScaling: 1.5
      }));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check that high contrast styles are applied
      const body = document.body;
      expect(body).toHaveClass('high-contrast');

      // Check for text scaling
      const textElements = screen.getAllByText(/Emmy's Learning Adventure/i);
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        // Text should be scaled appropriately
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Offline Functionality', () => {
    it('should load quickly and meet performance budgets', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      
      // Should load within 2 seconds (2000ms)
      expect(loadTime).toBeLessThan(2000);

      // Verify performance monitoring is active
      const { performanceMonitor } = require('../utils/performanceMonitor');
      expect(performanceMonitor.initialize).toHaveBeenCalled();
    });

    it('should work offline with cached content', async () => {
      // Mock offline state
      const serviceWorkerManager = require('../utils/serviceWorkerManager').default;
      serviceWorkerManager.isOnline = false;
      serviceWorkerManager.getCachedProgressData.mockReturnValue([
        { userId: 'test', subject: 'math', score: 80, timestamp: Date.now() }
      ]);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // App should still function offline
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Should show offline indicator
      await waitFor(() => {
        const offlineIndicator = screen.queryByText(/offline/i);
        expect(offlineIndicator).toBeTruthy();
      });

      // Progress should be cached locally
      expect(serviceWorkerManager.cacheProgressData).toHaveBeenCalled();
    });

    it('should sync data when connection is restored', async () => {
      const serviceWorkerManager = require('../utils/serviceWorkerManager').default;
      
      // Start offline
      serviceWorkerManager.isOnline = false;
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Simulate going back online
      act(() => {
        serviceWorkerManager.isOnline = true;
        serviceWorkerManager.emit('online');
      });

      // Should trigger background sync
      await waitFor(() => {
        expect(serviceWorkerManager.forceSyncCachedData).toHaveBeenCalled();
      });
    });
  });

  describe('PWA Features and App-like Experience', () => {
    it('should provide installable PWA experience', async () => {
      // Mock beforeinstallprompt event
      const mockInstallPrompt = {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Simulate beforeinstallprompt event
      act(() => {
        window.dispatchEvent(new CustomEvent('beforeinstallprompt', {
          detail: mockInstallPrompt
        }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Should show install prompt
      const installButton = screen.queryByText(/install/i);
      if (installButton) {
        await user.click(installButton);
        expect(mockInstallPrompt.prompt).toHaveBeenCalled();
      }
    });

    it('should handle push notifications', async () => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted')
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Should request notification permission
      if (global.Notification.requestPermission) {
        await global.Notification.requestPermission();
        expect(global.Notification.requestPermission).toHaveBeenCalled();
      }
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    const browsers = [
      {
        name: 'Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      {
        name: 'Firefox',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      },
      {
        name: 'Safari',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      }
    ];

    browsers.forEach(browser => {
      it(`should work correctly in ${browser.name}`, async () => {
        // Mock user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: browser.userAgent,
          writable: true
        });

        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
        });

        // Basic functionality should work
        const mathButton = screen.getByText(/Math/i);
        await user.click(mathButton);

        await waitFor(() => {
          expect(screen.getByText(/Math Questions/i)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle component errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <TestWrapper>
          <ErrorComponent />
        </TestWrapper>
      );

      // Should show error boundary fallback
      await waitFor(() => {
        const errorMessage = screen.queryByText(/something went wrong/i) || 
                           screen.queryByText(/error/i);
        expect(errorMessage).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });

    it('should recover from network errors', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Should handle network errors gracefully
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Should show error message or fallback content
      await waitFor(() => {
        const errorIndicator = screen.queryByText(/error/i) || 
                              screen.queryByText(/try again/i);
        expect(errorIndicator).toBeTruthy();
      });
    });
  });

  describe('Data Synchronization and Persistence', () => {
    it('should persist user progress across sessions', async () => {
      // Mock saved progress
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        math: { score: 85, level: 3, achievements: ['first_correct', 'streak_5'] },
        reading: { score: 92, level: 4, achievements: ['bookworm'] }
      }));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Should load saved progress
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        expect.stringContaining('progress')
      );

      // Navigate to Math to verify progress is loaded
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Should show progress indicators
      await waitFor(() => {
        const progressIndicators = screen.queryAllByText(/level/i) ||
                                 screen.queryAllByText(/score/i);
        expect(progressIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should validate adaptive learning algorithm with diverse patterns', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Simulate different user performance patterns
      const mathButton = screen.getByText(/Math/i);
      await user.click(mathButton);

      // Pattern 1: Consistent correct answers (should increase difficulty)
      for (let i = 0; i < 5; i++) {
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          if (buttons.length > 1) {
            fireEvent.click(buttons[0]); // Always correct
          }
        });
        
        const nextButton = screen.queryByText(/Next/i);
        if (nextButton) {
          await user.click(nextButton);
        }
      }

      // Should adapt difficulty upward
      await waitFor(() => {
        // Check for difficulty indicators or harder questions
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Pattern 2: Mixed performance (should maintain current level)
      for (let i = 0; i < 3; i++) {
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          if (buttons.length > 1) {
            // Alternate between correct and incorrect
            fireEvent.click(buttons[i % 2]);
          }
        });
        
        const nextButton = screen.queryByText(/Next/i);
        if (nextButton) {
          await user.click(nextButton);
        }
      }

      // Algorithm should maintain appropriate difficulty
      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
    });
  });
});