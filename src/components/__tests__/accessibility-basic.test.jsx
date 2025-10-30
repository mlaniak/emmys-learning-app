import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Import components to test
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';
import SkipLinks from '../SkipLinks';
import AriaLiveRegion from '../AriaLiveRegion';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia before importing components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that uses accessibility context
const TestComponent = () => {
  const { announce, preferences, updatePreference } = useAccessibility();
  
  return (
    <div>
      <button onClick={() => announce('Test announcement')}>
        Announce
      </button>
      <button onClick={() => updatePreference('highContrast', !preferences.highContrast)}>
        Toggle High Contrast
      </button>
      <div data-testid="preferences">{JSON.stringify(preferences)}</div>
    </div>
  );
};

describe('Basic Accessibility Infrastructure', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  describe('AccessibilityProvider', () => {
    it('provides default accessibility preferences', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const preferences = screen.getByTestId('preferences');
      expect(preferences).toHaveTextContent('highContrast');
      expect(preferences).toHaveTextContent('reducedMotion');
      expect(preferences).toHaveTextContent('announcements');
    });

    it('updates preferences', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByText('Toggle High Contrast');
      fireEvent.click(toggleButton);

      const preferences = screen.getByTestId('preferences');
      expect(preferences).toHaveTextContent('"highContrast":true');
    });
  });

  describe('SkipLinks', () => {
    it('renders skip links with proper attributes', () => {
      const { container } = render(<SkipLinks />);

      const skipLinksContainer = container.querySelector('.skip-links');
      expect(skipLinksContainer).toBeInTheDocument();

      const mainContentLink = container.querySelector('a[href="#main-content"]');
      const navigationLink = container.querySelector('a[href="#navigation"]');
      const gameAreaLink = container.querySelector('a[href="#game-area"]');

      expect(mainContentLink).toBeInTheDocument();
      expect(navigationLink).toBeInTheDocument();
      expect(gameAreaLink).toBeInTheDocument();
    });

    it('shows skip links on focus', () => {
      const { container } = render(<SkipLinks />);

      const skipLink = container.querySelector('a[href="#main-content"]');
      
      fireEvent.focus(skipLink);
      expect(skipLink).toHaveClass('visible');

      fireEvent.blur(skipLink);
      expect(skipLink).not.toHaveClass('visible');
    });
  });

  describe('AriaLiveRegion', () => {
    it('renders with correct ARIA attributes', () => {
      render(<AriaLiveRegion message="Test message" priority="assertive" />);

      const region = screen.getByText('Test message');
      expect(region).toHaveAttribute('aria-live', 'assertive');
      expect(region).toHaveAttribute('aria-atomic', 'true');
      expect(region).toHaveClass('sr-only');
    });

    it('renders empty when no message', () => {
      const { container } = render(<AriaLiveRegion message="" />);
      
      const region = container.querySelector('[aria-live]');
      expect(region).toBeInTheDocument();
      expect(region).toHaveTextContent('');
    });
  });

  describe('Integration', () => {
    it('works with provider and components together', () => {
      const { container } = render(
        <AccessibilityProvider>
          <SkipLinks />
          <TestComponent />
          <AriaLiveRegion message="System ready" />
        </AccessibilityProvider>
      );

      // Skip links should be present
      expect(container.querySelector('.skip-links')).toBeInTheDocument();
      
      // Test component should work
      expect(screen.getByText('Announce')).toBeInTheDocument();
      
      // Live region should show message
      expect(screen.getByText('System ready')).toBeInTheDocument();
    });
  });
});