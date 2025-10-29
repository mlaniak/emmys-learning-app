import React, { useState, useEffect } from 'react';
import { oauthErrorRecovery, RECOVERY_STRATEGIES } from '../utils/oauthErrorRecovery';
import { isDevelopment } from '../utils/environmentConfig';

/**
 * Error Recovery Modal Component
 * 
 * Provides user-friendly error recovery options for OAuth and other authentication failures
 */
const ErrorRecoveryModal = ({ 
  isOpen, 
  onClose, 
  errorAnalysis, 
  onRetry, 
  onFallback, 
  onGuestMode,
  onContactSupport 
}) => {
  const [isExecutingRecovery, setIsExecutingRecovery] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRecoveryResult(null);
      setIsExecutingRecovery(false);
      setShowDetails(false);
    }
  }, [isOpen]);

  const executeRecoveryStrategy = async (strategy, options = {}) => {
    setIsExecutingRecovery(true);
    
    try {
      const result = await oauthErrorRecovery.executeRecovery(
        { ...errorAnalysis, recoveryStrategy: strategy },
        options
      );
      
      setRecoveryResult(result);
      
      // Handle different recovery results
      switch (result.action) {
        case 'retry':
          if (onRetry) {
            await onRetry();
          }
          break;
        case 'fallback_auth':
          if (onFallback) {
            onFallback(result.options);
          }
          break;
        case 'guest_mode':
          if (onGuestMode) {
            onGuestMode();
          }
          break;
        case 'contact_support':
          if (onContactSupport) {
            onContactSupport(result);
          }
          break;
        default:
          break;
      }
      
    } catch (error) {
      if (isDevelopment()) {
        console.error('🚨 Recovery execution failed:', error);
      }
      
      setRecoveryResult({
        action: 'error',
        message: 'Recovery failed. Please try a different approach.',
        error: error.message
      });
    } finally {
      setIsExecutingRecovery(false);
    }
  };

  const handleRetry = () => {
    executeRecoveryStrategy(RECOVERY_STRATEGIES.RETRY, {
      retryCallback: onRetry
    });
  };

  const handleFallbackAuth = () => {
    executeRecoveryStrategy(RECOVERY_STRATEGIES.FALLBACK_AUTH);
  };

  const handleGuestMode = () => {
    executeRecoveryStrategy(RECOVERY_STRATEGIES.GUEST_MODE, {
      guestCallback: onGuestMode
    });
  };

  const handleManualRefresh = () => {
    executeRecoveryStrategy(RECOVERY_STRATEGIES.MANUAL_REFRESH, {
      retryCallback: onRetry
    });
  };

  const handleContactSupport = () => {
    executeRecoveryStrategy(RECOVERY_STRATEGIES.CONTACT_SUPPORT, {
      guestCallback: onGuestMode
    });
  };

  const copyErrorDetails = () => {
    const details = `
Error Details:
- ID: ${errorAnalysis?.errorId || 'Unknown'}
- Type: ${errorAnalysis?.errorType || 'Unknown'}
- Message: ${errorAnalysis?.userMessage || 'No message'}
- Retry Count: ${errorAnalysis?.retryCount || 0}
- Timestamp: ${new Date().toISOString()}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
    `.trim();
    
    navigator.clipboard.writeText(details).then(() => {
      alert('Error details copied to clipboard');
    }).catch(() => {
      alert('Failed to copy error details');
    });
  };

  if (!isOpen || !errorAnalysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">
            {errorAnalysis.severity === 'critical' ? '🚨' : 
             errorAnalysis.severity === 'high' ? '⚠️' : 
             errorAnalysis.canRetry ? '🔄' : '😅'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Sign-in Issue
          </h2>
          <p className="text-gray-600">
            {errorAnalysis.userMessage}
          </p>
        </div>

        {/* Recovery Result Display */}
        {recoveryResult && (
          <div className={`mb-6 p-4 rounded-lg ${
            recoveryResult.action === 'error' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="text-sm font-medium text-gray-800 mb-2">
              {recoveryResult.message}
            </div>
            {recoveryResult.description && (
              <div className="text-sm text-gray-600">
                {recoveryResult.description}
              </div>
            )}
            {recoveryResult.options && (
              <div className="mt-3 space-y-2">
                {recoveryResult.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.action}
                    className={`w-full text-left p-2 rounded ${
                      option.primary 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recovery Options */}
        {!recoveryResult && (
          <div className="space-y-3 mb-6">
            {/* Retry Option */}
            {errorAnalysis.canRetry && (
              <button
                onClick={handleRetry}
                disabled={isExecutingRecovery}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isExecutingRecovery ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Try Again ({errorAnalysis.retryCount + 1}/3)
                  </>
                )}
              </button>
            )}

            {/* Fallback Authentication */}
            <button
              onClick={handleFallbackAuth}
              disabled={isExecutingRecovery}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">📧</span>
              Try Different Sign-in Method
            </button>

            {/* Guest Mode */}
            <button
              onClick={handleGuestMode}
              disabled={isExecutingRecovery}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">👤</span>
              Continue as Guest
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={isExecutingRecovery}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="mr-2">🔄</span>
              Refresh Page
            </button>
          </div>
        )}

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
                  <span className="font-semibold">Error Type:</span> {errorAnalysis.errorType}
                </div>
                <div>
                  <span className="font-semibold">Severity:</span> {errorAnalysis.severity}
                </div>
                <div>
                  <span className="font-semibold">Retry Count:</span> {errorAnalysis.retryCount}
                </div>
                <div>
                  <span className="font-semibold">Error ID:</span> {errorAnalysis.errorId}
                </div>
                {isDevelopment() && (
                  <div>
                    <span className="font-semibold">Recovery Strategy:</span> {errorAnalysis.recoveryStrategy}
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={copyErrorDetails}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Copy Details
                </button>
                <button
                  onClick={handleContactSupport}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Get Help
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorRecoveryModal;