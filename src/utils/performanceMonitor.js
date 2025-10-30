/**
 * Comprehensive Performance Monitoring System
 * Includes Core Web Vitals, bundle size tracking, and performance budgets
 */

import { coreWebVitalsTracker } from './coreWebVitals.js';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      coreWebVitals: {},
      bundleSize: {},
      resourceTiming: [],
      userInteractions: [],
      memoryUsage: [],
      networkRequests: [],
      componentLoadTimes: {},
      renderTimes: {},
      customMetrics: {}
    };

    this.performanceBudget = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1
      TTFB: 800, // 800ms
      INP: 200,  // 200ms
      bundleSize: 500000, // 500KB
      totalResourceSize: 2000000, // 2MB
      maxRenderTime: 16, // 16ms (60fps)
      maxMemoryUsage: 50000000 // 50MB
    };

    this.observers = [];
    this.isInitialized = false;
    this.performanceEntries = new Map();
  }

  initialize() {
    if (this.isInitialized) return;

    this.setupCoreWebVitalsTracking();
    this.trackResourceTiming();
    this.trackMemoryUsage();
    this.trackNetworkRequests();
    this.setupPerformanceObserver();
    this.calculateBundleSize();

    this.isInitialized = true;
    console.log('Performance Monitor initialized');
  }

  setupCoreWebVitalsTracking() {
    coreWebVitalsTracker.subscribe((metricName, value, rating) => {
      this.metrics.coreWebVitals[metricName] = { value, rating, timestamp: Date.now() };
      this.checkBudgetViolation(metricName, value);
      this.notifyObservers('coreWebVitals', { metricName, value, rating });
    });
  }

  trackResourceTiming() {
    try {
      const resources = performance.getEntriesByType('resource');
      this.metrics.resourceTiming = resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        transferSize: resource.transferSize || 0,
        encodedBodySize: resource.encodedBodySize || 0,
        decodedBodySize: resource.decodedBodySize || 0,
        type: this.getResourceType(resource.name)
      }));

      // Calculate total resource size
      const totalSize = this.metrics.resourceTiming.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      this.checkBudgetViolation('totalResourceSize', totalSize);
    } catch (error) {
      console.warn('Resource timing tracking failed:', error);
    }
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  calculateBundleSize() {
    try {
      const scripts = this.metrics.resourceTiming.filter(r => r.type === 'script');
      const stylesheets = this.metrics.resourceTiming.filter(r => r.type === 'stylesheet');

      this.metrics.bundleSize = {
        scripts: {
          count: scripts.length,
          totalSize: scripts.reduce((total, script) => total + (script.transferSize || 0), 0)
        },
        stylesheets: {
          count: stylesheets.length,
          totalSize: stylesheets.reduce((total, style) => total + (style.transferSize || 0), 0)
        },
        total: scripts.reduce((total, script) => total + (script.transferSize || 0), 0) +
               stylesheets.reduce((total, style) => total + (style.transferSize || 0), 0)
      };

      this.checkBudgetViolation('bundleSize', this.metrics.bundleSize.total);
    } catch (error) {
      console.warn('Bundle size calculation failed:', error);
    }
  }

  trackMemoryUsage() {
    if (!('memory' in performance)) return;

    const trackMemory = () => {
      const memory = performance.memory;
      const memoryData = {
        timestamp: Date.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };

      this.metrics.memoryUsage.push(memoryData);
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }

      this.checkBudgetViolation('maxMemoryUsage', memory.usedJSHeapSize);
    };

    // Track memory every 5 seconds
    trackMemory();
    setInterval(trackMemory, 5000);
  }

  trackNetworkRequests() {
    // Override fetch to track network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.metrics.networkRequests.push({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          timestamp: Date.now()
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.metrics.networkRequests.push({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          timestamp: Date.now(),
          error: error.message
        });

        throw error;
      }
    };
  }

  setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Track long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.metrics.customMetrics.longTasks = this.metrics.customMetrics.longTasks || [];
            this.metrics.customMetrics.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: Date.now()
            });
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task observer setup failed:', error);
    }
  }

  // Component performance tracking
  startTiming(componentName) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.componentLoadTimes[componentName] = duration;
      this.checkBudgetViolation('maxRenderTime', duration);
      this.notifyObservers('componentTiming', { componentName, duration });
    };
  }

  trackUserInteraction(interactionType, details = {}) {
    this.metrics.userInteractions.push({
      type: interactionType,
      timestamp: Date.now(),
      ...details
    });

    // Keep only last 1000 interactions
    if (this.metrics.userInteractions.length > 1000) {
      this.metrics.userInteractions.shift();
    }
  }

  addCustomMetric(name, value, metadata = {}) {
    this.metrics.customMetrics[name] = {
      value,
      timestamp: Date.now(),
      ...metadata
    };

    this.notifyObservers('customMetric', { name, value, metadata });
  }

  checkBudgetViolation(metricName, value) {
    const budget = this.performanceBudget[metricName];
    if (budget && value > budget) {
      const violation = {
        metric: metricName,
        value,
        budget,
        timestamp: Date.now(),
        severity: this.calculateViolationSeverity(value, budget)
      };

      console.warn(`Performance Budget Violation: ${metricName}`, violation);
      this.notifyObservers('budgetViolation', violation);
    }
  }

  calculateViolationSeverity(value, budget) {
    const ratio = value / budget;
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  getPerformanceReport() {
    const coreWebVitals = coreWebVitalsTracker.exportMetrics();
    
    return {
      timestamp: Date.now(),
      coreWebVitals,
      bundleSize: this.metrics.bundleSize,
      resourceTiming: {
        totalResources: this.metrics.resourceTiming.length,
        totalSize: this.metrics.resourceTiming.reduce((total, r) => total + (r.transferSize || 0), 0),
        byType: this.groupResourcesByType()
      },
      memoryUsage: this.getMemoryTrend(),
      networkRequests: {
        total: this.metrics.networkRequests.length,
        averageResponseTime: this.getAverageNetworkResponseTime(),
        errorRate: this.getNetworkErrorRate()
      },
      componentPerformance: {
        averageLoadTime: this.getAverageComponentLoadTime(),
        slowestComponents: this.getSlowestComponents()
      },
      budgetViolations: this.getBudgetViolations(),
      recommendations: this.generateRecommendations()
    };
  }

  groupResourcesByType() {
    const grouped = {};
    this.metrics.resourceTiming.forEach(resource => {
      if (!grouped[resource.type]) {
        grouped[resource.type] = { count: 0, totalSize: 0 };
      }
      grouped[resource.type].count++;
      grouped[resource.type].totalSize += resource.transferSize || 0;
    });
    return grouped;
  }

  getMemoryTrend() {
    const usage = this.metrics.memoryUsage;
    if (usage.length < 2) return { trend: 'stable', current: usage[0]?.used || 0, peak: usage[0]?.used || 0 };
    
    const recent = usage.slice(-10);
    const trendValue = recent[recent.length - 1].used - recent[0].used;
    
    return {
      trend: trendValue > 10000000 ? 'increasing' : trendValue < -10000000 ? 'decreasing' : 'stable',
      current: recent[recent.length - 1].used,
      peak: Math.max(...usage.map(u => u.used))
    };
  }

  getAverageNetworkResponseTime() {
    const requests = this.metrics.networkRequests;
    if (requests.length === 0) return 0;
    return requests.reduce((total, req) => total + req.duration, 0) / requests.length;
  }

  getNetworkErrorRate() {
    const requests = this.metrics.networkRequests;
    if (requests.length === 0) return 0;
    const errors = requests.filter(req => req.status === 0 || req.status >= 400);
    return (errors.length / requests.length) * 100;
  }

  getAverageComponentLoadTime() {
    const times = Object.values(this.metrics.componentLoadTimes);
    if (times.length === 0) return 0;
    return times.reduce((total, time) => total + time, 0) / times.length;
  }

  getSlowestComponents() {
    return Object.entries(this.metrics.componentLoadTimes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, time]) => ({ name, time }));
  }

  getBudgetViolations() {
    const violations = [];
    const coreWebVitals = coreWebVitalsTracker.exportMetrics();
    const memoryTrend = this.getMemoryTrend();
    const resourceTiming = this.groupResourcesByType();
    const totalResourceSize = this.metrics.resourceTiming.reduce((total, r) => total + (r.transferSize || 0), 0);
    
    Object.entries(this.performanceBudget).forEach(([metric, budget]) => {
      let currentValue;
      
      switch (metric) {
        case 'LCP':
        case 'FID':
        case 'CLS':
        case 'TTFB':
        case 'INP':
          currentValue = coreWebVitals.metrics[metric];
          break;
        case 'bundleSize':
          currentValue = this.metrics.bundleSize.total;
          break;
        case 'totalResourceSize':
          currentValue = totalResourceSize;
          break;
        case 'maxMemoryUsage':
          currentValue = memoryTrend.current;
          break;
        default:
          return;
      }
      
      if (currentValue && currentValue > budget) {
        violations.push({
          metric,
          current: currentValue,
          budget,
          severity: this.calculateViolationSeverity(currentValue, budget)
        });
      }
    });
    
    return violations;
  }

  generateRecommendations() {
    const recommendations = [];
    const coreWebVitals = coreWebVitalsTracker.exportMetrics();
    const memoryTrend = this.getMemoryTrend();
    
    // Core Web Vitals recommendations
    if (coreWebVitals.ratings.LCP === 'poor') {
      recommendations.push({
        type: 'LCP',
        message: 'Optimize largest contentful paint by reducing image sizes and improving server response times',
        priority: 'high'
      });
    }
    
    if (coreWebVitals.ratings.FID === 'poor') {
      recommendations.push({
        type: 'FID',
        message: 'Reduce JavaScript execution time and break up long tasks',
        priority: 'high'
      });
    }
    
    if (coreWebVitals.ratings.CLS === 'poor') {
      recommendations.push({
        type: 'CLS',
        message: 'Add size attributes to images and reserve space for dynamic content',
        priority: 'medium'
      });
    }
    
    // Bundle size recommendations
    if (this.metrics.bundleSize.total > this.performanceBudget.bundleSize) {
      recommendations.push({
        type: 'bundleSize',
        message: 'Consider code splitting and lazy loading to reduce initial bundle size',
        priority: 'medium'
      });
    }
    
    // Memory recommendations
    if (memoryTrend.trend === 'increasing') {
      recommendations.push({
        type: 'memory',
        message: 'Monitor for memory leaks and optimize component cleanup',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Performance monitor observer failed:', error);
      }
    });
  }

  reset() {
    this.metrics = {
      coreWebVitals: {},
      bundleSize: {},
      resourceTiming: [],
      userInteractions: [],
      memoryUsage: [],
      networkRequests: [],
      componentLoadTimes: {},
      renderTimes: {},
      customMetrics: {}
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    performanceMonitor.initialize();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.initialize();
    });
  }
}

export default performanceMonitor;