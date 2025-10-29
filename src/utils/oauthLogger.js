/**
 * OAuth Error Logging and Monitoring Utility
 * 
 * Provides comprehensive logging and monitoring for OAuth authentication flows
 * including detailed error tracking, performance monitoring, and debug information.
 */

import { isDevelopment, getEnvironmentConfig } from './environmentConfig';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from './errorHandling.jsx';
import { analyticsCollector } from './analytics';

// OAuth-specific error types
export const OAUTH_ERROR_TYPES = {
  REDIRECT_MISMATCH: 'oauth_redirect_mismatch',
  PROVIDER_ERROR: 'oauth_provider_error',
  SESSION_ESTABLISHMENT: 'oauth_session_establishment',
  TOKEN_EXCHANGE: 'oauth_token_exchange',
  CALLBACK_PROCESSING: 'oauth_callback_processing',
  CONFIGURATION_ERROR: 'oauth_configuration_error',
  NETWORK_ERROR: 'oauth_network_error',
  TIMEOUT_ERROR: 'oauth_timeout_error',
  USER_CANCELLED: 'oauth_user_cancelled',
  POPUP_BLOCKED: 'oauth_popup_blocked',
  UNKNOWN_ERROR: 'oauth_unknown_error'
};

// OAuth flow stages for tracking
export const OAUTH_STAGES = {
  INITIATION: 'initiation',
  REDIRECT: 'redirect',
  CALLBACK: 'callback',
  TOKEN_EXCHANGE: 'token_exchange',
  SESSION_ESTABLISHMENT: 'session_establishment',
  COMPLETION: 'completion',
  ERROR_RECOVERY: 'error_recovery'
};

// OAuth providers
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  APPLE: 'apple',
  GITHUB: 'github',
  FACEBOOK: 'facebook'
};

/**
 * OAuth Logger Class
 * Handles comprehensive logging and monitoring for OAuth flows
 */
export class OAuthLogger {
  constructor() {
    this.config = getEnvironmentConfig();
    this.sessionLogs = new Map(); // Track logs per OAuth session
    this.performanceMetrics = [];
    this.errorCounts = new Map();
    this.debugMode = isDevelopment();
    
    // Initialize storage
    this.loadFromStorage();
  }

  /**
   * Start tracking an OAuth flow
   */
  startOAuthFlow(provider, options = {}) {
    const flowId = this.generateFlowId();
    const startTime = Date.now();
    
    const flowData = {
      flowId,
      provider,
      startTime,
      stage: OAUTH_STAGES.INITIATION,
      environment: this.config.environment,
      userAgent: navigator.userAgent,
      url: window.location.href,
      redirectUrl: options.redirectUrl,
      options,
      events: [],
      errors: [],
      performanceMarks: [],
      completed: false
    };

    this.sessionLogs.set(flowId, flowData);
    
    // Log initiation event
    this.logOAuthEvent(flowId, 'oauth_flow_started', {
      provider,
      environment: this.config.environment,
      redirectUrl: options.redirectUrl
    });

    // Track analytics
    analyticsCollector.trackEvent('oauth_flow_started', {
      provider,
      environment: this.config.environment
    });

    if (this.debugMode) {
      console.group(`🔐 OAuth Flow Started: ${provider}`);
      console.log('Flow ID:', flowId);
      console.log('Provider:', provider);
      console.log('Redirect URL:', options.redirectUrl);
      console.log('Options:', options);
      console.groupEnd();
    }

    return flowId;
  }

  /**
   * Log an OAuth event
   */
  logOAuthEvent(flowId, eventType, data = {}) {
    const flow = this.sessionLogs.get(flowId);
    if (!flow) {
      console.warn('OAuth Logger: Flow not found:', flowId);
      return;
    }

    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType,
      stage: flow.stage,
      data: {
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    flow.events.push(event);
    
    // Update flow stage if provided
    if (data.stage) {
      flow.stage = data.stage;
    }

    // Track in analytics
    analyticsCollector.trackEvent(`oauth_${eventType}`, {
      flowId,
      provider: flow.provider,
      stage: flow.stage,
      ...data
    });

    if (this.debugMode) {
      console.log(`🔐 OAuth Event [${flow.provider}]:`, eventType, data);
    }

    this.saveToStorage();
  }

  /**
   * Log an OAuth error with detailed context
   */
  logOAuthError(flowId, error, context = {}) {
    const flow = this.sessionLogs.get(flowId);
    if (!flow) {
      console.warn('OAuth Logger: Flow not found for error:', flowId);
      return;
    }

    // Categorize the OAuth error
    const errorType = this.categorizeOAuthError(error, context);
    const severity = this.determineErrorSeverity(error, context);

    const errorEntry = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      flowId,
      provider: flow.provider,
      stage: flow.stage,
      errorType,
      severity,
      message: error.message || 'Unknown OAuth error',
      stack: error.stack,
      code: error.code,
      status: error.status,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        redirectUrl: flow.redirectUrl,
        environment: this.config.environment,
        ...context
      },
      recoveryAttempts: 0,
      resolved: false
    };

    flow.errors.push(errorEntry);

    // Track error count
    const errorKey = `${flow.provider}_${errorType}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log to main error handler
    const enhancedError = new Error(error.message);
    enhancedError.oauthFlowId = flowId;
    enhancedError.oauthProvider = flow.provider;
    enhancedError.oauthStage = flow.stage;
    enhancedError.oauthErrorType = errorType;

    errorHandler.logError(enhancedError, {
      type: ERROR_TYPES.API,
      severity,
      oauthContext: errorEntry.context
    });

    // Track in analytics
    analyticsCollector.trackEvent('oauth_error', {
      flowId,
      provider: flow.provider,
      stage: flow.stage,
      errorType,
      severity,
      message: error.message
    });

    if (this.debugMode) {
      console.group(`🚨 OAuth Error [${flow.provider}]`);
      console.error('Error Type:', errorType);
      console.error('Severity:', severity);
      console.error('Stage:', flow.stage);
      console.error('Message:', error.message);
      console.error('Context:', context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    this.saveToStorage();
    return errorEntry;
  }

  /**
   * Log OAuth performance metrics
   */
  logOAuthPerformance(flowId, metricName, value, metadata = {}) {
    const flow = this.sessionLogs.get(flowId);
    if (!flow) {
      console.warn('OAuth Logger: Flow not found for performance metric:', flowId);
      return;
    }

    const performanceEntry = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      flowId,
      provider: flow.provider,
      stage: flow.stage,
      metricName,
      value,
      metadata: {
        environment: this.config.environment,
        ...metadata
      }
    };

    flow.performanceMarks.push(performanceEntry);
    this.performanceMetrics.push(performanceEntry);

    // Track in analytics
    analyticsCollector.trackPerformance(`oauth_${metricName}`, value, {
      flowId,
      provider: flow.provider,
      stage: flow.stage,
      ...metadata
    });

    if (this.debugMode) {
      console.log(`⚡ OAuth Performance [${flow.provider}]:`, metricName, value, metadata);
    }

    this.saveToStorage();
  }

  /**
   * Complete an OAuth flow
   */
  completeOAuthFlow(flowId, success = true, result = {}) {
    const flow = this.sessionLogs.get(flowId);
    if (!flow) {
      console.warn('OAuth Logger: Flow not found for completion:', flowId);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - flow.startTime;

    flow.completed = true;
    flow.success = success;
    flow.endTime = endTime;
    flow.duration = duration;
    flow.result = result;
    flow.stage = OAUTH_STAGES.COMPLETION;

    // Log completion event
    this.logOAuthEvent(flowId, success ? 'oauth_flow_completed' : 'oauth_flow_failed', {
      success,
      duration,
      errorCount: flow.errors.length,
      eventCount: flow.events.length,
      ...result
    });

    // Log performance metric for total flow duration
    this.logOAuthPerformance(flowId, 'total_flow_duration', duration, {
      success,
      errorCount: flow.errors.length
    });

    if (this.debugMode) {
      console.group(`🔐 OAuth Flow ${success ? 'Completed' : 'Failed'}: ${flow.provider}`);
      console.log('Flow ID:', flowId);
      console.log('Duration:', `${duration}ms`);
      console.log('Events:', flow.events.length);
      console.log('Errors:', flow.errors.length);
      console.log('Success:', success);
      if (result) console.log('Result:', result);
      console.groupEnd();
    }

    this.saveToStorage();
  }

  /**
   * Get OAuth flow logs
   */
  getOAuthFlow(flowId) {
    return this.sessionLogs.get(flowId);
  }

  /**
   * Get all OAuth flows
   */
  getAllOAuthFlows() {
    return Array.from(this.sessionLogs.values());
  }

  /**
   * Get OAuth flows by provider
   */
  getOAuthFlowsByProvider(provider) {
    return Array.from(this.sessionLogs.values()).filter(flow => flow.provider === provider);
  }

  /**
   * Get OAuth error statistics
   */
  getOAuthErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByProvider: {},
      errorsByType: {},
      errorsBySeverity: {},
      recentErrors: [],
      topErrors: []
    };

    // Process all flows
    this.sessionLogs.forEach(flow => {
      flow.errors.forEach(error => {
        stats.totalErrors++;
        
        // By provider
        stats.errorsByProvider[flow.provider] = (stats.errorsByProvider[flow.provider] || 0) + 1;
        
        // By type
        stats.errorsByType[error.errorType] = (stats.errorsByType[error.errorType] || 0) + 1;
        
        // By severity
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        
        // Recent errors (last 24 hours)
        const errorTime = new Date(error.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (errorTime > oneDayAgo) {
          stats.recentErrors.push({
            ...error,
            provider: flow.provider
          });
        }
      });
    });

    // Sort recent errors by timestamp
    stats.recentErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get top errors
    stats.topErrors = Object.entries(stats.errorsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Get OAuth performance statistics
   */
  getOAuthPerformanceStats() {
    const stats = {
      totalFlows: this.sessionLogs.size,
      completedFlows: 0,
      successfulFlows: 0,
      averageDuration: 0,
      performanceByProvider: {},
      performanceByStage: {},
      slowestFlows: [],
      fastestFlows: []
    };

    const durations = [];
    const flowsByProvider = {};

    this.sessionLogs.forEach(flow => {
      if (flow.completed) {
        stats.completedFlows++;
        
        if (flow.success) {
          stats.successfulFlows++;
        }
        
        if (flow.duration) {
          durations.push(flow.duration);
          
          // By provider
          if (!flowsByProvider[flow.provider]) {
            flowsByProvider[flow.provider] = [];
          }
          flowsByProvider[flow.provider].push(flow.duration);
          
          // Track slowest and fastest
          const flowSummary = {
            flowId: flow.flowId,
            provider: flow.provider,
            duration: flow.duration,
            success: flow.success,
            timestamp: flow.startTime
          };
          
          stats.slowestFlows.push(flowSummary);
          stats.fastestFlows.push(flowSummary);
        }
      }
    });

    // Calculate averages
    if (durations.length > 0) {
      stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    // Performance by provider
    Object.keys(flowsByProvider).forEach(provider => {
      const providerDurations = flowsByProvider[provider];
      stats.performanceByProvider[provider] = {
        count: providerDurations.length,
        average: providerDurations.reduce((sum, d) => sum + d, 0) / providerDurations.length,
        min: Math.min(...providerDurations),
        max: Math.max(...providerDurations)
      };
    });

    // Sort slowest and fastest
    stats.slowestFlows.sort((a, b) => b.duration - a.duration).splice(10);
    stats.fastestFlows.sort((a, b) => a.duration - b.duration).splice(10);

    return stats;
  }

  /**
   * Generate debug report for OAuth issues
   */
  generateDebugReport(flowId = null) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      userAgent: navigator.userAgent,
      url: window.location.href,
      flows: flowId ? [this.getOAuthFlow(flowId)] : this.getAllOAuthFlows(),
      errorStats: this.getOAuthErrorStats(),
      performanceStats: this.getOAuthPerformanceStats(),
      configuration: {
        oauth: this.config.oauth,
        features: this.config.features,
        settings: this.config.settings
      }
    };

    if (this.debugMode) {
      console.group('🔍 OAuth Debug Report');
      console.log('Report generated at:', report.timestamp);
      console.log('Total flows:', report.flows.length);
      console.log('Total errors:', report.errorStats.totalErrors);
      console.log('Environment:', report.environment);
      console.groupEnd();
    }

    return report;
  }

  /**
   * Export OAuth logs for analysis
   */
  exportOAuthLogs() {
    const report = this.generateDebugReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oauth-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear OAuth logs
   */
  clearOAuthLogs() {
    this.sessionLogs.clear();
    this.performanceMetrics = [];
    this.errorCounts.clear();
    localStorage.removeItem('oauth-logs');
    
    if (this.debugMode) {
      console.log('🧹 OAuth logs cleared');
    }
  }

  /**
   * Categorize OAuth error type
   */
  categorizeOAuthError(error, context = {}) {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    if (message.includes('redirect') || message.includes('callback') || code.includes('redirect')) {
      return OAUTH_ERROR_TYPES.REDIRECT_MISMATCH;
    }
    
    if (message.includes('access_denied') || code === 'access_denied') {
      return OAUTH_ERROR_TYPES.USER_CANCELLED;
    }
    
    if (message.includes('popup') || message.includes('blocked')) {
      return OAUTH_ERROR_TYPES.POPUP_BLOCKED;
    }
    
    if (message.includes('network') || message.includes('fetch') || code.includes('network')) {
      return OAUTH_ERROR_TYPES.NETWORK_ERROR;
    }
    
    if (message.includes('timeout') || code.includes('timeout')) {
      return OAUTH_ERROR_TYPES.TIMEOUT_ERROR;
    }
    
    if (message.includes('session') || message.includes('token') || code.includes('session')) {
      return OAUTH_ERROR_TYPES.SESSION_ESTABLISHMENT;
    }
    
    if (message.includes('configuration') || message.includes('invalid_request')) {
      return OAUTH_ERROR_TYPES.CONFIGURATION_ERROR;
    }
    
    if (context.stage === OAUTH_STAGES.CALLBACK) {
      return OAUTH_ERROR_TYPES.CALLBACK_PROCESSING;
    }
    
    if (context.stage === OAUTH_STAGES.TOKEN_EXCHANGE) {
      return OAUTH_ERROR_TYPES.TOKEN_EXCHANGE;
    }
    
    return OAUTH_ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity
   */
  determineErrorSeverity(error, context = {}) {
    const errorType = this.categorizeOAuthError(error, context);
    
    switch (errorType) {
      case OAUTH_ERROR_TYPES.USER_CANCELLED:
        return ERROR_SEVERITY.LOW;
      
      case OAUTH_ERROR_TYPES.NETWORK_ERROR:
      case OAUTH_ERROR_TYPES.TIMEOUT_ERROR:
      case OAUTH_ERROR_TYPES.POPUP_BLOCKED:
        return ERROR_SEVERITY.MEDIUM;
      
      case OAUTH_ERROR_TYPES.CONFIGURATION_ERROR:
      case OAUTH_ERROR_TYPES.REDIRECT_MISMATCH:
        return ERROR_SEVERITY.HIGH;
      
      case OAUTH_ERROR_TYPES.SESSION_ESTABLISHMENT:
      case OAUTH_ERROR_TYPES.TOKEN_EXCHANGE:
      case OAUTH_ERROR_TYPES.CALLBACK_PROCESSING:
        return ERROR_SEVERITY.HIGH;
      
      default:
        return ERROR_SEVERITY.MEDIUM;
    }
  }

  /**
   * Generate unique flow ID
   */
  generateFlowId() {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Save logs to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        sessionLogs: Array.from(this.sessionLogs.entries()),
        performanceMetrics: this.performanceMetrics.slice(-100), // Keep last 100
        errorCounts: Array.from(this.errorCounts.entries()),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('oauth-logs', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save OAuth logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('oauth-logs');
      if (data) {
        const parsed = JSON.parse(data);
        this.sessionLogs = new Map(parsed.sessionLogs || []);
        this.performanceMetrics = parsed.performanceMetrics || [];
        this.errorCounts = new Map(parsed.errorCounts || []);
      }
    } catch (error) {
      console.warn('Failed to load OAuth logs from storage:', error);
    }
  }
}

// Create singleton instance
export const oauthLogger = new OAuthLogger();

// Helper functions for easy integration
export const startOAuthFlow = (provider, options = {}) => {
  return oauthLogger.startOAuthFlow(provider, options);
};

export const logOAuthEvent = (flowId, eventType, data = {}) => {
  return oauthLogger.logOAuthEvent(flowId, eventType, data);
};

export const logOAuthError = (flowId, error, context = {}) => {
  return oauthLogger.logOAuthError(flowId, error, context);
};

export const logOAuthPerformance = (flowId, metricName, value, metadata = {}) => {
  return oauthLogger.logOAuthPerformance(flowId, metricName, value, metadata);
};

export const completeOAuthFlow = (flowId, success = true, result = {}) => {
  return oauthLogger.completeOAuthFlow(flowId, success, result);
};

export default oauthLogger;