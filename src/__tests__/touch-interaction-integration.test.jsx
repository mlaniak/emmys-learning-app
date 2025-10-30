/**
 * Touch Interaction Integration Tests
 * 
 * Comprehensive tests for touch interaction features including gestures,
 * haptic feedback, and mobile-optimized components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

// Mock touch APIs
Object.defineProperty(window, 'TouchEvent', {
  value: class TouchEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.touches = options.touches || [];
      this.targetTouches = options.targetTouches || [];
      this.changedTouches = options.changedTouches || [];
    }
  }
});

Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn()
});

// Mock responsive utils
vi.mock('../utils/responsiveUtils', () => ({
  getDeviceType: vi.fn(() => 'mobile'),
  getTouchCapabilities: vi.fn(() => ({
    hasTouch: true,
    supportsHaptics: true,
    supportsPointerEvents: true,
    maxTouchPoints: 10
  })),
  isMobileDevice: vi.fn(() => true),
  getScreenSize: vi.fn(() => ({ width: 375, height: 667 }))
}));

// Import components after mocking
import TouchButton from '../components/TouchButton';
import TouchDrawingCanvas from '../components/TouchDrawingCanvas';
import TouchGestureRecognizer from '../components/TouchGestureRecognizer';
import TouchContextMenu from '../components/TouchContextMenu';
import TouchInteractionDemo from '../components/TouchInteractionDemo';

describe('Touch Interaction Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Touch Button Interactions', () => {
    it('should handle basic touch interactions', async () => {
      const mockOnClick = vi.fn();
      
      render(
        <TouchButton onClick={mockOnClick}>
          Test Button
        </TouchButton>
      );

      const button = screen.getByText('Test Button');
      
      // Simulate touch events
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      expect(mockOnClick).toHaveBeenCalled();
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('should handle long press for context menu', async () => {
      const contextMenuItems = [
        { id: 'copy', label: 'Copy', action: vi.fn() },
        { id: 'paste', label: 'Paste', action: vi.fn() }
      ];

      render(
        <TouchButton contextMenuItems={contextMenuItems}>
          Long Press Button
        </TouchButton>
      );

      const button = screen.getByText('Long Press Button');
      
      // Simulate long press
      fireEvent.touchStart(button, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Wait for long press duration
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Paste')).toBeInTheDocument();
      });
    });

    it('should provide haptic feedback patterns', async () => {
      const variants = ['primary', 'secondary', 'success', 'danger'];
      
      for (const variant of variants) {
        const { unmount } = render(
          <TouchButton variant={variant} onClick={() => {}}>
            {variant} Button
          </TouchButton>
        );

        const button = screen.getByText(`${variant} Button`);
        
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);

        expect(navigator.vibrate).toHaveBeenCalled();
        
        unmount();
        vi.clearAllMocks();
      }
    });

    it('should handle touch target size requirements', () => {
      render(
        <TouchButton size="small">Small Button</TouchButton>
      );

      const button = screen.getByText('Small Button');
      const rect = button.getBoundingClientRect();
      
      // WCAG requires minimum 44x44px touch targets
      expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Gesture Recognition', () => {
    it('should recognize tap gestures', async () => {
      const mockOnGesture = vi.fn();
      
      render(
        <TouchGestureRecognizer
          gestures={['tap']}
          onGestureRecognized={mockOnGesture}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      // Simulate tap gesture
      fireEvent.touchStart(gestureArea, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchEnd(gestureArea, {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      });

      await waitFor(() => {
        expect(mockOnGesture).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'tap',
            confidence: expect.any(Number)
          })
        );
      });
    });

    it('should recognize swipe gestures', async () => {
      const mockOnGesture = vi.fn();
      
      render(
        <TouchGestureRecognizer
          gestures={['swipe']}
          onGestureRecognized={mockOnGesture}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      // Simulate swipe right gesture
      fireEvent.touchStart(gestureArea, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      
      fireEvent.touchMove(gestureArea, {
        touches: [{ clientX: 150, clientY: 100 }]
      });
      
      fireEvent.touchEnd(gestureArea, {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      });

      await waitFor(() => {
        expect(mockOnGesture).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'swipe',
            direction: 'right',
            confidence: expect.any(Number)
          })
        );
      });
    });

    it('should recognize pinch gestures', async () => {
      const mockOnGesture = vi.fn();
      
      render(
        <TouchGestureRecognizer
          gestures={['pinch']}
          onGestureRecognized={mockOnGesture}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      // Simulate pinch gesture (two fingers moving apart)
      fireEvent.touchStart(gestureArea, {
        touches: [
          { clientX: 90, clientY: 100 },
          { clientX: 110, clientY: 100 }
        ]
      });
      
      fireEvent.touchMove(gestureArea, {
        touches: [
          { clientX: 70, clientY: 100 },
          { clientX: 130, clientY: 100 }
        ]
      });
      
      fireEvent.touchEnd(gestureArea, {
        changedTouches: [
          { clientX: 70, clientY: 100 },
          { clientX: 130, clientY: 100 }
        ]
      });

      await waitFor(() => {
        expect(mockOnGesture).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'pinch',
            scale: expect.any(Number),
            confidence: expect.any(Number)
          })
        );
      });
    });

    it('should provide visual feedback during gestures', async () => {
      render(
        <TouchGestureRecognizer
          gestures={['tap']}
          showVisualFeedback={true}
          onGestureRecognized={() => {}}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      fireEvent.touchStart(gestureArea, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      // Should show visual feedback during touch
      await waitFor(() => {
        expect(gestureArea).toHaveClass('touch-active');
      });
    });
  });

  describe('Drawing Canvas Interactions', () => {
    it('should handle drawing with touch', async () => {
      const mockOnDrawingChange = vi.fn();
      
      render(
        <TouchDrawingCanvas
          width={300}
          height={200}
          onDrawingChange={mockOnDrawingChange}
        />
      );

      const canvas = screen.getByRole('img'); // Canvas has img role
      
      // Simulate drawing stroke
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 50, clientY: 50 }]
      });
      
      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 100, clientY: 50 }]
      });
      
      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 150, clientY: 100 }]
      });
      
      fireEvent.touchEnd(canvas, {
        changedTouches: [{ clientX: 150, clientY: 100 }]
      });

      await waitFor(() => {
        expect(mockOnDrawingChange).toHaveBeenCalled();
      });
    });

    it('should support different drawing tools', async () => {
      render(
        <TouchDrawingCanvas
          width={300}
          height={200}
          tools={['pen', 'eraser', 'highlighter']}
        />
      );

      // Should show tool selection
      expect(screen.getByText('pen')).toBeInTheDocument();
      expect(screen.getByText('eraser')).toBeInTheDocument();
      expect(screen.getByText('highlighter')).toBeInTheDocument();

      // Test tool switching
      const eraserTool = screen.getByText('eraser');
      await user.click(eraserTool);

      expect(eraserTool).toHaveClass('active');
    });

    it('should support color selection', async () => {
      const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff'];
      
      render(
        <TouchDrawingCanvas
          width={300}
          height={200}
          colors={colors}
        />
      );

      // Should show color palette
      colors.forEach(color => {
        const colorButton = screen.getByTitle(color);
        expect(colorButton).toBeInTheDocument();
      });
    });

    it('should handle undo/redo operations', async () => {
      render(
        <TouchDrawingCanvas
          width={300}
          height={200}
        />
      );

      const canvas = screen.getByRole('img');
      
      // Draw something
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 50, clientY: 50 }]
      });
      fireEvent.touchEnd(canvas);

      // Should enable undo button
      await waitFor(() => {
        const undoButton = screen.getByText('Undo');
        expect(undoButton).not.toBeDisabled();
      });

      // Test undo
      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);

      // Should enable redo button
      await waitFor(() => {
        const redoButton = screen.getByText('Redo');
        expect(redoButton).not.toBeDisabled();
      });
    });
  });

  describe('Context Menu Interactions', () => {
    it('should show context menu on long press', async () => {
      const menuItems = [
        { id: 'copy', label: 'Copy', action: vi.fn() },
        { id: 'paste', label: 'Paste', action: vi.fn() },
        { id: 'delete', label: 'Delete', action: vi.fn() }
      ];

      render(
        <TouchContextMenu
          menuItems={menuItems}
          trigger="longpress"
        >
          <div data-testid="context-target">Long press me</div>
        </TouchContextMenu>
      );

      const target = screen.getByTestId('context-target');
      
      // Simulate long press
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      fireEvent.touchEnd(target);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Paste')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('should execute menu item actions', async () => {
      const mockCopyAction = vi.fn();
      const menuItems = [
        { id: 'copy', label: 'Copy', action: mockCopyAction }
      ];

      render(
        <TouchContextMenu
          menuItems={menuItems}
          trigger="longpress"
        >
          <div data-testid="context-target">Long press me</div>
        </TouchContextMenu>
      );

      const target = screen.getByTestId('context-target');
      
      // Show context menu
      fireEvent.touchStart(target);
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });
      fireEvent.touchEnd(target);

      // Click menu item
      await waitFor(() => {
        const copyItem = screen.getByText('Copy');
        fireEvent.click(copyItem);
      });

      expect(mockCopyAction).toHaveBeenCalled();
    });

    it('should handle submenu interactions', async () => {
      const menuItems = [
        {
          id: 'more',
          label: 'More Options',
          submenu: [
            { id: 'share', label: 'Share', action: vi.fn() },
            { id: 'export', label: 'Export', action: vi.fn() }
          ]
        }
      ];

      render(
        <TouchContextMenu
          menuItems={menuItems}
          trigger="longpress"
        >
          <div data-testid="context-target">Long press me</div>
        </TouchContextMenu>
      );

      const target = screen.getByTestId('context-target');
      
      // Show context menu
      fireEvent.touchStart(target);
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });
      fireEvent.touchEnd(target);

      // Hover over submenu item
      await waitFor(() => {
        const moreItem = screen.getByText('More Options');
        fireEvent.mouseEnter(moreItem);
      });

      // Should show submenu
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Interaction Demo Integration', () => {
    it('should render all demo sections', () => {
      render(<TouchInteractionDemo />);

      expect(screen.getByText('Touch Interaction Demo')).toBeInTheDocument();
      expect(screen.getByText('🔘 Touch Buttons')).toBeInTheDocument();
      expect(screen.getByText('👋 Gesture Recognition')).toBeInTheDocument();
      expect(screen.getByText('🎨 Drawing Canvas')).toBeInTheDocument();
      expect(screen.getByText('📋 Context Menus')).toBeInTheDocument();
      expect(screen.getByText('⚡ Advanced Interactions')).toBeInTheDocument();
    });

    it('should switch between demo sections', async () => {
      render(<TouchInteractionDemo />);

      // Default should show buttons demo
      expect(screen.getByText('Basic Touch Buttons')).toBeInTheDocument();

      // Switch to gestures demo
      const gesturesButton = screen.getByText('👋 Gesture Recognition');
      await user.click(gesturesButton);

      expect(screen.getByText('Gesture Recognition Area')).toBeInTheDocument();
      expect(screen.queryByText('Basic Touch Buttons')).not.toBeInTheDocument();
    });

    it('should demonstrate haptic feedback patterns', async () => {
      render(<TouchInteractionDemo />);

      // Navigate to advanced interactions
      const advancedButton = screen.getByText('⚡ Advanced Interactions');
      await user.click(advancedButton);

      // Should show haptic feedback section
      expect(screen.getByText('Haptic Feedback Patterns')).toBeInTheDocument();

      // Test haptic feedback buttons
      const tapButton = screen.getByText('Tap');
      await user.click(tapButton);

      expect(navigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('should show device information', async () => {
      render(<TouchInteractionDemo />);

      // Navigate to advanced interactions
      const advancedButton = screen.getByText('⚡ Advanced Interactions');
      await user.click(advancedButton);

      expect(screen.getByText('Device Information')).toBeInTheDocument();
      expect(screen.getByText('Device Type: mobile')).toBeInTheDocument();
      expect(screen.getByText('Touch Support: Yes')).toBeInTheDocument();
      expect(screen.getByText('Haptic Support: Yes')).toBeInTheDocument();
    });

    it('should show mobile-specific instructions', () => {
      render(<TouchInteractionDemo />);

      expect(screen.getByText('📱 Mobile Instructions')).toBeInTheDocument();
      expect(screen.getByText('• Tap buttons for immediate actions')).toBeInTheDocument();
      expect(screen.getByText('• Long press for context menus and options')).toBeInTheDocument();
    });
  });

  describe('Accessibility in Touch Interactions', () => {
    it('should provide keyboard alternatives for touch interactions', async () => {
      render(
        <TouchButton onClick={() => {}}>
          Accessible Touch Button
        </TouchButton>
      );

      const button = screen.getByText('Accessible Touch Button');
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();

      // Should activate with Enter
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(navigator.vibrate).toHaveBeenCalled();

      // Should activate with Space
      fireEvent.keyDown(button, { key: ' ' });
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('should provide proper ARIA labels for touch components', () => {
      render(
        <TouchGestureRecognizer
          gestures={['tap', 'swipe']}
          onGestureRecognized={() => {}}
        >
          <div>Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByRole('region');
      expect(gestureArea).toHaveAttribute('aria-label', expect.stringContaining('gesture'));
    });

    it('should announce gesture recognition to screen readers', async () => {
      render(
        <TouchGestureRecognizer
          gestures={['tap']}
          onGestureRecognized={() => {}}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      fireEvent.touchStart(gestureArea);
      fireEvent.touchEnd(gestureArea);

      // Should have live region for announcements
      await waitFor(() => {
        const liveRegion = document.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should throttle touch move events', async () => {
      const mockOnDrawingChange = vi.fn();
      
      render(
        <TouchDrawingCanvas
          width={300}
          height={200}
          onDrawingChange={mockOnDrawingChange}
        />
      );

      const canvas = screen.getByRole('img');
      
      // Simulate rapid touch move events
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 50, clientY: 50 }]
      });
      
      for (let i = 0; i < 20; i++) {
        fireEvent.touchMove(canvas, {
          touches: [{ clientX: 50 + i, clientY: 50 }]
        });
      }
      
      fireEvent.touchEnd(canvas);

      // Should throttle the events (not call for every move)
      expect(mockOnDrawingChange).toHaveBeenCalledTimes(1);
    });

    it('should debounce gesture recognition', async () => {
      const mockOnGesture = vi.fn();
      
      render(
        <TouchGestureRecognizer
          gestures={['tap']}
          onGestureRecognized={mockOnGesture}
        >
          <div data-testid="gesture-area">Gesture Area</div>
        </TouchGestureRecognizer>
      );

      const gestureArea = screen.getByTestId('gesture-area');
      
      // Rapid taps should be debounced
      for (let i = 0; i < 5; i++) {
        fireEvent.touchStart(gestureArea);
        fireEvent.touchEnd(gestureArea);
      }

      await waitFor(() => {
        expect(mockOnGesture).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle touch API unavailability gracefully', () => {
      // Mock missing touch support
      delete window.TouchEvent;
      
      expect(() => {
        render(
          <TouchButton onClick={() => {}}>
            Fallback Button
          </TouchButton>
        );
      }).not.toThrow();

      expect(screen.getByText('Fallback Button')).toBeInTheDocument();
    });

    it('should handle vibration API unavailability', async () => {
      // Mock missing vibration support
      delete navigator.vibrate;
      
      render(
        <TouchButton onClick={() => {}}>
          No Vibration Button
        </TouchButton>
      );

      const button = screen.getByText('No Vibration Button');
      
      // Should not throw error when vibration is unavailable
      expect(() => {
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);
      }).not.toThrow();
    });

    it('should handle canvas context errors', () => {
      // Mock canvas context failure
      const mockGetContext = vi.fn(() => null);
      HTMLCanvasElement.prototype.getContext = mockGetContext;

      expect(() => {
        render(
          <TouchDrawingCanvas
            width={300}
            height={200}
          />
        );
      }).not.toThrow();

      // Should show fallback message
      expect(screen.getByText(/Canvas not supported/i)).toBeInTheDocument();
    });
  });
});