/**
 * Core Web Vitals Tracking Utility
 * Implements tracking for LCP, FID, CLS, and TTFB metrics
 */

class CoreWebVitalsTracker {
  constructor() {
    this.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      TTFB: null,
      INP: null // Interaction to Next Paint (new metric)
    };
    this.observers = [];
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.trackTTFB();
    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackINP();
    
    this.isInitialized = true;
  }

  // Time to First Byte
  trackTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.updateMetric('TTFB', ttfb);
      }
    } catch (error) {
      console.warn('TTFB tracking failed:', error);
    }
  }

  // Largest Contentful Paint
  trackLCP() {
    try {
      if (!('PerformanceObserver' in window)) return;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.updateMetric('LCP', lastEntry.startTime);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP tracking failed:', error);
    }
  }

  // First Input Delay
  trackFID() {
    try {
      if (!('PerformanceObserver' in window)) return;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = entry.processingStart - entry.startTime;
            this.updateMetric('FID', fid);
          }
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID tracking failed:', error);
    }
  }

  // Cumulative Layout Shift
  trackCLS() {
    try {
      if (!('PerformanceObserver' in window)) return;

      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.updateMetric('CLS', clsValue);
            }
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS tracking failed:', error);
    }
  }

  // Interaction to Next Paint (new metric)
  trackINP() {
    try {
      if (!('PerformanceObserver' in window)) return;

      let maxINP = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.interactionId) {
            const inp = entry.processingEnd - entry.startTime;
            if (inp > maxINP) {
              maxINP = inp;
              this.updateMetric('INP', inp);
            }
          }
        });
      });

      observer.observe({ type: 'event', buffered: true });
    } catch (error) {
      console.warn('INP tracking failed:', error);
    }
  }

  updateMetric(name, value) {
    this.metrics[name] = value;
    this.notifyObservers(name, value);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getMetricRating(name, value) {
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      TTFB: { good: 800, needsImprovement: 1800 },
      INP: { good: 200, needsImprovement: 500 }
    };

    const threshold = thresholds[name];
    if (!threshold || value === null) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  getAllRatings() {
    const ratings = {};
    Object.entries(this.metrics).forEach(([name, value]) => {
      ratings[name] = this.getMetricRating(name, value);
    });
    return ratings;
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  notifyObservers(metricName, value) {
    this.observers.forEach(callback => {
      try {
        callback(metricName, value, this.getMetricRating(metricName, value));
      } catch (error) {
        console.error('Observer callback failed:', error);
      }
    });
  }

  // Export metrics for analytics
  exportMetrics() {
    const ratings = this.getAllRatings();
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      ratings,
      overallScore: this.calculateOverallScore(ratings)
    };
  }

  calculateOverallScore(ratings) {
    const scores = { good: 100, 'needs-improvement': 50, poor: 0, unknown: 0 };
    const values = Object.values(ratings).map(rating => scores[rating] || 0);
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }
}

// Create singleton instance
export const coreWebVitalsTracker = new CoreWebVitalsTracker();

// Initialize tracking when module loads
if (typeof window !== 'undefined') {
  // Wait for page load to ensure accurate measurements
  if (document.readyState === 'complete') {
    coreWebVitalsTracker.initialize();
  } else {
    window.addEventListener('load', () => {
      coreWebVitalsTracker.initialize();
    });
  }
}

export default coreWebVitalsTracker;