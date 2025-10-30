import React, { useState, useEffect } from 'react';
import { useServiceWorker } from '../utils/serviceWorkerManager';

const OfflineStatus = ({ className = '' }) => {
  const {
    isOnline,
    cacheStatus,
    isOfflineReady,
    forceSyncCachedData,
    clearAllCaches,
    getOfflineCapabilities
  } = useServiceWorker();
  
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [capabilities, setCapabilities] = useState({});
  
  useEffect(() => {
    setCapabilities(getOfflineCapabilities());
  }, [getOfflineCapabilities]);
  
  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await forceSyncCachedData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearAllCaches();
    } catch (error) {
      console.error('Clear cache failed:', error);
    } finally {
      setClearing(false);
    }
  };
  
  const formatCacheSize = (size) => {
    if (!size) return 'Unknown';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getTotalCacheEntries = () => {
    return Object.values(cacheStatus).reduce((total, cache) => total + (cache.entries || 0), 0);
  };
  
  const getTotalCacheSize = () => {
    return Object.values(cacheStatus).reduce((total, cache) => total + (cache.size || 0), 0);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-gray-800">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {isOfflineReady && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Offline Ready
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {/* Quick Status */}
      <div className="text-sm text-gray-600 mb-3">
        {isOnline ? (
          <span>✅ Connected to internet</span>
        ) : (
          <span>📴 Working offline</span>
        )}
        {isOfflineReady && (
          <span className="block">💾 App cached for offline use</span>
        )}
      </div>
      
      {/* Detailed Status */}
      {showDetails && (
        <div className="border-t pt-3 space-y-3">
          {/* Cache Information */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Cache Status</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total cached items: {getTotalCacheEntries()}</div>
              <div>Total cache size: {formatCacheSize(getTotalCacheSize())}</div>
              
              {Object.entries(cacheStatus).map(([cacheName, cache]) => (
                <div key={cacheName} className="ml-4 text-xs">
                  {cacheName}: {cache.entries} items ({formatCacheSize(cache.size)})
                </div>
              ))}
            </div>
          </div>
          
          {/* Capabilities */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Offline Capabilities</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <span className={capabilities.canWorkOffline ? '✅' : '❌'}></span>
                <span>Service Worker Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={capabilities.hasBackgroundSync ? '✅' : '❌'}></span>
                <span>Background Sync</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={capabilities.hasIndexedDB ? '✅' : '❌'}></span>
                <span>IndexedDB Storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={capabilities.hasLocalStorage ? '✅' : '❌'}></span>
                <span>Local Storage</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleSyncData}
              disabled={syncing || !isOnline}
              className="btn-touch bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium"
            >
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
            
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="btn-touch bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium"
            >
              {clearing ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact offline indicator for header/navigation
export const OfflineIndicator = ({ className = '' }) => {
  const { isOnline, isOfflineReady } = useServiceWorker();
  
  if (isOnline && !isOfflineReady) {
    return null; // Don't show anything when online and not cached
  }
  
  return (
    <div className={`flex items-center space-x-1 text-xs ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
      <span className="text-gray-600">
        {isOnline ? 'Cached' : 'Offline'}
      </span>
    </div>
  );
};

// Offline banner for full-width notifications
export const OfflineBanner = () => {
  const { isOnline } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);
  
  if (isOnline || dismissed) {
    return null;
  }
  
  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-sm font-medium">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span>📴</span>
          <span>You're offline. Some features may be limited.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-black hover:text-gray-700 font-bold text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default OfflineStatus;