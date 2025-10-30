/**
 * Error Recovery System
 * 
 * Comprehensive error recovery system with intelligent recovery suggestions,
 * user-friendly error messages, and automated recovery attempts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { errorHandler, ERROR_TYPES, ERROR_SEVERITY } from '../utils/errorHandling.jsx';
import { networkRetry } from '../utils/networkRetry';
import { errorReporting } from '../utils/errorReporting';
import { 
  LoadingFallback, 
  NetworkErrorFallback, 
  GenericErrorFallback 
} from './FallbackComponents';

// Recovery Strategy Types
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  RELOAD: 'reload',
  CLEAR_CACHE: 'clear_cache',
  FALLBACK_MODE: 'fallback_mode',
  CONTACT_SUPPORT: 'contact_support',
  IGNORE: 'ignore'
};

// Recovery Context Provider
export const ErrorRecoveryContext = React.createContext({
  reportError: () => {},
  recoverFromError: () => {},
  getRecoveryOptions: () => []
});

/**
 * Error Recovery Provider Component
 */
export const ErrorRecoveryProvider = ({ children }) => {
  const [activeErrors, setActiveErrors] = useState([]);
  const [recoveryAttempts, setRecoveryAttempts] = useState(new Map());

  // Report error and get recovery options
  const reportError = useCallback(async (error, context = {}) => {
    const errorEntry = errorHandler.logError(error, context);
    
    // Add to active errors if not already present
    setActiveErrors(prev => {
      const exists = prev.find(e => e.id === errorEntry.id);
      if (!exists) {
        return [...prev, { ...errorEntry, context }];
      }
      return prev;
    });

    // Report to external service
    await errorReporting.reportError(error, context);

    return errorEntry;
  }, []);

  // Recover from error using specified strategy
  const recoverFromError = useCallback(async (errorId, strategy, options = {}) => {
    const error = activeErrors.find(e => e.id === errorId);
    if (!error) return false;

    const attemptKey = `${errorId}_${strategy}`;
    const currentAttempts = recoveryAttempts.get(attemptKey) || 0;
    const maxAttempts = options.maxAttempts || 3;

    if (currentAttempts >= maxAttempts) {
      console.warn(`Max recovery attempts reached for error ${errorId} with strategy ${strategy}`);
      return false;
    }

    // Update attempt count
    setRecoveryAttempts(prev => new Map(prev).set(attemptKey, currentAttempts + 1));

    try {
      const success = await executeRecoveryStrategy(strategy, error, options);
      
      if (success) {
        // Remove error from active errors
        setActiveErrors(prev => prev.filter(e => e.id !== errorId));
        // Reset attempt count
        setRecoveryAttempts(prev => {
          const newMap = new Map(prev);
          newMap.delete(attemptKey);
          return newMap;
        });
      }

      return success;
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      return false;
    }
  }, [activeErrors, recoveryAttempts]);

  // Get recovery options for an error
  const getRecoveryOptions = useCallback((error) => {
    return generateRecoveryOptions(error, recoveryAttempts);
  }, [recoveryAttempts]);

  const contextValue = {
    reportError,
    recoverFromError,
    getRecoveryOptions,
    activeErrors
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
      <ErrorRecoveryUI />
    </ErrorRecoveryContext.Provider>
  );
};

/**
 * Execute recovery strategy
 */
const executeRecoveryStrategy = async (strategy, error, options = {}) => {
  switch (strategy) {
    case RECOVERY_STRATEGIES.RETRY:
      if (options.retryFunction) {
        await options.retryFunction();
        return true;
      }
      return false;

    case RECOVERY_STRATEGIES.RELOAD:
      window.location.reload();
      return true;

    case RECOVERY_STRATEGIES.CLEAR_CACHE:
      try {
        // Clear various caches
        localStorage.clear();
        sessionStorage.clear();
        
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        window.location.reload();
        return true;
      } catch (cacheError) {
        console.error('Failed to clear cache:', cacheError);
        return false;
      }

    case RECOVERY_STRATEGIES.FALLBACK_MODE:
      if (options.fallbackFunction) {
        await options.fallbackFunction();
        return true;
      }
      return false;

    case RECOVERY_STRATEGIES.CONTACT_SUPPORT:
      // Open support contact method
      if (options.supportUrl) {
        window.open(options.supportUrl, '_blank');
      } else if (options.supportEmail) {
        window.location.href = `mailto:${options.supportEmail}?subject=Error Report&body=${encodeURIComponent(JSON.stringify(error, null, 2))}`;
      }
      return true;

    case RECOVERY_STRATEGIES.IGNORE:
      return true;

    default:
      return false;
  }
};

/**
 * Generate recovery options based on error type and context
 */
const generateRecoveryOptions = (error, recoveryAttempts) => {
  const options = [];
  const errorType = error.type || ERROR_TYPES.UNKNOWN;
  const severity = error.severity || ERROR_SEVERITY.MEDIUM;

  // Retry option for retryable errors
  if (isRetryableError(error)) {
    const retryAttempts = recoveryAttempts.get(`${error.id}_${RECOVERY_STRATEGIES.RETRY}`) || 0;
    if (retryAttempts < 3) {
      options.push({
        strategy: RECOVERY_STRATEGIES.RETRY,
        label: `Try Again ${retryAttempts > 0 ? `(${retryAttempts}/3)` : ''}`,
        description: 'Attempt the operation again',
        primary: true,
        icon: '🔄'
      });
    }
  }

  // Reload option for component errors
  if (errorType === ERROR_TYPES.COMPONENT || severity === ERROR_SEVERITY.HIGH) {
    options.push({
      strategy: RECOVERY_STRATEGIES.RELOAD,
      label: 'Reload Page',
      description: 'Refresh the page to reset the application',
      primary: options.length === 0,
      icon: '🔄'
    });
  }

  // Clear cache option for loading errors
  if (error.name === 'ChunkLoadError' || errorType === ERROR_TYPES.NETWORK) {
    options.push({
      strategy: RECOVERY_STRATEGIES.CLEAR_CACHE,
      label: 'Clear Cache & Reload',
      description: 'Clear stored data and reload the application',
      primary: false,
      icon: '🧹'
    });
  }

  // Fallback mode for non-critical errors
  if (severity !== ERROR_SEVERITY.CRITICAL) {
    options.push({
      strategy: RECOVERY_STRATEGIES.FALLBACK_MODE,
      label: 'Continue with Limited Features',
      description: 'Use the app with some features disabled',
      primary: false,
      icon: '⚡'
    });
  }

  // Contact support for persistent errors
  const totalAttempts = Array.from(recoveryAttempts.keys())
    .filter(key => key.startsWith(error.id))
    .reduce((sum, key) => sum + recoveryAttempts.get(key), 0);

  if (totalAttempts > 2 || severity === ERROR_SEVERITY.CRITICAL) {
    options.push({
      strategy: RECOVERY_STRATEGIES.CONTACT_SUPPORT,
      label: 'Get Help',
      description: 'Contact support for assistance',
      primary: false,
      icon: '📞'
    });
  }

  // Ignore option for low severity errors
  if (severity === ERROR_SEVERITY.LOW) {
    options.push({
      strategy: RECOVERY_STRATEGIES.IGNORE,
      label: 'Dismiss',
      description: 'Continue without fixing this error',
      primary: false,
      icon: '✖️'
    });
  }

  return options;
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error) => {
  const retryableTypes = [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.API
  ];

  return retryableTypes.includes(error.type) ||
         error.name === 'NetworkError' ||
         error.message?.includes('fetch') ||
         (error.status && error.status >= 500);
};

/**
 * Error Recovery UI Component
 */
const ErrorRecoveryUI = () => {
  const { activeErrors, recoverFromError, getRecoveryOptions } = React.useContext(ErrorRecoveryContext);
  const [currentError, setCurrentError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Show the most severe active error
  useEffect(() => {
    if (activeErrors.length > 0) {
      const mostSevere = activeErrors.reduce((prev, current) => {
        const prevSeverity = getSeverityWeight(prev.severity);
        const currentSeverity = getSeverityWeight(current.severity);
        return currentSeverity > prevSeverity ? current : prev;
      });
      setCurrentError(mostSevere);
    } else {
      setCurrentError(null);
    }
  }, [activeErrors]);

  const handleRecovery = async (strategy, options = {}) => {
    if (!currentError) return;

    setIsRecovering(true);
    try {
      const success = await recoverFromError(currentError.id, strategy, options);
      if (!success) {
        // Show error message or fallback options
        console.error('Recovery failed for strategy:', strategy);
      }
    } finally {
      setIsRecovering(false);
    }
  };

  if (!currentError) return null;

  const recoveryOptions = getRecoveryOptions(currentError);

  return (
    <ErrorRecoveryModal
      error={currentError}
      recoveryOptions={recoveryOptions}
      onRecover={handleRecovery}
      isRecovering={isRecovering}
    />
  );
};

/**
 * Error Recovery Modal Component
 */
const ErrorRecoveryModal = ({ error, recoveryOptions, onRecover, isRecovering }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getUserFriendlyMessage = (error) => {
    if (error.name === 'ChunkLoadError') {
      return "We're having trouble loading part of the app. This usually happens when there's a connection issue.";
    }
    if (error.type === ERROR_TYPES.NETWORK) {
      return "We can't connect to our servers right now. Please check your internet connection.";
    }
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      return "Something important broke in the app. We need to fix this right away.";
    }
    return "We ran into an unexpected problem. Don't worry, your progress is saved!";
  };

  const getErrorIcon = (error) => {
    if (error.severity === ERROR_SEVERITY.CRITICAL) return '🚨';
    if (error.type === ERROR_TYPES.NETWORK) return '🌐';
    if (error.name === 'ChunkLoadError') return '📦';
    return '😅';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{getErrorIcon(error)}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600">
            {getUserFriendlyMessage(error)}
          </p>
        </div>

        {/* Recovery Options */}
        <div className="space-y-3 mb-6">
          {recoveryOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => onRecover(option.strategy, option.options)}
              disabled={isRecovering}
              className={`w-full flex items-center justify-center p-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                option.primary
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isRecovering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                  Working...
                </>
              ) : (
                <>
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Error Details Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">{showDetails ? '🔼' : '🔽'}</span>
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-semibold">Error ID:</span> {error.id}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {error.type}
                </div>
                <div>
                  <span className="font-semibold">Severity:</span> {error.severity}
                </div>
                <div>
                  <span className="font-semibold">Message:</span> {error.message}
                </div>
                <div>
                  <span className="font-semibold">Time:</span> {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    const details = JSON.stringify(error, null, 2);
                    navigator.clipboard.writeText(details);
                    alert('Error details copied to clipboard');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Copy Details
                </button>
                <button
                  onClick={() => onRecover(RECOVERY_STRATEGIES.CONTACT_SUPPORT)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Report Error
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Get numeric weight for severity comparison
 */
const getSeverityWeight = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL: return 4;
    case ERROR_SEVERITY.HIGH: return 3;
    case ERROR_SEVERITY.MEDIUM: return 2;
    case ERROR_SEVERITY.LOW: return 1;
    default: return 0;
  }
};

/**
 * Hook for using error recovery in components
 */
export const useErrorRecovery = () => {
  const context = React.useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within ErrorRecoveryProvider');
  }
  return context;
};

export default {
  ErrorRecoveryProvider,
  ErrorRecoveryContext,
  useErrorRecovery,
  RECOVERY_STRATEGIES
};