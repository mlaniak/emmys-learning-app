/**
 * Network Retry Utility
 * 
 * Provides comprehensive retry mechanisms for network requests with
 * exponential backoff, circuit breaker pattern, and intelligent error handling.
 */

import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from './errorHandling.jsx';

// Network Error Types
export const NETWORK_ERROR_TYPES = {
  TIMEOUT: 'timeout',
  CONNECTION_ERROR: 'connection_error',
  SERVER_ERROR: 'server_error',
  CLIENT_ERROR: 'client_error',
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown'
};

// Retry Strategies
export const RETRY_STRATEGIES = {
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff',
  FIXED_DELAY: 'fixed_delay',
  IMMEDIATE: 'immediate'
};

// Circuit Breaker States
export const CIRCUIT_STATES = {
  CLOSED: 'closed',     // Normal operation
  OPEN: 'open',         // Failing fast
  HALF_OPEN: 'half_open' // Testing if service recovered
};

/**
 * Network Retry Manager with Circuit Breaker Pattern
 */
export class NetworkRetryManager {
  constructor(options = {}) {
    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      strategy: options.strategy || RETRY_STRATEGIES.EXPONENTIAL_BACKOFF,
      timeout: options.timeout || 10000,
      retryableStatusCodes: options.retryableStatusCodes || [408, 429, 500, 502, 503, 504],
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: options.circuitBreakerTimeout || 60000,
      ...options
    };

    // Circuit breaker state per endpoint
    this.circuitBreakers = new Map();
    
    // Request statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      circuitBreakerTrips: 0
    };
  }

  /**
   * Execute request with retry logic and circuit breaker
   */
  async executeWithRetry(requestFn, options = {}) {
    const endpoint = options.endpoint || 'default';
    const maxRetries = options.maxRetries || this.config.maxRetries;
    const requestId = this.generateRequestId();

    this.stats.totalRequests++;

    // Check circuit breaker
    if (this.isCircuitOpen(endpoint)) {
      const error = new Error(`Circuit breaker is open for endpoint: ${endpoint}`);
      error.code = 'CIRCUIT_BREAKER_OPEN';
      throw error;
    }

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Log attempt
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for request ${requestId}`);
          this.stats.retriedRequests++;
        }

        // Execute request with timeout
        const result = await this.executeWithTimeout(requestFn, options);
        
        // Success - reset circuit breaker and return result
        this.recordSuccess(endpoint);
        this.stats.successfulRequests++;
        
        return result;

      } catch (error) {
        lastError = error;
        attempt++;

        // Categorize error
        const errorType = this.categorizeNetworkError(error);
        
        // Log error
        errorHandler.logError(error, {
          requestId,
          attempt,
          maxRetries,
          endpoint,
          errorType,
          isRetryable: this.isRetryableError(error)
        });

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt > maxRetries) {
          this.recordFailure(endpoint);
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, options);
        
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}`);
        await this.delay(delay);
      }
    }

    // All retries exhausted
    this.stats.failedRequests++;
    this.recordFailure(endpoint);
    
    // Enhance error with retry information
    lastError.retryCount = attempt - 1;
    lastError.requestId = requestId;
    lastError.endpoint = endpoint;
    
    throw lastError;
  }

  /**
   * Execute request with timeout
   */
  async executeWithTimeout(requestFn, options = {}) {
    const timeout = options.timeout || this.config.timeout;
    
    return Promise.race([
      requestFn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Request timeout after ${timeout}ms`);
          error.code = 'TIMEOUT';
          reject(error);
        }, timeout);
      })
    ]);
  }

  /**
   * Categorize network error type
   */
  categorizeNetworkError(error) {
    if (error.code === 'TIMEOUT' || error.name === 'TimeoutError') {
      return NETWORK_ERROR_TYPES.TIMEOUT;
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
      return NETWORK_ERROR_TYPES.CONNECTION_ERROR;
    }
    
    if (error.status) {
      if (error.status >= 500) {
        return NETWORK_ERROR_TYPES.SERVER_ERROR;
      } else if (error.status === 429) {
        return NETWORK_ERROR_TYPES.RATE_LIMIT;
      } else if (error.status >= 400) {
        return NETWORK_ERROR_TYPES.CLIENT_ERROR;
      }
    }
    
    return NETWORK_ERROR_TYPES.UNKNOWN;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Don't retry client errors (4xx) except rate limiting
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return false;
    }
    
    // Don't retry authentication errors
    if (error.status === 401 || error.status === 403) {
      return false;
    }
    
    // Retry network errors, timeouts, and server errors
    const retryableTypes = [
      NETWORK_ERROR_TYPES.TIMEOUT,
      NETWORK_ERROR_TYPES.CONNECTION_ERROR,
      NETWORK_ERROR_TYPES.SERVER_ERROR,
      NETWORK_ERROR_TYPES.RATE_LIMIT
    ];
    
    const errorType = this.categorizeNetworkError(error);
    return retryableTypes.includes(errorType) || 
           this.config.retryableStatusCodes.includes(error.status);
  }

  /**
   * Calculate delay for next retry attempt
   */
  calculateDelay(attempt, options = {}) {
    const strategy = options.strategy || this.config.strategy;
    const baseDelay = options.baseDelay || this.config.baseDelay;
    const maxDelay = options.maxDelay || this.config.maxDelay;
    
    let delay;
    
    switch (strategy) {
      case RETRY_STRATEGIES.EXPONENTIAL_BACKOFF:
        delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        break;
        
      case RETRY_STRATEGIES.LINEAR_BACKOFF:
        delay = Math.min(baseDelay * attempt, maxDelay);
        break;
        
      case RETRY_STRATEGIES.FIXED_DELAY:
        delay = baseDelay;
        break;
        
      case RETRY_STRATEGIES.IMMEDIATE:
        delay = 0;
        break;
        
      default:
        delay = baseDelay;
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Circuit Breaker Implementation
   */
  
  isCircuitOpen(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (!breaker) return false;
    
    if (breaker.state === CIRCUIT_STATES.OPEN) {
      // Check if timeout has passed
      if (Date.now() - breaker.lastFailureTime > this.config.circuitBreakerTimeout) {
        breaker.state = CIRCUIT_STATES.HALF_OPEN;
        return false;
      }
      return true;
    }
    
    return false;
  }

  recordSuccess(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (breaker) {
      breaker.failureCount = 0;
      breaker.state = CIRCUIT_STATES.CLOSED;
    }
  }

  recordFailure(endpoint) {
    let breaker = this.circuitBreakers.get(endpoint);
    if (!breaker) {
      breaker = {
        failureCount: 0,
        state: CIRCUIT_STATES.CLOSED,
        lastFailureTime: null
      };
      this.circuitBreakers.set(endpoint, breaker);
    }
    
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
      breaker.state = CIRCUIT_STATES.OPEN;
      this.stats.circuitBreakerTrips++;
      
      console.warn(`🚨 Circuit breaker opened for endpoint: ${endpoint}`);
      
      // Log circuit breaker trip
      errorHandler.logError(new Error(`Circuit breaker tripped for ${endpoint}`), {
        endpoint,
        failureCount: breaker.failureCount,
        threshold: this.config.circuitBreakerThreshold
      });
    }
  }

  /**
   * Utility methods
   */
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get retry statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([endpoint, breaker]) => ({
        endpoint,
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime
      }))
    };
  }

  /**
   * Reset circuit breaker for endpoint
   */
  resetCircuitBreaker(endpoint) {
    this.circuitBreakers.delete(endpoint);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    this.circuitBreakers.clear();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      circuitBreakerTrips: 0
    };
  }
}

// Create default instance
export const networkRetry = new NetworkRetryManager();

// Convenience function for fetch with retry
export const fetchWithRetry = async (url, options = {}) => {
  const { retryOptions, ...fetchOptions } = options;
  
  return networkRetry.executeWithRetry(
    () => fetch(url, fetchOptions).then(response => {
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      return response;
    }),
    {
      endpoint: new URL(url, window.location.origin).pathname,
      ...retryOptions
    }
  );
};

// Convenience function for JSON requests with retry
export const fetchJsonWithRetry = async (url, options = {}) => {
  const response = await fetchWithRetry(url, options);
  return response.json();
};

export default NetworkRetryManager;