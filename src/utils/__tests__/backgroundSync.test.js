/**
 * Unit Tests for Background Sync Utility
 * 
 * Tests background synchronization functionality for offline data management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null
};

const mockIDBTransaction = {
  objectStore: vi.fn(() => ({
    add: vi.fn(() => mockIDBRequest),
    get: vi.fn(() => mockIDBRequest),
    getAll: vi.fn(() => mockIDBRequest),
    delete: vi.fn(() => mockIDBRequest),
    clear: vi.fn(() => mockIDBRequest)
  })),
  oncomplete: null,
  onerror: null
};

const mockIDBDatabase = {
  transaction: vi.fn(() => mockIDBTransaction),
  createObjectStore: vi.fn(),
  close: vi.fn()
};

global.indexedDB = {
  open: vi.fn(() => {
    const request = { ...mockIDBRequest };
    setTimeout(() => {
      request.result = mockIDBDatabase;
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest)
};

// Mock fetch
global.fetch = vi.fn();

// Import the module after mocking
import backgroundSync from '../backgroundSync';

describe('Background Sync Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize background sync successfully', async () => {
      const result = await backgroundSync.initialize();
      expect(result).toBe(true);
      expect(global.indexedDB.open).toHaveBeenCalledWith('BackgroundSyncDB', 1);
    });

    it('should handle initialization errors', async () => {
      global.indexedDB.open.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onerror) request.onerror(new Error('DB Error'));
        }, 0);
        return request;
      });

      const result = await backgroundSync.initialize();
      expect(result).toBe(false);
    });
  });

  describe('Data Queuing', () => {
    beforeEach(async () => {
      await backgroundSync.initialize();
    });

    it('should queue data for sync', async () => {
      const testData = {
        type: 'progress',
        userId: 'user123',
        data: { score: 85, subject: 'math' }
      };

      const result = await backgroundSync.queueForSync(testData);
      expect(result).toBe(true);
    });

    it('should handle queue errors', async () => {
      mockIDBTransaction.objectStore.mockImplementation(() => ({
        add: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onerror) request.onerror(new Error('Add failed'));
          }, 0);
          return request;
        })
      }));

      const testData = { type: 'test', data: {} };
      const result = await backgroundSync.queueForSync(testData);
      expect(result).toBe(false);
    });

    it('should add timestamp and id to queued data', async () => {
      const testData = { type: 'progress', data: { score: 85 } };
      
      let capturedData;
      mockIDBTransaction.objectStore.mockImplementation(() => ({
        add: vi.fn((data) => {
          capturedData = data;
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      await backgroundSync.queueForSync(testData);
      
      expect(capturedData).toMatchObject({
        type: 'progress',
        data: { score: 85 },
        timestamp: expect.any(Number),
        id: expect.any(String)
      });
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(async () => {
      await backgroundSync.initialize();
    });

    it('should get all queued items', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 } },
        { id: '2', type: 'achievement', data: { badge: 'math_master' } }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      const items = await backgroundSync.getQueuedItems();
      expect(items).toEqual(mockItems);
    });

    it('should get items by type', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 } }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      const items = await backgroundSync.getQueuedItems('progress');
      expect(items).toEqual(mockItems);
    });

    it('should handle retrieval errors', async () => {
      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onerror) request.onerror(new Error('Get failed'));
          }, 0);
          return request;
        })
      }));

      const items = await backgroundSync.getQueuedItems();
      expect(items).toEqual([]);
    });
  });

  describe('Sync Process', () => {
    beforeEach(async () => {
      await backgroundSync.initialize();
    });

    it('should sync queued items successfully', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 }, endpoint: '/api/progress' },
        { id: '2', type: 'achievement', data: { badge: 'math_master' }, endpoint: '/api/achievements' }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        }),
        delete: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await backgroundSync.syncAll();
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle sync failures gracefully', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 }, endpoint: '/api/progress' }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        }),
        delete: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await backgroundSync.syncAll();
      
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should retry failed syncs', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 }, endpoint: '/api/progress', retryCount: 0 }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        }),
        put: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      // First sync attempt should fail and increment retry count
      let result = await backgroundSync.syncAll();
      expect(result.failed).toBe(1);

      // Second sync attempt should succeed
      result = await backgroundSync.syncAll();
      expect(result.synced).toBe(1);
    });

    it('should abandon items after max retries', async () => {
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 }, endpoint: '/api/progress', retryCount: 5 }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        }),
        delete: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await backgroundSync.syncAll();
      
      expect(result.abandoned).toBe(1);
      expect(global.fetch).not.toHaveBeenCalled(); // Should not attempt sync
    });
  });

  describe('Connection Status', () => {
    it('should detect online status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(backgroundSync.isOnline()).toBe(true);
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(backgroundSync.isOnline()).toBe(false);
    });

    it('should register online event listener', () => {
      const mockAddEventListener = vi.spyOn(window, 'addEventListener');
      
      backgroundSync.onConnectionChange(() => {});
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should trigger callback on connection change', () => {
      const mockCallback = vi.fn();
      
      backgroundSync.onConnectionChange(mockCallback);
      
      // Simulate online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      expect(mockCallback).toHaveBeenCalledWith(true);
    });
  });

  describe('Auto Sync', () => {
    beforeEach(async () => {
      await backgroundSync.initialize();
    });

    it('should start auto sync when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      const result = backgroundSync.startAutoSync(5000); // 5 second interval
      expect(result).toBe(true);
    });

    it('should not start auto sync when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const result = backgroundSync.startAutoSync(5000);
      expect(result).toBe(false);
    });

    it('should stop auto sync', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      backgroundSync.startAutoSync(5000);
      const result = backgroundSync.stopAutoSync();
      expect(result).toBe(true);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await backgroundSync.initialize();
    });

    it('should clear all queued data', async () => {
      mockIDBTransaction.objectStore.mockImplementation(() => ({
        clear: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      const result = await backgroundSync.clearQueue();
      expect(result).toBe(true);
    });

    it('should remove specific item from queue', async () => {
      mockIDBTransaction.objectStore.mockImplementation(() => ({
        delete: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      const result = await backgroundSync.removeFromQueue('item123');
      expect(result).toBe(true);
    });

    it('should get queue statistics', async () => {
      const mockItems = [
        { id: '1', type: 'progress', timestamp: Date.now() - 1000 },
        { id: '2', type: 'achievement', timestamp: Date.now() - 2000 },
        { id: '3', type: 'progress', timestamp: Date.now() - 3000 }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      const stats = await backgroundSync.getQueueStats();
      
      expect(stats).toMatchObject({
        total: 3,
        byType: {
          progress: 2,
          achievement: 1
        },
        oldestItem: expect.any(Number),
        newestItem: expect.any(Number)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      global.indexedDB.open.mockImplementation(() => {
        throw new Error('IndexedDB not supported');
      });

      const result = await backgroundSync.initialize();
      expect(result).toBe(false);
    });

    it('should handle transaction errors gracefully', async () => {
      await backgroundSync.initialize();
      
      mockIDBDatabase.transaction.mockImplementation(() => {
        throw new Error('Transaction failed');
      });

      const result = await backgroundSync.queueForSync({ type: 'test', data: {} });
      expect(result).toBe(false);
    });

    it('should handle network errors during sync', async () => {
      await backgroundSync.initialize();
      
      const mockItems = [
        { id: '1', type: 'progress', data: { score: 85 }, endpoint: '/api/progress' }
      ];

      mockIDBTransaction.objectStore.mockImplementation(() => ({
        getAll: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            request.result = mockItems;
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        }),
        put: vi.fn(() => {
          const request = { ...mockIDBRequest };
          setTimeout(() => {
            if (request.onsuccess) request.onsuccess();
          }, 0);
          return request;
        })
      }));

      global.fetch.mockRejectedValue(new Error('Network timeout'));

      const result = await backgroundSync.syncAll();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network timeout');
    });
  });
});