import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import serviceWorkerManager from '../serviceWorkerManager';

// Mock service worker and related APIs
const mockServiceWorker = {
  controller: {
    postMessage: vi.fn()
  },
  addEventListener: vi.fn(),
  ready: Promise.resolve({
    sync: {
      register: vi.fn()
    }
  })
};

const mockRegistration = {
  sync: {
    register: vi.fn()
  }
};

// Mock global objects
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    onLine: true
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ServiceWorkerRegistration: {
      prototype: {
        sync: true
      }
    }
  },
  writable: true
});

Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'indexedDB', {
  value: {
    open: vi.fn()
  },
  writable: true
});

describe('ServiceWorkerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceWorkerManager.isOnline = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with service worker registration', () => {
      serviceWorkerManager.initialize(mockRegistration);
      expect(serviceWorkerManager.registration).toBe(mockRegistration);
    });

    it('should setup online/offline listeners', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Progress Data Caching', () => {
    it('should cache progress data when online', async () => {
      const progressData = {
        userId: 'test-user',
        score: 100,
        subject: 'math'
      };

      // Mock successful fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await serviceWorkerManager.cacheProgressData(progressData);
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      });
    });

    it('should fallback to localStorage when service worker unavailable', async () => {
      // Temporarily disable service worker
      const originalServiceWorker = navigator.serviceWorker;
      delete navigator.serviceWorker;

      const progressData = {
        userId: 'test-user',
        score: 100,
        subject: 'math'
      };

      // Mock failed fetch to trigger caching
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await serviceWorkerManager.cacheProgressData(progressData);
      expect(result).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalled();

      // Restore service worker
      navigator.serviceWorker = originalServiceWorker;
    });

    it('should get cached progress data from localStorage', () => {
      const cachedData = [
        { userId: 'test-user', score: 100, timestamp: Date.now() }
      ];
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = serviceWorkerManager.getCachedProgressData();
      expect(result).toEqual(cachedData);
      expect(localStorage.getItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should clear cached progress data', () => {
      serviceWorkerManager.clearCachedProgressData();
      expect(localStorage.removeItem).toHaveBeenCalledWith('cached-progress');
    });
  });

  describe('Offline Capabilities', () => {
    it('should return correct offline capabilities', () => {
      const capabilities = serviceWorkerManager.getOfflineCapabilities();
      
      expect(capabilities).toEqual({
        canWorkOffline: true,
        hasBackgroundSync: true,
        hasPushNotifications: true,
        hasIndexedDB: true,
        hasLocalStorage: true
      });
    });

    it('should handle missing APIs gracefully', () => {
      // Temporarily remove APIs
      const originalServiceWorker = navigator.serviceWorker;
      const originalIndexedDB = global.indexedDB;
      const originalLocalStorage = global.localStorage;
      
      delete navigator.serviceWorker;
      delete global.indexedDB;
      delete global.localStorage;

      const capabilities = serviceWorkerManager.getOfflineCapabilities();
      
      expect(capabilities.canWorkOffline).toBe(false);
      expect(capabilities.hasIndexedDB).toBe(false);
      expect(capabilities.hasLocalStorage).toBe(false);

      // Restore APIs
      navigator.serviceWorker = originalServiceWorker;
      global.indexedDB = originalIndexedDB;
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Event Handling', () => {
    it('should emit online event when connection restored', () => {
      const onlineCallback = vi.fn();
      serviceWorkerManager.on('online', onlineCallback);

      // Simulate online event
      serviceWorkerManager.isOnline = false;
      serviceWorkerManager.emit('online');

      expect(onlineCallback).toHaveBeenCalled();
    });

    it('should emit offline event when connection lost', () => {
      const offlineCallback = vi.fn();
      serviceWorkerManager.on('offline', offlineCallback);

      // Simulate offline event
      serviceWorkerManager.isOnline = true;
      serviceWorkerManager.emit('offline');

      expect(offlineCallback).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const callback = vi.fn();
      serviceWorkerManager.on('test', callback);
      serviceWorkerManager.off('test', callback);

      serviceWorkerManager.emit('test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should get cache status from service worker', async () => {
      const mockCacheStatus = {
        'emmy-static-v2.0.0': { entries: 10, size: 1024 },
        'emmy-dynamic-v2.0.0': { entries: 5, size: 512 }
      };

      // Mock MessageChannel
      global.MessageChannel = vi.fn().mockImplementation(() => ({
        port1: { onmessage: null },
        port2: {}
      }));

      // Mock the response
      const messageChannel = new MessageChannel();
      setTimeout(() => {
        messageChannel.port1.onmessage({ data: mockCacheStatus });
      }, 0);

      const result = await serviceWorkerManager.getCacheStatus();
      expect(result).toEqual(mockCacheStatus);
    });

    it('should clear all caches via service worker', async () => {
      // Mock MessageChannel
      global.MessageChannel = vi.fn().mockImplementation(() => ({
        port1: { onmessage: null },
        port2: {}
      }));

      // Mock the response
      const messageChannel = new MessageChannel();
      setTimeout(() => {
        messageChannel.port1.onmessage({ data: { success: true } });
      }, 0);

      const result = await serviceWorkerManager.clearAllCaches();
      expect(result).toBe(true);
    });
  });

  describe('Force Sync', () => {
    it('should sync cached data when online', async () => {
      const cachedData = [
        { userId: 'test-user', score: 100, timestamp: Date.now(), id: 'test-1' }
      ];
      
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
      
      // Mock successful fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await serviceWorkerManager.forceSyncCachedData();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(localStorage.removeItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should not sync when offline', async () => {
      serviceWorkerManager.isOnline = false;
      
      const result = await serviceWorkerManager.forceSyncCachedData();
      expect(result).toBe(false);
    });

    it('should handle partial sync failures', async () => {
      const cachedData = [
        { userId: 'test-user', score: 100, timestamp: Date.now(), id: 'test-1' },
        { userId: 'test-user', score: 200, timestamp: Date.now(), id: 'test-2' }
      ];
      
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
      
      // Mock one success, one failure
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await serviceWorkerManager.forceSyncCachedData();
      expect(result).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Should keep failed items in localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached-progress',
        JSON.stringify([cachedData[1]])
      );
    });
  });
});