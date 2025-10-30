// Service Worker for Emmy's Learning Adventure
// Implements offline-first approach with comprehensive caching strategies

const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `emmy-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `emmy-dynamic-v${CACHE_VERSION}`;
const OFFLINE_CACHE = `emmy-offline-v${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  maxAge: {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    dynamic: 24 * 60 * 60 * 1000,     // 1 day
    offline: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  maxEntries: {
    dynamic: 100,
    offline: 50
  }
};

// Core app resources that should always be cached
const STATIC_RESOURCES = [
  '/emmys-learning-app/',
  '/emmys-learning-app/index.html',
  '/emmys-learning-app/manifest.json',
  '/emmys-learning-app/404.html'
];

// Educational content and assets that should be cached for offline use
const OFFLINE_RESOURCES = [
  '/emmys-learning-app/newsletters/',
  '/emmys-learning-app/sounds/'
];

// Background sync queue for offline data
const SYNC_QUEUE = 'progress-sync';
let syncQueue = [];

// Install event - cache core resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      
      // Initialize offline cache
      caches.open(OFFLINE_CACHE).then(cache => {
        console.log('Initializing offline cache');
        return Promise.resolve();
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('emmy-') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
      
      // Initialize background sync
      initializeBackgroundSync()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isEducationalContent(request)) {
    event.respondWith(handleEducationalContent(request));
  } else {
    event.respondWith(handleDynamicResource(request));
  }
});

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_QUEUE) {
    event.waitUntil(syncOfflineData());
  }
});

// Push event handling for notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: "Emmy's Learning Adventure",
    body: "Time for some fun learning!",
    icon: '/emmys-learning-app/icons/icon-192x192.png',
    badge: '/emmys-learning-app/icons/icon-72x72.png',
    tag: 'learning-reminder',
    data: { url: '/emmys-learning-app/' }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'start-learning',
          title: 'Start Learning',
          icon: '/emmys-learning-app/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Later',
          icon: '/emmys-learning-app/icons/icon-72x72.png'
        }
      ]
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  let urlToOpen = data?.url || '/emmys-learning-app/';
  
  // Add tracking parameter
  const url = new URL(urlToOpen, self.location.origin);
  url.searchParams.set('from', 'notification');
  
  if (action === 'start-learning') {
    url.searchParams.set('action', 'start-learning');
  } else if (action === 'dismiss') {
    // Just close the notification, don't open the app
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if the app is already open
      for (const client of clientList) {
        if (client.url.includes('/emmys-learning-app/') && 'focus' in client) {
          // Focus existing window and navigate if needed
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action,
            data
          });
          return;
        }
      }
      
      // Open new window
      return clients.openWindow(url.toString());
    })
  );
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_PROGRESS':
      cacheProgressData(data);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'SCHEDULE_NOTIFICATION':
      scheduleLocalNotification(data);
      break;
  }
});

// Caching strategy implementations

// Cache-first strategy for static resources
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheTime = await getCacheTime(cache, request);
      if (Date.now() - cacheTime < CACHE_CONFIG.maxAge.static) {
        return cachedResponse;
      }
    }
    
    // Fetch from network and update cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await setCacheTime(cache, request);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Static resource fetch failed, serving from cache:', error);
    const cache = await caches.open(STATIC_CACHE);
    return await cache.match(request) || createOfflineResponse();
  }
}

// Network-first strategy for API requests with offline fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      await setCacheTime(cache, request);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('API request failed, checking cache:', error);
    
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Queue for background sync if it's a POST/PUT request
    if (request.method !== 'GET') {
      await queueForSync(request);
    }
    
    return createOfflineResponse();
  }
}

// Stale-while-revalidate strategy for educational content
async function handleEducationalContent(request) {
  const cache = await caches.open(OFFLINE_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Serve from cache immediately if available
  const responsePromise = cachedResponse || fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
      setCacheTime(cache, request);
    }
    return response;
  }).catch(() => createOfflineResponse());
  
  // Update cache in background
  if (cachedResponse) {
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        setCacheTime(cache, request);
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
  }
  
  return responsePromise;
}

// Network-first with cache fallback for dynamic resources
async function handleDynamicResource(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      
      // Manage cache size
      await manageCacheSize(cache, CACHE_CONFIG.maxEntries.dynamic);
      
      await cache.put(request, networkResponse.clone());
      await setCacheTime(cache, request);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Dynamic resource fetch failed, serving from cache:', error);
    const cache = await caches.open(DYNAMIC_CACHE);
    return await cache.match(request) || createOfflineResponse();
  }
}

// Helper functions

function isStaticResource(request) {
  const url = new URL(request.url);
  return STATIC_RESOURCES.some(resource => url.pathname.includes(resource)) ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.html');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') || 
         url.hostname.includes('supabase') ||
         url.hostname.includes('googleapis');
}

function isEducationalContent(request) {
  const url = new URL(request.url);
  return OFFLINE_RESOURCES.some(resource => url.pathname.includes(resource)) ||
         url.pathname.includes('/newsletters/') ||
         url.pathname.includes('/sounds/') ||
         url.pathname.endsWith('.pdf') ||
         url.pathname.endsWith('.mp3') ||
         url.pathname.endsWith('.wav');
}

async function getCacheTime(cache, request) {
  const timeKey = `${request.url}-timestamp`;
  const timeResponse = await cache.match(timeKey);
  if (timeResponse) {
    const timeText = await timeResponse.text();
    return parseInt(timeText, 10);
  }
  return 0;
}

async function setCacheTime(cache, request) {
  const timeKey = `${request.url}-timestamp`;
  const timeResponse = new Response(Date.now().toString());
  await cache.put(timeKey, timeResponse);
}

async function manageCacheSize(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length >= maxEntries) {
    // Remove oldest entries (first 20% of cache)
    const entriesToDelete = Math.floor(keys.length * 0.2);
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      timestamp: Date.now()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

async function queueForSync(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    syncQueue.push(requestData);
    
    // Store in IndexedDB for persistence
    await storeInIndexedDB('sync-queue', requestData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await self.registration;
      await registration.sync.register(SYNC_QUEUE);
    }
  } catch (error) {
    console.error('Failed to queue request for sync:', error);
  }
}

async function syncOfflineData() {
  console.log('Syncing offline data...');
  
  try {
    // Load queued requests from IndexedDB
    const queuedRequests = await getFromIndexedDB('sync-queue');
    
    for (const requestData of queuedRequests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove from queue on successful sync
          await removeFromIndexedDB('sync-queue', requestData);
          console.log('Successfully synced:', requestData.url);
        }
      } catch (error) {
        console.log('Failed to sync request:', requestData.url, error);
        // Keep in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function initializeBackgroundSync() {
  try {
    // Load any existing sync queue from IndexedDB
    syncQueue = await getFromIndexedDB('sync-queue') || [];
    console.log('Loaded sync queue:', syncQueue.length, 'items');
  } catch (error) {
    console.error('Failed to initialize background sync:', error);
  }
}

async function cacheProgressData(data) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = new Response(JSON.stringify(data));
    await cache.put(`progress-${data.userId || 'anonymous'}`, response);
    console.log('Cached progress data');
  } catch (error) {
    console.error('Failed to cache progress data:', error);
  }
}

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        entries: keys.length,
        size: await estimateCacheSize(cache)
      };
    }
    
    return status;
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {};
  }
}

async function estimateCacheSize(cache) {
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const key of keys.slice(0, 10)) { // Sample first 10 entries
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

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// IndexedDB utilities for persistent storage
async function storeInIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmmyLearningDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const addRequest = store.add({ ...data, id: Date.now() + Math.random() });
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmmyLearningDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function removeFromIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmmyLearningDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Find and delete matching entries
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const entries = getAllRequest.result;
        const matchingEntry = entries.find(entry => 
          entry.url === data.url && entry.timestamp === data.timestamp
        );
        
        if (matchingEntry) {
          const deleteRequest = store.delete(matchingEntry.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve();
        }
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// Local notification scheduling
async function scheduleLocalNotification(notificationData) {
  try {
    const { title, body, delay, tag, data } = notificationData;
    
    // Schedule notification after delay
    setTimeout(async () => {
      await self.registration.showNotification(title, {
        body,
        icon: '/emmys-learning-app/icons/icon-192x192.png',
        badge: '/emmys-learning-app/icons/icon-72x72.png',
        tag: tag || 'local-notification',
        data: data || { url: '/emmys-learning-app/' },
        requireInteraction: false,
        silent: false,
        actions: [
          {
            action: 'start-learning',
            title: 'Start Learning',
            icon: '/emmys-learning-app/icons/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Later',
            icon: '/emmys-learning-app/icons/icon-72x72.png'
          }
        ]
      });
    }, delay || 0);
    
    console.log('Local notification scheduled:', title);
  } catch (error) {
    console.error('Failed to schedule local notification:', error);
  }
}

console.log('Service Worker loaded successfully');
