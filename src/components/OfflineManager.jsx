import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';

const OfflineManager = () => {
  const { userProfile, updateProgress } = useUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync data from localStorage
  useEffect(() => {
    const savedPendingSync = localStorage.getItem('pendingSync');
    if (savedPendingSync) {
      try {
        setPendingSync(JSON.parse(savedPendingSync));
      } catch (error) {
        console.error('Error parsing pending sync data:', error);
      }
    }

    const savedLastSync = localStorage.getItem('lastSyncTime');
    if (savedLastSync) {
      setLastSyncTime(new Date(savedLastSync));
    }
  }, []);

  // Save pending sync data to localStorage
  useEffect(() => {
    localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
  }, [pendingSync]);

  // Add data to pending sync queue
  const queueForSync = useCallback((data) => {
    if (!isOnline) {
      const syncItem = {
        id: Date.now() + Math.random(),
        data,
        timestamp: new Date(),
        type: 'progress'
      };
      
      setPendingSync(prev => [...prev, syncItem]);
      return true; // Data queued successfully
    }
    return false; // Data can be synced immediately
  }, [isOnline]);

  // Sync pending data when online
  const syncPendingData = async () => {
    if (!isOnline || pendingSync.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const syncItems = [...pendingSync];
    
    try {
      for (const item of syncItems) {
        try {
          await updateProgress(item.data);
          console.log('Synced item:', item);
        } catch (error) {
          console.error('Error syncing item:', item, error);
          // Keep failed items in the queue
          continue;
        }
      }
      
      // Remove successfully synced items
      setPendingSync([]);
      setLastSyncTime(new Date());
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual sync trigger
  const triggerSync = () => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingData();
    }
  };

  // Get sync status message
  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        message: 'You\'re offline - changes will sync when you\'re back online!',
        color: 'text-orange-600',
        icon: '📡'
      };
    }
    
    if (isSyncing) {
      return {
        message: 'Syncing your progress...',
        color: 'text-blue-600',
        icon: '🔄'
      };
    }
    
    if (pendingSync.length > 0) {
      return {
        message: `${pendingSync.length} changes waiting to sync`,
        color: 'text-yellow-600',
        icon: '⏳'
      };
    }
    
    if (lastSyncTime) {
      return {
        message: `Last synced: ${lastSyncTime.toLocaleTimeString()}`,
        color: 'text-green-600',
        icon: '✅'
      };
    }
    
    return {
      message: 'All synced up!',
      color: 'text-green-600',
      icon: '✨'
    };
  };

  const syncStatus = getSyncStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-lg border-l-4 ${
        !isOnline ? 'border-orange-400' : 
        isSyncing ? 'border-blue-400' : 
        pendingSync.length > 0 ? 'border-yellow-400' : 'border-green-400'
      } p-3 max-w-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">{syncStatus.icon}</span>
            <div>
              <div className={`text-sm font-medium ${syncStatus.color}`}>
                {syncStatus.message}
              </div>
              {pendingSync.length > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={!isOnline || isSyncing}
                  className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                >
                  Sync now
                </button>
              )}
            </div>
          </div>
          
          {isSyncing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for using offline functionality
export const useOfflineSync = () => {
  const { userProfile, updateProgress } = useUser();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncProgress = async (progressData) => {
    if (isOnline) {
      try {
        await updateProgress(progressData);
        return true; // Successfully synced
      } catch (error) {
        console.error('Sync error:', error);
        return false; // Failed to sync
      }
    } else {
      // Queue for offline sync
      const pendingSync = JSON.parse(localStorage.getItem('pendingSync') || '[]');
      const syncItem = {
        id: Date.now() + Math.random(),
        data: progressData,
        timestamp: new Date(),
        type: 'progress'
      };
      pendingSync.push(syncItem);
      localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
      return true; // Queued successfully
    }
  };

  return {
    isOnline,
    syncProgress
  };
};

export default OfflineManager;
