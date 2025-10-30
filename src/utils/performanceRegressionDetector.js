/**
 * Performance Regression Detection System
 * Automatically detects performance regressions by comparing current metrics with historical data
 */

class PerformanceRegressionDetector {
  constructor() {
    this.storageKey = 'emmy-performance-history';
    this.maxHistoryEntries = 100;
    this.regressionThresholds = {
      LCP: 0.2, // 20% increase is considered a regression
      FID: 0.3, // 30% increase
      CLS: 0.5, // 50% increase
      TTFB: 0.25, // 25% increase
      INP: 0.3, // 30% increase
      bundleSize: 0.1, // 10% increase
      memoryUsage: 0.2, // 20% increase
      componentLoadTime: 0.3 // 30% increase
    };
    this.observers = [];
  }

  // Store performance data for regression analysis
  recordPerformanceSnapshot(performanceData) {
    try {
      const snapshot = {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metrics: {
          LCP: performanceData.coreWebVitals.metrics.LCP,
          FID: performanceData.coreWebVitals.metrics.FID,
          CLS: performanceData.coreWebVitals.metrics.CLS,
          TTFB: performanceData.coreWebVitals.metrics.TTFB,
          INP: performanceData.coreWebVitals.metrics.INP,
          bundleSize: performanceData.bundleSize.total,
          memoryUsage: performanceData.memoryUsage.current,
          averageComponentLoadTime: performanceData.componentPerformance.averageLoadTime
        },
        overallScore: performanceData.coreWebVitals.overallScore
      };

      const history = this.getPerformanceHistory();
      history.push(snapshot);

      // Keep only the most recent entries
      if (history.length > this.maxHistoryEntries) {
        history.splice(0, history.length - this.maxHistoryEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(history));
      
      // Check for regressions
      this.detectRegressions(snapshot, history);
      
      return snapshot;
    } catch (error) {
      console.error('Failed to record performance snapshot:', error);
      return null;
    }
  }

  getPerformanceHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load performance history:', error);
      return [];
    }
  }

  detectRegressions(currentSnapshot, history) {
    if (history.length < 5) {
      // Need at least 5 data points for meaningful regression detection
      return [];
    }

    const regressions = [];
    const baseline = this.calculateBaseline(history.slice(-10)); // Use last 10 entries as baseline

    Object.entries(currentSnapshot.metrics).forEach(([metric, currentValue]) => {
      if (currentValue === null || currentValue === undefined) return;

      const baselineValue = baseline[metric];
      if (!baselineValue) return;

      const threshold = this.regressionThresholds[metric] || 0.2;
      const percentageIncrease = (currentValue - baselineValue) / baselineValue;

      if (percentageIncrease > threshold) {
        const regression = {
          metric,
          currentValue,
          baselineValue,
          percentageIncrease: percentageIncrease * 100,
          severity: this.calculateRegressionSeverity(percentageIncrease, threshold),
          timestamp: currentSnapshot.timestamp,
          url: currentSnapshot.url
        };

        regressions.push(regression);
        this.notifyObservers('regression', regression);
      }
    });

    // Check overall score regression
    const baselineScore = this.calculateAverageScore(history.slice(-10));
    const currentScore = currentSnapshot.overallScore;
    const scoreDecrease = baselineScore - currentScore;

    if (scoreDecrease > 10) { // 10 point decrease in overall score
      const regression = {
        metric: 'overallScore',
        currentValue: currentScore,
        baselineValue: baselineScore,
        percentageIncrease: -scoreDecrease, // Negative because it's a decrease
        severity: scoreDecrease > 20 ? 'critical' : scoreDecrease > 15 ? 'high' : 'medium',
        timestamp: currentSnapshot.timestamp,
        url: currentSnapshot.url
      };

      regressions.push(regression);
      this.notifyObservers('regression', regression);
    }

    if (regressions.length > 0) {
      console.warn('Performance regressions detected:', regressions);
    }

    return regressions;
  }

  calculateBaseline(recentHistory) {
    if (recentHistory.length === 0) return {};

    const baseline = {};
    const metrics = Object.keys(recentHistory[0].metrics);

    metrics.forEach(metric => {
      const values = recentHistory
        .map(entry => entry.metrics[metric])
        .filter(value => value !== null && value !== undefined);

      if (values.length > 0) {
        // Use median as baseline to reduce impact of outliers
        baseline[metric] = this.calculateMedian(values);
      }
    });

    return baseline;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  calculateAverageScore(history) {
    const scores = history.map(entry => entry.overallScore).filter(score => score !== null);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  calculateRegressionSeverity(percentageIncrease, threshold) {
    if (percentageIncrease > threshold * 3) return 'critical';
    if (percentageIncrease > threshold * 2) return 'high';
    if (percentageIncrease > threshold * 1.5) return 'medium';
    return 'low';
  }

  getPerformanceTrends(metric, days = 7) {
    const history = this.getPerformanceHistory();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const recentData = history
      .filter(entry => entry.timestamp > cutoffTime)
      .map(entry => ({
        timestamp: entry.timestamp,
        value: entry.metrics[metric],
        overallScore: entry.overallScore
      }))
      .filter(entry => entry.value !== null && entry.value !== undefined);

    if (recentData.length < 2) {
      return { trend: 'insufficient-data', data: recentData };
    }

    // Calculate trend using linear regression
    const trend = this.calculateTrend(recentData);
    
    return {
      trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'degrading' : 'stable',
      slope: trend,
      data: recentData,
      average: recentData.reduce((sum, entry) => sum + entry.value, 0) / recentData.length
    };
  }

  calculateTrend(data) {
    const n = data.length;
    const sumX = data.reduce((sum, entry, index) => sum + index, 0);
    const sumY = data.reduce((sum, entry) => sum + entry.value, 0);
    const sumXY = data.reduce((sum, entry, index) => sum + (index * entry.value), 0);
    const sumXX = data.reduce((sum, entry, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  generateRegressionReport() {
    const history = this.getPerformanceHistory();
    if (history.length === 0) {
      return { message: 'No performance data available for regression analysis' };
    }

    const latest = history[history.length - 1];
    const trends = {};
    
    Object.keys(latest.metrics).forEach(metric => {
      trends[metric] = this.getPerformanceTrends(metric);
    });

    const recentRegressions = this.getRecentRegressions(7); // Last 7 days

    return {
      timestamp: Date.now(),
      dataPoints: history.length,
      latestSnapshot: latest,
      trends,
      recentRegressions,
      recommendations: this.generateRegressionRecommendations(trends, recentRegressions)
    };
  }

  getRecentRegressions(days = 7) {
    const history = this.getPerformanceHistory();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const regressions = [];
    
    // Simulate regression detection for recent history
    // In a real implementation, you'd store detected regressions separately
    for (let i = Math.max(0, history.length - 10); i < history.length; i++) {
      const snapshot = history[i];
      if (snapshot.timestamp > cutoffTime) {
        const baseline = this.calculateBaseline(history.slice(0, i));
        const detected = this.detectRegressionsForSnapshot(snapshot, baseline);
        regressions.push(...detected);
      }
    }
    
    return regressions;
  }

  detectRegressionsForSnapshot(snapshot, baseline) {
    const regressions = [];
    
    Object.entries(snapshot.metrics).forEach(([metric, value]) => {
      if (value === null || value === undefined) return;
      
      const baselineValue = baseline[metric];
      if (!baselineValue) return;
      
      const threshold = this.regressionThresholds[metric] || 0.2;
      const percentageIncrease = (value - baselineValue) / baselineValue;
      
      if (percentageIncrease > threshold) {
        regressions.push({
          metric,
          currentValue: value,
          baselineValue,
          percentageIncrease: percentageIncrease * 100,
          severity: this.calculateRegressionSeverity(percentageIncrease, threshold),
          timestamp: snapshot.timestamp,
          url: snapshot.url
        });
      }
    });
    
    return regressions;
  }

  generateRegressionRecommendations(trends, regressions) {
    const recommendations = [];
    
    // Analyze trends
    Object.entries(trends).forEach(([metric, trendData]) => {
      if (trendData.trend === 'degrading') {
        recommendations.push({
          type: 'trend',
          metric,
          message: `${metric} is showing a degrading trend over time`,
          priority: 'medium',
          action: this.getRecommendationAction(metric)
        });
      }
    });
    
    // Analyze recent regressions
    const criticalRegressions = regressions.filter(r => r.severity === 'critical');
    if (criticalRegressions.length > 0) {
      recommendations.push({
        type: 'critical-regression',
        message: `${criticalRegressions.length} critical performance regressions detected`,
        priority: 'high',
        action: 'Immediate investigation required'
      });
    }
    
    return recommendations;
  }

  getRecommendationAction(metric) {
    const actions = {
      LCP: 'Optimize images, reduce server response time, eliminate render-blocking resources',
      FID: 'Reduce JavaScript execution time, break up long tasks, use web workers',
      CLS: 'Add size attributes to images, reserve space for dynamic content',
      TTFB: 'Optimize server response time, use CDN, implement caching',
      INP: 'Optimize event handlers, reduce JavaScript execution time',
      bundleSize: 'Implement code splitting, remove unused dependencies, optimize imports',
      memoryUsage: 'Fix memory leaks, optimize component cleanup, reduce object retention',
      componentLoadTime: 'Optimize component rendering, implement lazy loading, reduce complexity'
    };
    
    return actions[metric] || 'Review and optimize this metric';
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
        console.error('Regression detector observer failed:', error);
      }
    });
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }

  exportHistory() {
    const history = this.getPerformanceHistory();
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const performanceRegressionDetector = new PerformanceRegressionDetector();

export default performanceRegressionDetector;