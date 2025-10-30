// Resource Preloader for Critical Assets and Performance Optimization
class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Map();
    this.preloadQueue = new Set();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();
    this.criticalResources = new Set();
  }

  // Preload critical resources immediately
  async preloadCriticalResources() {
    const criticalAssets = [
      // Critical CSS (if any external)
      '/emmys-learning-app/assets/critical.css',
      
      // Essential images
      '/emmys-learning-app/images/logo.png',
      '/emmys-learning-app/images/loading-spinner.gif',
      
      // Critical fonts
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      
      // Essential audio files
      '/emmys-learning-app/sounds/correct.mp3',
      '/emmys-learning-app/sounds/incorrect.mp3',
      '/emmys-learning-app/sounds/complete.mp3'
    ];

    const preloadPromises = criticalAssets.map(asset => 
      this.preloadResource(asset, { priority: 'high', critical: true })
        .catch(error => {
          console.warn(`Failed to preload critical asset ${asset}:`, error);
          return null;
        })
    );

    const results = await Promise.all(preloadPromises);
    const successCount = results.filter(result => result !== null).length;
    
    console.log(`Preloaded ${successCount}/${criticalAssets.length} critical resources`);
    return { total: criticalAssets.length, loaded: successCount };
  }

  // Preload resource with caching and performance tracking
  async preloadResource(url, options = {}) {
    const { 
      priority = 'normal', 
      critical = false, 
      timeout = 10000,
      retries = 2 
    } = options;

    // Return cached resource if available
    if (this.preloadedResources.has(url)) {
      return this.preloadedResources.get(url);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const startTime = performance.now();
    const resourceType = this.getResourceType(url);
    
    // Create loading promise
    const loadingPromise = this.loadResourceWithRetry(url, resourceType, retries, timeout);
    this.loadingPromises.set(url, loadingPromise);

    try {
      const resource = await loadingPromise;
      
      // Cache the resource
      this.preloadedResources.set(url, resource);
      
      if (critical) {
        this.criticalResources.add(url);
      }

      // Track performance
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.set(url, {
        loadTime,
        resourceType,
        priority,
        critical,
        timestamp: Date.now()
      });

      // Report to performance monitor
      if (window.emmyPerformance?.monitor) {
        window.emmyPerformance.monitor.recordCustomMetric(`preload_${resourceType}`, loadTime);
      }

      return resource;
    } catch (error) {
      console.error(`Failed to preload resource ${url}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  // Load resource with retry logic
  async loadResourceWithRetry(url, resourceType, retries, timeout) {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.loadResourceByType(url, resourceType, timeout);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Load resource by type with timeout
  async loadResourceByType(url, resourceType, timeout) {
    return Promise.race([
      this.createResourceLoader(url, resourceType),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Resource load timeout: ${url}`)), timeout)
      )
    ]);
  }

  // Create appropriate loader for resource type
  createResourceLoader(url, resourceType) {
    switch (resourceType) {
      case 'image':
        return this.loadImage(url);
      case 'audio':
        return this.loadAudio(url);
      case 'font':
        return this.loadFont(url);
      case 'css':
        return this.loadCSS(url);
      case 'script':
        return this.loadScript(url);
      default:
        return this.loadGeneric(url);
    }
  }

  // Load image
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Load audio
  loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = reject;
      audio.src = url;
      audio.load();
    });
  }

  // Load font
  loadFont(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      link.onload = () => resolve(link);
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Load CSS
  loadCSS(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      link.onload = () => {
        link.rel = 'stylesheet';
        resolve(link);
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Load script
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => resolve(script);
      script.onerror = reject;
      script.src = url;
      document.head.appendChild(script);
    });
  }

  // Load generic resource
  loadGeneric(url) {
    return fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    });
  }

  // Get resource type from URL
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase().split('?')[0];
    
    const typeMap = {
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
      'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio',
      'woff': 'font', 'woff2': 'font', 'ttf': 'font', 'otf': 'font',
      'css': 'css',
      'js': 'script'
    };

    return typeMap[extension] || 'generic';
  }

  // Preload resources based on user behavior
  async preloadByUserBehavior(userPreferences = {}) {
    const { favoriteSubjects = [], recentSubjects = [], settings = {} } = userPreferences;
    
    // Preload subject-specific assets
    const subjectAssets = this.getSubjectAssets([...favoriteSubjects, ...recentSubjects]);
    
    // Preload audio if enabled
    if (settings.audioEnabled !== false) {
      subjectAssets.push(...this.getAudioAssets());
    }

    // Preload accessibility assets if needed
    if (settings.highContrast || settings.screenReader) {
      subjectAssets.push(...this.getAccessibilityAssets());
    }

    const preloadPromises = subjectAssets.map(asset => 
      this.preloadResource(asset, { priority: 'normal' })
        .catch(error => {
          console.warn(`Failed to preload user behavior asset ${asset}:`, error);
          return null;
        })
    );

    const results = await Promise.all(preloadPromises);
    const successCount = results.filter(result => result !== null).length;
    
    return { total: subjectAssets.length, loaded: successCount };
  }

  // Get assets for specific subjects
  getSubjectAssets(subjects) {
    const subjectAssetMap = {
      science: [
        '/emmys-learning-app/images/science-icon.png',
        '/emmys-learning-app/sounds/science-complete.mp3'
      ],
      art: [
        '/emmys-learning-app/images/art-icon.png',
        '/emmys-learning-app/sounds/art-complete.mp3'
      ],
      geography: [
        '/emmys-learning-app/images/geography-icon.png',
        '/emmys-learning-app/sounds/geography-complete.mp3'
      ],
      history: [
        '/emmys-learning-app/images/history-icon.png',
        '/emmys-learning-app/sounds/history-complete.mp3'
      ]
    };

    return subjects.flatMap(subject => subjectAssetMap[subject] || []);
  }

  // Get audio assets
  getAudioAssets() {
    return [
      '/emmys-learning-app/sounds/click.mp3',
      '/emmys-learning-app/sounds/achievement.mp3',
      '/emmys-learning-app/sounds/celebration.mp3',
      '/emmys-learning-app/sounds/background-music.mp3'
    ];
  }

  // Get accessibility assets
  getAccessibilityAssets() {
    return [
      '/emmys-learning-app/css/high-contrast.css',
      '/emmys-learning-app/css/large-text.css',
      '/emmys-learning-app/sounds/screen-reader-notifications.mp3'
    ];
  }

  // Preload during idle time
  preloadDuringIdle(resources, options = {}) {
    const { timeout = 5000, priority = 'low' } = options;
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadResourceBatch(resources, { priority });
      }, { timeout });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadResourceBatch(resources, { priority });
      }, timeout);
    }
  }

  // Preload batch of resources
  async preloadResourceBatch(resources, options = {}) {
    const { concurrent = 3, delay = 100 } = options;
    
    // Create batches
    const batches = [];
    for (let i = 0; i < resources.length; i += concurrent) {
      batches.push(resources.slice(i, i + concurrent));
    }

    for (const batch of batches) {
      const promises = batch.map(resource => 
        this.preloadResource(resource, options)
          .catch(error => {
            console.warn(`Batch preload failed for ${resource}:`, error);
            return null;
          })
      );
      
      await Promise.all(promises);
      
      // Add delay between batches
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Get preload statistics
  getPreloadStats() {
    const stats = {
      totalPreloaded: this.preloadedResources.size,
      criticalResources: this.criticalResources.size,
      averageLoadTime: 0,
      resourceBreakdown: {},
      memoryUsage: this.estimateMemoryUsage()
    };

    if (this.performanceMetrics.size > 0) {
      const loadTimes = Array.from(this.performanceMetrics.values()).map(m => m.loadTime);
      stats.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      
      // Resource breakdown
      for (const [url, data] of this.performanceMetrics.entries()) {
        const type = data.resourceType;
        if (!stats.resourceBreakdown[type]) {
          stats.resourceBreakdown[type] = { count: 0, totalTime: 0 };
        }
        stats.resourceBreakdown[type].count++;
        stats.resourceBreakdown[type].totalTime += data.loadTime;
      }
    }

    return stats;
  }

  // Estimate memory usage
  estimateMemoryUsage() {
    let estimate = 0;
    
    for (const [url, resource] of this.preloadedResources.entries()) {
      const type = this.getResourceType(url);
      
      // Rough estimates in KB
      switch (type) {
        case 'image':
          estimate += 100; // Average image size
          break;
        case 'audio':
          estimate += 500; // Average audio file size
          break;
        case 'font':
          estimate += 50; // Average font size
          break;
        case 'css':
          estimate += 20; // Average CSS size
          break;
        case 'script':
          estimate += 100; // Average script size
          break;
        default:
          estimate += 10; // Generic estimate
      }
    }
    
    return estimate;
  }

  // Clear preloaded resources
  clearPreloadCache() {
    this.preloadedResources.clear();
    this.performanceMetrics.clear();
    this.criticalResources.clear();
  }

  // Check if resource is preloaded
  isPreloaded(url) {
    return this.preloadedResources.has(url);
  }

  // Get preloaded resource
  getPreloadedResource(url) {
    return this.preloadedResources.get(url);
  }
}

// Create singleton instance
const resourcePreloader = new ResourcePreloader();

// Initialize critical resource preloading
export const initializeResourcePreloading = async (userPreferences = {}) => {
  try {
    // Preload critical resources immediately
    const criticalResults = await resourcePreloader.preloadCriticalResources();
    
    // Preload user-specific resources
    const userResults = await resourcePreloader.preloadByUserBehavior(userPreferences);
    
    // Preload additional resources during idle time
    const idleResources = [
      '/emmys-learning-app/images/background-patterns.png',
      '/emmys-learning-app/sounds/ambient-sounds.mp3',
      '/emmys-learning-app/css/themes.css'
    ];
    
    resourcePreloader.preloadDuringIdle(idleResources);
    
    console.log('Resource preloading initialized:', {
      critical: criticalResults,
      userBehavior: userResults
    });
    
    return { critical: criticalResults, userBehavior: userResults };
  } catch (error) {
    console.error('Failed to initialize resource preloading:', error);
    return null;
  }
};

export default resourcePreloader;