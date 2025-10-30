import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDeviceType,
  getTouchCapabilities,
  getScreenInfo,
  getTouchFriendlySize,
  getBreakpoint,
  generateResponsiveClasses,
  setViewportHeight,
  initializeResponsiveUtils
} from '../responsiveUtils';

// Mock window and navigator objects
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxTouchPoints: 0,
    vibrate: undefined
  },
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

const mockDocument = {
  documentElement: {
    style: {
      setProperty: vi.fn()
    }
  },
  querySelector: vi.fn(),
  head: {
    appendChild: vi.fn()
  },
  createElement: vi.fn(() => ({
    name: '',
    content: ''
  })),
  querySelectorAll: vi.fn(() => [])
};

describe('Responsive Utils', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.window = mockWindow;
    global.navigator = mockWindow.navigator;
    global.document = mockDocument;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect desktop device', () => {
      mockWindow.innerWidth = 1024;
      const deviceType = getDeviceType();
      expect(deviceType).toBe('desktop');
    });

    it('should detect mobile device', () => {
      mockWindow.innerWidth = 375;
      const deviceType = getDeviceType();
      expect(deviceType).toBe('mobile');
    });

    it('should detect tablet device', () => {
      mockWindow.innerWidth = 768;
      const deviceType = getDeviceType();
      expect(deviceType).toBe('tablet');
    });

    it('should detect iOS device', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const deviceType = getDeviceType();
      expect(deviceType).toBe('ios');
    });

    it('should detect Android device', () => {
      mockWindow.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      const deviceType = getDeviceType();
      expect(deviceType).toBe('android');
    });
  });

  describe('Touch Capabilities', () => {
    it('should detect touch capabilities', () => {
      mockWindow.navigator.maxTouchPoints = 1;
      mockWindow.navigator.vibrate = vi.fn();
      
      const capabilities = getTouchCapabilities();
      
      expect(capabilities.hasTouch).toBe(true);
      expect(capabilities.supportsHaptics).toBe(true);
    });

    it('should detect no touch capabilities', () => {
      mockWindow.navigator.maxTouchPoints = 0;
      mockWindow.navigator.vibrate = undefined;
      
      const capabilities = getTouchCapabilities();
      
      expect(capabilities.hasTouch).toBe(false);
      expect(capabilities.supportsHaptics).toBe(false);
    });
  });

  describe('Screen Information', () => {
    it('should get screen info for desktop', () => {
      mockWindow.innerWidth = 1024;
      mockWindow.innerHeight = 768;
      
      const screenInfo = getScreenInfo();
      
      expect(screenInfo.width).toBe(1024);
      expect(screenInfo.height).toBe(768);
      expect(screenInfo.orientation).toBe('landscape');
      expect(screenInfo.isLargeScreen).toBe(true);
      expect(screenInfo.isSmallScreen).toBe(false);
    });

    it('should get screen info for mobile portrait', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      
      const screenInfo = getScreenInfo();
      
      expect(screenInfo.width).toBe(375);
      expect(screenInfo.height).toBe(667);
      expect(screenInfo.orientation).toBe('portrait');
      expect(screenInfo.isSmallScreen).toBe(true);
      expect(screenInfo.isLargeScreen).toBe(false);
    });
  });

  describe('Touch-Friendly Sizing', () => {
    it('should return minimum touch size for mobile', () => {
      const size = getTouchFriendlySize(30, 'mobile');
      expect(size).toBeGreaterThanOrEqual(44); // iOS minimum
    });

    it('should return minimum touch size for iOS', () => {
      const size = getTouchFriendlySize(30, 'ios');
      expect(size).toBeGreaterThanOrEqual(44); // iOS minimum
    });

    it('should return minimum touch size for Android', () => {
      const size = getTouchFriendlySize(30, 'android');
      expect(size).toBeGreaterThanOrEqual(44); // Android minimum
    });

    it('should return original size for desktop', () => {
      const size = getTouchFriendlySize(30, 'desktop');
      expect(size).toBe(30);
    });
  });

  describe('Breakpoints', () => {
    it('should detect xs breakpoint', () => {
      mockWindow.innerWidth = 400;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('xs');
    });

    it('should detect sm breakpoint', () => {
      mockWindow.innerWidth = 600;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('sm');
    });

    it('should detect md breakpoint', () => {
      mockWindow.innerWidth = 700;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('md');
    });

    it('should detect lg breakpoint', () => {
      mockWindow.innerWidth = 900;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('lg');
    });

    it('should detect xl breakpoint', () => {
      mockWindow.innerWidth = 1200;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('xl');
    });

    it('should detect 2xl breakpoint', () => {
      mockWindow.innerWidth = 1600;
      const breakpoint = getBreakpoint();
      expect(breakpoint).toBe('2xl');
    });
  });

  describe('Responsive Classes', () => {
    it('should generate responsive classes', () => {
      const classes = generateResponsiveClasses('text-base', {
        sm: 'text-lg',
        md: 'text-xl'
      });
      
      expect(classes).toBe('text-base sm:text-lg md:text-xl');
    });

    it('should handle empty overrides', () => {
      const classes = generateResponsiveClasses('text-base', {});
      expect(classes).toBe('text-base');
    });

    it('should handle null overrides', () => {
      const classes = generateResponsiveClasses('text-base', {
        sm: null,
        md: 'text-xl'
      });
      
      expect(classes).toBe('text-base md:text-xl');
    });
  });

  describe('Viewport Height', () => {
    it('should set viewport height CSS custom property', () => {
      mockWindow.innerHeight = 800;
      
      setViewportHeight();
      
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--vh',
        '8px'
      );
    });
  });

  describe('Initialization', () => {
    it('should initialize responsive utilities', () => {
      initializeResponsiveUtils();
      
      // Should set viewport height
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalled();
      
      // Should add event listeners
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });
  });
});