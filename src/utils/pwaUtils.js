// Progressive Web App Configuration and Utilities

// Service Worker Registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification();
          }
        });
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showOnlineNotification();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showOfflineNotification();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Cache Management
export class CacheManager {
  constructor() {
    this.cacheName = 'emmy-learning-v1';
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB
  }
  
  async openCache() {
    return await caches.open(this.cacheName);
  }
  
  async cacheRequest(request, response) {
    const cache = await this.openCache();
    await cache.put(request, response);
  }
  
  async getCachedResponse(request) {
    const cache = await this.openCache();
    return await cache.match(request);
  }
  
  async clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
  
  async getCacheSize() {
    const cache = await this.openCache();
    const requests = await cache.keys();
    let totalSize = 0;
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return totalSize;
  }
  
  async cleanupCache() {
    const cacheSize = await this.getCacheSize();
    if (cacheSize > this.maxCacheSize) {
      // Remove oldest entries
      const cache = await this.openCache();
      const requests = await cache.keys();
      const requestsToDelete = requests.slice(0, Math.floor(requests.length * 0.3));
      
      await Promise.all(
        requestsToDelete.map(request => cache.delete(request))
      );
    }
  }
}

// Background Sync
export const setupBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    return {
      registerSync: async (tag, data) => {
        const registration = await navigator.serviceWorker.ready;
        return await registration.sync.register(tag);
      },
      
      isSupported: true
    };
  }
  
  return { isSupported: false };
};

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

// PWA Utilities Component
export const PWAUtilities = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // Setup install prompt
    const setup = setupInstallPrompt();
    setInstallPrompt(setup);
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', () => {
      setShowInstallButton(true);
    });
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    });
  }, []);
  
  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.install();
    }
  };
  
  if (isInstalled || !showInstallButton) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstall}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
      >
        <span>📱</span>
        <span>Install App</span>
      </button>
    </div>
  );
};

// Update Notification Component
const showUpdateNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50';
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <span>🔄</span>
      <div>
        <div class="font-bold">Update Available!</div>
        <div class="text-sm">A new version is ready.</div>
      </div>
      <button onclick="window.location.reload()" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
        Update
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 10000);
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

// PWA Initialization
export const initializePWA = async () => {
  try {
    // Register service worker
    await registerServiceWorker();
    
    // Setup install prompt
    setupInstallPrompt();
    
    // Setup offline handling
    setupOfflineHandling();
    
    // Setup background sync
    const backgroundSync = setupBackgroundSync();
    if (backgroundSync.isSupported) {
      console.log('Background sync is supported');
    }
    
    // Setup push notifications
    const pushNotifications = await setupPushNotifications();
    if (pushNotifications.isSupported) {
      console.log('Push notifications are supported');
    }
    
    console.log('PWA initialized successfully');
  } catch (error) {
    console.error('PWA initialization failed:', error);
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
