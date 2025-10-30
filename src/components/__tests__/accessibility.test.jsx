import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Import components to test
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';
import SkipLinks from '../SkipLinks';
import AccessibilitySettings from '../AccessibilitySettings';
import KeyboardNavigationHelper from '../KeyboardNavigationHelper';
import FocusManager, { FocusTrap, AutoFocus } from '../FocusManager';
import RovingTabIndex, { RovingTabIndexItem } from '../RovingTabIndex';
import AriaLiveRegion, { StatusRegion, AlertRegion } from '../AriaLiveRegion';
import withAccessibility, { withButtonAccessibility } from '../withAccessibility';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

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

describe('Accessibility Infrastructure', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    it('updates preferences and saves to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const toggleButton = screen.getByText('Toggle High Contrast');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'accessibility-preferences',
          expect.stringContaining('"highContrast":true')
        );
      });
    });

    it('loads preferences from localStorage', () => {
      const savedPreferences = {
        highContrast: true,
        reducedMotion: true,
        textScaling: 1.2,
        announcements: false
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences));

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      const preferences = screen.getByTestId('preferences');
      expect(preferences).toHaveTextContent('"highContrast":true');
      expect(preferences).toHaveTextContent('"reducedMotion":true');
      expect(preferences).toHaveTextContent('"textScaling":1.2');
    });
  });

  describe('SkipLinks', () => {
    it('renders skip links with proper attributes', () => {
      render(<SkipLinks />);

      const mainContentLink = screen.getByText('Skip to main content');
      const navigationLink = screen.getByText('Skip to navigation');
      const gameAreaLink = screen.getByText('Skip to game area');

      expect(mainContentLink).toHaveAttribute('href', '#main-content');
      expect(navigationLink).toHaveAttribute('href', '#navigation');
      expect(gameAreaLink).toHaveAttribute('href', '#game-area');
    });

    it('shows skip links on focus', () => {
      render(<SkipLinks />);

      const skipLink = screen.getByText('Skip to main content');
      
      fireEvent.focus(skipLink);
      expect(skipLink).toHaveClass('visible');

      fireEvent.blur(skipLink);
      expect(skipLink).not.toHaveClass('visible');
    });
  });

  describe('AccessibilitySettings', () => {
    it('renders when open', () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={vi.fn()} />
        </AccessibilityProvider>
      );

      expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('Reduce Motion')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={false} onClose={vi.fn()} />
        </AccessibilityProvider>
      );

      expect(screen.queryByText('Accessibility Settings')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      
      render(
        <AccessibilityProvider>
          <AccessibilitySettings isOpen={true} onClose={onClose} />
        </AccessibilityProvider>
      );

      const closeButton = screen.getByLabelText('Close accessibility settings');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
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

    it('clears message after delay', async () => {
      const { rerender } = render(
        <AriaLiveRegion message="Test message" clearDelay={100} />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('StatusRegion and AlertRegion', () => {
    it('StatusRegion uses polite priority', () => {
      render(<StatusRegion message="Status update" />);
      
      const region = screen.getByText('Status update');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('AlertRegion uses assertive priority', () => {
      render(<AlertRegion message="Alert message" />);
      
      const region = screen.getByText('Alert message');
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('KeyboardNavigationHelper', () => {
    it('renders with correct navigation attributes', () => {
      render(
        <AccessibilityProvider>
          <KeyboardNavigationHelper navigationMode="grid" gridColumns={3}>
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </KeyboardNavigationHelper>
        </AccessibilityProvider>
      );

      const container = screen.getByRole('grid');
      expect(container).toHaveAttribute('data-keyboard-navigation', 'grid');
      expect(container).toHaveAttribute('data-grid-columns', '3');
    });

    it('handles keyboard navigation', () => {
      render(
        <AccessibilityProvider>
          <KeyboardNavigationHelper navigationMode="list">
            <button>Item 1</button>
            <button>Item 2</button>
            <button>Item 3</button>
          </KeyboardNavigationHelper>
        </AccessibilityProvider>
      );

      const container = screen.getByRole('list');
      const firstButton = screen.getByText('Item 1');
      
      firstButton.focus();
      fireEvent.keyDown(container, { key: 'ArrowDown' });
      
      expect(screen.getByText('Item 2')).toHaveFocus();
    });
  });

  describe('FocusManager', () => {
    it('focuses first element when autoFocus is true', () => {
      render(
        <AccessibilityProvider>
          <FocusManager autoFocus={true}>
            <button>First Button</button>
            <button>Second Button</button>
          </FocusManager>
        </AccessibilityProvider>
      );

      expect(screen.getByText('First Button')).toHaveFocus();
    });
  });

  describe('FocusTrap', () => {
    it('traps focus within container', () => {
      render(
        <AccessibilityProvider>
          <FocusTrap active={true}>
            <button>First</button>
            <button>Last</button>
          </FocusTrap>
        </AccessibilityProvider>
      );

      const firstButton = screen.getByText('First');
      const lastButton = screen.getByText('Last');

      // Focus should start on first button
      expect(firstButton).toHaveFocus();

      // Tab from last button should go to first
      lastButton.focus();
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      expect(firstButton).toHaveFocus();

      // Shift+Tab from first button should go to last
      fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true });
      expect(lastButton).toHaveFocus();
    });
  });

  describe('RovingTabIndex', () => {
    it('manages tabindex correctly', () => {
      render(
        <AccessibilityProvider>
          <RovingTabIndex>
            <RovingTabIndexItem>Item 1</RovingTabIndexItem>
            <RovingTabIndexItem>Item 2</RovingTabIndexItem>
            <RovingTabIndexItem>Item 3</RovingTabIndexItem>
          </RovingTabIndex>
        </AccessibilityProvider>
      );

      const items = screen.getAllByText(/Item \d/);
      
      // First item should be tabbable
      expect(items[0]).toHaveAttribute('tabindex', '0');
      expect(items[1]).toHaveAttribute('tabindex', '-1');
      expect(items[2]).toHaveAttribute('tabindex', '-1');
    });

    it('handles arrow key navigation', () => {
      render(
        <AccessibilityProvider>
          <RovingTabIndex orientation="horizontal">
            <RovingTabIndexItem>Item 1</RovingTabIndexItem>
            <RovingTabIndexItem>Item 2</RovingTabIndexItem>
            <RovingTabIndexItem>Item 3</RovingTabIndexItem>
          </RovingTabIndex>
        </AccessibilityProvider>
      );

      const container = screen.getByRole('group');
      const items = screen.getAllByText(/Item \d/);

      items[0].focus();
      fireEvent.keyDown(container, { key: 'ArrowRight' });

      expect(items[1]).toHaveAttribute('tabindex', '0');
      expect(items[0]).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('withAccessibility HOC', () => {
    it('adds accessibility props to component', () => {
      const TestButton = ({ children, ...props }) => (
        <button {...props}>{children}</button>
      );
      
      const AccessibleButton = withButtonAccessibility(TestButton);
      
      render(<AccessibleButton>Click me</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('tabindex', '0');
    });

    it('handles keyboard activation', () => {
      const onClick = vi.fn();
      const TestDiv = ({ children, ...props }) => (
        <div {...props}>{children}</div>
      );
      
      const AccessibleDiv = withAccessibility(TestDiv, {
        interactive: true,
        onClick
      });
      
      render(<AccessibleDiv>Interactive div</AccessibleDiv>);
      
      const div = screen.getByText('Interactive div');
      fireEvent.keyDown(div, { key: 'Enter' });
      
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('works together in a complete accessibility setup', () => {
      const TestApp = () => (
        <AccessibilityProvider>
          <SkipLinks />
          <main id="main-content">
            <KeyboardNavigationHelper navigationMode="list">
              <FocusManager autoFocus={true}>
                <button>Button 1</button>
                <button>Button 2</button>
              </FocusManager>
            </KeyboardNavigationHelper>
          </main>
          <StatusRegion message="App loaded" />
        </AccessibilityProvider>
      );

      render(<TestApp />);

      // Skip links should be present
      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      
      // Main content should have proper role
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // First button should be focused
      expect(screen.getByText('Button 1')).toHaveFocus();
      
      // Status message should be announced
      expect(screen.getByText('App loaded')).toBeInTheDocument();
    });
  });
});