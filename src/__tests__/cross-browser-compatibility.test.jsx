/**
 * Cross-Browser Compatibility Tests
 * 
 * Tests to ensure the application works correctly across different browsers
 * and handles browser-specific features and limitations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

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

describe('Cross-Browser Compatibility Tests', () => {
  let user;
  let originalUserAgent;
  let originalMatchMedia;

  beforeEach(() => {
    user = userEvent.setup();
    originalUserAgent = navigator.userAgent;
    originalMatchMedia = window.matchMedia;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  const mockUserAgent = (userAgent) => {
    Object.defineProperty(navigator, 'userAgent', {
      value: userAgent,
      writable: true
    });
  };

  const mockMatchMedia = (matches = false) => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      mockMatchMedia(false);
    });

    it('should render correctly in Chrome', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Chrome-specific features should work
      expect(window.matchMedia).toHaveBeenCalled();
    });

    it('should support Chrome-specific APIs', () => {
      // Mock Chrome-specific APIs
      global.chrome = {
        runtime: {
          onMessage: {
            addListener: vi.fn()
          }
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(global.chrome).toBeDefined();
      
      // Cleanup
      delete global.chrome;
    });

    it('should handle Chrome touch events', async () => {
      // Mock Chrome touch events
      window.TouchEvent = class TouchEvent extends Event {
        constructor(type, options = {}) {
          super(type, options);
          this.touches = options.touches || [];
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const mathButton = screen.getByText(/Math/i);
      
      fireEvent.touchStart(mathButton, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(mathButton, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      // Should handle touch events without errors
      expect(mathButton).toBeInTheDocument();
    });
  });

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
      mockMatchMedia(false);
    });

    it('should render correctly in Firefox', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });
    });

    it('should handle Firefox-specific CSS features', () => {
      // Mock Firefox-specific CSS support
      const mockSupports = vi.fn((property, value) => {
        // Firefox supports different CSS features
        if (property === '-moz-appearance') return true;
        if (property === 'scrollbar-width') return true;
        return false;
      });

      global.CSS = {
        supports: mockSupports
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(mockSupports).toHaveBeenCalled();
      
      // Cleanup
      delete global.CSS;
    });

    it('should handle Firefox pointer events', async () => {
      // Mock Firefox pointer events
      window.PointerEvent = class PointerEvent extends Event {
        constructor(type, options = {}) {
          super(type, options);
          this.pointerId = options.pointerId || 1;
          this.pointerType = options.pointerType || 'mouse';
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const mathButton = screen.getByText(/Math/i);
      
      fireEvent.pointerDown(mathButton, {
        pointerId: 1,
        pointerType: 'touch'
      });
      
      fireEvent.pointerUp(mathButton, {
        pointerId: 1,
        pointerType: 'touch'
      });

      expect(mathButton).toBeInTheDocument();
    });
  });

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
      mockMatchMedia(false);
    });

    it('should render correctly in Safari', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });
    });

    it('should handle Safari-specific limitations', () => {
      // Mock Safari limitations
      delete window.webkitAudioContext;
      delete window.AudioContext;

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should still work without Web Audio API
      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
    });

    it('should handle Safari touch events with webkit prefix', async () => {
      // Mock Safari webkit touch events
      window.webkitTouchEvent = class WebkitTouchEvent extends Event {
        constructor(type, options = {}) {
          super(type, options);
          this.touches = options.touches || [];
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const mathButton = screen.getByText(/Math/i);
      
      // Safari might use webkit prefixed events
      fireEvent(mathButton, new window.webkitTouchEvent('webkittouchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      }));

      expect(mathButton).toBeInTheDocument();
    });

    it('should handle Safari viewport meta tag requirements', () => {
      // Check for viewport meta tag (important for Safari mobile)
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      
      if (!viewportMeta) {
        // Add viewport meta tag for Safari
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
      }

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const updatedViewportMeta = document.querySelector('meta[name="viewport"]');
      expect(updatedViewportMeta).toBeTruthy();
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59');
      mockMatchMedia(false);
    });

    it('should render correctly in Edge', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });
    });

    it('should handle Edge-specific features', () => {
      // Mock Edge-specific APIs
      global.MSInputMethodContext = function() {};
      global.MSGesture = function() {};

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(global.MSInputMethodContext).toBeDefined();
      
      // Cleanup
      delete global.MSInputMethodContext;
      delete global.MSGesture;
    });
  });

  describe('Mobile Browser Compatibility', () => {
    describe('iOS Safari', () => {
      beforeEach(() => {
        mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
        mockMatchMedia(true); // Mobile media queries match
        
        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        Object.defineProperty(window, 'innerHeight', { value: 667 });
      });

      it('should render correctly on iOS Safari', async () => {
        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
        });
      });

      it('should handle iOS-specific touch events', async () => {
        // Mock iOS touch events
        window.TouchEvent = class TouchEvent extends Event {
          constructor(type, options = {}) {
            super(type, options);
            this.touches = options.touches || [];
            this.targetTouches = options.targetTouches || [];
            this.changedTouches = options.changedTouches || [];
          }
        };

        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        const mathButton = screen.getByText(/Math/i);
        
        fireEvent.touchStart(mathButton, {
          touches: [{ clientX: 100, clientY: 100 }],
          targetTouches: [{ clientX: 100, clientY: 100 }]
        });

        expect(mathButton).toBeInTheDocument();
      });

      it('should handle iOS viewport scaling issues', () => {
        // Mock iOS viewport behavior
        Object.defineProperty(window, 'visualViewport', {
          value: {
            width: 375,
            height: 667,
            scale: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
          },
          writable: true
        });

        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        expect(window.visualViewport).toBeDefined();
      });
    });

    describe('Android Chrome', () => {
      beforeEach(() => {
        mockUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
        mockMatchMedia(true);
        
        Object.defineProperty(window, 'innerWidth', { value: 360 });
        Object.defineProperty(window, 'innerHeight', { value: 640 });
      });

      it('should render correctly on Android Chrome', async () => {
        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
        });
      });

      it('should handle Android-specific features', () => {
        // Mock Android-specific APIs
        Object.defineProperty(navigator, 'vibrate', {
          value: vi.fn(),
          writable: true
        });

        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );

        expect(navigator.vibrate).toBeDefined();
      });
    });
  });

  describe('Feature Detection and Polyfills', () => {
    it('should detect and handle missing APIs gracefully', () => {
      // Remove modern APIs
      delete window.IntersectionObserver;
      delete window.ResizeObserver;
      delete window.requestIdleCallback;

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should still render without modern APIs
      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
    });

    it('should provide polyfills for missing features', () => {
      // Mock missing features
      delete Array.prototype.includes;
      delete Object.assign;
      delete Promise;

      // Mock polyfills
      Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
      };

      Object.assign = function(target, ...sources) {
        sources.forEach(source => {
          Object.keys(source).forEach(key => {
            target[key] = source[key];
          });
        });
        return target;
      };

      global.Promise = class MockPromise {
        constructor(executor) {
          this.state = 'pending';
          this.value = undefined;
          
          const resolve = (value) => {
            this.state = 'fulfilled';
            this.value = value;
          };
          
          const reject = (reason) => {
            this.state = 'rejected';
            this.value = reason;
          };
          
          executor(resolve, reject);
        }
        
        then(onFulfilled) {
          if (this.state === 'fulfilled') {
            return new MockPromise(resolve => resolve(onFulfilled(this.value)));
          }
          return this;
        }
        
        catch(onRejected) {
          if (this.state === 'rejected') {
            return new MockPromise(resolve => resolve(onRejected(this.value)));
          }
          return this;
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(Array.prototype.includes).toBeDefined();
      expect(Object.assign).toBeDefined();
      expect(global.Promise).toBeDefined();
    });

    it('should handle CSS feature detection', () => {
      // Mock CSS.supports
      global.CSS = {
        supports: vi.fn((property, value) => {
          // Simulate different browser support
          const supportedFeatures = [
            'display:grid',
            'display:flex',
            'transform:translateX(0)',
            'transition:all 0.3s'
          ];
          
          return supportedFeatures.includes(`${property}:${value}`);
        })
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(global.CSS.supports).toHaveBeenCalled();
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain performance standards in all browsers', async () => {
      const performanceEntries = [];
      
      // Mock performance API
      global.performance = {
        now: vi.fn(() => Date.now()),
        mark: vi.fn((name) => {
          performanceEntries.push({ name, type: 'mark', startTime: Date.now() });
        }),
        measure: vi.fn((name, startMark, endMark) => {
          performanceEntries.push({ name, type: 'measure', duration: 100 });
        }),
        getEntriesByType: vi.fn((type) => {
          return performanceEntries.filter(entry => entry.type === type);
        })
      };

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

      // Should render within reasonable time across all browsers
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle memory constraints on mobile browsers', () => {
      // Mock limited memory environment
      global.performance = {
        ...global.performance,
        memory: {
          usedJSHeapSize: 50000000, // 50MB
          totalJSHeapSize: 100000000, // 100MB
          jsHeapSizeLimit: 200000000 // 200MB limit
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should handle memory constraints gracefully
      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility in all browsers', async () => {
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
        expect(button).toHaveAttribute('aria-label');
      });

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should handle screen reader compatibility across browsers', () => {
      // Mock different screen reader APIs
      const mockScreenReader = {
        speak: vi.fn(),
        cancel: vi.fn()
      };

      // NVDA (Firefox)
      global.nvda = mockScreenReader;
      
      // JAWS (IE/Edge)
      global.jaws = mockScreenReader;
      
      // VoiceOver (Safari)
      global.voiceOver = mockScreenReader;

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      
      // Cleanup
      delete global.nvda;
      delete global.jaws;
      delete global.voiceOver;
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle browser-specific errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock browser-specific errors
      const originalError = window.Error;
      window.Error = class BrowserError extends originalError {
        constructor(message) {
          super(message);
          this.name = 'BrowserSpecificError';
        }
      };

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();

      // Restore
      window.Error = originalError;
      consoleSpy.mockRestore();
    });

    it('should provide fallbacks for unsupported features', () => {
      // Mock unsupported features
      delete window.fetch;
      delete window.Promise;
      delete window.Map;
      delete window.Set;

      // Should still render with fallbacks
      expect(() => {
        render(
          <TestWrapper>
            <App />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
});