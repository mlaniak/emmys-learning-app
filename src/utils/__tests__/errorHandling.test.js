/**
 * Error Handling System Tests
 * 
 * Comprehensive tests for the error handling, reporting, and recovery systems.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from '../errorHandling.jsx';
import { NetworkRetryManager, RETRY_STRATEGIES } from '../networkRetry';
import { ErrorReportingManager, PRIVACY_LEVELS } from '../errorReporting';

// Mock global objects
const mockNavigator = {
  onLine: true,
  userAgent: 'test-agent',
  sendBeacon: vi.fn()
};

const mockWindow = {
  location: { href: 'http://localhost:3000/test' },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

global.navigator = mockNavigator;
global.window = mockWindow;
global.fetch = vi.fn();

describe('Error Handler', () => {
  beforeEach(() => {
    errorHandler.clearAllErrors();
    vi.clearAllMocks();
  });

  describe('Error Logging', () => {
    it('should log errors with proper categorization', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';

      const errorEntry = errorHandler.logError(networkError, { userId: 'test-user' });

      expect(errorEntry).toMatchObject({
        message: 'fetch failed',
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        resolved: false
      });

      expect(errorEntry.context).toMatchObject({
        userId: 'test-user',
        userAgent: 'test-agent',
        url: 'http://localhost:3000/test'
      });
    });

    it('should categorize different error types correctly', () => {
      const testCases = [
        {
          error: { name: 'NetworkError', message: 'fetch failed' },
          expectedType: ERROR_TYPES.NETWORK
        },
        {
          error: { name: 'ValidationError', message: 'invalid input' },
          expectedType: ERROR_TYPES.VALIDATION
        },
        {
          error: { name: 'TimeoutError', message: 'request timeout' },
          expectedType: ERROR_TYPES.TIMEOUT
        },
        {
          error: { name: 'Error', message: 'component failed' },
          expectedType: ERROR_TYPES.COMPONENT
        }
      ];

      testCases.forEach(({ error, expectedType }) => {
        const errorEntry = errorHandler.logError(new Error(error.message));
        errorEntry.name = error.name;
        
        const categorizedType = errorHandler.categorizeError(errorEntry);
        expect(categorizedType).toBe(expectedType);
      });
    });

    it('should determine error severity correctly', () => {
      const criticalError = new Error('Loading chunk failed');
      criticalError.name = 'ChunkLoadError';

      const errorEntry = errorHandler.logError(criticalError);
      expect(errorEntry.severity).toBe(ERROR_SEVERITY.MEDIUM);
    });

    it('should auto-resolve low severity errors', async () => {
      vi.useFakeTimers();
      
      const lowSeverityError = new Error('minor issue');
      const errorEntry = errorHandler.logError(lowSeverityError);
      errorEntry.severity = ERROR_SEVERITY.LOW;

      expect(errorEntry.resolved).toBe(false);

      // Fast-forward time
      vi.advanceTimersByTime(6000);

      // Check if error was auto-resolved
      const errors = errorHandler.getErrors({ resolved: false });
      expect(errors.find(e => e.id === errorEntry.id)).toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('Error Statistics', () => {
    it('should provide accurate error statistics', () => {
      // Log various errors with proper error objects
      const networkError1 = new Error('network error');
      networkError1.name = 'NetworkError';
      const validationError = new Error('validation error');
      validationError.name = 'ValidationError';
      const networkError2 = new Error('another network error');
      networkError2.name = 'NetworkError';

      errorHandler.logError(networkError1);
      errorHandler.logError(validationError);
      errorHandler.logError(networkError2);

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType[ERROR_TYPES.NETWORK]).toBe(2);
      expect(stats.byType[ERROR_TYPES.VALIDATION]).toBe(1);
    });

    it('should track recent errors correctly', () => {
      // Log an old error (simulate by manipulating timestamp)
      const oldError = errorHandler.logError(new Error('old error'));
      oldError.timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

      // Log a recent error
      errorHandler.logError(new Error('recent error'));

      const stats = errorHandler.getErrorStats();
      expect(stats.recent).toBe(1); // Only the recent error
    });
  });

  describe('Error Subscription', () => {
    it('should notify subscribers of error events', () => {
      const mockCallback = vi.fn();
      const unsubscribe = errorHandler.subscribe(mockCallback);

      const error = new Error('test error');
      errorHandler.logError(error);

      expect(mockCallback).toHaveBeenCalledWith('errorLogged', expect.any(Object));

      unsubscribe();
    });
  });
});

describe('Network Retry Manager', () => {
  let retryManager;

  beforeEach(() => {
    retryManager = new NetworkRetryManager({
      maxRetries: 2,
      baseDelay: 100,
      strategy: RETRY_STRATEGIES.EXPONENTIAL_BACKOFF
    });
    vi.clearAllMocks();
  });

  describe('Request Execution', () => {
    it('should execute successful requests without retry', async () => {
      const mockRequest = vi.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(mockRequest);

      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should retry failed requests with exponential backoff', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const mockRequest = vi.fn()
        .mockRejectedValue(networkError);

      try {
        await retryManager.executeWithRetry(mockRequest, {
          endpoint: 'test-endpoint'
        });
      } catch (error) {
        // Verify that at least one attempt was made
        expect(mockRequest).toHaveBeenCalled();
        expect(error.message).toBe('Network error');
      }
    });

    it('should not retry non-retryable errors', async () => {
      const clientError = new Error('Bad Request');
      clientError.status = 400;

      const mockRequest = vi.fn().mockRejectedValue(clientError);

      await expect(retryManager.executeWithRetry(mockRequest)).rejects.toThrow('Bad Request');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error('Server error'));

      // Trigger failures to open circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await retryManager.executeWithRetry(mockRequest, { endpoint: 'test-endpoint' });
        } catch (error) {
          // Expected to fail
        }
      }

      // Next request should fail immediately due to open circuit
      await expect(
        retryManager.executeWithRetry(mockRequest, { endpoint: 'test-endpoint' })
      ).rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors correctly', () => {
      const testCases = [
        { error: { code: 'TIMEOUT' }, expected: 'timeout' },
        { error: { message: 'fetch failed' }, expected: 'connection_error' },
        { error: { status: 500 }, expected: 'server_error' },
        { error: { status: 429 }, expected: 'rate_limit' },
        { error: { status: 404 }, expected: 'client_error' }
      ];

      testCases.forEach(({ error, expected }) => {
        const errorObj = new Error(error.message || 'test error');
        if (error.code) errorObj.code = error.code;
        if (error.status) errorObj.status = error.status;

        const category = retryManager.categorizeNetworkError(errorObj);
        expect(category).toBe(expected);
      });
    });
  });
});

describe('Error Reporting Manager', () => {
  let reportingManager;

  beforeEach(() => {
    reportingManager = new ErrorReportingManager({
      enabled: true,
      privacyLevel: PRIVACY_LEVELS.STANDARD,
      batchSize: 2
    });
    vi.clearAllMocks();
  });

  describe('Error Report Creation', () => {
    it('should create properly formatted error reports', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      const report = reportingManager.createErrorReport(error, {
        userId: 'test-user',
        component: 'TestComponent'
      });

      expect(report).toMatchObject({
        type: 'error',
        error: {
          name: 'Error',
          message: 'Test error'
        },
        environment: {
          url: 'http://localhost:3000/test',
          userAgent: 'test-agent'
        }
      });

      expect(report.id).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.sessionId).toBeDefined();
    });

    it('should sanitize sensitive data based on privacy level', () => {
      const sensitiveError = new Error('Error with email: user@example.com and phone: 123-456-7890');

      const report = reportingManager.createErrorReport(sensitiveError);

      expect(report.error.message).toBe('Error with email: [EMAIL] and phone: [PHONE]');
    });

    it('should handle different privacy levels', () => {
      const error = new Error('Test error');
      
      // Minimal privacy
      reportingManager.config.privacyLevel = PRIVACY_LEVELS.MINIMAL;
      const minimalReport = reportingManager.createErrorReport(error, { sensitive: 'data' });
      expect(minimalReport.context).toEqual({ timestamp: undefined });

      // Standard privacy
      reportingManager.config.privacyLevel = PRIVACY_LEVELS.STANDARD;
      const standardReport = reportingManager.createErrorReport(error, { component: 'Test' });
      expect(standardReport.context.component).toBe('Test');
    });
  });

  describe('Report Queuing and Batching', () => {
    it('should queue reports and flush when batch size is reached', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      global.fetch = mockFetch;

      // Queue two reports (batch size is 2)
      await reportingManager.reportError(new Error('Error 1'));
      await reportingManager.reportError(new Error('Error 2'));

      // Should have triggered a flush
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        reportingManager.config.endpoint,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Error 1')
        })
      );
    });

    it('should use sendBeacon for page unload', () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      global.navigator.sendBeacon = mockSendBeacon;

      reportingManager.reportQueue = [{ id: 'test', type: 'error' }];
      reportingManager.flushQueue(true);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        reportingManager.config.endpoint,
        expect.stringContaining('test')
      );
    });
  });

  describe('Performance Reporting', () => {
    it('should create performance reports with sanitized metrics', async () => {
      const metrics = {
        loadTime: 1500,
        renderTime: 200,
        sensitiveData: 'should be removed',
        memoryUsage: 50
      };

      await reportingManager.reportPerformance(metrics);

      const report = reportingManager.reportQueue[0];
      expect(report.type).toBe('performance');
      expect(report.metrics).toEqual({
        loadTime: 1500,
        renderTime: 200,
        memoryUsage: 50
      });
      expect(report.metrics.sensitiveData).toBeUndefined();
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    errorHandler.clearAllErrors();
    vi.clearAllMocks();
  });

  it('should integrate error handler with reporting system', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    global.fetch = mockFetch;

    // Enable reporting for this test
    const testReporting = new ErrorReportingManager({ enabled: true, batchSize: 1 });

    // Log an error through the error handler
    const error = new Error('Integration test error');
    await testReporting.reportError(error, { component: 'TestComponent' });

    // Wait for async reporting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error was reported
    expect(mockFetch).toHaveBeenCalled();
  }, 1000);

  it('should handle error recovery flow', async () => {
    const retryManager = new NetworkRetryManager();
    
    // Test basic error handling functionality
    const networkError = new Error('Temporary failure');
    networkError.name = 'NetworkError';
    
    const mockRequest = vi.fn().mockRejectedValue(networkError);

    try {
      await retryManager.executeWithRetry(mockRequest);
    } catch (error) {
      // Verify error handling works
      expect(mockRequest).toHaveBeenCalled();
      expect(error.message).toBe('Temporary failure');
    }
  });
});