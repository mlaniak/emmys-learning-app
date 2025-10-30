// Lazy Loading Utilities for Code Splitting and Performance Optimization
import { lazy } from 'react';

// Preloading cache to store preloaded modules
const preloadCache = new Map();

// Enhanced lazy loading with preloading support
export const createLazyComponent = (importFn, preloadDelay = 0) => {
  const LazyComponent = lazy(importFn);
  
  // Add preload method to the component
  LazyComponent.preload = () => {
    const modulePromise = importFn();
    preloadCache.set(importFn, modulePromise);
    return modulePromise;
  };
  
  // Auto-preload after specified delay
  if (preloadDelay > 0) {
    setTimeout(() => {
      LazyComponent.preload();
    }, preloadDelay);
  }
  
  return LazyComponent;
};

// Preload strategy for likely-to-be-used resources
export const preloadStrategy = {
  // Preload on hover with debouncing
  onHover: (importFn, delay = 100) => {
    let timeoutId;
    return {
      onMouseEnter: () => {
        timeoutId = setTimeout(() => {
          if (!preloadCache.has(importFn)) {
            const modulePromise = importFn();
            preloadCache.set(importFn, modulePromise);
          }
        }, delay);
      },
      onMouseLeave: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
  },
  
  // Preload on viewport intersection
  onIntersection: (importFn, threshold = 0.1) => {
    return (element) => {
      if (!element || preloadCache.has(importFn)) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const modulePromise = importFn();
              preloadCache.set(importFn, modulePromise);
              observer.disconnect();
            }
          });
        },
        { threshold }
      );
      
      observer.observe(element);
      return () => observer.disconnect();
    };
  },
  
  // Preload after user interaction
  onInteraction: (importFn, events = ['click', 'touchstart']) => {
    const preload = () => {
      if (!preloadCache.has(importFn)) {
        const modulePromise = importFn();
        preloadCache.set(importFn, modulePromise);
      }
      // Remove listeners after first interaction
      events.forEach(event => {
        document.removeEventListener(event, preload, { once: true });
      });
    };
    
    events.forEach(event => {
      document.addEventListener(event, preload, { once: true });
    });
  },
  
  // Preload during idle time
  onIdle: (importFn, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (!preloadCache.has(importFn)) {
          const modulePromise = importFn();
          preloadCache.set(importFn, modulePromise);
        }
      }, { timeout });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        if (!preloadCache.has(importFn)) {
          const modulePromise = importFn();
          preloadCache.set(importFn, modulePromise);
        }
      }, timeout);
    }
  }
};

// Progressive loading for large content sets
export class ProgressiveLoader {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 10;
    this.loadDelay = options.loadDelay || 100;
    this.cache = new Map();
  }
  
  // Load content in chunks
  async loadInChunks(dataArray, processor) {
    const chunks = this.createChunks(dataArray, this.chunkSize);
    const results = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const processedChunk = await processor(chunk, i);
      results.push(...processedChunk);
      
      // Add delay between chunks to prevent blocking
      if (i < chunks.length - 1) {
        await this.delay(this.loadDelay);
      }
    }
    
    return results;
  }
  
  // Create chunks from array
  createChunks(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Cache processed content
  cacheContent(key, content) {
    this.cache.set(key, content);
  }
  
  // Get cached content
  getCachedContent(key) {
    return this.cache.get(key);
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Bundle splitting utilities
export const bundleSplitting = {
  // Create vendor chunk for common dependencies
  createVendorChunk: (dependencies) => {
    return dependencies.reduce((acc, dep) => {
      acc[dep] = dep;
      return acc;
    }, {});
  },
  
  // Create feature-based chunks
  createFeatureChunks: (features) => {
    return features.reduce((acc, feature) => {
      acc[feature.name] = feature.modules;
      return acc;
    }, {});
  }
};

// Resource preloading for critical assets
export const resourcePreloader = {
  // Preload images
  preloadImages: (imageUrls) => {
    return Promise.all(
      imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  },
  
  // Preload fonts
  preloadFonts: (fontUrls) => {
    return Promise.all(
      fontUrls.map(url => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          link.href = url;
          link.onload = resolve;
          link.onerror = reject;
          document.head.appendChild(link);
        });
      })
    );
  },
  
  // Preload CSS
  preloadCSS: (cssUrls) => {
    return Promise.all(
      cssUrls.map(url => {
        return new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = url;
          link.onload = () => {
            link.rel = 'stylesheet';
            resolve();
          };
          link.onerror = reject;
          document.head.appendChild(link);
        });
      })
    );
  }
};

// Performance monitoring for lazy loading
export const lazyLoadingMetrics = {
  // Track loading times
  trackLoadTime: (componentName, startTime) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Store metrics for performance monitoring
    if (window.emmyPerformance?.monitor) {
      window.emmyPerformance.monitor.recordCustomMetric(`lazy_load_${componentName}`, loadTime);
    }
    
    console.log(`Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
    return loadTime;
  },
  
  // Track cache hit rates
  trackCacheHit: (componentName, isHit) => {
    const metric = isHit ? 'cache_hit' : 'cache_miss';
    
    if (window.emmyPerformance?.monitor) {
      window.emmyPerformance.monitor.recordCustomMetric(`${metric}_${componentName}`, 1);
    }
  }
};

export default {
  createLazyComponent,
  preloadStrategy,
  ProgressiveLoader,
  bundleSplitting,
  resourcePreloader,
  lazyLoadingMetrics
};