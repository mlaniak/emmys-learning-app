/**
 * Basic tests for OAuth Error Recovery functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { oauthErrorRecovery, OAUTH_ERROR_TYPES, RECOVERY_STRATEGIES } from '../oauthErrorRecovery.js';

// Mock environment config
vi.mock('../environmentConfig', () => ({
  isDevelopment: () => true,
  getEnvironmentConfig: () => ({
    settings: {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      exponentialBackoff: true,
      fallbackTimeout: 30000
    }
  })
}));

// Mock error handler
vi.mock('../errorHandling', () => ({
  errorHandler: {
    logError: vi.fn().mockReturnValue({ id: 'test-error-id' })
  },
  ERROR_TYPES: {},
  ERROR_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}));

describe('OAuth Error Recovery', () => {
  beforeEach(() => {
    oauthErrorRecovery.resetAllRetryCounts();
  });

  test('categorizes network errors correctly', () => {
    const networkError = new Error('Network error occurred');
    networkError.code = 'NETWORK_ERROR';
    
    const analysis = oauthErrorRecovery.categorizeOAuthError(networkError);
    
    expect(analysis.errorType).toBe(OAUTH_ERROR_TYPES.NETWORK_ERROR);
    expect(analysis.recoveryStrategy).toBe(RECOVERY_STRATEGIES.RETRY);
    expect(analysis.canRetry).toBe(true);
  });

  test('categorizes configuration errors correctly', () => {
    const configError = new Error('Invalid redirect URL configuration');
    configError.code = 'INVALID_REQUEST';
    
    const analysis = oauthErrorRecovery.categorizeOAuthError(configError);
    
    expect(analysis.errorType).toBe(OAUTH_ERROR_TYPES.CONFIGURATION_ERROR);
    expect(analysis.recoveryStrategy).toBe(RECOVERY_STRATEGIES.CONTACT_SUPPORT);
    expect(analysis.canRetry).toBe(false);
  });

  test('categorizes user cancellation correctly', () => {
    const cancelError = new Error('User denied access');
    cancelError.code = 'ACCESS_DENIED';
    
    const analysis = oauthErrorRecovery.categorizeOAuthError(cancelError);
    
    expect(analysis.errorType).toBe(OAUTH_ERROR_TYPES.USER_CANCELLED);
    expect(analysis.recoveryStrategy).toBe(RECOVERY_STRATEGIES.FALLBACK_AUTH);
  });

  test('tracks retry counts correctly', () => {
    const errorType = OAUTH_ERROR_TYPES.NETWORK_ERROR;
    
    expect(oauthErrorRecovery.getRetryCount(errorType)).toBe(0);
    
    oauthErrorRecovery.incrementRetryCount(errorType);
    expect(oauthErrorRecovery.getRetryCount(errorType)).toBe(1);
    
    oauthErrorRecovery.incrementRetryCount(errorType);
    expect(oauthErrorRecovery.getRetryCount(errorType)).toBe(2);
    
    oauthErrorRecovery.resetRetryCount(errorType);
    expect(oauthErrorRecovery.getRetryCount(errorType)).toBe(0);
  });

  test('respects maximum retry attempts', () => {
    const errorType = OAUTH_ERROR_TYPES.NETWORK_ERROR;
    
    // Set retry count to maximum
    for (let i = 0; i < 3; i++) {
      oauthErrorRecovery.incrementRetryCount(errorType);
    }
    
    expect(oauthErrorRecovery.canRetry(errorType)).toBe(false);
  });

  test('has cleanupOAuthUrl method', () => {
    // Just test that the method exists and can be called without error
    expect(typeof oauthErrorRecovery.cleanupOAuthUrl).toBe('function');
    
    // Test that it doesn't throw when called
    expect(() => {
      oauthErrorRecovery.cleanupOAuthUrl();
    }).not.toThrow();
  });
});

// Export for potential use in other tests
export default oauthErrorRecovery;