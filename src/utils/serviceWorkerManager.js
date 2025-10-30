// Service Worker Manager - Interface for components to interact with service worker

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.listeners = new Map();
    
    // Setup online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }
  
  // Initialize with service worker registration
  initialize(registration) {
    this.registration = registration;
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }
  
  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data);
        break;
      case 'OFFLINE_READY':
        this.emit('offlineReady', data);
        break;
      case 'SYNC_COMPLETE':
        this.emit('syncComplete', data);
        break;
      case 'SYNC_FAILED':
        this.emit('syncFailed', data);
        break;
    }
  }
  
  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in service worker event listener:', error);
        }
      });
    }
  }
  
  // Cache progress data for offline sync
  async cacheProgressData(progressData) {
    if (this.isOnline) {
      // Try to send immediately if online
      try {
        await this.sendProgressData(progressData);
        return true;
      } catch (error) {
        console.log('Failed to send progress data immediately, caching for sync:', error);
      }
    }
    
    // Cache for background sync
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PROGRESS',
        data: progressData
      });
    } else {
      // Fallback to localStorage
      this.cacheProgressDataFallback(progressData);
    }
    
    return false;
  }
  
  // Send progress data immediately
  async sendProgressData(progressData) {
    // This would typically send to your backend API
    // For now, we'll just simulate the API call
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send progress data: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Fallback progress data caching
  cacheProgressDataFallback(progressData) {
    try {
      const existingData = JSON.parse(localStorage.getItem('cached-progress') || '[]');
      existingData.push({
        ...progressData,
        timestamp: Date.now(),
        id: `progress-${Date.now()}-${Math.random()}`
      });
      
      // Keep only last 100 entries
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('cached-progress', JSON.stringify(existingData));
      console.log('Progress data cached locally');
    } catch (error) {
      console.error('Failed to cache progress data locally:', error);
    }
  }
  
  // Get cached progress data
  getCachedProgressData() {
    try {
      return JSON.parse(localStorage.getItem('cached-progress') || '[]');
    } catch (error) {
      console.error('Failed to get cached progress data:', error);
      return [];
    }
  }
  
  // Clear cached progress data
  clearCachedProgressData() {
    try {
      localStorage.removeItem('cached-progress');
      console.log('Cached progress data cleared');
    } catch (error) {
      console.error('Failed to clear cached progress data:', error);
    }
  }
  
  // Force sync cached data
  async forceSyncCachedData() {
    if (!this.isOnline) {
      console.log('Cannot sync while offline');
      return false;
    }
    
    const cachedData = this.getCachedProgressData();
    if (cachedData.length === 0) {
      console.log('No cached data to sync');
      return true;
    }
    
    let syncedCount = 0;
    const failedItems = [];
    
    for (const item of cachedData) {
      try {
        await this.sendProgressData(item);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
        failedItems.push(item);
      }
    }
    
    // Update localStorage with only failed items
    if (failedItems.length > 0) {
      localStorage.setItem('cached-progress', JSON.stringify(failedItems));
    } else {
      this.clearCachedProgressData();
    }
    
    console.log(`Synced ${syncedCount} items, ${failedItems.length} failed`);
    this.emit('syncComplete', { synced: syncedCount, failed: failedItems.length });
    
    return failedItems.length === 0;
  }
  
  // Get cache status
  async getCacheStatus() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    }
    
    return this.getFallbackCacheStatus();
  }
  
  // Fallback cache status
  async getFallbackCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      const status = {};
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = {
          entries: keys.length,
          size: 0 // Size calculation is expensive, skip for fallback
        };
      }
      
      return status;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return {};
    }
  }
  
  // Clear all caches
  async clearAllCaches() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
    
    return this.clearCachesFallback();
  }
  
  // Fallback cache clearing
  async clearCachesFallback() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }
  
  // Check if app is ready for offline use
  async isOfflineReady() {
    const cacheStatus = await this.getCacheStatus();
    const hasStaticCache = Object.keys(cacheStatus).some(name => name.includes('static'));
    const hasOfflineCache = Object.keys(cacheStatus).some(name => name.includes('offline'));
    
    return hasStaticCache && hasOfflineCache;
  }
  
  // Get offline capabilities
  getOfflineCapabilities() {
    return {
      canWorkOffline: 'serviceWorker' in navigator,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      hasPushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      hasIndexedDB: 'indexedDB' in window,
      hasLocalStorage: 'localStorage' in window
    };
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

import { useState, useEffect } from 'react';

// React hook for using service worker manager
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(serviceWorkerManager.isOnline);
  const [cacheStatus, setCacheStatus] = useState({});
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleCacheUpdated = () => {
      serviceWorkerManager.getCacheStatus().then(setCacheStatus);
    };
    const handleOfflineReady = () => setIsOfflineReady(true);
    
    serviceWorkerManager.on('online', handleOnline);
    serviceWorkerManager.on('offline', handleOffline);
    serviceWorkerManager.on('cacheUpdated', handleCacheUpdated);
    serviceWorkerManager.on('offlineReady', handleOfflineReady);
    
    // Initial status check
    serviceWorkerManager.getCacheStatus().then(setCacheStatus);
    serviceWorkerManager.isOfflineReady().then(setIsOfflineReady);
    
    return () => {
      serviceWorkerManager.off('online', handleOnline);
      serviceWorkerManager.off('offline', handleOffline);
      serviceWorkerManager.off('cacheUpdated', handleCacheUpdated);
      serviceWorkerManager.off('offlineReady', handleOfflineReady);
    };
  }, []);
  
  return {
    isOnline,
    cacheStatus,
    isOfflineReady,
    cacheProgressData: serviceWorkerManager.cacheProgressData.bind(serviceWorkerManager),
    forceSyncCachedData: serviceWorkerManager.forceSyncCachedData.bind(serviceWorkerManager),
    clearAllCaches: serviceWorkerManager.clearAllCaches.bind(serviceWorkerManager),
    getOfflineCapabilities: serviceWorkerManager.getOfflineCapabilities.bind(serviceWorkerManager)
  };
};

export default serviceWorkerManager;