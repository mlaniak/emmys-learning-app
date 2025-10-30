import React, { useState } from 'react';

// Enhanced fallback component with comprehensive error recovery options
const SimpleFallback = ({ 
  message = "Something went wrong", 
  showRetry = true,
  onRetry,
  error,
  errorId,
  retryCount = 0,
  maxRetries = 3,
  showDetails = false,
  showReportError = true
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleStartFresh = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/emmys-learning-app';
  };

  const handleReportError = async () => {
    setIsReporting(true);
    try {
      // Create error report
      const errorReport = {
        errorId,
        message: error?.message || message,
        stack: error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount,
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // In a real app, send to error reporting service
      console.log('Error Report:', errorReport);
      
      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      
      alert('Error details copied to clipboard. Please share with support if needed.');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      alert('Failed to report error. Please try refreshing the page.');
    } finally {
      setIsReporting(false);
    }
  };

  const getErrorIcon = () => {
    if (error?.name === 'ChunkLoadError') return '📦';
    if (error?.message?.includes('network')) return '🌐';
    if (error?.message?.includes('timeout')) return '⏰';
    return '😅';
  };

  const getRecoveryMessage = () => {
    if (retryCount > 0) {
      return `We've tried ${retryCount} time${retryCount > 1 ? 's' : ''} to fix this.`;
    }
    return "Don't worry, Emmy's Learning App is still here!";
  };

  const canRetry = showRetry && retryCount < maxRetries;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="text-center text-white p-8 max-w-md w-full">
        <div className="text-6xl mb-4">{getErrorIcon()}</div>
        <h1 className="text-3xl font-bold mb-4">Oops!</h1>
        <p className="text-lg mb-4">{message}</p>
        <p className="text-sm mb-6 opacity-75">{getRecoveryMessage()}</p>
        
        <div className="space-y-3">
          {canRetry && (
            <button
              onClick={handleRetry}
              className="w-full bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              🔄 Try Again {retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors"
          >
            🔄 Reload Page
          </button>
          
          <button
            onClick={handleStartFresh}
            className="w-full bg-purple-700 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-800 transition-colors"
          >
            🏠 Start Fresh
          </button>

          {showReportError && (
            <button
              onClick={handleReportError}
              disabled={isReporting}
              className="w-full bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isReporting ? '📤 Reporting...' : '📤 Report Error'}
            </button>
          )}
        </div>

        {(showDetails || error) && (
          <div className="mt-6">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-white/70 hover:text-white text-sm underline"
            >
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showErrorDetails && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg text-left">
                <div className="text-xs space-y-2">
                  {errorId && (
                    <div>
                      <span className="font-semibold">Error ID:</span> {errorId}
                    </div>
                  )}
                  {error?.name && (
                    <div>
                      <span className="font-semibold">Type:</span> {error.name}
                    </div>
                  )}
                  {error?.message && (
                    <div>
                      <span className="font-semibold">Message:</span> {error.message}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">URL:</span> {window.location.href}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {new Date().toLocaleString()}
                  </div>
                  {retryCount > 0 && (
                    <div>
                      <span className="font-semibold">Retries:</span> {retryCount}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleFallback;
