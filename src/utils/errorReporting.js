/**
 * Error Reporting System
 * 
 * Comprehensive error reporting and logging system for production monitoring
 * with privacy-conscious data collection and user feedback integration.
 */

import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from './errorHandling.jsx';
import { getEnvironmentConfig, isDevelopment } from './environmentConfig';

// Report Types
export const REPORT_TYPES = {
  ERROR: 'error',
  PERFORMANCE: 'performance',
  USER_FEEDBACK: 'user_feedback',
  CRASH: 'crash',
  NETWORK: 'network'
};

// Privacy Levels
export const PRIVACY_LEVELS = {
  MINIMAL: 'minimal',     // Only essential error info
  STANDARD: 'standard',   // Include context but no PII
  DETAILED: 'detailed'    // Full context for debugging
};

/**
 * Error Reporting Manager
 */
export class ErrorReportingManager {
  constructor(options = {}) {
    this.config = {
      endpoint: options.endpoint || '/api/errors',
      apiKey: options.apiKey || null,
      privacyLevel: options.privacyLevel || PRIVACY_LEVELS.STANDARD,
      batchSize: options.batchSize || 10,
      flushInterval: options.flushInterval || 30000, // 30 seconds
      maxRetries: options.maxRetries || 3,
      enabled: options.enabled !== false,
      ...options
    };

    this.reportQueue = [];
    this.isFlushingQueue = false;
    this.flushTimer = null;
    this.sessionId = this.generateSessionId();
    
    // Start periodic flushing
    this.startPeriodicFlush();
    
    // Listen for page unload to flush remaining reports
    window.addEventListener('beforeunload', () => this.flushQueue(true));
  }

  /**
   * Report an error with context
   */
  async reportError(error, context = {}) {
    if (!this.config.enabled) return;

    try {
      const report = this.createErrorReport(error, context);
      await this.queueReport(report);
      
      if (isDevelopment()) {
        console.log('📊 Error reported:', report);
      }
      
      return report.id;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Report performance issue
   */
  async reportPerformance(metrics, context = {}) {
    if (!this.config.enabled) return;

    try {
      const report = this.createPerformanceReport(metrics, context);
      await this.queueReport(report);
      
      return report.id;
    } catch (reportingError) {
      console.error('Failed to report performance issue:', reportingError);
    }
  }

  /**
   * Report user feedback
   */
  async reportUserFeedback(feedback, context = {}) {
    if (!this.config.enabled) return;

    try {
      const report = this.createFeedbackReport(feedback, context);
      await this.queueReport(report);
      
      return report.id;
    } catch (reportingError) {
      console.error('Failed to report user feedback:', reportingError);
    }
  }

  /**
   * Create error report with privacy filtering
   */
  createErrorReport(error, context = {}) {
    const baseReport = {
      id: this.generateReportId(),
      type: REPORT_TYPES.ERROR,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      error: {
        name: error.name,
        message: this.sanitizeMessage(error.message),
        stack: this.sanitizeStackTrace(error.stack),
        code: error.code,
        status: error.status
      },
      context: this.sanitizeContext(context),
      environment: this.getEnvironmentInfo(),
      user: this.getUserInfo(context.userId)
    };

    // Add severity assessment
    baseReport.severity = this.assessErrorSeverity(error, context);
    
    // Add error categorization
    baseReport.category = this.categorizeError(error);
    
    return baseReport;
  }

  /**
   * Create performance report
   */
  createPerformanceReport(metrics, context = {}) {
    return {
      id: this.generateReportId(),
      type: REPORT_TYPES.PERFORMANCE,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metrics: this.sanitizeMetrics(metrics),
      context: this.sanitizeContext(context),
      environment: this.getEnvironmentInfo(),
      user: this.getUserInfo(context.userId)
    };
  }

  /**
   * Create feedback report
   */
  createFeedbackReport(feedback, context = {}) {
    return {
      id: this.generateReportId(),
      type: REPORT_TYPES.USER_FEEDBACK,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      feedback: {
        rating: feedback.rating,
        category: feedback.category,
        message: this.sanitizeMessage(feedback.message),
        type: feedback.type
      },
      context: this.sanitizeContext(context),
      environment: this.getEnvironmentInfo(),
      user: this.getUserInfo(context.userId)
    };
  }

  /**
   * Queue report for batch sending
   */
  async queueReport(report) {
    this.reportQueue.push(report);
    
    // Flush immediately for critical errors
    if (report.severity === ERROR_SEVERITY.CRITICAL) {
      await this.flushQueue();
    } else if (this.reportQueue.length >= this.config.batchSize) {
      await this.flushQueue();
    }
  }

  /**
   * Check if we're on a static hosting platform (like GitHub Pages)
   */
  isStaticHosting() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    // Check for common static hosting platforms
    return hostname.includes('github.io') || 
           hostname.includes('netlify.app') || 
           hostname.includes('vercel.app') ||
           hostname.includes('pages.dev') ||
           hostname === 'localhost' || 
           hostname === '127.0.0.1';
  }

  /**
   * Flush report queue to server
   */
  async flushQueue(isUnloading = false) {
    if (this.isFlushingQueue || this.reportQueue.length === 0) return;
    
    // Skip reporting on static hosting platforms
    if (this.isStaticHosting()) {
      this.reportQueue = [];
      return;
    }
    
    this.isFlushingQueue = true;
    const reportsToSend = [...this.reportQueue];
    this.reportQueue = [];

    try {
      if (isUnloading && navigator.sendBeacon) {
        // Use sendBeacon for page unload
        const data = JSON.stringify({ reports: reportsToSend });
        navigator.sendBeacon(this.config.endpoint, data);
      } else {
        // Use fetch for normal reporting
        await this.sendReports(reportsToSend);
      }
      
      if (isDevelopment()) {
        console.log(`📤 Sent ${reportsToSend.length} error reports`);
      }
    } catch (error) {
      // Fail silently on static hosting - don't log errors that users can't fix
      if (!this.isStaticHosting()) {
        // Only log errors if not on static hosting
        if (isDevelopment()) {
          console.warn('Failed to send error reports:', error);
        }
        // Re-queue reports on failure (only if not static hosting)
        this.reportQueue.unshift(...reportsToSend);
      }
      // On static hosting, just clear the queue silently
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Send reports to server
   */
  async sendReports(reports) {
    // Skip if on static hosting
    if (this.isStaticHosting()) {
      return { success: true, skipped: true };
    }

    const payload = {
      reports,
      metadata: {
        sdk: 'emmys-learning-app',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // For 405 (Method Not Allowed), likely static hosting - fail silently
        if (response.status === 405) {
          return { success: true, skipped: true };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // If fetch fails completely (network error, CORS, etc.), fail silently on static hosting
      if (this.isStaticHosting() || error.message.includes('405')) {
        return { success: true, skipped: true };
      }
      throw error;
    }
  }

  /**
   * Privacy-conscious data sanitization
   */
  
  sanitizeMessage(message) {
    if (!message) return message;
    
    // Remove potential PII patterns
    return message
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  }

  sanitizeStackTrace(stack) {
    if (!stack || this.config.privacyLevel === PRIVACY_LEVELS.MINIMAL) return null;
    
    // Remove file paths that might contain usernames
    return stack.replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
                .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
  }

  sanitizeContext(context) {
    if (this.config.privacyLevel === PRIVACY_LEVELS.MINIMAL) {
      return { timestamp: context.timestamp };
    }

    const sanitized = { ...context };
    
    // Remove sensitive keys
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    sensitiveKeys.forEach(key => {
      Object.keys(sanitized).forEach(contextKey => {
        if (contextKey.toLowerCase().includes(key)) {
          sanitized[contextKey] = '[REDACTED]';
        }
      });
    });

    return sanitized;
  }

  sanitizeMetrics(metrics) {
    // Only include performance metrics, no user data
    const allowedMetrics = [
      'loadTime', 'renderTime', 'interactionTime', 'memoryUsage',
      'bundleSize', 'cacheHitRate', 'errorRate', 'responseTime'
    ];

    const sanitized = {};
    allowedMetrics.forEach(metric => {
      if (metrics[metric] !== undefined) {
        sanitized[metric] = metrics[metric];
      }
    });

    return sanitized;
  }

  /**
   * Environment and user info collection
   */
  
  getEnvironmentInfo() {
    const info = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    };

    if (this.config.privacyLevel === PRIVACY_LEVELS.DETAILED) {
      info.screen = {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      };
      info.connection = navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null;
    }

    return info;
  }

  getUserInfo(userId) {
    if (this.config.privacyLevel === PRIVACY_LEVELS.MINIMAL) {
      return { id: 'anonymous' };
    }

    return {
      id: userId || 'anonymous',
      sessionId: this.sessionId,
      // Don't include any other user data for privacy
    };
  }

  /**
   * Error assessment and categorization
   */
  
  assessErrorSeverity(error, context) {
    // Critical errors that break core functionality
    if (error.name === 'ChunkLoadError' || 
        error.message?.includes('Loading chunk') ||
        context.isCriticalPath) {
      return ERROR_SEVERITY.CRITICAL;
    }

    // High severity for component errors
    if (error.name === 'TypeError' && error.message?.includes('Cannot read property')) {
      return ERROR_SEVERITY.HIGH;
    }

    // Network errors are usually medium severity
    if (error.name === 'NetworkError' || error.status >= 500) {
      return ERROR_SEVERITY.MEDIUM;
    }

    return ERROR_SEVERITY.LOW;
  }

  categorizeError(error) {
    if (error.name === 'ChunkLoadError') return 'chunk_loading';
    if (error.name === 'NetworkError') return 'network';
    if (error.name === 'TypeError') return 'type_error';
    if (error.name === 'ReferenceError') return 'reference_error';
    if (error.status) return 'http_error';
    return 'unknown';
  }

  /**
   * Utility methods
   */
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startPeriodicFlush() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    
    this.flushTimer = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushQueue();
      }
    }, this.config.flushInterval);
  }

  /**
   * Configuration and control methods
   */
  
  setPrivacyLevel(level) {
    this.config.privacyLevel = level;
  }

  enable() {
    this.config.enabled = true;
    this.startPeriodicFlush();
  }

  disable() {
    this.config.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  getQueueSize() {
    return this.reportQueue.length;
  }

  clearQueue() {
    this.reportQueue = [];
  }

  getStats() {
    return {
      queueSize: this.reportQueue.length,
      sessionId: this.sessionId,
      enabled: this.config.enabled,
      privacyLevel: this.config.privacyLevel
    };
  }
}

// Helper function to check if we're on static hosting
const isStaticHosting = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('github.io') || 
         hostname.includes('netlify.app') || 
         hostname.includes('vercel.app') ||
         hostname.includes('pages.dev');
};

// Create default instance
export const errorReporting = new ErrorReportingManager({
  // In a real app, these would come from environment variables
  endpoint: isDevelopment() ? '/dev/api/errors' : '/api/errors',
  // Disable error reporting on static hosting platforms or in development
  enabled: !isDevelopment() && !isStaticHosting(),
  privacyLevel: PRIVACY_LEVELS.STANDARD
});

// Integration with existing error handler
if (typeof window !== 'undefined') {
  // Subscribe to error handler events
  errorHandler.subscribe((event, data) => {
    if (event === 'errorLogged') {
      errorReporting.reportError(new Error(data.message), {
        errorId: data.id,
        severity: data.severity,
        type: data.type,
        context: data.context
      });
    }
  });
}

export default ErrorReportingManager;