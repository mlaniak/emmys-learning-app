/**
 * Fallback UI Components
 * 
 * Collection of fallback components for different failure scenarios
 * providing graceful degradation and recovery options.
 */

import React, { useState, useEffect } from 'react';
import { networkRetry } from '../utils/networkRetry';
import { errorHandler } from '../utils/errorHandling.jsx';

// Generic Loading Fallback
export const LoadingFallback = ({ 
  message = "Loading...", 
  showSpinner = true,
  timeout = 10000,
  onTimeout 
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) onTimeout();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">⏰</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Taking longer than expected</h3>
        <p className="text-gray-500 mb-4">This is taking a while to load.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {showSpinner && (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      )}
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

// Network Error Fallback
export const NetworkErrorFallback = ({ 
  error, 
  onRetry, 
  retryCount = 0,
  maxRetries = 3 
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    if (error?.code === 'TIMEOUT') {
      return "The request timed out. Please check your connection and try again.";
    }
    if (error?.message?.includes('fetch')) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    if (error?.status >= 500) {
      return "The server is experiencing issues. Please try again in a moment.";
    }
    return "A network error occurred. Please try again.";
  };

  const canRetry = retryCount < maxRetries && onRetry;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg border border-red-200">
      <div className="text-4xl mb-4">🌐</div>
      <h3 className="text-lg font-semibold text-red-700 mb-2">Connection Problem</h3>
      <p className="text-red-600 mb-4">{getErrorMessage()}</p>
      
      {canRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 mb-2"
        >
          {isRetrying ? 'Retrying...' : `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`}
        </button>
      )}
      
      <button
        onClick={() => window.location.reload()}
        className="text-red-600 hover:text-red-700 text-sm underline"
      >
        Refresh Page
      </button>
    </div>
  );
};

// Content Loading Error Fallback
export const ContentErrorFallback = ({ 
  contentType = "content",
  onRetry,
  showFallbackContent = false,
  fallbackContent = null
}) => {
  const [showFallback, setShowFallback] = useState(showFallbackContent);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-lg font-semibold text-yellow-700 mb-2">Content Unavailable</h3>
      <p className="text-yellow-600 mb-4">
        We couldn't load the {contentType}. This might be a temporary issue.
      </p>
      
      <div className="space-y-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors"
          >
            Try Loading Again
          </button>
        )}
        
        {fallbackContent && (
          <button
            onClick={() => setShowFallback(!showFallback)}
            className="text-yellow-600 hover:text-yellow-700 text-sm underline"
          >
            {showFallback ? 'Hide' : 'Show'} Cached Content
          </button>
        )}
      </div>
      
      {showFallback && fallbackContent && (
        <div className="mt-4 p-4 bg-white rounded border">
          {fallbackContent}
        </div>
      )}
    </div>
  );
};

// Feature Unavailable Fallback
export const FeatureUnavailableFallback = ({ 
  featureName,
  reason = "temporarily unavailable",
  alternativeAction,
  alternativeLabel = "Continue without this feature"
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-4xl mb-4">🚧</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Feature Unavailable</h3>
      <p className="text-gray-600 mb-4">
        {featureName} is {reason}. You can continue using the app without this feature.
      </p>
      
      {alternativeAction && (
        <button
          onClick={alternativeAction}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          {alternativeLabel}
        </button>
      )}
    </div>
  );
};

// Offline Fallback
export const OfflineFallback = ({ 
  onRetryConnection,
  cachedContent = null,
  showCachedContent = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCached, setShowCached] = useState(showCachedContent);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && onRetryConnection) {
      onRetryConnection();
    }
  }, [isOnline, onRetryConnection]);

  if (isOnline) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-lg border border-green-200">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-green-700 mb-2">Back Online</h3>
        <p className="text-green-600">Connection restored! Refreshing content...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-orange-50 rounded-lg border border-orange-200">
      <div className="text-4xl mb-4">📱</div>
      <h3 className="text-lg font-semibold text-orange-700 mb-2">You're Offline</h3>
      <p className="text-orange-600 mb-4">
        No internet connection detected. Some features may be limited.
      </p>
      
      {cachedContent && (
        <button
          onClick={() => setShowCached(!showCached)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors mb-2"
        >
          {showCached ? 'Hide' : 'Show'} Offline Content
        </button>
      )}
      
      <p className="text-orange-500 text-sm">
        We'll automatically reconnect when your connection is restored.
      </p>
      
      {showCached && cachedContent && (
        <div className="mt-4 p-4 bg-white rounded border w-full">
          {cachedContent}
        </div>
      )}
    </div>
  );
};

// Permission Denied Fallback
export const PermissionDeniedFallback = ({ 
  permission,
  onRequestPermission,
  alternativeAction,
  alternativeLabel = "Continue without permission"
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg border border-red-200">
      <div className="text-4xl mb-4">🔒</div>
      <h3 className="text-lg font-semibold text-red-700 mb-2">Permission Required</h3>
      <p className="text-red-600 mb-4">
        This feature requires {permission} permission to work properly.
      </p>
      
      <div className="space-y-2">
        {onRequestPermission && (
          <button
            onClick={onRequestPermission}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Grant Permission
          </button>
        )}
        
        {alternativeAction && (
          <button
            onClick={alternativeAction}
            className="text-red-600 hover:text-red-700 text-sm underline"
          >
            {alternativeLabel}
          </button>
        )}
      </div>
    </div>
  );
};

// Maintenance Mode Fallback
export const MaintenanceFallback = ({ 
  estimatedTime,
  contactInfo,
  allowOfflineMode = true,
  onOfflineMode
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="text-center text-white p-8 max-w-md">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
        <p className="text-lg mb-6">
          We're making Emmy's Learning App even better! We'll be back soon.
        </p>
        
        {estimatedTime && (
          <p className="text-sm mb-6 opacity-75">
            Estimated time: {estimatedTime}
          </p>
        )}
        
        {allowOfflineMode && onOfflineMode && (
          <button
            onClick={onOfflineMode}
            className="w-full bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors mb-4"
          >
            Use Offline Mode
          </button>
        )}
        
        {contactInfo && (
          <p className="text-xs opacity-50">
            Questions? Contact us at {contactInfo}
          </p>
        )}
      </div>
    </div>
  );
};

// Generic Error Fallback with Recovery Options
export const GenericErrorFallback = ({ 
  error,
  title = "Something went wrong",
  message,
  onRetry,
  onReport,
  showDetails = false,
  recoveryOptions = []
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const defaultMessage = message || 
    "We encountered an unexpected error. Don't worry, your progress is saved!";

  const defaultRecoveryOptions = [
    {
      label: "Try Again",
      action: onRetry || (() => window.location.reload()),
      primary: true
    },
    {
      label: "Go Home",
      action: () => window.location.href = '/',
      primary: false
    }
  ];

  const allRecoveryOptions = recoveryOptions.length > 0 ? recoveryOptions : defaultRecoveryOptions;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200 max-w-md mx-auto">
      <div className="text-4xl mb-4">😅</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{defaultMessage}</p>
      
      <div className="space-y-2 w-full">
        {allRecoveryOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.action}
            className={`w-full px-4 py-2 rounded transition-colors ${
              option.primary
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {(showDetails || error) && (
        <div className="mt-6 w-full">
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            {showErrorDetails ? 'Hide' : 'Show'} Error Details
          </button>
          
          {showErrorDetails && error && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left">
              <div className="text-xs space-y-2 text-gray-600">
                <div><strong>Error:</strong> {error.message}</div>
                <div><strong>Type:</strong> {error.name}</div>
                <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
              </div>
              
              {onReport && (
                <button
                  onClick={() => onReport(error)}
                  className="mt-3 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Report Error
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default {
  LoadingFallback,
  NetworkErrorFallback,
  ContentErrorFallback,
  FeatureUnavailableFallback,
  OfflineFallback,
  PermissionDeniedFallback,
  MaintenanceFallback,
  GenericErrorFallback
};