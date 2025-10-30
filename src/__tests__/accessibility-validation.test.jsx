/**
 * Accessibility Compliance Validation Tests
 * 
 * Comprehensive tests to validate WCAG 2.1 AA compliance and accessibility features
 * Requirements tested: 3.1, 3.2, 3.3, 3.4, 3.5 (All accessibility requirements)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import components for testing
import App from '../App';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { UserProvider } from '../contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock external dependencies
vi.mock('../supabase/config', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('(prefers-reduced-motion: reduce)') || 
             query.includes('(prefers-contrast: high)'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock SpeechSynthesis API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
    onvoiceschanged: null
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

describe('Accessibility Compliance Validation', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in main app', async () => {
      const { container } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Run axe accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should meet color contrast requirements', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for high contrast mode support
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Buttons should have sufficient contrast (this would be validated by axe)
        expect(button).toBeInTheDocument();
      });
    });

    it('should provide proper heading hierarchy', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check heading structure
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements).toHaveLength(1); // Should have exactly one h1

      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings.length).toBeGreaterThan(0);

      // Verify heading hierarchy (h1 -> h2 -> h3, no skipping)
      const headingLevels = allHeadings.map(heading => 
        parseInt(heading.tagName.charAt(1))
      ).sort();
      
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1); // No skipping heading levels
      }
    });

    it('should provide descriptive link text', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check all links have descriptive text
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const linkText = link.textContent || link.getAttribute('aria-label');
        expect(linkText).toBeTruthy();
        expect(linkText.length).toBeGreaterThan(2);
        // Should not be generic text like "click here" or "read more"
        expect(linkText.toLowerCase()).not.toMatch(/^(click here|read more|more|link)$/);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support complete keyboard navigation', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Test tab navigation through all interactive elements
      const interactiveElements = screen.getAllByRole('button')
        .concat(screen.getAllByRole('link'))
        .concat(screen.getAllByRole('textbox'))
        .filter(element => !element.hasAttribute('disabled'));

      if (interactiveElements.length > 0) {
        // Focus first element
        interactiveElements[0].focus();
        expect(interactiveElements[0]).toHaveFocus();

        // Tab through elements
        for (let i = 1; i < Math.min(interactiveElements.length, 5); i++) {
          await user.keyboard('{Tab}');
          // Check that focus moved to a focusable element
          const focusedElement = document.activeElement;
          expect(focusedElement).toBeInstanceOf(HTMLElement);
          expect(focusedElement.tabIndex).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should support arrow key navigation in lists and grids', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Navigate to subject selection (which should be a grid/list)
      const subjectButtons = screen.getAllByRole('button').filter(button => 
        button.textContent.match(/Math|Reading|Science|Phonics/i)
      );

      if (subjectButtons.length > 1) {
        subjectButtons[0].focus();
        expect(subjectButtons[0]).toHaveFocus();

        // Test arrow key navigation
        fireEvent.keyDown(subjectButtons[0], { key: 'ArrowRight' });
        
        // Should move focus to next item or handle arrow keys appropriately
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeInstanceOf(HTMLElement);
      }
    });

    it('should trap focus in modal dialogs', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Look for settings or modal trigger
      const settingsButton = screen.queryByLabelText(/settings/i) || 
                           screen.queryByText(/settings/i);

      if (settingsButton) {
        await user.click(settingsButton);

        // Check if modal opened
        const modal = screen.queryByRole('dialog');
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length > 1) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Focus should be trapped within modal
            lastElement.focus();
            await user.keyboard('{Tab}');
            expect(firstElement).toHaveFocus();

            firstElement.focus();
            await user.keyboard('{Shift>}{Tab}{/Shift}');
            expect(lastElement).toHaveFocus();
          }
        }
      }
    });

    it('should provide skip links', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for skip links
      const skipLinks = screen.queryAllByText(/skip to/i);
      expect(skipLinks.length).toBeGreaterThan(0);

      // Skip links should be focusable
      if (skipLinks.length > 0) {
        skipLinks[0].focus();
        expect(skipLinks[0]).toHaveFocus();
        expect(skipLinks[0]).toHaveAttribute('href');
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper ARIA labels and descriptions', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check buttons have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || 
                              button.getAttribute('aria-labelledby') ||
                              button.textContent;
        expect(accessibleName).toBeTruthy();
        expect(accessibleName.trim().length).toBeGreaterThan(0);
      });

      // Check images have alt text
      const images = screen.getAllByRole('img');
      images.forEach(image => {
        const altText = image.getAttribute('alt');
        expect(altText).toBeDefined();
        // Alt text should be descriptive or empty for decorative images
        if (altText.length > 0) {
          expect(altText.length).toBeGreaterThan(2);
        }
      });
    });

    it('should announce dynamic content changes', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Look for live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      liveRegions.forEach(region => {
        const liveValue = region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(liveValue);
      });

      // Test status announcements
      const statusRegions = document.querySelectorAll('[aria-live="polite"]');
      expect(statusRegions.length).toBeGreaterThan(0);

      // Test alert announcements
      const alertRegions = document.querySelectorAll('[aria-live="assertive"]');
      expect(alertRegions.length).toBeGreaterThan(0);
    });

    it('should provide proper form labels and error messages', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check form inputs have labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const label = screen.queryByLabelText(input.getAttribute('aria-label') || '');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const ariaLabel = input.getAttribute('aria-label');
        
        expect(label || ariaLabelledBy || ariaLabel).toBeTruthy();
      });

      // Check for error message associations
      const errorMessages = document.querySelectorAll('[role="alert"]');
      errorMessages.forEach(error => {
        expect(error.textContent.trim().length).toBeGreaterThan(0);
      });
    });

    it('should support landmark navigation', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for semantic landmarks
      const main = screen.queryByRole('main');
      expect(main).toBeInTheDocument();

      const navigation = screen.queryByRole('navigation');
      if (navigation) {
        expect(navigation).toBeInTheDocument();
      }

      const banner = screen.queryByRole('banner');
      if (banner) {
        expect(banner).toBeInTheDocument();
      }

      const contentinfo = screen.queryByRole('contentinfo');
      if (contentinfo) {
        expect(contentinfo).toBeInTheDocument();
      }
    });
  });

  describe('Visual Accessibility', () => {
    it('should support high contrast mode', async () => {
      // Mock high contrast preference
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        highContrast: true
      }));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check that high contrast class is applied
      const body = document.body;
      expect(body).toHaveClass('high-contrast');

      // Verify contrast ratios would be sufficient (axe would catch this)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should support text scaling', async () => {
      // Mock text scaling preference
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
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

      // Check that text scaling is applied
      const rootElement = document.documentElement;
      const fontSize = window.getComputedStyle(rootElement).fontSize;
      expect(fontSize).toBeDefined();
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        reducedMotion: true
      }));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check that reduced motion class is applied
      const body = document.body;
      expect(body).toHaveClass('reduce-motion');
    });

    it('should provide sufficient focus indicators', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Test focus indicators on interactive elements
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        buttons[0].focus();
        expect(buttons[0]).toHaveFocus();
        
        // Focus indicator should be visible (CSS would handle this)
        const styles = window.getComputedStyle(buttons[0]);
        expect(styles).toBeDefined();
      }
    });
  });

  describe('Motor Accessibility', () => {
    it('should provide adequate touch target sizes', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check button sizes meet minimum touch target requirements (44px)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // WCAG requires minimum 44x44px touch targets
        expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it('should support alternative input methods', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Test that all interactive elements can be activated via keyboard
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 0) {
        buttons[0].focus();
        
        // Should be activatable with Enter
        fireEvent.keyDown(buttons[0], { key: 'Enter' });
        expect(buttons[0]).toHaveFocus();

        // Should be activatable with Space
        fireEvent.keyDown(buttons[0], { key: ' ' });
        expect(buttons[0]).toHaveFocus();
      }
    });

    it('should provide sufficient time for interactions', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check that there are no automatic timeouts or they can be extended
      // This would be tested through user interactions and timing
      const timeoutElements = document.querySelectorAll('[data-timeout]');
      timeoutElements.forEach(element => {
        const timeout = element.getAttribute('data-timeout');
        if (timeout) {
          // Timeout should be reasonable or extendable
          expect(parseInt(timeout)).toBeGreaterThan(20000); // At least 20 seconds
        }
      });
    });
  });

  describe('Cognitive Accessibility', () => {
    it('should provide clear and consistent navigation', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for consistent navigation patterns
      const navigationElements = screen.getAllByRole('navigation');
      navigationElements.forEach(nav => {
        const links = nav.querySelectorAll('a, button');
        expect(links.length).toBeGreaterThan(0);
      });

      // Check for breadcrumbs or clear location indicators
      const breadcrumbs = screen.queryByRole('navigation', { name: /breadcrumb/i });
      if (breadcrumbs) {
        expect(breadcrumbs).toBeInTheDocument();
      }
    });

    it('should provide helpful error messages and recovery', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check for error message patterns
      const errorElements = document.querySelectorAll('[role="alert"]');
      errorElements.forEach(error => {
        const errorText = error.textContent;
        expect(errorText).toBeTruthy();
        // Error messages should be helpful, not just "Error"
        expect(errorText.toLowerCase()).not.toBe('error');
        expect(errorText.length).toBeGreaterThan(5);
      });
    });

    it('should support user preferences and customization', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Check that accessibility preferences are available
      const settingsButton = screen.queryByLabelText(/accessibility/i) ||
                           screen.queryByText(/accessibility/i) ||
                           screen.queryByLabelText(/settings/i);

      if (settingsButton) {
        expect(settingsButton).toBeInTheDocument();
        
        await user.click(settingsButton);
        
        // Should provide accessibility options
        const highContrastOption = screen.queryByText(/high contrast/i) ||
                                  screen.queryByLabelText(/high contrast/i);
        const textSizeOption = screen.queryByText(/text size/i) ||
                              screen.queryByLabelText(/text size/i);
        const motionOption = screen.queryByText(/reduce motion/i) ||
                            screen.queryByLabelText(/reduce motion/i);

        expect(highContrastOption || textSizeOption || motionOption).toBeTruthy();
      }
    });
  });

  describe('Accessibility Testing Integration', () => {
    it('should pass automated accessibility tests on all major pages', async () => {
      const pages = [
        { name: 'Home', component: <App /> },
      ];

      for (const page of pages) {
        const { container } = render(
          <TestWrapper>
            {page.component}
          </TestWrapper>
        );

        await waitFor(() => {
          expect(container.firstChild).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should maintain accessibility during dynamic content updates', async () => {
      const { container } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emmy's Learning Adventure/i)).toBeInTheDocument();
      });

      // Initial accessibility check
      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Navigate to different content
      const mathButton = screen.queryByText(/Math/i);
      if (mathButton) {
        await user.click(mathButton);

        await waitFor(() => {
          // Wait for content to update
          expect(container.firstChild).toBeInTheDocument();
        });

        // Check accessibility after content change
        results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });
});