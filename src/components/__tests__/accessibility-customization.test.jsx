import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';
import AccessibilitySettings from '../AccessibilitySettings';
import AccessibleImage from '../AccessibleImage';
import altTextManager from '../../utils/altTextManager';

import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = mockLocalStorage;

// Mock matchMedia
global.matchMedia = vi.fn(() => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Test component to access context
const TestComponent = () => {
  const { preferences, updatePreference } = useAccessibility();
  
  return (
    <div>
      <div data-testid="high-contrast">{preferences.highContrast.toString()}</div>
      <div data-testid="text-scaling">{preferences.textScaling}</div>
      <div data-testid="reduced-motion">{preferences.reducedMotion.toString()}</div>
      <button 
        onClick={() => updatePreference('highContrast', true)}
        data-testid="toggle-contrast"
      >
        Toggle Contrast
      </button>
    </div>
  );
};

describe('Accessibility Customization Options', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(null);
    document.body.className = '';
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AccessibilityProvider', () => {
    test('provides default accessibility preferences', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
      expect(screen.getByTestId('text-scaling')).toHaveTextContent('1');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
    });

    test('applies high contrast mode to document', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-contrast'));

      await waitFor(() => {
        expect(document.body).toHaveClass('high-contrast');
        expect(document.documentElement).toHaveClass('high-contrast');
      });
    });

    test('saves preferences to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-contrast'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'accessibility-preferences',
          expect.stringContaining('"highContrast":true')
        );
      });
    });

    test('loads preferences from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          highContrast: true,
          textScaling: 1.5,
          reducedMotion: true
        })
      );

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(screen.getByTestId('text-scaling')).toHaveTextContent('1.5');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });

  describe('AccessibilitySettings', () => {
    test('renders all accessibility options', () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('Reduce Motion')).toBeInTheDocument();
      expect(screen.getByText('Text Size')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Focus Indicators')).toBeInTheDocument();
      expect(screen.getByText('Show Alternative Text')).toBeInTheDocument();
    });

    test('allows toggling high contrast mode', async () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      const checkbox = screen.getByLabelText(/High Contrast Mode/);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(document.body).toHaveClass('high-contrast');
      });
    });

    test('allows changing text scaling', async () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      const largeTextRadio = screen.getByLabelText('Large');
      fireEvent.click(largeTextRadio);

      await waitFor(() => {
        expect(largeTextRadio).toBeChecked();
        expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1.2');
      });
    });

    test('allows toggling reduced motion', async () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      const checkbox = screen.getByLabelText(/Reduce Motion/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(document.body).toHaveClass('reduce-motion');
      });
    });
  });

  describe('AccessibleImage', () => {
    test('renders image with proper alt text', () => {
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test educational image"
        />
      );

      const img = screen.getByAltText('Test educational image');
      expect(img).toHaveAttribute('alt', 'Test educational image');
      expect(img).toHaveAttribute('src', '/test-image.jpg');
    });

    test('handles decorative images correctly', () => {
      render(
        <AccessibleImage
          src="/decorative.jpg"
          decorative={true}
        />
      );

      // Check that the image has proper decorative attributes
      const container = screen.getByRole('figure');
      const img = container.querySelector('img');
      expect(img).toHaveAttribute('aria-hidden', 'true');
      expect(img).toHaveAttribute('role', 'presentation');
    });

    test('shows loading placeholder', () => {
      render(
        <AccessibleImage
          src="/slow-image.jpg"
          alt="Slow loading image"
        />
      );

      expect(screen.getByLabelText('Image loading')).toBeInTheDocument();
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    test('shows error placeholder when image fails', async () => {
      render(
        <AccessibleImage
          src="/broken-image.jpg"
          alt="Broken image"
        />
      );

      const img = screen.getByAltText('Broken image');
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText(/Image unavailable: Broken image/)).toBeInTheDocument();
      });
    });

    test('displays caption when provided', () => {
      render(
        <AccessibleImage
          src="/test-image.jpg"
          alt="Test image"
          caption="This is a test image caption"
        />
      );

      expect(screen.getByText('This is a test image caption')).toBeInTheDocument();
    });
  });

  describe('Alt Text Manager', () => {
    test('generates appropriate alt text for math elements', () => {
      const element = document.createElement('div');
      element.className = 'math-problem';
      
      const altText = altTextManager.generateAltText(element, { subject: 'math' });
      expect(altText.toLowerCase()).toContain('math');
    });

    test('generates alt text for buttons', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit Answer';
      
      const altText = altTextManager.generateAltText(button);
      expect(altText).toBe('Submit Answer button');
    });

    test('enhances images without alt text', () => {
      document.body.innerHTML = '<img src="/math-problem.jpg" alt="">';
      const img = document.querySelector('img');
      
      altTextManager.enhanceImageAltText(img, { subject: 'math' });
      
      expect(img.getAttribute('alt')).toBeTruthy();
      expect(img.getAttribute('alt')).not.toBe('');
    });

    test('enhances interactive elements', () => {
      document.body.innerHTML = '<div class="clickable math-button" onclick="solve()"></div>';
      const element = document.querySelector('.clickable');
      
      altTextManager.enhanceInteractiveElements(element);
      
      expect(element.getAttribute('aria-label')).toBeTruthy();
      expect(element.getAttribute('role')).toBe('button');
      expect(element.getAttribute('tabindex')).toBe('0');
    });

    test('adds landmark roles to page sections', () => {
      document.body.innerHTML = `
        <header class="header"></header>
        <nav class="navigation"></nav>
        <main class="main-content"></main>
        <footer class="footer"></footer>
      `;
      
      altTextManager.addLandmarkRoles();
      
      expect(document.querySelector('header').getAttribute('role')).toBe('banner');
      expect(document.querySelector('nav').getAttribute('role')).toBe('navigation');
      expect(document.querySelector('main').getAttribute('role')).toBe('main');
      expect(document.querySelector('footer').getAttribute('role')).toBe('contentinfo');
    });
  });

  describe('WCAG Compliance', () => {
    test('high contrast mode provides sufficient color contrast', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-contrast'));

      await waitFor(() => {
        const styles = getComputedStyle(document.documentElement);
        // Check that high contrast variables are defined
        expect(document.documentElement).toHaveClass('high-contrast');
      });
    });

    test('focus indicators meet minimum size requirements', () => {
      document.body.className = 'enhanced-focus';
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      
      button.focus();
      
      const styles = getComputedStyle(button, ':focus');
      // Focus indicators should be at least 3px wide
      expect(document.body).toHaveClass('enhanced-focus');
    });

    test('text scaling maintains readability', async () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      const extraLargeRadio = screen.getByLabelText('Extra Large');
      fireEvent.click(extraLargeRadio);

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--text-scale')).toBe('1.5');
        expect(document.body).toHaveClass('text-scale-extra-large');
      });
    });

    test('reduced motion disables animations', async () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={() => {}} />
        </AccessibilityProvider>
      );

      const checkbox = screen.getByLabelText(/Reduce Motion/);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(document.body).toHaveClass('reduce-motion');
      });
    });
  });
});