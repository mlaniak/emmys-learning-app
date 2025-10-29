import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';

// Lazy Loading Components
export const LazyDragAndDropGame = lazy(() => import('../components/InteractiveGames').then(module => ({ default: module.DragAndDropGame })));
export const LazyMatchingGame = lazy(() => import('../components/InteractiveGames').then(module => ({ default: module.MatchingGame })));
export const LazyMemoryGame = lazy(() => import('../components/InteractiveGames').then(module => ({ default: module.MemoryGame })));

export const LazyVisualAids = lazy(() => import('../components/VisualLearningAids'));
export const LazyProfileManager = lazy(() => import('../components/ProfileManager'));
export const LazyParentDashboard = lazy(() => import('../components/ParentDashboard'));
export const LazyProgressTracker = lazy(() => import('../components/ProgressTracker'));

// Loading Components
const GameLoadingFallback = () => (
  <div className="bg-white rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 rounded mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-300 rounded"></div>
        ))}
      </div>
      <div className="flex justify-center space-x-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 w-20 bg-gray-300 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// Performance Monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      componentLoadTimes: {},
      renderTimes: {},
      memoryUsage: [],
      networkRequests: []
    };
    this.observers = [];
  }

  startTiming(componentName) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.metrics.componentLoadTimes[componentName] = loadTime;
      this.notifyObservers('componentLoaded', { componentName, loadTime });
    };
  }

  measureRender(componentName, renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.metrics.renderTimes[componentName] = endTime - startTime;
    return result;
  }

  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  trackNetworkRequest(url, startTime, endTime) {
    this.metrics.networkRequests.push({
      url,
      duration: endTime - startTime,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageLoadTime: this.getAverageLoadTime(),
      averageRenderTime: this.getAverageRenderTime(),
      memoryTrend: this.getMemoryTrend()
    };
  }

  getAverageLoadTime() {
    const times = Object.values(this.metrics.componentLoadTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getAverageRenderTime() {
    const times = Object.values(this.metrics.renderTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMemoryTrend() {
    const usage = this.metrics.memoryUsage;
    if (usage.length < 2) return 'stable';
    
    const recent = usage.slice(-10);
    const trend = recent[recent.length - 1].used - recent[0].used;
    
    if (trend > 10000000) return 'increasing'; // 10MB increase
    if (trend < -10000000) return 'decreasing'; // 10MB decrease
    return 'stable';
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => callback(event, data));
  }

  clearMetrics() {
    this.metrics = {
      componentLoadTimes: {},
      renderTimes: {},
      memoryUsage: [],
      networkRequests: []
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance Optimization Hooks
export const usePerformanceOptimization = () => {
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    // Check if device is low-end
    const isLowEndDevice = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
      
      return (
        memory < 4 || // Less than 4GB RAM
        (connection && connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) ||
        /Android.*Chrome\/[.0-9]* Mobile/.test(navigator.userAgent) // Mobile Android
      );
    };

    setIsOptimized(isLowEndDevice());
  }, []);

  return { isOptimized };
};

// Memoized Component Wrapper
export const MemoizedComponent = React.memo(({ children, ...props }) => {
  return React.cloneElement(children, props);
});

// Virtual Scrolling Hook for Large Lists
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Image Lazy Loading Hook
export const useLazyImage = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { imageSrc, isLoaded };
};

// Debounced Search Hook
export const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return debouncedTerm;
};

// Code Splitting Utilities
export const createAsyncComponent = (importFunc, fallback = ComponentLoadingFallback) => {
  return React.lazy(importFunc);
};

export const preloadComponent = (importFunc) => {
  return importFunc();
};

// Bundle Analyzer (Development Only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    console.group('Bundle Analysis');
    console.log('Scripts:', scripts.length);
    console.log('Stylesheets:', stylesheets.length);
    
    scripts.forEach(script => {
      console.log('Script:', script.src);
    });
    
    stylesheets.forEach(link => {
      console.log('Stylesheet:', link.href);
    });
    
    console.groupEnd();
  }
};

// Performance Budget Checker
export const checkPerformanceBudget = () => {
  const metrics = performanceMonitor.getMetrics();
  const budget = {
    maxLoadTime: 1000, // 1 second
    maxRenderTime: 100, // 100ms
    maxMemoryUsage: 50000000 // 50MB
  };

  const violations = [];

  if (metrics.averageLoadTime > budget.maxLoadTime) {
    violations.push(`Load time exceeded: ${metrics.averageLoadTime}ms > ${budget.maxLoadTime}ms`);
  }

  if (metrics.averageRenderTime > budget.maxRenderTime) {
    violations.push(`Render time exceeded: ${metrics.averageRenderTime}ms > ${budget.maxRenderTime}ms`);
  }

  const currentMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];
  if (currentMemory && currentMemory.used > budget.maxMemoryUsage) {
    violations.push(`Memory usage exceeded: ${currentMemory.used} bytes > ${budget.maxMemoryUsage} bytes`);
  }

  if (violations.length > 0) {
    console.warn('Performance Budget Violations:', violations);
  }

  return violations;
};

// Export all utilities
export {
  GameLoadingFallback,
  ComponentLoadingFallback,
  PerformanceMonitor
};
