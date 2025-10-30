// Progressive Web App Configuration and Utilities

// Service Worker Registration with enhanced functionality
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/emmys-learning-app/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              showUpdateNotification(registration);
            }
          });
        }
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'CACHE_UPDATED':
            console.log('Cache updated:', data);
            break;
          case 'OFFLINE_READY':
            console.log('App ready for offline use');
            showOfflineReadyNotification();
            break;
          case 'SYNC_COMPLETE':
            console.log('Background sync completed:', data);
            break;
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.warn('Service Worker not supported');
    return null;
  }
};

// PWA Installation Prompt
export const setupInstallPrompt = () => {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button
    showInstallButton();
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallButton();
    deferredPrompt = null;
  });
  
  return {
    install: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
    },
    canInstall: () => !!deferredPrompt
  };
};

// Offline Detection and Handling
export const setupOfflineHandling = () => {
  let isOnline = navigator.onLine;
  
  const handleOnline = () => {
    isOnline = true;
    showOnlineNotification();
  };
  
  const handleOffline = () => {
    isOnline = false;
    showOfflineNotification();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return {
    isOnline,
    cleanup: () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

// Enhanced Cache Management with service worker communication
export class CacheManager {
  constructor() {
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
  }
  
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
    
    // Fallback for when service worker is not available
    return this.getFallbackCacheStatus();
  }
  
  async getFallbackCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      const status = {};
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = {
          entries: keys.length,
          size: await this.estimateCacheSize(cache)
        };
      }
      
      return status;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return {};
    }
  }
  
  async estimateCacheSize(cache) {
    const keys = await cache.keys();
    let totalSize = 0;
    
    // Sample first 10 entries to estimate total size
    for (const key of keys.slice(0, 10)) {
      try {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      } catch (error) {
        // Ignore errors for individual entries
      }
    }
    
    // Estimate total size based on sample
    return Math.round((totalSize / Math.min(keys.length, 10)) * keys.length);
  }
  
  async clearCache() {
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
    
    // Fallback for when service worker is not available
    return this.clearCacheFallback();
  }
  
  async clearCacheFallback() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
  
  async cacheProgressData(data) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PROGRESS',
        data
      });
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem(`progress-${data.userId || 'anonymous'}`, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to cache progress data:', error);
      }
    }
  }
  
  async preloadCriticalResources() {
    const criticalResources = [
      '/emmys-learning-app/',
      '/emmys-learning-app/index.html',
      '/emmys-learning-app/manifest.json'
    ];
    
    try {
      await Promise.all(
        criticalResources.map(url => 
          fetch(url).then(response => {
            if (response.ok) {
              return caches.open('emmy-static-v2.0.0').then(cache => 
                cache.put(url, response)
              );
            }
          }).catch(error => {
            console.log('Failed to preload:', url, error);
          })
        )
      );
      console.log('Critical resources preloaded');
    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }
}

// Enhanced Background Sync with progress data handling
export const setupBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    return {
      registerSync: async (tag, data) => {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Store data for sync if provided
          if (data) {
            await storeDataForSync(tag, data);
          }
          
          return await registration.sync.register(tag);
        } catch (error) {
          console.error('Failed to register background sync:', error);
          throw error;
        }
      },
      
      syncProgressData: async (progressData) => {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Store progress data for sync
          await storeDataForSync('progress-sync', progressData);
          
          return await registration.sync.register('progress-sync');
        } catch (error) {
          console.error('Failed to sync progress data:', error);
          // Fallback to immediate storage
          localStorage.setItem('pending-progress', JSON.stringify(progressData));
        }
      },
      
      isSupported: true
    };
  }
  
  return { 
    isSupported: false,
    registerSync: () => Promise.resolve(),
    syncProgressData: (data) => {
      // Fallback to localStorage
      localStorage.setItem('pending-progress', JSON.stringify(data));
      return Promise.resolve();
    }
  };
};

// Store data for background sync
async function storeDataForSync(tag, data) {
  try {
    // Use IndexedDB for persistent storage
    const request = indexedDB.open('EmmyLearningDB', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['sync-data'], 'readwrite');
        const store = transaction.objectStore('sync-data');
        
        const syncData = {
          tag,
          data,
          timestamp: Date.now(),
          id: `${tag}-${Date.now()}`
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
  } catch (error) {
    console.error('Failed to store data for sync:', error);
    // Fallback to localStorage
    const existingData = JSON.parse(localStorage.getItem('sync-data') || '[]');
    existingData.push({ tag, data, timestamp: Date.now() });
    localStorage.setItem('sync-data', JSON.stringify(existingData));
  }
}

// Push Notifications
export const setupPushNotifications = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      
      return {
        subscribe: async () => {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
          });
          
          return subscription;
        },
        
        unsubscribe: async () => {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        },
        
        isSupported: true,
        permission
      };
    }
  }
  
  return { isSupported: false, permission: 'denied' };
};

// App Manifest Configuration
export const generateManifest = () => {
  return {
    name: "Emmy's Learning Adventure",
    short_name: "Emmy Learning",
    description: "Interactive educational game for young students",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8B5CF6",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["education", "games", "kids"],
    lang: "en",
    scope: "/",
    id: "emmy-learning-app"
  };
};

// PWA Install Button Management (non-React version)
export const createInstallButton = () => {
  let installPrompt = null;
  let isInstalled = false;
  let buttonElement = null;
  
  // Check if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
    return null;
  }
  
  const setup = setupInstallPrompt();
  installPrompt = setup;
  
  const createButton = () => {
    if (isInstalled || !installPrompt?.canInstall()) {
      return null;
    }
    
    buttonElement = document.createElement('div');
    buttonElement.className = 'fixed bottom-4 right-4 z-50';
    buttonElement.innerHTML = `
      <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors">
        <span>📱</span>
        <span>Install App</span>
      </button>
    `;
    
    const button = buttonElement.querySelector('button');
    button.addEventListener('click', async () => {
      if (installPrompt) {
        await installPrompt.install();
        removeButton();
      }
    });
    
    document.body.appendChild(buttonElement);
    return buttonElement;
  };
  
  const removeButton = () => {
    if (buttonElement && buttonElement.parentNode) {
      buttonElement.parentNode.removeChild(buttonElement);
      buttonElement = null;
    }
  };
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', () => {
    createButton();
  });
  
  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    removeButton();
  });
  
  return {
    createButton,
    removeButton,
    isInstalled: () => isInstalled
  };
};

// Enhanced Update Notification Component
const showUpdateNotification = (registration) => {
  // Remove any existing update notifications
  const existingNotifications = document.querySelectorAll('.update-notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = 'update-notification fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <span class="text-xl">🔄</span>
      <div class="flex-1">
        <div class="font-bold">Update Available!</div>
        <div class="text-sm opacity-90 mb-3">A new version with improvements is ready.</div>
        <div class="flex space-x-2">
          <button id="update-now" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors">
            Update Now
          </button>
          <button id="update-later" class="bg-blue-400 hover:bg-blue-500 px-3 py-1 rounded text-sm font-medium transition-colors">
            Later
          </button>
        </div>
      </div>
      <button id="close-update" class="text-white hover:text-gray-200 text-lg leading-none">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle update actions
  const updateNowBtn = notification.querySelector('#update-now');
  const updateLaterBtn = notification.querySelector('#update-later');
  const closeBtn = notification.querySelector('#close-update');
  
  updateNowBtn.addEventListener('click', () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  });
  
  updateLaterBtn.addEventListener('click', () => {
    notification.remove();
    // Show reminder in 1 hour
    setTimeout(() => {
      if (registration && registration.waiting) {
        showUpdateNotification(registration);
      }
    }, 60 * 60 * 1000);
  });
  
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 30 seconds if no action
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 30000);
};

// Offline Ready Notification
const showOfflineReadyNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 max-w-sm';
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>📱</span>
      <div>
        <div class="font-medium">Ready for offline use!</div>
        <div class="text-sm opacity-90">You can now use the app without internet.</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};

const showInstallButton = () => {
  // This will be handled by the PWAUtilities component
};

const hideInstallButton = () => {
  // This will be handled by the PWAUtilities component
};

const showOnlineNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 left-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>🌐</span>
      <span>You're back online!</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

const showOfflineNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 left-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>📴</span>
      <span>You're offline. Some features may be limited.</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
};

// Enhanced PWA Initialization with comprehensive offline support
export const initializePWA = async () => {
  try {
    console.log('Initializing PWA features...');
    
    // Register service worker with enhanced functionality
    const registration = await registerServiceWorker();
    
    if (registration) {
      console.log('Service Worker registered successfully');
      
      // Setup install prompt
      setupInstallPrompt();
      
      // Setup background sync
      const backgroundSync = setupBackgroundSync();
      if (backgroundSync.isSupported) {
        console.log('Background sync is supported');
      }
      
      // Initialize cache manager
      const cacheManager = new CacheManager();
      
      // Preload critical resources
      await cacheManager.preloadCriticalResources();
      
      // Setup push notifications
      const pushNotifications = await setupPushNotifications();
      if (pushNotifications.isSupported) {
        console.log('Push notifications are supported');
      }
      
      // Monitor cache status
      const cacheStatus = await cacheManager.getCacheStatus();
      console.log('Cache status:', cacheStatus);
      
      // Setup periodic cache cleanup
      setInterval(async () => {
        try {
          const status = await cacheManager.getCacheStatus();
          const totalSize = Object.values(status).reduce((sum, cache) => sum + (cache.size || 0), 0);
          
          if (totalSize > 50 * 1024 * 1024) { // 50MB
            console.log('Cache size exceeded limit, cleaning up...');
            // Could implement selective cleanup here
          }
        } catch (error) {
          console.error('Cache cleanup check failed:', error);
        }
      }, 30 * 60 * 1000); // Check every 30 minutes
      
      console.log('PWA initialized successfully');
      
      return {
        registration,
        cacheManager,
        backgroundSync,
        pushNotifications
      };
    } else {
      console.warn('Service Worker not supported, PWA features limited');
      return null;
    }
  } catch (error) {
    console.error('PWA initialization failed:', error);
    return null;
  }
};

export default {
  registerServiceWorker,
  setupInstallPrompt,
  setupOfflineHandling,
  CacheManager,
  setupBackgroundSync,
  setupPushNotifications,
  generateManifest,
  PWAUtilities,
  initializePWA
};
