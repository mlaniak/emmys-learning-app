/**
 * OAuth Error Recovery Utility
 * 
 * Provides centralized error recovery mechanisms for OAuth authentication failures
 * including retry logic, fallback mechanisms, and user-friendly error handling.
 */

import { getEnvironmentConfig, isDevelopment } from './environmentConfig';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from './errorHandling';
import { logOAuthEvent, logOAuthError, OAUTH_STAGES } from './oauthLogger';

// OAuth Error Types
export const OAUTH_ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  CONFIGURATION_ERROR: 'configuration_error',
  SESSION_ERROR: 'session_error',
  TIMEOUT_ERROR: 'timeout_error',
  USER_CANCELLED: 'user_cancelled',
  PROVIDER_ERROR: 'provider_error',
  UNKNOWN_ERROR: 'unknown_error'
};

// OAuth Error Recovery Strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK_AUTH: 'fallback_auth',
  GUEST_MODE: 'guest_mode',
  MANUAL_REFRESH: 'manual_refresh',
  CONTACT_SUPPORT: 'contact_support'
};

/**
 * OAuth Error Recovery Manager
 */
export class OAuthErrorRecovery {
  constructor() {
    this.config = getEnvironmentConfig();
    this.retryAttempts = new Map(); // Track retry attempts per error type
    this.recoveryCallbacks = new Map(); // Store recovery callbacks
  }

  /**
   * Categorize OAuth error and determine recovery strategy
   */
  categorizeOAuthError(error, context = {}) {
    let errorType = OAUTH_ERROR_TYPES.UNKNOWN_ERROR;
    let severity = ERROR_SEVERITY.MEDIUM;
    let recoveryStrategy = RECOVERY_STRATEGIES.RETRY;
    let userMessage = 'An error occurred during sign-in. Please try again.';

    // Analyze error to determine type and strategy
    if (error.message?.includes('network') || error.message?.includes('fetch') || error.code === 'NETWORK_ERROR') {
      errorType = OAUTH_ERROR_TYPES.NETWORK_ERROR;
      severity = ERROR_SEVERITY.MEDIUM;
      recoveryStrategy = RECOVERY_STRATEGIES.RETRY;
      userMessage = 'Network error during sign-in. Please check your connection and try again.';
    } else if (error.message?.includes('redirect') || error.message?.includes('configuration') || error.code === 'INVALID_REQUEST') {
      errorType = OAUTH_ERROR_TYPES.CONFIGURATION_ERROR;
      severity = ERROR_SEVERITY.HIGH;
      recoveryStrategy = RECOVERY_STRATEGIES.CONTACT_SUPPORT;
      userMessage = 'Authentication configuration error. Please contact support if this continues.';
    } else if (error.message?.includes('session') || error.message?.includes('token') || error.code === 'SESSION_ERROR') {
      errorType = OAUTH_ERROR_TYPES.SESSION_ERROR;
      severity = ERROR_SEVERITY.MEDIUM;
      recoveryStrategy = RECOVERY_STRATEGIES.MANUAL_REFRESH;
      userMessage = 'Session error during sign-in. Please try signing in again.';
    } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT_ERROR') {
      errorType = OAUTH_ERROR_TYPES.TIMEOUT_ERROR;
      severity = ERROR_SEVERITY.MEDIUM;
      recoveryStrategy = RECOVERY_STRATEGIES.RETRY;
      userMessage = 'Sign-in timed out. Please try again.';
    } else if (error.message?.includes('access_denied') || error.code === 'ACCESS_DENIED') {
      errorType = OAUTH_ERROR_TYPES.USER_CANCELLED;
      severity = ERROR_SEVERITY.LOW;
      recoveryStrategy = RECOVERY_STRATEGIES.FALLBACK_AUTH;
      userMessage = 'Sign-in was cancelled. You can try again or use a different method.';
    } else if (error.message?.includes('popup') || error.message?.includes('blocked')) {
      errorType = OAUTH_ERROR_TYPES.PROVIDER_ERROR;
      severity = ERROR_SEVERITY.MEDIUM;
      recoveryStrategy = RECOVERY_STRATEGIES.MANUAL_REFRESH;
      userMessage = 'Popup blocked or provider error. Please allow popups and try again.';
    }

    // Log the error with context
    const errorEntry = errorHandler.logError(error, {
      ...context,
      oauthErrorType: errorType,
      recoveryStrategy,
      userMessage
    });

    // Log to OAuth logger if flowId is provided
    if (context.flowId) {
      logOAuthError(context.flowId, error, {
        stage: OAUTH_STAGES.ERROR_RECOVERY,
        errorType,
        recoveryStrategy,
        userMessage,
        ...context
      });
    }

    return {
      errorType,
      severity,
      recoveryStrategy,
      userMessage,
      errorId: errorEntry.id,
      canRetry: this.canRetry(errorType),
      retryCount: this.getRetryCount(errorType)
    };
  }

  /**
   * Execute recovery strategy for OAuth error
   */
  async executeRecovery(errorAnalysis, recoveryOptions = {}) {
    const { errorType, recoveryStrategy, errorId } = errorAnalysis;
    
    if (isDevelopment()) {
      console.log('🔄 Executing OAuth recovery strategy:', recoveryStrategy, 'for error:', errorType);
    }

    // Log recovery attempt
    if (errorAnalysis.flowId) {
      logOAuthEvent(errorAnalysis.flowId, 'recovery_strategy_started', {
        stage: OAUTH_STAGES.ERROR_RECOVERY,
        recoveryStrategy,
        errorType
      });
    }

    try {
      switch (recoveryStrategy) {
        case RECOVERY_STRATEGIES.RETRY:
          return await this.executeRetryStrategy(errorType, recoveryOptions);
          
        case RECOVERY_STRATEGIES.FALLBACK_AUTH:
          return await this.executeFallbackAuthStrategy(recoveryOptions);
          
        case RECOVERY_STRATEGIES.GUEST_MODE:
          return await this.executeGuestModeStrategy(recoveryOptions);
          
        case RECOVERY_STRATEGIES.MANUAL_REFRESH:
          return await this.executeManualRefreshStrategy(recoveryOptions);
          
        case RECOVERY_STRATEGIES.CONTACT_SUPPORT:
          return await this.executeContactSupportStrategy(errorAnalysis, recoveryOptions);
          
        default:
          throw new Error(`Unknown recovery strategy: ${recoveryStrategy}`);
      }
    } catch (recoveryError) {
      if (isDevelopment()) {
        console.error('🚨 Recovery strategy failed:', recoveryError);
      }
      
      // Mark original error as unrecoverable
      errorHandler.logError(recoveryError, {
        originalErrorId: errorId,
        recoveryStrategy,
        type: 'recovery_failure'
      });
      
      throw recoveryError;
    }
  }

  /**
   * Execute retry strategy with exponential backoff
   */
  async executeRetryStrategy(errorType, options = {}) {
    const retryCount = this.getRetryCount(errorType);
    const maxRetries = options.maxRetries || this.config.settings.maxRetryAttempts;
    
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded for ${errorType}`);
    }

    // Calculate delay with exponential backoff
    const baseDelay = options.baseDelay || this.config.settings.retryDelayMs;
    const delay = this.config.settings.exponentialBackoff 
      ? baseDelay * Math.pow(2, retryCount)
      : baseDelay;

    if (isDevelopment()) {
      console.log(`⏳ Retrying OAuth operation (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms delay`);
    }

    // Increment retry count
    this.incrementRetryCount(errorType);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Execute the retry callback if provided
    if (options.retryCallback && typeof options.retryCallback === 'function') {
      return await options.retryCallback();
    }

    return { action: 'retry', delay, attempt: retryCount + 1 };
  }

  /**
   * Execute fallback authentication strategy
   */
  async executeFallbackAuthStrategy(options = {}) {
    if (isDevelopment()) {
      console.log('🔄 Executing fallback authentication strategy');
    }

    const fallbackOptions = [
      {
        method: 'email',
        label: 'Sign in with Email',
        description: 'Use your email and password instead',
        available: true
      },
      {
        method: 'guest',
        label: 'Continue as Guest',
        description: 'Try the app without creating an account',
        available: true
      },
      {
        method: 'apple',
        label: 'Sign in with Apple',
        description: 'Use Apple ID as an alternative',
        available: options.appleAvailable !== false
      }
    ];

    return {
      action: 'fallback_auth',
      options: fallbackOptions.filter(opt => opt.available),
      message: 'Try a different sign-in method:'
    };
  }

  /**
   * Execute guest mode strategy
   */
  async executeGuestModeStrategy(options = {}) {
    if (isDevelopment()) {
      console.log('👤 Executing guest mode strategy');
    }

    return {
      action: 'guest_mode',
      message: 'Continue without an account',
      description: 'Your progress will be saved locally and can be transferred to an account later.',
      callback: options.guestCallback
    };
  }

  /**
   * Execute manual refresh strategy
   */
  async executeManualRefreshStrategy(options = {}) {
    if (isDevelopment()) {
      console.log('🔄 Executing manual refresh strategy');
    }

    return {
      action: 'manual_refresh',
      message: 'Please try refreshing the page',
      description: 'This will reset the authentication process.',
      options: [
        {
          label: 'Refresh Page',
          action: () => window.location.reload(),
          primary: true
        },
        {
          label: 'Try Again',
          action: options.retryCallback,
          primary: false
        }
      ]
    };
  }

  /**
   * Execute contact support strategy
   */
  async executeContactSupportStrategy(errorAnalysis, options = {}) {
    if (isDevelopment()) {
      console.log('📞 Executing contact support strategy');
    }

    return {
      action: 'contact_support',
      message: 'We need to help you with this issue',
      description: 'This appears to be a configuration problem that requires assistance.',
      errorId: errorAnalysis.errorId,
      supportOptions: [
        {
          label: 'Copy Error Details',
          action: () => {
            const errorDetails = `Error ID: ${errorAnalysis.errorId}\nType: ${errorAnalysis.errorType}\nMessage: ${errorAnalysis.userMessage}\nTimestamp: ${new Date().toISOString()}`;
            navigator.clipboard.writeText(errorDetails);
          }
        },
        {
          label: 'Try Guest Mode',
          action: options.guestCallback,
          fallback: true
        }
      ]
    };
  }

  /**
   * Check if error type can be retried
   */
  canRetry(errorType) {
    const retryableErrors = [
      OAUTH_ERROR_TYPES.NETWORK_ERROR,
      OAUTH_ERROR_TYPES.TIMEOUT_ERROR,
      OAUTH_ERROR_TYPES.SESSION_ERROR
    ];
    
    return retryableErrors.includes(errorType) && 
           this.getRetryCount(errorType) < this.config.settings.maxRetryAttempts;
  }

  /**
   * Get retry count for error type
   */
  getRetryCount(errorType) {
    return this.retryAttempts.get(errorType) || 0;
  }

  /**
   * Increment retry count for error type
   */
  incrementRetryCount(errorType) {
    const current = this.getRetryCount(errorType);
    this.retryAttempts.set(errorType, current + 1);
  }

  /**
   * Reset retry count for error type
   */
  resetRetryCount(errorType) {
    this.retryAttempts.delete(errorType);
  }

  /**
   * Reset all retry counts
   */
  resetAllRetryCounts() {
    this.retryAttempts.clear();
  }

  /**
   * Register recovery callback for specific error type
   */
  registerRecoveryCallback(errorType, callback) {
    this.recoveryCallbacks.set(errorType, callback);
  }

  /**
   * Clean up URL parameters after OAuth processing
   */
  cleanupOAuthUrl() {
    try {
      const url = new URL(window.location.href);
      const paramsToRemove = [
        'access_token',
        'expires_in',
        'refresh_token',
        'token_type',
        'error',
        'error_description',
        'error_code',
        'state',
        'code'
      ];

      let hasChanges = false;

      // Remove OAuth parameters from search params
      paramsToRemove.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          hasChanges = true;
        }
      });

      // Remove OAuth parameters from hash
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        paramsToRemove.forEach(param => {
          if (hashParams.has(param)) {
            hashParams.delete(param);
            hasChanges = true;
          }
        });

        // Reconstruct hash
        const newHash = hashParams.toString();
        url.hash = newHash ? `#${newHash}` : '';
      }

      // Update URL if changes were made
      if (hasChanges) {
        const cleanUrl = url.toString();
        window.history.replaceState(null, '', cleanUrl);
        
        if (isDevelopment()) {
          console.log('🧹 OAuth URL cleaned:', cleanUrl);
        }
      }
    } catch (error) {
      if (isDevelopment()) {
        console.warn('⚠️ Failed to clean OAuth URL:', error);
      }
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    const stats = {
      totalRetries: 0,
      retriesByType: {},
      activeRecoveries: this.retryAttempts.size
    };

    this.retryAttempts.forEach((count, errorType) => {
      stats.totalRetries += count;
      stats.retriesByType[errorType] = count;
    });

    return stats;
  }
}

// Create singleton instance
export const oauthErrorRecovery = new OAuthErrorRecovery();

// Helper function to handle OAuth errors with recovery
export const handleOAuthError = async (error, context = {}, recoveryOptions = {}) => {
  const errorAnalysis = oauthErrorRecovery.categorizeOAuthError(error, context);
  
  if (isDevelopment()) {
    console.log('🔍 OAuth Error Analysis:', errorAnalysis);
  }

  // If error can be retried automatically, do so
  if (errorAnalysis.canRetry && recoveryOptions.autoRetry !== false) {
    try {
      return await oauthErrorRecovery.executeRecovery(errorAnalysis, recoveryOptions);
    } catch (recoveryError) {
      // If recovery fails, return the analysis for manual handling
      return {
        ...errorAnalysis,
        recoveryFailed: true,
        recoveryError: recoveryError.message
      };
    }
  }

  return errorAnalysis;
};

// Export default
export default oauthErrorRecovery;