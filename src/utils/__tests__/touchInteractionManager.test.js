import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import touchInteractionManager from '../touchInteractionManager';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true
});

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    style: {},
    appendChild: vi.fn(),
    remove: vi.fn(),
    animate: vi.fn(() => ({ onfinish: null })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  writable: true
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn()
  },
  writable: true
});

describe('TouchInteractionManager', () => {
  let mockElement;

  beforeEach(() => {
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100
      })),
      style: {},
      appendChild: vi.fn(),
      animate: vi.fn(() => ({ onfinish: null }))
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    touchInteractionManager.cleanup();
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback with correct patterns', () => {
      touchInteractionManager.triggerHaptic('tap');
      expect(navigator.vibrate).toHaveBeenCalledWith([10]);

      touchInteractionManager.triggerHaptic('success');
      expect(navigator.vibrate).toHaveBeenCalledWith([10, 10, 10]);

      touchInteractionManager.triggerHaptic('error');
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should handle unknown haptic types gracefully', () => {
      touchInteractionManager.triggerHaptic('unknown');
      expect(navigator.vibrate).toHaveBeenCalledWith([10]); // Falls back to tap
    });
  });

  describe('Touch Support', () => {
    it('should add touch event listeners to element', () => {
      const handlers = {
        onTap: vi.fn(),
        onLongPress: vi.fn(),
        onSwipe: vi.fn()
      };

      const cleanup = touchInteractionManager.addTouchSupport(mockElement, handlers);

      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });

      // Test cleanup
      cleanup();
      expect(mockElement.removeEventListener).toHaveBeenCalledTimes(4);
    });

    it('should return empty cleanup function for non-touch devices', () => {
      // Mock non-touch environment
      const originalOntouchstart = window.ontouchstart;
      delete window.ontouchstart;

      const cleanup = touchInteractionManager.addTouchSupport(mockElement, {});
      expect(typeof cleanup).toBe('function');
      expect(mockElement.addEventListener).not.toHaveBeenCalled();

      // Restore
      if (originalOntouchstart !== undefined) {
        window.ontouchstart = originalOntouchstart;
      }
    });
  });

  describe('Context Menu', () => {
    it('should create context menu with correct items', () => {
      const menuItems = [
        { id: 'copy', label: 'Copy', action: vi.fn() },
        { id: 'paste', label: 'Paste', action: vi.fn() }
      ];

      const showMenu = touchInteractionManager.createContextMenu(mockElement, menuItems);
      expect(typeof showMenu).toBe('function');

      // Test menu creation
      showMenu(100, 100);
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should hide all context menus', () => {
      // Mock existing menus
      const mockMenu = {
        style: {},
        remove: vi.fn()
      };

      document.querySelectorAll = vi.fn(() => [mockMenu]);

      touchInteractionManager.hideAllContextMenus();
      
      expect(mockMenu.style.transform).toBe('scale(0.8)');
      expect(mockMenu.style.opacity).toBe('0');
    });
  });

  describe('Drawing Support', () => {
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
      mockContext = {
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
        lineJoin: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        closePath: vi.fn()
      };

      mockCanvas = {
        ...mockElement,
        tagName: 'CANVAS',
        getContext: vi.fn(() => mockContext),
        width: 400,
        height: 300
      };
    });

    it('should add drawing support to canvas element', () => {
      const options = {
        strokeStyle: '#ff0000',
        lineWidth: 3,
        onDrawStart: vi.fn(),
        onDraw: vi.fn(),
        onDrawEnd: vi.fn()
      };

      const cleanup = touchInteractionManager.addDrawingSupport(mockCanvas, options);

      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      
      // Also adds mouse events for desktop compatibility
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));

      cleanup();
      expect(mockCanvas.removeEventListener).toHaveBeenCalledTimes(7); // 4 touch + 3 mouse + 1 mouseleave
    });

    it('should warn for non-canvas elements', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const cleanup = touchInteractionManager.addDrawingSupport(mockElement, {});
      
      expect(consoleSpy).toHaveBeenCalledWith('Drawing support requires a canvas element');
      expect(typeof cleanup).toBe('function');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Animation System', () => {
    it('should play touch animations', () => {
      touchInteractionManager.playTouchAnimation(mockElement, 'press');
      expect(mockElement.animate).toHaveBeenCalled();
    });

    it('should create ripple effects', () => {
      touchInteractionManager.createRippleEffect(mockElement, 50, 50);
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('should handle animation failures gracefully', () => {
      mockElement.animate = vi.fn(() => {
        throw new Error('Animation failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      touchInteractionManager.playTouchAnimation(mockElement, 'press');
      
      expect(consoleSpy).toHaveBeenCalledWith('Touch animation failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all active interactions', () => {
      // Add some interactions
      touchInteractionManager.addTouchSupport(mockElement, {});
      
      // Mock timers
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      touchInteractionManager.cleanup();
      
      // Should clear timers and interactions
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});