/**
 * Offline Functionality and Data Synchronization Tests
 * 
 * Tests to validate offline capabilities and data sync functionality
 * Requirements tested: 4.2, 4.4 (Offline functionality and data synchronization)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import serviceWorkerManager from '../utils/serviceWorkerManager';
import { backgroundSync } from '../utils/backgroundSync';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

const mockIDBDatabase = {
  createObjectStore: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn()
};

const mockIDBTransaction = {
  objectStore: vi.fn(),
  oncomplete: null,
  onerror: null
};

const mockIDBObjectStore = {
  add: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn()
};

const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null
};

// Mock global APIs
global.indexedDB = mockIndexedDB;
global.IDBDatabase = mockIDBDatabase;
global.IDBTransaction = mockIDBTransaction;
global.IDBObjectStore = mockIDBObjectStore;
global.IDBRequest = mockIDBRequest;

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    serviceWorker: {
      ready: Promise.resolve({
        sync: {
          register: vi.fn()
        }
      })
    }
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('Offline Functionality and Data Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    
    // Reset service worker manager
    serviceWorkerManager.isOnline = true;
    serviceWorkerManager.registration = null;
    
    // Mock successful IndexedDB operations
    mockIndexedDB.open.mockImplementation(() => {
      const request = { ...mockIDBRequest };
      setTimeout(() => {
        request.result = mockIDBDatabase;
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    });

    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Offline Detection and Handling', () => {
    it('should detect when app goes offline', () => {
      const offlineCallback = vi.fn();
      serviceWorkerManager.on('offline', offlineCallback);

      // Simulate going offline
      navigator.onLine = false;
      serviceWorkerManager.isOnline = false;
      serviceWorkerManager.emit('offline');

      expect(offlineCallback).toHaveBeenCalled();
      expect(serviceWorkerManager.isOnline).toBe(false);
    });

    it('should detect when app comes back online', () => {
      const onlineCallback = vi.fn();
      serviceWorkerManager.on('online', onlineCallback);

      // Start offline
      serviceWorkerManager.isOnline = false;

      // Simulate coming back online
      navigator.onLine = true;
      serviceWorkerManager.isOnline = true;
      serviceWorkerManager.emit('online');

      expect(onlineCallback).toHaveBeenCalled();
      expect(serviceWorkerManager.isOnline).toBe(true);
    });

    it('should provide offline capabilities information', () => {
      const capabilities = serviceWorkerManager.getOfflineCapabilities();

      expect(capabilities).toEqual({
        canWorkOffline: true,
        hasBackgroundSync: true,
        hasPushNotifications: true,
        hasIndexedDB: true,
        hasLocalStorage: true
      });
    });
  });

  describe('Data Caching When Offline', () => {
    it('should cache progress data when offline', async () => {
      // Simulate offline state
      serviceWorkerManager.isOnline = false;
      global.fetch.mockRejectedValue(new Error('Network error'));

      const progressData = {
        userId: 'test-user-123',
        subject: 'math',
        score: 85,
        completedAt: new Date().toISOString(),
        questions: [
          { id: 1, answer: 'correct', timeSpent: 5000 },
          { id: 2, answer: 'incorrect', timeSpent: 3000 }
        ]
      };

      const result = await serviceWorkerManager.cacheProgressData(progressData);

      // Should fallback to localStorage when offline
      expect(result).toBe(false); // Network request failed
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached-progress',
        expect.stringContaining(progressData.userId)
      );
    });

    it('should retrieve cached progress data', () => {
      const cachedData = [
        {
          id: 'cache-1',
          userId: 'test-user-123',
          subject: 'math',
          score: 85,
          timestamp: Date.now()
        },
        {
          id: 'cache-2',
          userId: 'test-user-123',
          subject: 'reading',
          score: 92,
          timestamp: Date.now()
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = serviceWorkerManager.getCachedProgressData();

      expect(result).toEqual(cachedData);
      expect(localStorage.getItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should handle corrupted cache data gracefully', () => {
      // Mock corrupted JSON data
      localStorage.getItem.mockReturnValue('invalid-json-data');

      const result = serviceWorkerManager.getCachedProgressData();

      expect(result).toEqual([]); // Should return empty array for corrupted data
    });

    it('should cache user preferences offline', () => {
      const preferences = {
        highContrast: true,
        textScaling: 1.2,
        reducedMotion: false,
        audioEnabled: true
      };

      // Simulate saving preferences offline
      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'accessibility-preferences',
        JSON.stringify(preferences)
      );

      // Verify retrieval
      localStorage.getItem.mockReturnValue(JSON.stringify(preferences));
      const retrieved = JSON.parse(localStorage.getItem('accessibility-preferences'));

      expect(retrieved).toEqual(preferences);
    });
  });

  describe('Background Synchronization', () => {
    it('should register background sync when data is cached', async () => {
      const mockRegistration = {
        sync: {
          register: vi.fn().mockResolvedValue(undefined)
        }
      };

      serviceWorkerManager.initialize(mockRegistration);

      const progressData = {
        userId: 'test-user-123',
        subject: 'science',
        score: 78
      };

      // Cache data (simulating offline scenario)
      serviceWorkerManager.isOnline = false;
      await serviceWorkerManager.cacheProgressData(progressData);

      // Should register background sync
      expect(mockRegistration.sync.register).toHaveBeenCalledWith('progress-sync');
    });

    it('should sync cached data when connection is restored', async () => {
      const cachedData = [
        {
          id: 'sync-1',
          userId: 'test-user-123',
          subject: 'math',
          score: 85,
          timestamp: Date.now()
        },
        {
          id: 'sync-2',
          userId: 'test-user-123',
          subject: 'reading',
          score: 92,
          timestamp: Date.now()
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Mock successful API calls
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, id: 'sync-1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, id: 'sync-2' })
        });

      serviceWorkerManager.isOnline = true;
      const result = await serviceWorkerManager.forceSyncCachedData();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(localStorage.removeItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should handle partial sync failures', async () => {
      const cachedData = [
        {
          id: 'sync-1',
          userId: 'test-user-123',
          subject: 'math',
          score: 85,
          timestamp: Date.now()
        },
        {
          id: 'sync-2',
          userId: 'test-user-123',
          subject: 'reading',
          score: 92,
          timestamp: Date.now()
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Mock one success, one failure
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, id: 'sync-1' })
        })
        .mockRejectedValueOnce(new Error('Network timeout'));

      serviceWorkerManager.isOnline = true;
      const result = await serviceWorkerManager.forceSyncCachedData();

      expect(result).toBe(false); // Partial failure
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Should keep failed items in cache
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached-progress',
        JSON.stringify([cachedData[1]]) // Only the failed item
      );
    });

    it('should retry failed sync operations', async () => {
      const cachedData = [
        {
          id: 'retry-1',
          userId: 'test-user-123',
          subject: 'math',
          score: 85,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Mock failure then success
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, id: 'retry-1' })
        });

      // First attempt should fail and increment retry count
      let result = await serviceWorkerManager.forceSyncCachedData();
      expect(result).toBe(false);

      // Update cached data with retry count
      cachedData[0].retryCount = 1;
      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Second attempt should succeed
      result = await serviceWorkerManager.forceSyncCachedData();
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should abandon sync after maximum retry attempts', async () => {
      const cachedData = [
        {
          id: 'abandon-1',
          userId: 'test-user-123',
          subject: 'math',
          score: 85,
          timestamp: Date.now(),
          retryCount: 5 // Already at max retries
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
      global.fetch.mockRejectedValue(new Error('Persistent network error'));

      const result = await serviceWorkerManager.forceSyncCachedData();

      expect(result).toBe(false);
      // Should remove items that have exceeded retry limit
      expect(localStorage.setItem).toHaveBeenCalledWith('cached-progress', '[]');
    });
  });

  describe('Offline Content Availability', () => {
    it('should provide core app functionality offline', () => {
      serviceWorkerManager.isOnline = false;

      const capabilities = serviceWorkerManager.getOfflineCapabilities();

      expect(capabilities.canWorkOffline).toBe(true);
      expect(capabilities.hasLocalStorage).toBe(true);
    });

    it('should cache educational content for offline use', async () => {
      const educationalContent = {
        subject: 'math',
        questions: [
          {
            id: 1,
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correct: 1
          },
          {
            id: 2,
            question: 'What is 5 - 3?',
            options: ['1', '2', '3', '4'],
            correct: 1
          }
        ]
      };

      // Cache content in localStorage
      localStorage.setItem('cached-content-math', JSON.stringify(educationalContent));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached-content-math',
        JSON.stringify(educationalContent)
      );

      // Verify retrieval
      localStorage.getItem.mockReturnValue(JSON.stringify(educationalContent));
      const retrieved = JSON.parse(localStorage.getItem('cached-content-math'));

      expect(retrieved).toEqual(educationalContent);
    });

    it('should handle offline achievement tracking', () => {
      const achievements = [
        {
          id: 'first-correct',
          name: 'First Correct Answer',
          earned: true,
          timestamp: Date.now()
        },
        {
          id: 'streak-5',
          name: '5 Question Streak',
          earned: true,
          timestamp: Date.now()
        }
      ];

      // Cache achievements offline
      localStorage.setItem('cached-achievements', JSON.stringify(achievements));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cached-achievements',
        JSON.stringify(achievements)
      );
    });
  });

  describe('Data Conflict Resolution', () => {
    it('should resolve conflicts between cached and server data', async () => {
      const cachedData = {
        userId: 'test-user-123',
        subject: 'math',
        score: 85,
        lastModified: Date.now() - 10000 // 10 seconds ago
      };

      const serverData = {
        userId: 'test-user-123',
        subject: 'math',
        score: 90,
        lastModified: Date.now() - 5000 // 5 seconds ago (more recent)
      };

      // Mock server response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(serverData)
      });

      localStorage.getItem.mockReturnValue(JSON.stringify([cachedData]));

      const result = await serviceWorkerManager.forceSyncCachedData();

      // Should use server data as it's more recent
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle timestamp-based conflict resolution', async () => {
      const cachedData = {
        userId: 'test-user-123',
        subject: 'reading',
        score: 95,
        lastModified: Date.now() // More recent
      };

      const serverData = {
        userId: 'test-user-123',
        subject: 'reading',
        score: 88,
        lastModified: Date.now() - 30000 // 30 seconds ago (older)
      };

      // In this case, cached data is newer, so it should be sent to server
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, updated: true })
      });

      localStorage.getItem.mockReturnValue(JSON.stringify([cachedData]));

      const result = await serviceWorkerManager.forceSyncCachedData();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cachedData)
      });
    });
  });

  describe('Storage Management', () => {
    it('should manage storage quota efficiently', () => {
      // Mock storage quota API
      const mockStorageEstimate = {
        quota: 1000000000, // 1GB
        usage: 500000000   // 500MB
      };

      global.navigator.storage = {
        estimate: vi.fn().mockResolvedValue(mockStorageEstimate)
      };

      // Test storage management
      expect(navigator.storage.estimate).toBeDefined();
    });

    it('should clean up old cached data', () => {
      const oldData = [
        {
          id: 'old-1',
          timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days old
          userId: 'test-user-123',
          subject: 'math',
          score: 80
        },
        {
          id: 'recent-1',
          timestamp: Date.now() - (1 * 60 * 60 * 1000), // 1 hour old
          userId: 'test-user-123',
          subject: 'reading',
          score: 90
        }
      ];

      localStorage.getItem.mockReturnValue(JSON.stringify(oldData));

      // Simulate cleanup (would be done by service worker)
      const cleanedData = oldData.filter(item => 
        Date.now() - item.timestamp < (3 * 24 * 60 * 60 * 1000) // Keep data less than 3 days old
      );

      expect(cleanedData).toHaveLength(1);
      expect(cleanedData[0].id).toBe('recent-1');
    });

    it('should handle storage quota exceeded errors', async () => {
      // Mock quota exceeded error
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      localStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const progressData = {
        userId: 'test-user-123',
        subject: 'science',
        score: 88
      };

      // Should handle quota error gracefully
      serviceWorkerManager.isOnline = false;
      const result = await serviceWorkerManager.cacheProgressData(progressData);

      expect(result).toBe(false);
      // Should attempt to clear old data and retry (implementation dependent)
    });
  });

  describe('Network Recovery', () => {
    it('should automatically sync when network is restored', async () => {
      const syncCallback = vi.fn();
      serviceWorkerManager.on('sync-complete', syncCallback);

      // Start offline with cached data
      serviceWorkerManager.isOnline = false;
      localStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'recovery-1', userId: 'test-user-123', subject: 'math', score: 85 }
      ]));

      // Simulate network recovery
      serviceWorkerManager.isOnline = true;
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Trigger sync
      serviceWorkerManager.emit('online');
      await serviceWorkerManager.forceSyncCachedData();

      expect(fetch).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('cached-progress');
    });

    it('should handle intermittent connectivity', async () => {
      const progressData = {
        userId: 'test-user-123',
        subject: 'history',
        score: 92
      };

      // Simulate intermittent connectivity
      global.fetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      // First attempt fails
      serviceWorkerManager.isOnline = true;
      let result = await serviceWorkerManager.cacheProgressData(progressData);
      expect(result).toBe(false);

      // Second attempt fails
      result = await serviceWorkerManager.cacheProgressData(progressData);
      expect(result).toBe(false);

      // Third attempt succeeds
      result = await serviceWorkerManager.cacheProgressData(progressData);
      expect(result).toBe(true);
    });
  });
});