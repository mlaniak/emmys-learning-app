// Enhanced Background Sync for Progress Tracking

class BackgroundSyncManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    this.syncTags = {
      PROGRESS_SYNC: 'progress-sync',
      ACHIEVEMENT_SYNC: 'achievement-sync',
      SETTINGS_SYNC: 'settings-sync',
      ANALYTICS_SYNC: 'analytics-sync'
    };
    this.pendingData = new Map();
  }

  // Initialize background sync
  async initialize() {
    if (!this.isSupported) {
      console.warn('Background sync not supported, using fallback storage');
      return { success: false, reason: 'not_supported' };
    }

    try {
      // Load any pending sync data from IndexedDB
      await this.loadPendingSyncData();
      
      // Listen for online/offline events
      this.setupNetworkListeners();
      
      console.log('Background sync initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Setup network event listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Network back online, attempting to sync pending data');
      this.syncAllPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline, data will be queued for sync');
    });
  }

  // Sync learning progress data
  async syncProgressData(progressData) {
    const syncData = {
      type: 'progress',
      data: progressData,
      timestamp: Date.now(),
      id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (navigator.onLine && this.isSupported) {
      try {
        // Try immediate sync
        const success = await this.sendDataToServer(syncData);
        if (success) {
          console.log('Progress data synced immediately');
          return { success: true, synced: 'immediate' };
        }
      } catch (error) {
        console.log('Immediate sync failed, queuing for background sync:', error);
      }
    }

    // Queue for background sync
    await this.queueForSync(this.syncTags.PROGRESS_SYNC, syncData);
    return { success: true, synced: 'queued' };
  }

  // Sync achievement data
  async syncAchievementData(achievementData) {
    const syncData = {
      type: 'achievement',
      data: achievementData,
      timestamp: Date.now(),
      id: `achievement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (navigator.onLine && this.isSupported) {
      try {
        const success = await this.sendDataToServer(syncData);
        if (success) {
          console.log('Achievement data synced immediately');
          return { success: true, synced: 'immediate' };
        }
      } catch (error) {
        console.log('Immediate sync failed, queuing for background sync:', error);
      }
    }

    await this.queueForSync(this.syncTags.ACHIEVEMENT_SYNC, syncData);
    return { success: true, synced: 'queued' };
  }

  // Sync user settings
  async syncSettingsData(settingsData) {
    const syncData = {
      type: 'settings',
      data: settingsData,
      timestamp: Date.now(),
      id: `settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (navigator.onLine && this.isSupported) {
      try {
        const success = await this.sendDataToServer(syncData);
        if (success) {
          console.log('Settings data synced immediately');
          return { success: true, synced: 'immediate' };
        }
      } catch (error) {
        console.log('Immediate sync failed, queuing for background sync:', error);
      }
    }

    await this.queueForSync(this.syncTags.SETTINGS_SYNC, syncData);
    return { success: true, synced: 'queued' };
  }

  // Sync analytics data
  async syncAnalyticsData(analyticsData) {
    const syncData = {
      type: 'analytics',
      data: analyticsData,
      timestamp: Date.now(),
      id: `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    if (navigator.onLine && this.isSupported) {
      try {
        const success = await this.sendDataToServer(syncData);
        if (success) {
          console.log('Analytics data synced immediately');
          return { success: true, synced: 'immediate' };
        }
      } catch (error) {
        console.log('Immediate sync failed, queuing for background sync:', error);
      }
    }

    await this.queueForSync(this.syncTags.ANALYTICS_SYNC, syncData);
    return { success: true, synced: 'queued' };
  }

  // Queue data for background sync
  async queueForSync(tag, data) {
    try {
      // Store in memory
      if (!this.pendingData.has(tag)) {
        this.pendingData.set(tag, []);
      }
      this.pendingData.get(tag).push(data);

      // Store in IndexedDB for persistence
      await this.storeInIndexedDB(tag, data);

      // Register background sync if supported
      if (this.isSupported) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`Background sync registered for tag: ${tag}`);
      } else {
        // Fallback: store in localStorage
        this.storeInLocalStorage(tag, data);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to queue data for sync:', error);
      // Fallback to localStorage
      this.storeInLocalStorage(tag, data);
      return { success: false, error: error.message };
    }
  }

  // Send data to server (mock implementation)
  async sendDataToServer(syncData) {
    try {
      // In a real implementation, this would send data to your backend
      // For now, we'll simulate the API call
      
      console.log('Sending data to server:', syncData.type, syncData.data);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate success/failure based on data type
      if (Math.random() > 0.1) { // 90% success rate
        // Store successful sync in localStorage for demo
        const syncHistory = JSON.parse(localStorage.getItem('emmy-sync-history') || '[]');
        syncHistory.push({
          ...syncData,
          syncedAt: Date.now(),
          status: 'success'
        });
        localStorage.setItem('emmy-sync-history', JSON.stringify(syncHistory.slice(-50))); // Keep last 50
        
        return true;
      } else {
        throw new Error('Simulated network error');
      }
    } catch (error) {
      console.error('Failed to send data to server:', error);
      return false;
    }
  }

  // Sync all pending data
  async syncAllPendingData() {
    if (!navigator.onLine) {
      console.log('Device is offline, cannot sync pending data');
      return;
    }

    try {
      for (const [tag, dataArray] of this.pendingData.entries()) {
        if (dataArray.length > 0) {
          console.log(`Syncing ${dataArray.length} items for tag: ${tag}`);
          
          for (const data of dataArray) {
            try {
              const success = await this.sendDataToServer(data);
              if (success) {
                // Remove from pending data
                const index = dataArray.indexOf(data);
                if (index > -1) {
                  dataArray.splice(index, 1);
                }
                
                // Remove from IndexedDB
                await this.removeFromIndexedDB(tag, data.id);
              }
            } catch (error) {
              console.error('Failed to sync individual item:', error);
            }
          }
        }
      }
      
      console.log('Finished syncing all pending data');
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }

  // Load pending sync data from IndexedDB
  async loadPendingSyncData() {
    try {
      for (const tag of Object.values(this.syncTags)) {
        const data = await this.getFromIndexedDB(tag);
        if (data && data.length > 0) {
          this.pendingData.set(tag, data);
          console.log(`Loaded ${data.length} pending items for tag: ${tag}`);
        }
      }
    } catch (error) {
      console.error('Failed to load pending sync data:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
  }

  // Store data in IndexedDB
  async storeInIndexedDB(tag, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EmmyLearningDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync-data'], 'readwrite');
        const store = transaction.objectStore('sync-data');
        
        const syncData = {
          tag,
          data,
          id: data.id,
          timestamp: Date.now()
        };
        
        const addRequest = store.put(syncData);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('sync-data')) {
          db.createObjectStore('sync-data', { keyPath: 'id' });
        }
      };
    });
  }

  // Get data from IndexedDB
  async getFromIndexedDB(tag) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EmmyLearningDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync-data'], 'readonly');
        const store = transaction.objectStore('sync-data');
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const allData = getAllRequest.result;
          const tagData = allData
            .filter(item => item.tag === tag)
            .map(item => item.data);
          resolve(tagData);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('sync-data')) {
          db.createObjectStore('sync-data', { keyPath: 'id' });
        }
      };
    });
  }

  // Remove data from IndexedDB
  async removeFromIndexedDB(tag, dataId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EmmyLearningDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync-data'], 'readwrite');
        const store = transaction.objectStore('sync-data');
        
        const deleteRequest = store.delete(dataId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Fallback storage methods
  storeInLocalStorage(tag, data) {
    try {
      const key = `emmy-sync-${tag}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(data);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store in localStorage:', error);
    }
  }

  loadFromLocalStorage() {
    try {
      for (const tag of Object.values(this.syncTags)) {
        const key = `emmy-sync-${tag}`;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (data.length > 0) {
          this.pendingData.set(tag, data);
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  // Get sync status
  getSyncStatus() {
    const status = {
      isSupported: this.isSupported,
      isOnline: navigator.onLine,
      pendingItems: 0,
      pendingByType: {}
    };

    for (const [tag, dataArray] of this.pendingData.entries()) {
      status.pendingByType[tag] = dataArray.length;
      status.pendingItems += dataArray.length;
    }

    return status;
  }

  // Clear all pending data (for testing/debugging)
  async clearAllPendingData() {
    try {
      this.pendingData.clear();
      
      // Clear IndexedDB
      for (const tag of Object.values(this.syncTags)) {
        const data = await this.getFromIndexedDB(tag);
        for (const item of data) {
          await this.removeFromIndexedDB(tag, item.id);
        }
      }
      
      // Clear localStorage fallback
      for (const tag of Object.values(this.syncTags)) {
        localStorage.removeItem(`emmy-sync-${tag}`);
      }
      
      console.log('All pending sync data cleared');
      return { success: true };
    } catch (error) {
      console.error('Failed to clear pending data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();

// Export class for testing
export { BackgroundSyncManager };

export default backgroundSyncManager;