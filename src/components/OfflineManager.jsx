import React, { useState, useEffect } from 'react';
import { getDeviceType } from '../utils/responsiveUtils';

const OfflineManager = ({ children, fallbackContent = null }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    setDeviceType(getDeviceType());

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      
      // Show brief "back online" message
      showConnectionStatus('Back online!', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showConnectionStatus = (message, type) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const isMobile = deviceType === 'mobile' || deviceType === 'ios' || deviceType === 'android';

  if (!isOnline && fallbackContent) {
    return fallbackContent;
  }

  return (
    <>
      {/* Offline indicator banner */}
      {showOfflineMessage && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50 safe-area-top">
          <div className="flex items-center justify-center space-x-2">
            <span>📡</span>
            <span>You're offline. Some features may not work.</span>
          </div>
        </div>
      )}
      
      {/* Main content with offline padding if needed */}
      <div className={showOfflineMessage ? 'pt-10' : ''}>
        {children}
      </div>
    </>
  );
};

// Offline fallback component for specific features
export const OfflineFallback = ({ 
  title = "You're offline",
  message = "This feature requires an internet connection. Please check your connection and try again.",
  icon = "📡",
  onRetry,
  showRetryButton = true,
  className = ''
}) => {
  return (
    <div className={`text-center p-8 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      
      {showRetryButton && (
        <button
          onClick={onRetry || (() => window.location.reload())}
          className="btn-touch bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Try Again
        </button>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{navigator.onLine ? 'Connected' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
};

// Hook for managing offline state
export const useOfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger any necessary data sync or refresh
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const retryWhenOnline = (callback) => {
    if (isOnline) {
      callback();
    } else {
      const handleOnline = () => {
        callback();
        window.removeEventListener('online', handleOnline);
      };
      window.addEventListener('online', handleOnline);
    }
  };

  return {
    isOnline,
    wasOffline,
    retryWhenOnline
  };
};

// Component for handling network-dependent features
export const NetworkDependentFeature = ({ 
  children, 
  fallback = null,
  requiresOnline = true,
  onOfflineAttempt
}) => {
  const { isOnline } = useOfflineManager();

  if (requiresOnline && !isOnline) {
    if (onOfflineAttempt) {
      onOfflineAttempt();
    }
    
    return fallback || (
      <OfflineFallback 
        title="Feature unavailable"
        message="This feature requires an internet connection."
      />
    );
  }

  return children;
};

// Error boundary with offline handling
export class OfflineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isOnline: navigator.onLine 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Offline Error Boundary caught an error:', error, errorInfo);
    
    // Check if error is network-related
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      this.setState({ isNetworkError: true });
    }
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    
    // Auto-retry if it was a network error
    if (this.state.isNetworkError) {
      this.setState({ hasError: false, error: null, isNetworkError: false });
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.isNetworkError || !this.state.isOnline;
      
      return (
        <OfflineFallback
          title={isNetworkError ? "Connection Error" : "Something went wrong"}
          message={
            isNetworkError 
              ? "Please check your internet connection and try again."
              : "An unexpected error occurred. Please try refreshing the page."
          }
          icon={isNetworkError ? "📡" : "⚠️"}
          onRetry={() => {
            this.setState({ hasError: false, error: null, isNetworkError: false });
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default OfflineManager;